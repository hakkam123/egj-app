<?php

namespace App\Mail;

use App\Models\GeneralJournal;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ApprovalResultMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public GeneralJournal $journal,
        public User $requester,
        public string $result, // 'approved' or 'rejected'
        public ?string $notes = null,
    ) {}

    public function envelope(): Envelope
    {
        $status = $this->result === 'approved' ? 'Approved' : 'Rejected';

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
