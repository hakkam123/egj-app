<?php

namespace App\Mail;

use App\Models\GeneralJournal;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

// Queued so approve/revise requests return immediately instead of waiting on SMTP
class ApprovalResultMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        public GeneralJournal $journal,
        public User $requester,
        public string $result, // 'approved', 'revised', 'rejected'
        public ?string $notes = null,
    ) {
        // Callers queue this inside DB::transaction; wait for the commit so the worker sees the rows
        $this->afterCommit();
    }

    public function envelope(): Envelope
    {
        $status = match (strtolower($this->result)) {
            'approved' => 'Approved',
            'revised' => 'Revision Requested',
            'rejected' => 'Rejected',
            default => ucfirst($this->result),
        };

        return new Envelope(
            subject: "General Journal {$this->journal->document_number} - {$status}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.approval-result',
            with: [
                'journal' => $this->journal,
                'requester' => $this->requester,
                'result' => $this->result,
                'notes' => $this->notes,
                'portalUrl' => url('/monitoring'),
            ],
        );
    }
}

