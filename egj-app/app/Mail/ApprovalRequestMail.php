<?php

namespace App\Mail;

use App\Models\GeneralJournal;
use App\Models\EmailToken;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

// Queued so the submit request returns immediately instead of waiting on SMTP
class ApprovalRequestMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        public GeneralJournal $journal,
        public User $approver,
        public EmailToken $previewToken,
    ) {
        // Callers queue this inside DB::transaction; wait for the commit so the worker sees the rows
        $this->afterCommit();
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Approval Required: General Journal ' . $this->journal->document_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.approval-request',
            with: [
                'journal' => $this->journal,
                'approver' => $this->approver,
                'previewUrl' => url('/preview/' . $this->previewToken->token),
                'portalUrl' => url('/approval'),
            ],
        );
    }
}
