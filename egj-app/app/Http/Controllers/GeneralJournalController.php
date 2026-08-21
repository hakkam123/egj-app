<?php

namespace App\Http\Controllers;

use App\Models\GeneralJournal;
use App\Models\GeneralJournalFile;
use App\Models\GeneralJournalApproval;
use App\Models\ApprovalHistory;
use App\Models\EmailToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use App\Services\PdfApprovalStampService;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Inertia\Inertia;
use App\Mail\ApprovalRequestMail;
use App\Mail\DeptHeadApprovalMail;

class GeneralJournalController extends Controller
{
    /**
     * Show create form for new draft.
     */
    public function create()
    {
        $user = Auth::user();

        if (!$user->canCreateJournal()) {
            abort(403, 'Anda tidak memiliki izin untuk membuat General Journal.');
        }

        return Inertia::render('GeneralJournal/Create');
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user->canCreateJournal()) {
            abort(403);
        }

        $request->validate([
            'document_number' => ['required', 'string', 'max:100'],
            'journal_date' => ['required', 'date'],
            'reference' => ['nullable', 'string'],
            'general_journal_file' => ['required', 'file', 'mimes:pdf', 'max:10240'],
            'supporting_documents' => ['nullable', 'array'],
            'supporting_documents.*' => ['file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,xlsx,xls'],
        ]);

        $journal = DB::transaction(function () use ($request, $user) {
            $sectionHead = User::where('role', 'Section Head')->where('is_active', true)->first();
            $deptHead = User::where('role', 'Dept/Div Head')->where('is_active', true)->first();
            
            $currentAssignTo = $user->hasRole('Staff') ? $sectionHead->id : $deptHead->id;

            $journal = GeneralJournal::create([
                'document_number' => $request->document_number,
                'journal_date' => $request->journal_date,
                'reference' => $request->reference,
                'status' => 'Waiting Approval',
                'requested_by' => $user->id,
                'current_assign_to' => $currentAssignTo,
                'resubmit_count' => 0,
                'submitted_at' => now(),
                'last_updated_at' => now(),
            ]);

            // Upload General Journal PDF
            $gjFile = $request->file('general_journal_file');
            $gjPath = $gjFile->store("general-journals/{$journal->id}/general_journal");

            GeneralJournalFile::create([
                'general_journal_id' => $journal->id,
                'category' => 'general_journal',
                'file_name' => $gjFile->getClientOriginalName(),
                'file_path' => $gjPath,
                'file_size' => $gjFile->getSize(),
                'mime_type' => $gjFile->getMimeType(),
                'version' => 1,
                'is_active' => true,
                'uploaded_at' => now(),
            ]);

            // Upload Supporting Documents
            if ($request->hasFile('supporting_documents')) {
                foreach ($request->file('supporting_documents') as $file) {
                    $path = $file->store("general-journals/{$journal->id}/supporting_documents");

                    GeneralJournalFile::create([
                        'general_journal_id' => $journal->id,
                        'category' => 'supporting_document',
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => $path,
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                        'version' => 1,
                        'is_active' => true,
                        'uploaded_at' => now(),
                    ]);
                }
            }

            if ($user->hasRole('Staff')) {
                // Accounting: auto-approved
                GeneralJournalApproval::create([
                    'general_journal_id' => $journal->id,
                    'approval_level' => 'accounting',
                    'assigned_user_id' => $user->id,
                    'approved_by_user_id' => $user->id,
                    'status' => 'Approved',
                    'approved_at' => now(),
                ]);

                // Superior: Section Head
                GeneralJournalApproval::create([
                    'general_journal_id' => $journal->id,
                    'approval_level' => 'superior',
                    'assigned_user_id' => $sectionHead->id,
                    'status' => 'Pending',
                ]);

                // Superior of Superior: Dept/Div Head
                GeneralJournalApproval::create([
                    'general_journal_id' => $journal->id,
                    'approval_level' => 'superior_of_superior',
                    'assigned_user_id' => $deptHead->id,
                    'status' => 'Pending',
                ]);

                // Send email to Section Head
                $this->sendApprovalEmail($journal, $sectionHead, $deptHead);

            } elseif ($user->hasRole('Section Head')) {
                // Accounting & Superior auto-approved
                GeneralJournalApproval::create([
                    'general_journal_id' => $journal->id,
                    'approval_level' => 'accounting',
                    'assigned_user_id' => $user->id,
                    'approved_by_user_id' => $user->id,
                    'status' => 'Approved',
                    'approved_at' => now(),
                ]);

                GeneralJournalApproval::create([
                    'general_journal_id' => $journal->id,
                    'approval_level' => 'superior',
                    'assigned_user_id' => $user->id,
                    'approved_by_user_id' => $user->id,
                    'status' => 'Approved',
                    'approved_at' => now(),
                ]);

                // Superior of Superior: Dept/Div Head
                GeneralJournalApproval::create([
                    'general_journal_id' => $journal->id,
                    'approval_level' => 'superior_of_superior',
                    'assigned_user_id' => $deptHead->id,
                    'status' => 'Pending',
                ]);

                // Send email directly to Dept/Div Head
                $this->sendDeptHeadApprovalEmail($journal, $deptHead);
            }

            // Record history
            ApprovalHistory::create([
                'general_journal_id' => $journal->id,
                'action' => 'submit',
                'actor_user_id' => $user->id,
                'target_level' => $user->hasRole('Staff') ? 'superior' : 'superior_of_superior',
                'created_at' => now(),
            ]);

            return $journal;
        });

