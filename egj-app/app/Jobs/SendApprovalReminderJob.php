<?php

namespace App\Jobs;

use App\Console\Commands\DispatchApprovalReminders;
use App\Mail\DeptHeadApprovalMail;
use App\Models\EmailToken;
use App\Models\GeneralJournal;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendApprovalReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        public string $journalId,
        public int $reminderNumber
    ) {}

    public function handle(): void
    {
        $journal = GeneralJournal::with(['requester'])->find($this->journalId);

        // Skip if the journal is gone or no longer waiting
        if (!$journal || $journal->status !== 'Waiting Approval') {
            Log::info("Reminder skipped for journal {$this->journalId}: status = " . ($journal?->status ?? 'not found'));
            return;
        }

        // Only remind while the journal is at the Dept/Div Head stage
        $pendingFinal = $journal->currentPendingApproval();

        if (!$pendingFinal || $pendingFinal->approval_level !== 'superior_of_superior') {
            Log::info("Reminder skipped for journal {$this->journalId}: not at final approval stage");
            return;
        }

        $deptHead = User::where('id', $pendingFinal->assigned_user_id)->where('is_active', true)->first()
            ?? User::where('role', 'Dept/Div Head')->where('is_active', true)->first();
        if (!$deptHead) return;

        // Old links stop working; the reminder carries fresh ones valid for EmailToken::TTL_DAYS
        EmailToken::revokeFor($journal->id, $deptHead->email);

        $approveToken = EmailToken::issue($journal, $deptHead->email, 'approval');
        $reviseToken = EmailToken::issue($journal, $deptHead->email, 'rejection');

        $approveUrl = route('email.approve', ['token' => $approveToken->token]);
        $reviseUrl  = route('email.revise', ['token' => $reviseToken->token]);

        $daysPending = (int) DispatchApprovalReminders::stageStartedAt($journal)->copy()->startOfDay()->diffInDays(today());

        try {
            Mail::to($deptHead->email)->send(
                new DeptHeadApprovalMail($journal, $deptHead, $approveUrl, $reviseUrl, $this->reminderNumber, $daysPending)
            );
            Log::info("Reminder #{$this->reminderNumber} sent for journal {$journal->document_number} to {$deptHead->email}");
        } catch (\Throwable $e) {
            Log::error("Failed sending reminder for journal {$journal->id}: " . $e->getMessage());
            throw $e; // re-throw so the job is retried
        }

        // Also records that this reminder was sent (the dispatcher counts these per round)
        Notification::create([
            'user_id'            => $journal->requested_by,
            'general_journal_id' => $journal->id,
            'type'               => 'reminder_pending',
            'message'            => "Document {$journal->document_number} is still waiting for final approval (reminder #{$this->reminderNumber}).",
            'created_at'         => now(),
        ]);
    }
}
