<?php

namespace App\Console\Commands;

use App\Jobs\SendApprovalReminderJob;
use App\Models\GeneralJournal;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class DispatchApprovalReminders extends Command
{
    protected $signature   = 'jago:dispatch-reminders';
    protected $description = 'Dispatch reminder emails for pending Dept Head approvals';

    public function handle(): void
    {
        // Cari semua jurnal yang masih Waiting Approval
        // dan superior_of_superior masih Pending
        $journals = GeneralJournal::where('status', 'Waiting Approval')
            ->whereHas('approvals', function ($q) {
                $q->where('approval_level', 'superior_of_superior')
                  ->where('status', 'Pending');
            })
            ->whereNotNull('submitted_at')
            ->get();

        $dispatched = 0;

        foreach ($journals as $journal) {
            $daysPending = now()->diffInDays($journal->last_updated_at ?? $journal->submitted_at);

            // Cek apakah reminder sudah pernah dikirim hari ini
            $reminderSentToday = \App\Models\Notification::where('general_journal_id', $journal->id)
                ->where('type', 'reminder_pending')
                ->whereDate('created_at', today())
                ->exists();

            if ($reminderSentToday) continue;

            if ($daysPending >= 5) {
                // Cek apakah reminder 2 sudah pernah dikirim
                $reminder2Sent = \App\Models\Notification::where('general_journal_id', $journal->id)
                    ->where('type', 'reminder_pending')
                    ->count() >= 2;

                if (!$reminder2Sent) {
                    SendApprovalReminderJob::dispatch($journal->id, 2);
                    $dispatched++;
                    $this->info("Dispatched reminder #2 for {$journal->document_number}");
                }
            } elseif ($daysPending >= 3) {
                // Cek apakah reminder 1 sudah pernah dikirim
                $reminder1Sent = \App\Models\Notification::where('general_journal_id', $journal->id)
                    ->where('type', 'reminder_pending')
                    ->count() >= 1;

                if (!$reminder1Sent) {
                    SendApprovalReminderJob::dispatch($journal->id, 1);
                    $dispatched++;
                    $this->info("Dispatched reminder #1 for {$journal->document_number}");
                }
            }
        }

        Log::info("jago:dispatch-reminders completed. Dispatched: {$dispatched}");
        $this->info("Done. Dispatched {$dispatched} reminder(s).");
    }
}
