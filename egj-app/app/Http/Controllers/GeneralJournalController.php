<?php

namespace App\Http\Controllers;

use App\Models\ApprovalHistory;
use App\Models\EmailToken;
use App\Models\GeneralJournal;
use App\Models\GeneralJournalApproval;
use App\Models\GeneralJournalFile;
use App\Models\Notification;
use App\Models\User;
use App\Services\PdfApprovalStampService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use App\Mail\ApprovalRequestMail;
use App\Mail\DeptHeadApprovalMail;

class GeneralJournalController extends Controller
{
    /**
     * Show the create form.
     */
    public function create()
    {
        $user = Auth::user();

        // Hanya Staff dan Section Head yang boleh membuat pengajuan
        if (!$user->hasRole('Staff') && !$user->hasRole('Section Head')) {
            abort(403, 'Hanya Staff dan Section Head yang dapat mengajukan General Journal.');
        }

        return Inertia::render('GeneralJournal/Create');
    }

    /**
     * Store a newly created General Journal with PDF and supporting documents.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user->hasRole('Staff') && !$user->hasRole('Section Head')) {
            abort(403);
        }

        $request->validate([
            'document_number' => ['required', 'string', 'max:50', 'unique:general_journals,document_number'],
            'journal_date' => ['required', 'date'],
            'reference' => ['nullable', 'string'],
            'general_journal_file' => ['required', 'file', 'mimes:pdf', 'max:10240'],
            'supporting_documents' => ['nullable', 'array'],
            'supporting_documents.*' => ['file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,xlsx,xls'],
        ]);

        $journal = DB::transaction(function () use ($request, $user) {
            $sectionHead = User::where('role', 'Section Head')->where('is_active', true)->first();
            $deptHead = User::where('role', 'Dept/Div Head')->where('is_active', true)->first();
            
            $currentAssignTo = $user->hasRole('Staff') ? $sectionHead?->id : $deptHead?->id;

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

            // Upload Supporting Documents
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
                if ($sectionHead && $deptHead) {
                    $this->sendApprovalEmail($journal, $sectionHead, $deptHead);
                }

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
                if ($deptHead) {
                    GeneralJournalApproval::create([
                        'general_journal_id' => $journal->id,
                        'approval_level' => 'superior_of_superior',
                        'assigned_user_id' => $deptHead->id,
                        'status' => 'Pending',
                    ]);

                    // Send email directly to Dept/Div Head
                    $this->sendDeptHeadApprovalEmail($journal, $deptHead);
                }
            }

            // Record history
            ApprovalHistory::create([
                'general_journal_id' => $journal->id,
                'action' => 'submit',
                'actor_user_id' => $user->id,
                'target_level' => $user->hasRole('Staff') ? 'superior' : 'superior_of_superior',
                'created_at' => now(),
            ]);

            // Create notification for approver
            if ($currentAssignTo) {
                Notification::create([
                    'user_id' => $currentAssignTo,
                    'general_journal_id' => $journal->id,
                    'type' => 'approval_request',
                    'message' => "Dokumen {$journal->document_number} membutuhkan persetujuan Anda.",
                    'created_at' => now(),
                ]);
            }

            return $journal;
        });

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
     * Send approval notification email to Section Head.
     */
    private function sendApprovalEmail(GeneralJournal $journal, User $sectionHead, User $deptHead): void
    {
        try {
            $previewToken = $this->createEmailToken($journal, $sectionHead->email, 'preview');

            Mail::to($sectionHead->email)->send(
                new ApprovalRequestMail($journal, $sectionHead, $previewToken)
            );
        } catch (\Throwable $e) {
            \Log::error("Failed sending ApprovalRequestMail to Section Head: " . $e->getMessage());
        }
    }

    /**
     * Send approval notification email to Dept/Div Head with approve button.
     */
    private function sendDeptHeadApprovalEmail(GeneralJournal $journal, User $deptHead): void
    {
        try {
            $approvalToken = $this->createEmailToken($journal, $deptHead->email, 'approval');
            $previewToken = $this->createEmailToken($journal, $deptHead->email, 'preview');

            Mail::to($deptHead->email)->send(
                new DeptHeadApprovalMail($journal, $deptHead, $approvalToken, $previewToken)
            );
        } catch (\Throwable $e) {
            \Log::error("Failed sending DeptHeadApprovalMail to Dept/Div Head: " . $e->getMessage());
        }
    }

    /**
     * Create an email token with 5 business days expiry.
     */
    private function createEmailToken(GeneralJournal $journal, string $email, string $purpose): EmailToken
    {
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
