<?php

namespace App\Http\Controllers;

use App\Models\ApprovalHistory;
use App\Models\EmailToken;
use App\Models\GeneralJournal;
use App\Models\GeneralJournalApproval;
use App\Models\GeneralJournalFile;
use App\Models\Notification;
use App\Models\User;
use App\Mail\ApprovalRequestMail;
use App\Mail\DeptHeadApprovalMail;
use App\Mail\ApprovalResultMail;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class GeneralJournalController extends Controller
{
    /**
     * Display drafts management page with bulk submit capabilities.
     */
    public function drafts(Request $request)
    {
        $user = Auth::user();

        if (!$user->hasRole('Staff') && !$user->hasRole('Section Head') && !$user->hasRole('Admin')) {
            abort(403, 'Access denied.');
        }

        $query = GeneralJournal::with(['requester', 'activeFiles'])
            ->where('status', 'Draft');

        // Non-admin users only see their own drafts
        if (!$user->hasRole('Admin')) {
            $query->where('requested_by', $user->id);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('document_number', 'like', "%{$search}%")
                  ->orWhere('reference', 'like', "%{$search}%")
                  ->orWhere(DB::raw("CAST(journal_date AS NVARCHAR)"), 'like', "%{$search}%")
                  ->orWhere(DB::raw("CAST(last_updated_at AS NVARCHAR)"), 'like', "%{$search}%")
                  ->orWhere(DB::raw("CAST(created_at AS NVARCHAR)"), 'like', "%{$search}%")
                  ->orWhereHas('files', function ($fileQuery) use ($search) {
                      $fileQuery->where('file_name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('doc_number')) {
            $query->where('document_number', 'like', '%' . trim($request->doc_number) . '%');
        }

        if ($request->filled('reference')) {
            $query->where('reference', 'like', '%' . trim($request->reference) . '%');
        }

        if ($request->filled('file_name')) {
            $fileName = trim($request->file_name);
            $query->whereHas('files', function ($fileQuery) use ($fileName) {
                $fileQuery->where('file_name', 'like', "%{$fileName}%");
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('journal_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('journal_date', '<=', $request->date_to);
        }

        if ($request->filled('date')) {
            $query->whereDate('journal_date', $request->date);
        }

        $perPage = $request->input('per_page', 10);
        $drafts = $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

        $stats = [
            'total_drafts' => GeneralJournal::where('status', 'Draft')
                ->when(!$user->hasRole('Admin'), fn($q) => $q->where('requested_by', $user->id))
                ->count(),
        ];

        return Inertia::render('GeneralJournal/Drafts', [
            'drafts' => $drafts,
            'filters' => $request->only(['search', 'doc_number', 'reference', 'file_name', 'date', 'date_from', 'date_to', 'per_page']),
            'stats' => $stats,
        ]);
    }

    /**
     * Show the create form (separate page).
     */
    public function create()
    {
        $user = Auth::user();

        if (!$user->hasRole('Staff') && !$user->hasRole('Section Head') && !$user->hasRole('Admin')) {
            abort(403, 'Only Staff and Section Head can create General Journals.');
        }

        return Inertia::render('GeneralJournal/Create');
    }

    /**
     * Store a newly created General Journal (as Draft or directly Submitted).
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user->hasRole('Staff') && !$user->hasRole('Section Head') && !$user->hasRole('Admin')) {
            abort(403, 'Access denied.');
        }

        $isSubmit = $request->input('action') === 'submit';

        // Format document number to ensure JOT prefix
        $rawDocNum = trim((string) $request->document_number);
        $formattedDocNum = $this->formatDocumentNumber($rawDocNum);
        $request->merge(['document_number' => $formattedDocNum]);

        $request->validate([
            'document_number' => [
                'required',
                'string',
                'max:100',
                Rule::unique('general_journals', 'document_number')->where(function ($query) {
                    return $query->whereIn('status', ['Waiting Approval', 'Approved', 'Revised', 'Draft']);
                }),
            ],
            'journal_date' => ['required', 'date'],
            'reference' => ['required', 'string', 'max:4000'],
            'general_journal_file' => [$isSubmit ? 'required' : 'nullable', 'file', 'mimes:pdf', 'max:10240'],
            'supporting_documents' => ['nullable', 'array'],
            'supporting_documents.*' => ['file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,xlsx,xls'],
        ], [
            'document_number.required' => 'Document Number is required.',
            'document_number.unique' => 'This Document Number has already been used.',
            'journal_date.required' => 'Journal Date is required.',
            'journal_date.date' => 'Journal Date must be a valid date.',
            'reference.required' => 'Reference is required.',
            'general_journal_file.required' => 'General Journal PDF document is required to submit for approval.',
            'general_journal_file.mimes' => 'The General Journal must be a valid PDF file.',
            'general_journal_file.max' => 'The General Journal PDF file cannot exceed 10 MB.',
            'supporting_documents.*.max' => 'Each Supporting Document cannot exceed 10 MB.',
            'supporting_documents.*.mimes' => 'Supporting Documents must be PDF, Image, or Excel files.',
        ]);

        $journal = DB::transaction(function () use ($request, $user, $isSubmit, $formattedDocNum) {
            $sectionHead = User::where('role', 'Section Head')
                ->where('is_active', true)
                ->where('is_default_approver', true)
                ->first()
                ?? User::where('role', 'Section Head')->where('is_active', true)->first();

            $deptHead = User::where('role', 'Dept/Div Head')
                ->where('is_active', true)
                ->first();

            $currentAssignTo = null;
            $status = $isSubmit ? 'Waiting Approval' : 'Draft';
            $submittedAt = $isSubmit ? now() : null;

            if ($isSubmit) {
                $currentAssignTo = $user->hasRole('Section Head') ? $deptHead?->id : $sectionHead?->id;
            }

            $journal = GeneralJournal::create([
                'document_number' => $formattedDocNum,
                'journal_date' => $request->journal_date,
                'reference' => $request->reference,
                'status' => $status,
                'requested_by' => $user->id,
                'current_assign_to' => $currentAssignTo,
                'resubmit_count' => 0,
                'submitted_at' => $submittedAt,
                'last_updated_at' => now(),
            ]);

            // Upload General Journal PDF
            if ($request->hasFile('general_journal_file')) {
                $gjFile = $request->file('general_journal_file');
                $gjPath = $gjFile->store("general-journals/{$journal->id}/general_journal");
                $gjHash = hash_file('sha256', Storage::path($gjPath));

                GeneralJournalFile::create([
                    'general_journal_id' => $journal->id,
                    'category' => 'general_journal',
                    'file_name' => $gjFile->getClientOriginalName(),
                    'file_path' => $gjPath,
                    'file_size' => $gjFile->getSize(),
                    'mime_type' => $gjFile->getMimeType(),
                    'file_hash' => $gjHash,
                    'version' => 1,
                    'is_active' => true,
                    'uploaded_at' => now(),
                ]);
            }

            // Upload Supporting Documents (optional)
            if ($request->hasFile('supporting_documents')) {
                foreach ($request->file('supporting_documents') as $file) {
                    $path = $file->store("general-journals/{$journal->id}/supporting_documents");
                    $hash = hash_file('sha256', Storage::path($path));

                    GeneralJournalFile::create([
                        'general_journal_id' => $journal->id,
                        'category' => 'supporting_document',
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => $path,
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                        'file_hash' => $hash,
                        'version' => 1,
                        'is_active' => true,
                        'uploaded_at' => now(),
                    ]);
                }
            }

            if ($isSubmit) {
                $this->setupApprovalChainAndNotify($journal, $user, $sectionHead, $deptHead);
            }

            return $journal;
        });

        if ($isSubmit) {
            return redirect()->route('monitoring.index')
                ->with('success', 'Document submitted successfully for approval.');
        }

        return redirect()->route('drafts.index')
            ->with('success', 'Draft saved successfully.');
    }

    /**
     * Bulk submit selected draft documents with rigorous validation.
     */
    public function bulkSubmit(Request $request)
    {
        $user = Auth::user();

        if (!$user->hasRole('Staff') && !$user->hasRole('Section Head') && !$user->hasRole('Admin')) {
            abort(403, 'Access denied.');
        }

        $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string', 'exists:general_journals,id'],
        ], [
            'ids.required' => 'Please select at least one draft document to submit.',
            'ids.min' => 'Please select at least one draft document to submit.',
        ]);

        $sectionHead = User::where('role', 'Section Head')
            ->where('is_active', true)
            ->where('is_default_approver', true)
            ->first()
            ?? User::where('role', 'Section Head')->where('is_active', true)->first();

        $deptHead = User::where('role', 'Dept/Div Head')
            ->where('is_active', true)
            ->first();

        $drafts = GeneralJournal::whereIn('id', $request->ids)
            ->where('status', 'Draft')
            ->when(!$user->hasRole('Admin'), fn($q) => $q->where('requested_by', $user->id))
            ->with(['activeFiles', 'requester'])
            ->get();

        $submittedCount = 0;
        $skippedMissingPdf = [];
        $skippedMissingFields = [];

        DB::transaction(function () use ($drafts, $user, $sectionHead, $deptHead, &$submittedCount, &$skippedMissingPdf, &$skippedMissingFields) {
            foreach ($drafts as $journal) {
                // Validate General Journal PDF
                $hasGjFile = $journal->activeFiles->contains('category', 'general_journal');
                if (!$hasGjFile) {
                    $skippedMissingPdf[] = $journal->document_number;
                    continue;
                }

                // Validate required fields
                if (empty($journal->reference) || empty($journal->journal_date) || empty($journal->document_number)) {
                    $skippedMissingFields[] = $journal->document_number;
                    continue;
                }

                $requester = $journal->requester ?? $user;
                $currentAssignTo = $requester->hasRole('Section Head') ? $deptHead?->id : $sectionHead?->id;

                $journal->update([
                    'status' => 'Waiting Approval',
                    'current_assign_to' => $currentAssignTo,
                    'submitted_at' => now(),
                    'last_updated_at' => now(),
                ]);

                $this->setupApprovalChainAndNotify($journal, $requester, $sectionHead, $deptHead);
                $submittedCount++;
            }
        });

        if ($submittedCount === 0) {
            $errorDetails = [];
            if (!empty($skippedMissingPdf)) {
                $errorDetails[] = 'Missing PDF document: ' . implode(', ', $skippedMissingPdf);
            }
            if (!empty($skippedMissingFields)) {
                $errorDetails[] = 'Missing required fields (Reference/Date): ' . implode(', ', $skippedMissingFields);
            }

            $detailStr = !empty($errorDetails) ? ' (' . implode('; ', $errorDetails) . ')' : '';
            return redirect()->back()->with('error', "Cannot submit drafts: None of the selected drafts have the required General Journal PDF or complete details{$detailStr}. Please edit and complete them first.");
        }

        if (!empty($skippedMissingPdf) || !empty($skippedMissingFields)) {
            $skippedTotal = count($skippedMissingPdf) + count($skippedMissingFields);
            $skippedDocs = implode(', ', array_merge($skippedMissingPdf, $skippedMissingFields));
            return redirect()->route('monitoring.index')
                ->with('success', "{$submittedCount} draft(s) submitted successfully. {$skippedTotal} draft(s) skipped ({$skippedDocs}) due to missing PDF or required fields.");
        }

        return redirect()->route('monitoring.index')
            ->with('success', "All {$submittedCount} draft document(s) submitted successfully for approval.");
    }

    /**
     * Submit a single draft document.
     */
    public function submitSingle(string $id)
    {
        $user = Auth::user();
        $journal = GeneralJournal::with(['activeFiles', 'requester'])->findOrFail($id);

        if (!$journal->isDraft()) {
            return redirect()->back()->with('error', 'Document is not in Draft status.');
        }

        if ($journal->requested_by !== $user->id && !$user->hasRole('Admin')) {
            abort(403, 'Unauthorized.');
        }

        // Validate required fields
        if (empty($journal->reference)) {
            return redirect()->back()->with('error', 'Cannot submit draft: Reference is required. Please edit the draft first.');
        }

        if (empty($journal->journal_date)) {
            return redirect()->back()->with('error', 'Cannot submit draft: Journal Date is required. Please edit the draft first.');
        }

        $hasGjFile = $journal->activeFiles->contains('category', 'general_journal');
        if (!$hasGjFile) {
            return redirect()->back()->with('error', 'Cannot submit draft: General Journal PDF document is missing. Please edit the draft and attach the PDF file before submitting.');
        }

        $sectionHead = User::where('role', 'Section Head')
            ->where('is_active', true)
            ->where('is_default_approver', true)
            ->first()
            ?? User::where('role', 'Section Head')->where('is_active', true)->first();

        $deptHead = User::where('role', 'Dept/Div Head')
            ->where('is_active', true)
            ->first();

        DB::transaction(function () use ($journal, $user, $sectionHead, $deptHead) {
            $requester = $journal->requester ?? $user;
            $currentAssignTo = $requester->hasRole('Section Head') ? $deptHead?->id : $sectionHead?->id;

            $journal->update([
                'status' => 'Waiting Approval',
                'current_assign_to' => $currentAssignTo,
                'submitted_at' => now(),
                'last_updated_at' => now(),
            ]);

            $this->setupApprovalChainAndNotify($journal, $requester, $sectionHead, $deptHead);
        });

        return redirect()->route('monitoring.index')
            ->with('success', "Document {$journal->document_number} submitted successfully for approval.");
    }

    /**
     * Edit draft or revised journal.
     */
    public function edit(string $id)
    {
        $user = Auth::user();
        $journal = GeneralJournal::with([
            'activeFiles',
            'approvals.assignedUser',
            'approvals.approvedByUser',
            'histories.actor',
        ])->findOrFail($id);

        if ($journal->requested_by !== $user->id && !$user->hasRole('Admin')) {
            abort(403, 'Unauthorized.');
        }

        if (!$journal->isDraft() && !$journal->isRevised()) {
            return redirect()->route('general-journals.show', $id)
                ->with('error', 'This document cannot be edited.');
        }

        return Inertia::render('GeneralJournal/Edit', [
            'journal' => $journal,
        ]);
    }

    /**
     * Update draft document.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $journal = GeneralJournal::with(['activeFiles'])->findOrFail($id);

        if ($journal->requested_by !== $user->id && !$user->hasRole('Admin')) {
            abort(403, 'Unauthorized.');
        }

        if (!$journal->isDraft()) {
            return redirect()->back()->with('error', 'Only drafts can be updated with this action.');
        }

        $formattedDocNum = $this->formatDocumentNumber(trim((string) $request->document_number));
        $request->merge(['document_number' => $formattedDocNum]);

        $request->validate([
            'document_number' => [
                'required',
                'string',
                'max:100',
                Rule::unique('general_journals', 'document_number')->ignore($journal->id)->where(function ($query) {
                    return $query->whereIn('status', ['Waiting Approval', 'Approved', 'Revised', 'Draft']);
                }),
            ],
            'journal_date' => ['required', 'date'],
            'reference' => ['required', 'string', 'max:4000'],
            'general_journal_file' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'supporting_documents' => ['nullable', 'array'],
            'supporting_documents.*' => ['file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,xlsx,xls'],
        ], [
            'document_number.required' => 'Document Number is required.',
            'document_number.unique' => 'This Document Number has already been used.',
            'journal_date.required' => 'Journal Date is required.',
            'reference.required' => 'Reference is required.',
            'general_journal_file.mimes' => 'The General Journal must be a valid PDF file.',
            'general_journal_file.max' => 'The General Journal PDF file cannot exceed 10 MB.',
            'supporting_documents.*.max' => 'Each Supporting Document cannot exceed 10 MB.',
            'supporting_documents.*.mimes' => 'Supporting Documents must be PDF, Image, or Excel files.',
        ]);

        DB::transaction(function () use ($request, $journal, $formattedDocNum) {
            $journal->update([
                'document_number' => $formattedDocNum,
                'journal_date' => $request->journal_date,
                'reference' => $request->reference,
                'last_updated_at' => now(),
            ]);

            // Replace General Journal PDF if uploaded
            if ($request->hasFile('general_journal_file')) {
                // Delete previous active GJ files
                foreach ($journal->files()->where('category', 'general_journal')->get() as $oldFile) {
                    Storage::delete($oldFile->file_path);
                    $oldFile->delete();
                }

                $gjFile = $request->file('general_journal_file');
                $gjPath = $gjFile->store("general-journals/{$journal->id}/general_journal");
                $gjHash = hash_file('sha256', Storage::path($gjPath));

                GeneralJournalFile::create([
                    'general_journal_id' => $journal->id,
                    'category' => 'general_journal',
                    'file_name' => $gjFile->getClientOriginalName(),
                    'file_path' => $gjPath,
                    'file_size' => $gjFile->getSize(),
                    'mime_type' => $gjFile->getMimeType(),
                    'file_hash' => $gjHash,
                    'version' => 1,
                    'is_active' => true,
                    'uploaded_at' => now(),
                ]);
            }

            // Replace Supporting Documents if provided
            if ($request->hasFile('supporting_documents')) {
                foreach ($journal->files()->where('category', 'supporting_document')->get() as $oldSup) {
                    Storage::delete($oldSup->file_path);
                    $oldSup->delete();
                }

                foreach ($request->file('supporting_documents') as $file) {
                    $path = $file->store("general-journals/{$journal->id}/supporting_documents");
                    $hash = hash_file('sha256', Storage::path($path));

                    GeneralJournalFile::create([
                        'general_journal_id' => $journal->id,
                        'category' => 'supporting_document',
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => $path,
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                        'file_hash' => $hash,
                        'version' => 1,
                        'is_active' => true,
                        'uploaded_at' => now(),
                    ]);
                }
            }
        });

        return redirect()->route('drafts.index')
            ->with('success', 'Draft updated successfully.');
    }

    /**
     * Resubmit a revised General Journal.
     */
    public function resubmit(Request $request, string $id)
    {
        $user = Auth::user();
        $journal = GeneralJournal::with(['activeFiles', 'approvals'])->findOrFail($id);

        if ($journal->requested_by !== $user->id && !$user->hasRole('Admin')) {
            abort(403, 'Unauthorized.');
        }

        if (!$journal->isRevised()) {
            return redirect()->back()->with('error', 'Only documents with Revised status can be resubmitted.');
        }

        $hasExistingGj = $journal->activeFiles->contains('category', 'general_journal');
        $hasNewGj = $request->hasFile('general_journal_file');

        if (!$hasExistingGj && !$hasNewGj) {
            return redirect()->back()->with('error', 'Cannot resubmit: General Journal PDF document is required. Please upload a PDF file.');
        }

        $request->validate([
            'general_journal_file' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
            'supporting_documents' => ['nullable', 'array'],
            'supporting_documents.*' => ['file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,xlsx,xls'],
            'reference' => ['required', 'string', 'max:4000'],
        ], [
            'reference.required' => 'Reference is required to resubmit.',
            'general_journal_file.mimes' => 'The General Journal must be a valid PDF file.',
            'general_journal_file.max' => 'The General Journal PDF file cannot exceed 10 MB.',
            'supporting_documents.*.max' => 'Each Supporting Document cannot exceed 10 MB.',
            'supporting_documents.*.mimes' => 'Supporting Documents must be PDF, Image, or Excel files.',
        ]);

        $sectionHead = User::where('role', 'Section Head')
            ->where('is_active', true)
            ->where('is_default_approver', true)
            ->first()
            ?? User::where('role', 'Section Head')->where('is_active', true)->first();

        $deptHead = User::where('role', 'Dept/Div Head')
            ->where('is_active', true)
            ->first();

        DB::transaction(function () use ($request, $journal, $user, $sectionHead, $deptHead) {
            $requester = $journal->requester ?? $user;
            $currentAssignTo = $requester->hasRole('Section Head') ? $deptHead?->id : $sectionHead?->id;
            $newVersion = $journal->resubmit_count + 2;

            // Handle new General Journal file: old active files replaced
            if ($request->hasFile('general_journal_file')) {
                // Delete previous files from storage & db as requested
                foreach ($journal->files()->where('category', 'general_journal')->get() as $oldFile) {
                    Storage::delete($oldFile->file_path);
                    $oldFile->delete();
                }

                $gjFile = $request->file('general_journal_file');
                $gjPath = $gjFile->store("general-journals/{$journal->id}/general_journal");
                $gjHash = hash_file('sha256', Storage::path($gjPath));

                GeneralJournalFile::create([
                    'general_journal_id' => $journal->id,
                    'category' => 'general_journal',
                    'file_name' => $gjFile->getClientOriginalName(),
                    'file_path' => $gjPath,
                    'file_size' => $gjFile->getSize(),
                    'mime_type' => $gjFile->getMimeType(),
                    'file_hash' => $gjHash,
                    'version' => $newVersion,
                    'is_active' => true,
                    'uploaded_at' => now(),
                ]);
            }

            // Handle Supporting Documents replacement if new files uploaded
            if ($request->hasFile('supporting_documents')) {
                foreach ($journal->files()->where('category', 'supporting_document')->get() as $oldSup) {
                    Storage::delete($oldSup->file_path);
                    $oldSup->delete();
                }

                foreach ($request->file('supporting_documents') as $file) {
                    $path = $file->store("general-journals/{$journal->id}/supporting_documents");
                    $hash = hash_file('sha256', Storage::path($path));

                    GeneralJournalFile::create([
                        'general_journal_id' => $journal->id,
                        'category' => 'supporting_document',
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => $path,
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                        'file_hash' => $hash,
                        'version' => $newVersion,
                        'is_active' => true,
                        'uploaded_at' => now(),
                    ]);
                }
            }

            if ($request->filled('reference')) {
                $journal->reference = $request->reference;
            }

            $journal->status = 'Waiting Approval';
            $journal->current_assign_to = $currentAssignTo;
            $journal->resubmit_count += 1;
            $journal->last_updated_at = now();
            $journal->save();

            // Reset approval chain
            $journal->approvals()->delete();
            $this->setupApprovalChainAndNotify($journal, $journal->requester ?? $user, $sectionHead, $deptHead, true);
        });

        return redirect()->route('monitoring.index')
            ->with('success', 'Document resubmitted successfully for approval.');
    }

    /**
     * Self-reject a revised document (by Requester only).
     */
    public function selfReject(Request $request, string $id)
    {
        $user = Auth::user();
        $journal = GeneralJournal::findOrFail($id);

        if ($journal->requested_by !== $user->id && !$user->hasRole('Admin')) {
            abort(403, 'Only the requester can reject this document.');
        }

        if (!$journal->isRevised()) {
            return redirect()->back()->with('error', 'Only documents in Revised status can be rejected by the requester.');
        }

        $reason = $request->input('notes', 'Cancelled / Rejected by requester');

        DB::transaction(function () use ($journal, $user, $reason) {
            $journal->update([
                'status' => 'Rejected',
                'current_assign_to' => null,
                'last_updated_at' => now(),
            ]);

            ApprovalHistory::create([
                'general_journal_id' => $journal->id,
                'action' => 'reject',
                'actor_user_id' => $user->id,
                'target_level' => 'requester',
                'notes' => $reason,
                'created_at' => now(),
            ]);

            Notification::create([
                'user_id' => $user->id,
                'general_journal_id' => $journal->id,
                'type' => 'rejected',
                'message' => "Document {$journal->document_number} has been cancelled and closed.",
                'created_at' => now(),
            ]);
        });

        return redirect()->route('monitoring.index')
            ->with('success', 'Document has been rejected and closed permanently.');
    }

    /**
     * Delete a draft document.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        $journal = GeneralJournal::with(['files'])->findOrFail($id);

        if ($journal->requested_by !== $user->id && !$user->hasRole('Admin')) {
            abort(403, 'Unauthorized.');
        }

        if (!$journal->isDraft()) {
            return redirect()->back()->with('error', 'Only Draft documents can be deleted.');
        }

        DB::transaction(function () use ($journal) {
            foreach ($journal->files as $file) {
                Storage::delete($file->file_path);
                $file->delete();
            }
            $journal->delete();
        });

        return redirect()->route('drafts.index')
            ->with('success', 'Draft deleted successfully.');
    }

    /**
     * Show detail of a General Journal.
     */
    public function show(string $id)
    {
        $journal = GeneralJournal::with([
            'requester',
            'assignee',
            'activeFiles',
            'approvals.assignedUser',
            'approvals.approvedByUser',
            'histories.actor',
        ])->findOrFail($id);

        return Inertia::render('GeneralJournal/Show', [
            'journal' => $journal,
        ]);
    }

    /**
     * Setup approval chain records, accounting auto-approval with journal_date, and send notifications.
     */
    private function setupApprovalChainAndNotify(GeneralJournal $journal, User $user, ?User $sectionHead, ?User $deptHead, bool $isResubmit = false): void
    {
        $requester = $journal->requester ?? $user;

        // 1. Accounting: Auto-approved with date matching journal_date
        $accountingApprovedAt = Carbon::parse($journal->journal_date)->setTimeFrom(now());

        GeneralJournalApproval::create([
            'general_journal_id' => $journal->id,
            'approval_level' => 'accounting',
            'assigned_user_id' => $requester->id,
            'approved_by_user_id' => $requester->id,
            'status' => 'Approved',
            'approved_at' => $accountingApprovedAt,
            'notes' => 'Approved ' . Carbon::parse($journal->journal_date)->format('Y-m-d') . ' ' . $requester->name,
        ]);

        if ($requester->hasRole('Section Head')) {
            $superiorApprovedAt = Carbon::parse($journal->journal_date)->setTimeFrom(now());

            // Superior also auto-approved with date matching journal_date
            GeneralJournalApproval::create([
                'general_journal_id' => $journal->id,
                'approval_level' => 'superior',
                'assigned_user_id' => $requester->id,
                'approved_by_user_id' => $requester->id,
                'status' => 'Approved',
                'approved_at' => $superiorApprovedAt,
                'notes' => 'Approved ' . Carbon::parse($journal->journal_date)->format('Y-m-d') . ' ' . $requester->name,
            ]);

            // Superior of Superior: Dept/Div Head
            if ($deptHead) {
                GeneralJournalApproval::create([
                    'general_journal_id' => $journal->id,
                    'approval_level' => 'superior_of_superior',
                    'assigned_user_id' => $deptHead->id,
                    'status' => 'Pending',
                ]);

                $this->sendDeptHeadApprovalEmail($journal, $deptHead);
            }
        } else {
            // Requester is Staff / Admin / other: requires Section Head approval
            if ($sectionHead) {
                GeneralJournalApproval::create([
                    'general_journal_id' => $journal->id,
                    'approval_level' => 'superior',
                    'assigned_user_id' => $sectionHead->id,
                    'status' => 'Pending',
                ]);
            }

            // Superior of Superior: Dept/Div Head
            if ($deptHead) {
                GeneralJournalApproval::create([
                    'general_journal_id' => $journal->id,
                    'approval_level' => 'superior_of_superior',
                    'assigned_user_id' => $deptHead->id,
                    'status' => 'Pending',
                ]);
            }

            // Send email to Section Head
            if ($sectionHead) {
                $this->sendApprovalEmail($journal, $sectionHead);
            }
        }

        // Record history
        ApprovalHistory::create([
            'general_journal_id' => $journal->id,
            'action' => $isResubmit ? 'resubmit' : 'submit',
            'actor_user_id' => $user->id,
            'target_level' => $requester->hasRole('Section Head') ? 'superior_of_superior' : 'superior',
            'notes' => $isResubmit ? 'Resubmitted with revised files' : 'Initial submission',
            'created_at' => now(),
        ]);

        // Create in-app notification for approver
        if ($journal->current_assign_to) {
            Notification::create([
                'user_id' => $journal->current_assign_to,
                'general_journal_id' => $journal->id,
                'type' => 'approval_request',
                'message' => "Document {$journal->document_number} requires your approval review.",
                'created_at' => now(),
            ]);
        }
    }

    /**
     * Send approval notification email to Section Head.
     */
    private function sendApprovalEmail(GeneralJournal $journal, User $sectionHead): void
    {
        try {
            $previewToken = $this->createEmailToken($journal, $sectionHead->email, 'preview');

            Mail::to($sectionHead->email)->send(
                new ApprovalRequestMail($journal, $sectionHead, $previewToken)
            );
        } catch (\Throwable $e) {
            Log::error("Failed sending ApprovalRequestMail to Section Head: " . $e->getMessage());
        }
    }

    /**
     * Send approval notification email to Dept/Div Head with approve and revise buttons.
     */
    private function sendDeptHeadApprovalEmail(GeneralJournal $journal, User $deptHead): void
    {
        try {
            $approvalToken = $this->createEmailToken($journal, $deptHead->email, 'approval');
            $reviseToken = $this->createEmailToken($journal, $deptHead->email, 'rejection');

            Mail::to($deptHead->email)->send(
                new DeptHeadApprovalMail(
                    $journal,
                    $deptHead,
                    url('/approve-email/' . $approvalToken->token),
                    url('/revise-email/' . $reviseToken->token)
                )
            );
        } catch (\Throwable $e) {
            Log::error("Failed sending DeptHeadApprovalMail to Dept/Div Head: " . $e->getMessage());
        }
    }

    /**
     * Format document number to enforce JOT prefix cleanly.
     */
    private function formatDocumentNumber(string $input): string
    {
        $cleaned = trim($input);
        if (preg_match('/^JOT\s*[-_]?\s*(.*)$/i', $cleaned, $matches)) {
            $suffix = trim($matches[1]);
            return 'JOT ' . ($suffix !== '' ? $suffix : $cleaned);
        }
        return 'JOT ' . $cleaned;
    }

    /**
     * Create an email token with 3 days (72 hours) expiry.
     */
    private function createEmailToken(GeneralJournal $journal, string $email, string $purpose): EmailToken
    {
        return EmailToken::create([
            'general_journal_id' => $journal->id,
            'token' => Str::uuid()->toString(),
            'email' => $email,
            'purpose' => $purpose,
            'expires_at' => Carbon::now()->addDays(3),
            'created_at' => now(),
        ]);
    }
}
