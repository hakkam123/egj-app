<?php

namespace App\Http\Controllers;

use App\Models\EmailToken;
use App\Models\GeneralJournal;
use App\Models\GeneralJournalApproval;
use App\Models\ApprovalHistory;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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

        if (!$approver) {
            return Inertia::render('EmailApproval/Invalid', [
                'message' => 'Anda tidak memiliki akses untuk approval dokumen ini.',
            ]);
        }

        DB::transaction(function () use ($journal, $approver, $emailToken) {
            // Find the pending approval for Dept/Div Head
            $currentApproval = $journal->approvals()
                ->where('approval_level', 'superior_of_superior')
                ->where('status', 'Pending')
                ->first();

            if (!$currentApproval) {
                abort(403);
            }

            // Approve
            $currentApproval->update([
                'status' => 'Approved',
                'assigned_user_id' => $approver->id,
                'approved_by_user_id' => $approver->id,
                'approved_at' => now(),
                'notes' => 'Approved ' . now()->format('Y-m-d') . ' ' . $approver->name . ' (via email)',
            ]);

            // Mark token as used
            $emailToken->markAsUsed();

            // All approved → final
            $journal->update([
                'status' => 'Approved',
                'current_assign_to' => null,
                'last_updated_at' => now(),
            ]);

            // Record history
            ApprovalHistory::create([
                'general_journal_id' => $journal->id,
                'action' => 'approve',
                'actor_user_id' => $approver->id,
                'target_level' => $currentApproval->approval_level,
                'notes' => 'Approved via email ' . now()->format('Y-m-d') . ' ' . $approver->name,
                'created_at' => now(),
            ]);

            // Cek sebelum buat notifikasi approved ke requester
            $alreadyNotified = Notification::where('general_journal_id', $journal->id)
                ->where('user_id', $journal->requested_by)
                ->where('type', 'approved')
                ->exists();

            if (!$alreadyNotified) {
                // Create notification for requester
                Notification::create([
                    'user_id' => $journal->requested_by,
                    'general_journal_id' => $journal->id,
                    'type' => 'approved',
                    'message' => "Dokumen {$journal->document_number} telah disetujui sepenuhnya.",
                    'created_at' => now(),
                ]);

                // Send final approval email to requester
                $requester = User::find($journal->requested_by);
                if ($requester) {
                    try {
                        Mail::to($requester->email)->send(
                            new ApprovalResultMail($journal, $requester, 'approved')
                        );
                    } catch (\Throwable $e) {
                        Log::error("Failed sending ApprovalResultMail in email approval for journal {$journal->id}: " . $e->getMessage());
                    }
                }
            }
        });

        return Inertia::render('EmailApproval/Success', [
            'journal' => $journal->fresh(['requester']),
        ]);
    }
}
