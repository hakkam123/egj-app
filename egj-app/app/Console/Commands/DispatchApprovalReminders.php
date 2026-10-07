<?php

namespace App\Console\Commands;

use App\Jobs\SendApprovalReminderJob;
use App\Models\ApprovalHistory;
use App\Models\EmailToken;
use App\Models\GeneralJournal;
use App\Models\Notification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class DispatchApprovalReminders extends Command
{
    /**
     * Re-send the approval email when the Dept Head has not acted this many days after the last email.
     */
    public const REMIND_AFTER_DAYS = 3;

    /**
     * Maximum reminders per approval round (after that the Dept Head uses the portal).
     */
    public const MAX_REMINDERS = 2;

    protected $signature   = 'jago:dispatch-reminders';
    protected $description = 'Dispatch reminder emails for pending Dept Head approvals';

    public function handle(): void
    {
        // All journals currently waiting at the Dept/Div Head (superior_of_superior) stage
        $journals = GeneralJournal::where('status', 'Waiting Approval')
            ->whereHas('approvals', function ($q) {
                $q->where('approval_level', 'superior_of_superior')
                  ->where('status', 'Pending');
            })
            ->whereDoesntHave('approvals', function ($q) {
                $q->where('approval_level', 'superior')
                  ->where('status', 'Pending');
            })
            ->whereNotNull('submitted_at')
            ->get();

        $dispatched = 0;

        foreach ($journals as $journal) {
            $stageStartedAt = self::stageStartedAt($journal);

            $remindersSent = Notification::where('general_journal_id', $journal->id)
                ->where('type', 'reminder_pending')
                ->where('created_at', '>=', $stageStartedAt)
                ->count();

            if ($remindersSent >= self::MAX_REMINDERS) {
                continue;
            }

            // Last time the Dept Head was emailed approve/revise links (initial email or a reminder)
            $lastEmailedAt = EmailToken::where('general_journal_id', $journal->id)
                ->where('purpose', 'approval')
                ->where('created_at', '>=', $stageStartedAt)
                ->max('created_at');
            $lastEmailedAt = $lastEmailedAt ? \Illuminate\Support\Carbon::parse($lastEmailedAt) : $stageStartedAt;

            // Compare calendar days so the 08:00 schedule is not skipped by a few hours
            $daysSinceLastEmail = (int) $lastEmailedAt->copy()->startOfDay()->diffInDays(today());

            if ($daysSinceLastEmail < self::REMIND_AFTER_DAYS) {
                continue;
            }

            $reminderNumber = $remindersSent + 1;
            SendApprovalReminderJob::dispatch($journal->id, $reminderNumber);
            $dispatched++;
            $this->info("Dispatched reminder #{$reminderNumber} for {$journal->document_number}");
        }

        Log::info("jago:dispatch-reminders completed. Dispatched: {$dispatched}");
        $this->info("Done. Dispatched {$dispatched} reminder(s).");
    }

    /**
     * When the journal reached its current approval round: the latest submit / resubmit /
     * approve event (the Section Head approval hands it to the Dept Head).
     */
    public static function stageStartedAt(GeneralJournal $journal): \Illuminate\Support\Carbon
    {
        $at = ApprovalHistory::where('general_journal_id', $journal->id)
            ->whereIn('action', ['submit', 'resubmit', 'approve'])
            ->max('created_at');

        return $at
            ? \Illuminate\Support\Carbon::parse($at)
            : ($journal->submitted_at ?? $journal->last_updated_at ?? now());
    }
}
