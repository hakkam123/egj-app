<?php

namespace App\Mail;

use App\Models\GeneralJournal;
use App\Models\EmailToken;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApprovalRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public GeneralJournal $journal,
        public User $approver,
        public EmailToken $previewToken,
    ) {}

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
