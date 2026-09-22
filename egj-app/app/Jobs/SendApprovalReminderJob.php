<?php

namespace App\Jobs;

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
use Illuminate\Support\Str;

class SendApprovalReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        public string $journalId,
        public int $reminderNumber // 1 atau 2
    ) {}

    public function handle(): void
    {
        $journal = GeneralJournal::with([
            'approvals.approvedBy',
            'requester',
            'files',
        ])->find($this->journalId);

        // Skip jika sudah approved/rejected atau tidak ada
        if (!$journal || $journal->status !== 'Waiting Approval') {
            Log::info("Reminder skipped for journal {$this->journalId}: status = " . ($journal?->status ?? 'not found'));
            return;
        }

        // Cek apakah superior_of_superior masih Pending
        $pendingFinal = $journal->approvals()
            ->where('approval_level', 'superior_of_superior')
            ->where('status', 'Pending')
            ->first();

        if (!$pendingFinal) {
            Log::info("Reminder skipped for journal {$this->journalId}: no pending final approval");
            return;
        }

        // Ambil Dept Head
        $deptHead = User::where('role', 'Dept/Div Head')->where('is_active', true)->first();
        if (!$deptHead) return;

        // Expire semua token lama untuk journal ini
        EmailToken::where('general_journal_id', $journal->id)
            ->where('email', $deptHead->email)
            ->whereNull('used_at')
            ->update(['expires_at' => now()->subSecond()]);

        // Generate token baru
        // Token berlaku 24 jam x hari threshold berikutnya
        // Reminder 1 (hari ke-3): token berlaku 2 hari (sampai hari ke-5)
        // Reminder 2 (hari ke-5): token berlaku 2 hari
        $tokenHours = 48;

        $approveToken = EmailToken::create([
            'general_journal_id' => $journal->id,
            'email'              => $deptHead->email,
            'token'              => Str::random(64),
            'purpose'            => 'approval',
            'expires_at'         => now()->addHours($tokenHours),
            'created_at'         => now(),
        ]);

        $rejectToken = EmailToken::create([
            'general_journal_id' => $journal->id,
            'email'              => $deptHead->email,
            'token'              => Str::random(64),
            'purpose'            => 'rejection',
            'expires_at'         => now()->addHours($tokenHours),
            'created_at'         => now(),
        ]);

        $approveUrl = route('email.approve', ['token' => $approveToken->token]);
        $rejectUrl  = route('email.reject',  ['token' => $rejectToken->token]);

        // Kirim email reminder ke Dept Head
        try {
            Mail::to($deptHead->email)->send(
                new DeptHeadApprovalMail($journal, $deptHead, $approveUrl, $rejectUrl, $this->reminderNumber)
            );
            Log::info("Reminder #{$this->reminderNumber} sent for journal {$journal->document_number} to {$deptHead->email}");
        } catch (\Throwable $e) {
            Log::error("Failed sending reminder for journal {$journal->id}: " . $e->getMessage());
            throw $e; // re-throw agar job di-retry
        }

        // Notifikasi ke requester bahwa dokumen masih pending
        $alreadyNotified = Notification::where('general_journal_id', $journal->id)
            ->where('user_id', $journal->requested_by)
            ->where('type', 'reminder_pending')
            ->where('created_at', '>=', now()->subDay())
            ->exists();

        if (!$alreadyNotified) {
            Notification::create([
                'user_id'            => $journal->requested_by,
                'general_journal_id' => $journal->id,
                'type'               => 'reminder_pending',
                'message'            => "Dokumen {$journal->document_number} masih menunggu persetujuan akhir (reminder #{$this->reminderNumber}).",
                'created_at'         => now(),
            ]);
        }
    }
}
