<?php

namespace App\Mail;

use App\Models\GeneralJournal;
use App\Models\GeneralJournalFile;
use App\Models\User;
use App\Services\PdfStampRenderService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class DeptHeadApprovalMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Total size of attachments allowed in one email (bytes).
     */
    public const ATTACHMENT_LIMIT = 20 * 1024 * 1024;

    /**
     * Attachment plan, built once and shared by content() and attachments().
     * Laravel hydrates content() BEFORE attachments(), so the plan must not be
     * produced inside attachments() or the "over limit" list never reaches the view.
     */
    private ?array $plan = null;

    public function __construct(
        public GeneralJournal $journal,
        public User $approver,
        public string $approveUrl,
        public string $rejectUrl,
        public int $reminderNumber = 0, // 0 = first email, 1..n = reminder number
        public int $daysPending = 0,
    ) {}

    public function envelope(): Envelope
    {
        $subjectPrefix = $this->reminderNumber > 0 ? "[Reminder #{$this->reminderNumber}] " : '';
        return new Envelope(
            subject: "{$subjectPrefix}Approval Required: General Journal {$this->journal->document_number}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.dept-head-approval',
            with: [
                'journal'        => $this->journal,
                'approver'       => $this->approver,
                'approveUrl'     => $this->approveUrl,
                'rejectUrl'      => $this->rejectUrl,
                'reminderNumber' => $this->reminderNumber,
                'daysPending'    => $this->daysPending,
                'overLimitFiles' => $this->plan()['overLimit'],
            ],
        );
    }

    public function attachments(): array
    {
        $plan = $this->plan();

        // GJ is always attached (rendered with stamps)
        $attachments = [
            Attachment::fromData(
                fn () => $plan['gjPdf'],
                'GJ_' . $this->journal->document_number . '.pdf'
            )->withMime('application/pdf'),
        ];

        foreach ($plan['attach'] as $file) {
            $attachments[] = Attachment::fromPath(Storage::path($file->file_path))
                ->as($file->file_name)
                ->withMime($file->mime_type ?? 'application/octet-stream');
        }

        return $attachments;
    }

    /**
     * Decide which supporting documents fit in the email and which become download links.
     */
    private function plan(): array
    {
        if ($this->plan !== null) {
            return $this->plan;
        }

        $gjPdf = app(PdfStampRenderService::class)->render($this->journal);
        $totalSize = strlen($gjPdf);
        $attach = [];
        $overLimit = [];

        $supportingFiles = GeneralJournalFile::where('general_journal_id', $this->journal->id)
            ->where('category', 'supporting_document')
            ->where('is_active', true)
            ->get();

        foreach ($supportingFiles as $file) {
            $filePath = Storage::path($file->file_path);
            if (!file_exists($filePath)) continue;

            $fileSize = filesize($filePath);

            if (($totalSize + $fileSize) <= self::ATTACHMENT_LIMIT) {
                $totalSize += $fileSize;
                $attach[] = $file;
            } else {
                $overLimit[] = $file;
            }
        }

        return $this->plan = ['gjPdf' => $gjPdf, 'attach' => $attach, 'overLimit' => $overLimit];
    }
}