        // Stamp PDF
        $stampService = app(PdfApprovalStampService::class);
        if ($user->hasRole('Staff')) {
            $stampService->stampApproval($journal, 'accounting');
        } elseif ($user->hasRole('Section Head')) {
            $stampService->stampApproval($journal, 'accounting');
            $stampService->stampApproval($journal, 'superior');
        }

        return redirect()->route('monitoring.index')
            ->with('success', 'Dokumen berhasil diajukan.');
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
     * Show resubmit form (after rejection).
     */
    public function resubmitForm(string $id)
    {
        $journal = GeneralJournal::with('activeFiles')->findOrFail($id);

        if ($journal->requested_by !== Auth::id() || !$journal->isRejected()) {
            abort(403, 'Anda tidak dapat resubmit dokumen ini.');
        }

        return Inertia::render('GeneralJournal/Resubmit', [
            'journal' => $journal,
        ]);
    }

    /**
     * Process resubmit with new files.
     */
    public function resubmit(Request $request, string $id)
    {
        $journal = GeneralJournal::findOrFail($id);
        $user = Auth::user();

        if ($journal->requested_by !== $user->id || !$journal->isRejected()) {
            abort(403);
        }

        $request->validate([
            'general_journal_file' => ['required', 'file', 'mimes:pdf', 'max:10240'],
            'supporting_documents' => ['nullable', 'array'],
            'supporting_documents.*' => ['file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,xlsx,xls'],
        ]);

        $journal = DB::transaction(function () use ($request, $journal, $user) {
            $newVersion = $journal->resubmit_count + 2; // version starts at 1, resubmit adds 1

            // Deactivate all old files
            $journal->files()->update(['is_active' => false]);

            // Upload new General Journal PDF
            $gjFile = $request->file('general_journal_file');
            $gjPath = $gjFile->store("general-journals/{$journal->id}/general_journal");

            GeneralJournalFile::create([
                'general_journal_id' => $journal->id,
                'category' => 'general_journal',
                'file_name' => $gjFile->getClientOriginalName(),
                'file_path' => $gjPath,
                'file_size' => $gjFile->getSize(),
                'mime_type' => $gjFile->getMimeType(),
                'version' => $newVersion,
                'is_active' => true,
                'uploaded_at' => now(),
            ]);

            // Upload new Supporting Documents
            if ($request->hasFile('supporting_documents')) {
                foreach ($request->file('supporting_documents') as $file) {
                    $path = $file->store("general-journals/{$journal->id}/supporting_documents");

                    GeneralJournalFile::create([
                        'general_journal_id' => $journal->id,
                        'category' => 'supporting_document',
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => $path,
                        'file_size' => $file->getSize(),
                        'mime_type' => $file->getMimeType(),
                        'version' => $newVersion,
                        'is_active' => true,
                        'uploaded_at' => now(),
                    ]);
                }
            }

            // Reset approval records
            $journal->approvals()->delete();

            $sectionHead = User::where('role', 'Section Head')->where('is_active', true)->first();
            $deptHead = User::where('role', 'Dept/Div Head')->where('is_active', true)->first();

            if ($user->hasRole('Staff')) {
                // Accounting: auto-approved
                GeneralJournalApproval::create([
                    'general_journal_id' => $journal->id,
                    'approval_level' => 'accounting',
                    'assigned_user_id' => $user->id,
                    'approved_by_user_id' => $user->id,
                    'status' => 'Approved',
                    'approved_at' => now(),
                ]);

                GeneralJournalApproval::create([
                    'general_journal_id' => $journal->id,
                    'approval_level' => 'superior',
                    'assigned_user_id' => $sectionHead->id,
                    'status' => 'Pending',
                ]);

                GeneralJournalApproval::create([
                    'general_journal_id' => $journal->id,
                    'approval_level' => 'superior_of_superior',
                    'assigned_user_id' => $deptHead->id,
                    'status' => 'Pending',
                ]);

                $journal->update([
                    'status' => 'Waiting Approval',
                    'current_assign_to' => $sectionHead->id,
                    'resubmit_count' => $journal->resubmit_count + 1,
                    'last_updated_at' => now(),
                ]);

                $this->sendApprovalEmail($journal, $sectionHead, $deptHead);

            } elseif ($user->hasRole('Section Head')) {
                // Accounting & Superior auto-approved
                GeneralJournalApproval::create([
                    'general_journal_id' => $journal->id,
                    'approval_level' => 'accounting',
                    'assigned_user_id' => $user->id,
                    'approved_by_user_id' => $user->id,
                    'status' => 'Approved',
                    'approved_at' => now(),
                ]);

                GeneralJournalApproval::create([
                    'general_journal_id' => $journal->id,
                    'approval_level' => 'superior',
                    'assigned_user_id' => $user->id,
                    'approved_by_user_id' => $user->id,
                    'status' => 'Approved',
                    'approved_at' => now(),
                ]);

                GeneralJournalApproval::create([
                    'general_journal_id' => $journal->id,
                    'approval_level' => 'superior_of_superior',
                    'assigned_user_id' => $deptHead->id,
                    'status' => 'Pending',
                ]);

                $journal->update([
                    'status' => 'Waiting Approval',
                    'current_assign_to' => $deptHead->id,
                    'resubmit_count' => $journal->resubmit_count + 1,
                    'last_updated_at' => now(),
                ]);

                $this->sendDeptHeadApprovalEmail($journal, $deptHead);
            }

            // Record history
            ApprovalHistory::create([
                'general_journal_id' => $journal->id,
                'action' => 'resubmit',
                'actor_user_id' => $user->id,
                'target_level' => $user->hasRole('Staff') ? 'superior' : 'superior_of_superior',
                'created_at' => now(),
            ]);

            return $journal;
        });

        // Stamp PDF for resubmit
        $stampService = app(PdfApprovalStampService::class);
        if ($user->hasRole('Staff')) {
            $stampService->stampApproval($journal, 'accounting');
        } elseif ($user->hasRole('Section Head')) {
            $stampService->stampApproval($journal, 'accounting');
            $stampService->stampApproval($journal, 'superior');
        }

        return redirect()->route('monitoring.index')
            ->with('success', 'General Journal berhasil di-resubmit.');
    }

