<?php

namespace App\Http\Controllers;

use App\Models\GeneralJournal;
use App\Models\GeneralJournalApproval;
use App\Models\ApprovalHistory;
use App\Models\EmailToken;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Services\PdfApprovalStampService;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Inertia\Inertia;
use App\Mail\DeptHeadApprovalMail;
use App\Mail\ApprovalResultMail;

class ApprovalController extends Controller
{
    /**
     * Show approval queue for the current user.
     */
    public function index()
    {
        $user = Auth::user();

        $journals = GeneralJournal::with(['requester', 'assignee'])
            ->where('current_assign_to', $user->id)
            ->where('status', 'Waiting Approval')
            ->orderBy('last_updated_at', 'desc')
            ->paginate(15);

        return Inertia::render('Approval/Index', [
            'journals' => $journals,
        ]);
    }

    /**
     * Show approval detail.
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

        $user = Auth::user();

        // User can access if they are the current assignee OR they are in the approval chain
        $isCurrentAssignee = $journal->current_assign_to == $user->id;
        $isInApprovalChain = $journal->approvals->contains('assigned_user_id', $user->id);

        if (!$isCurrentAssignee && !$isInApprovalChain) {
            abort(403, 'Anda tidak memiliki akses untuk approval dokumen ini.');
        }

        return Inertia::render('Approval/Show', [
            'journal' => $journal,
        ]);
    }

    /**
     * Approve a General Journal.
     */
    public function approve(Request $request, string $id)
    {
        $journal = GeneralJournal::with('approvals')->findOrFail($id);
        $user = Auth::user();

        if ($journal->current_assign_to != $user->id || !$journal->isWaitingApproval()) {
            abort(403);
        }

        $levelStamped = null;

        DB::transaction(function () use ($journal, $user, &$levelStamped) {
            // Find the current pending approval for this user
            $currentApproval = $journal->approvals()
                ->where('assigned_user_id', $user->id)
                ->where('status', 'Pending')
                ->first();

            if (!$currentApproval) {
                abort(403, 'Tidak ada approval yang pending untuk Anda.');
            }

            // Approve the current level
            $currentApproval->update([
                'status' => 'Approved',
                'approved_by_user_id' => $user->id,
                'approved_at' => now(),
                'notes' => 'Approved ' . now()->format('Y-m-d') . ' ' . $user->name,
            ]);

            $levelStamped = $currentApproval->approval_level;

            // Record history
            ApprovalHistory::create([
                'general_journal_id' => $journal->id,
                'action' => 'approve',
                'actor_user_id' => $user->id,
                'target_level' => $currentApproval->approval_level,
                'notes' => 'Approved ' . now()->format('Y-m-d') . ' ' . $user->name,
                'created_at' => now(),
            ]);

            // Check if there are more pending levels
            $nextPending = $journal->approvals()
                ->where('status', 'Pending')
                ->orderByRaw("CASE approval_level WHEN 'accounting' THEN 1 WHEN 'superior' THEN 2 WHEN 'superior_of_superior' THEN 3 END")
                ->first();

            if ($nextPending) {
                // Move to next approver
                $journal->update([
                    'current_assign_to' => $nextPending->assigned_user_id,
                    'last_updated_at' => now(),
                ]);

                // Send email to next approver
                $nextUser = User::find($nextPending->assigned_user_id);
                if ($nextUser->hasRole('Dept/Div Head')) {
                    // Send email with approve button to Dept/Div Head
                    $approvalToken = $this->createEmailToken($journal, $nextUser->email, 'approval');
                    $previewToken = $this->createEmailToken($journal, $nextUser->email, 'preview');

                    Mail::to($nextUser->email)->send(
                        new DeptHeadApprovalMail($journal, $nextUser, $approvalToken, $previewToken)
                    );
                }
            } else {
                // All levels approved → final approved
                $journal->update([
                    'status' => 'Approved',
                    'current_assign_to' => null,
                    'last_updated_at' => now(),
                ]);

                // Send final approval email to requester
                $requester = User::find($journal->requested_by);
                Mail::to($requester->email)->send(
                    new ApprovalResultMail($journal, $requester, 'approved')
                );
            }
        });

        // Stamp PDF
        if ($levelStamped) {
            $stampService = app(PdfApprovalStampService::class);
            $stampService->stampApproval($journal, $levelStamped);
        }

        return redirect()->route('approval.index')
            ->with('success', 'General Journal berhasil di-approve.');
    }

    /**
     * Reject a General Journal.
     */
    public function reject(Request $request, string $id)
    {
        $request->validate([
            'notes' => ['required', 'string', 'min:5'],
        ]);

        $journal = GeneralJournal::with('approvals')->findOrFail($id);
        $user = Auth::user();

        if ($journal->current_assign_to != $user->id || !$journal->isWaitingApproval()) {
            abort(403);
        }

        DB::transaction(function () use ($request, $journal, $user) {
            // Find the current pending approval
            $currentApproval = $journal->approvals()
                ->where('assigned_user_id', $user->id)
                ->where('status', 'Pending')
                ->first();

            if (!$currentApproval) {
                abort(403);
            }

            // Reject the current level
            $currentApproval->update([
                'status' => 'Rejected',
                'approved_by_user_id' => $user->id,
                'approved_at' => now(),
                'notes' => $request->notes,
            ]);

            // Update journal status
            $journal->update([
                'status' => 'Rejected',
                'current_assign_to' => $journal->requested_by, // Assign back to requester
                'last_updated_at' => now(),
            ]);

            // Record history
            ApprovalHistory::create([
                'general_journal_id' => $journal->id,
                'action' => 'reject',
                'actor_user_id' => $user->id,
                'target_level' => $currentApproval->approval_level,
                'notes' => $request->notes,
                'created_at' => now(),
            ]);

            // Send rejection email to requester
            $requester = User::find($journal->requested_by);
            Mail::to($requester->email)->send(
                new ApprovalResultMail($journal, $requester, 'rejected', $request->notes)
            );
        });

        return redirect()->route('approval.index')
            ->with('success', 'General Journal berhasil di-reject.');
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
