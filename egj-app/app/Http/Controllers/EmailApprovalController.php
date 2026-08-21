<?php

namespace App\Http\Controllers;

use App\Models\EmailToken;
use App\Models\GeneralJournal;
use App\Models\GeneralJournalApproval;
use App\Models\ApprovalHistory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use App\Mail\ApprovalResultMail;

class EmailApprovalController extends Controller
{
    /**
     * Show approval confirmation page (GET).
     */
    public function show(string $token)
    {
        $emailToken = EmailToken::where('token', $token)
            ->where('purpose', 'approval')
            ->first();

        if (!$emailToken) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'Token tidak valid.',
            ]);
        }

        if ($emailToken->isExpired()) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'Token sudah kedaluwarsa. Silakan minta pengiriman ulang notifikasi email.',
            ]);
        }

        if ($emailToken->isUsed()) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'Token ini sudah digunakan.',
            ]);
        }

        $journal = GeneralJournal::with([
            'requester',
            'activeFiles',
            'approvals.assignedUser',
        ])->findOrFail($emailToken->general_journal_id);

        // Check if the journal is still waiting approval
        if (!$journal->isWaitingApproval()) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'Dokumen ini sudah tidak memerlukan approval.',
            ]);
        }

        return Inertia::render('EmailApproval/Confirm', [
            'journal' => $journal,
            'token' => $token,
        ]);
    }

    /**
     * Process approval via email token (POST).
     */
    public function approve(Request $request, string $token)
    {
        $emailToken = EmailToken::where('token', $token)
            ->where('purpose', 'approval')
            ->first();

        if (!$emailToken || $emailToken->isExpired() || $emailToken->isUsed()) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'Token tidak valid atau sudah kedaluwarsa.',
            ]);
        }

        $journal = GeneralJournal::with('approvals')->findOrFail($emailToken->general_journal_id);

        if (!$journal->isWaitingApproval()) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'Dokumen ini sudah tidak memerlukan approval.',
            ]);
        }

        // Find the approver user by email
        $approver = User::where('email', $emailToken->email)
            ->where('role', 'Dept/Div Head')
            ->first();

        if (!$approver || $journal->current_assign_to !== $approver->id) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'Anda tidak memiliki akses untuk approval dokumen ini.',
            ]);
        }

        DB::transaction(function () use ($journal, $approver, $emailToken) {
            // Find the pending approval for this user
            $currentApproval = $journal->approvals()
                ->where('assigned_user_id', $approver->id)
                ->where('status', 'Pending')
                ->first();

            if (!$currentApproval) {
                abort(403);
            }

            // Approve
            $currentApproval->update([
                'status' => 'Approved',
                'approved_by_user_id' => $approver->id,
                'approved_at' => now(),
                'notes' => 'Approved ' . now()->format('Y-m-d') . ' ' . $approver->name . ' (via email)',
            ]);

            // Mark token as used
            $emailToken->markAsUsed();

            // Check for next pending approvals
            $nextPending = $journal->approvals()
                ->where('status', 'Pending')
                ->first();

            if (!$nextPending) {
                // All approved → final
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
            } else {
                $journal->update([
                    'current_assign_to' => $nextPending->assigned_user_id,
                    'last_updated_at' => now(),
                ]);
            }

            // Record history
            ApprovalHistory::create([
                'general_journal_id' => $journal->id,
                'action' => 'approve',
                'actor_user_id' => $approver->id,
                'target_level' => $currentApproval->approval_level,
                'notes' => 'Approved via email ' . now()->format('Y-m-d') . ' ' . $approver->name,
                'created_at' => now(),
            ]);
        });

        return Inertia::render('EmailApproval/Success', [
            'journal' => $journal->fresh(['requester']),
        ]);
    }
}
