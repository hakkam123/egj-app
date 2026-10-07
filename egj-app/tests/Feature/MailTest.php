<?php

namespace Tests\Feature;

use App\Mail\ApprovalRequestMail;
use App\Mail\ApprovalResultMail;
use App\Mail\DeptHeadApprovalMail;
use App\Models\EmailToken;
use App\Models\GeneralJournalFile;
use Tests\TestCase;

class MailTest extends TestCase
{
    public function test_approval_request_mail_renders_preview_link(): void
    {
        $journal = $this->createJournal($this->staff);
        $token = EmailToken::where('purpose', 'preview')->firstOrFail();

        $mail = new ApprovalRequestMail($journal, $this->sectionHead, $token);

        $mail->assertHasSubject("Approval Required: General Journal {$journal->document_number}");
        $mail->assertSeeInHtml(url('/preview/' . $token->token));
    }

    public function test_approval_result_mail_subjects_and_escaped_notes(): void
    {
        $journal = $this->createJournal($this->staff);

        (new ApprovalResultMail($journal, $this->staff, 'approved'))
            ->assertHasSubject("General Journal {$journal->document_number} - Approved");

        $revised = new ApprovalResultMail($journal, $this->staff, 'revised', '<script>alert(1)</script> fix amount');
        $revised->assertHasSubject("General Journal {$journal->document_number} - Revision Requested");
        $revised->assertSeeInHtml('fix amount');
        $revised->assertDontSeeInHtml('<script>alert(1)</script>', false);
    }

    public function test_dept_head_mail_attaches_stamped_pdf_and_links(): void
    {
        $journal = $this->journalAtDeptHead();

        $mail = new DeptHeadApprovalMail($journal, $this->deptHead, 'https://jago.test/approve-email/abc', 'https://jago.test/revise-email/def');

        $mail->assertHasSubject("Approval Required: General Journal {$journal->document_number}");
        $mail->assertSeeInHtml('https://jago.test/approve-email/abc');
        $mail->assertSeeInHtml('https://jago.test/revise-email/def');
        $attachments = $mail->attachments();
        $this->assertSame("GJ_{$journal->document_number}.pdf", $attachments[0]->as);
        $this->assertSame('application/pdf', $attachments[0]->mime);
    }

    public function test_reminder_mail_shows_reminder_header(): void
    {
        $journal = $this->journalAtDeptHead();

        $mail = new DeptHeadApprovalMail($journal, $this->deptHead, 'a', 'b', 2, 6);

        $mail->assertHasSubject("[Reminder #2] Approval Required: General Journal {$journal->document_number}");
        $mail->assertSeeInHtml('APPROVAL REMINDER #2 (Pending for 6 Days)');
    }

    public function test_over_limit_supporting_documents_become_links_in_the_email(): void
    {
        $journal = $this->journalAtDeptHead();

        // A supporting document bigger than the 20 MB total attachment limit
        $path = "general-journals/{$journal->id}/supporting_documents/huge.pdf";
        \Illuminate\Support\Facades\Storage::put($path, str_repeat('0', DeptHeadApprovalMail::ATTACHMENT_LIMIT + 1));
        $big = GeneralJournalFile::create([
            'general_journal_id' => $journal->id, 'category' => 'supporting_document', 'file_name' => 'huge-scan.pdf',
            'file_path' => $path, 'file_size' => DeptHeadApprovalMail::ATTACHMENT_LIMIT + 1, 'mime_type' => 'application/pdf',
            'version' => 1, 'is_active' => true, 'uploaded_at' => now(),
        ]);

        $mail = new DeptHeadApprovalMail($journal, $this->deptHead, 'a', 'b');

        // Regression: this list was always empty because content() ran before attachments()
        $mail->assertSeeInHtml('huge-scan.pdf');
        $mail->assertSeeInHtml(route('files.download', $big->id));
        $this->assertCount(1, $mail->attachments(), 'only the GJ PDF is attached');
    }
}