    /**
     * Send approval notification email to Section Head.
     */
    private function sendApprovalEmail(GeneralJournal $journal, User $sectionHead, User $deptHead): void
    {
        // Create preview token for Section Head
        $previewToken = $this->createEmailToken($journal, $sectionHead->email, 'preview');

        Mail::to($sectionHead->email)->send(
            new ApprovalRequestMail($journal, $sectionHead, $previewToken)
        );
    }

    /**
     * Send approval notification email to Dept/Div Head with approve button.
     */
    private function sendDeptHeadApprovalEmail(GeneralJournal $journal, User $deptHead): void
    {
        // Create approval token and preview token for Dept/Div Head
        $approvalToken = $this->createEmailToken($journal, $deptHead->email, 'approval');
        $previewToken = $this->createEmailToken($journal, $deptHead->email, 'preview');

        Mail::to($deptHead->email)->send(
            new DeptHeadApprovalMail($journal, $deptHead, $approvalToken, $previewToken)
        );
    }

    /**
     * Create an email token with 5 business days expiry.
     */
    private function createEmailToken(GeneralJournal $journal, string $email, string $purpose): EmailToken
    {
        // Calculate 5 business days from now (skip weekends)
        $expiresAt = Carbon::now();
        $businessDays = 0;
        while ($businessDays < 5) {
            $expiresAt->addDay();
            if (!$expiresAt->isWeekend()) {
                $businessDays++;
            }
        }

        return EmailToken::create([
            'general_journal_id' => $journal->id,
            'token' => Str::uuid()->toString(),
            'email' => $email,
            'purpose' => $purpose,
            'expires_at' => $expiresAt,
            'created_at' => now(),
        ]);
    }
}
