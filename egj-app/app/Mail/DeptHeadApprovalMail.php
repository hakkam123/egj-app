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

    public array $overLimitFiles = [];

    public function __construct(
        public GeneralJournal $journal,
        public User $approver,
        public string $approveUrl,
        public string $rejectUrl,
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
            view: 'emails.dept-head-approval',
            with: [
                'journal'        => $this->journal,
                'approver'       => $this->approver,
                'approveUrl'     => $this->approveUrl,
                'rejectUrl'      => $this->rejectUrl,
                'overLimitFiles' => $this->overLimitFiles,
            ],
        );
    }

    public function attachments(): array
    {
        $attachments = [];
        $totalSize = 0;
        $overLimitFiles = [];

        // Render GJ PDF on-the-fly
        $gjPdfBinary = app(PdfStampRenderService::class)->render($this->journal);
        $gjSize = strlen($gjPdfBinary);
        $totalSize += $gjSize;

        // GJ selalu di-attach
        $attachments[] = Attachment::fromData(
            fn () => $gjPdfBinary,
            'GJ_' . $this->journal->document_number . '.pdf'
        )->withMime('application/pdf');

        // Ambil semua supporting documents
        $supportingFiles = GeneralJournalFile::where('general_journal_id', $this->journal->id)
            ->where('category', 'supporting_document')
            ->where('is_active', true)
            ->get();

        $LIMIT = 20 * 1024 * 1024; // 20MB dalam bytes

        foreach ($supportingFiles as $file) {
            $filePath = Storage::path($file->file_path);
            if (!file_exists($filePath)) continue;

            $fileSize = filesize($filePath);

            if (($totalSize + $fileSize) <= $LIMIT) {
                // Masih dalam batas — attach
                $totalSize += $fileSize;
                $attachments[] = Attachment::fromPath($filePath)
                    ->as($file->file_name)
                    ->withMime($file->mime_type ?? 'application/octet-stream');
            } else {
                // Melebihi batas — jadikan link
                $overLimitFiles[] = $file;
            }
        }

        // Simpan file over limit ke property agar bisa diakses di blade
        $this->overLimitFiles = $overLimitFiles;

        return $attachments;
    }
}
