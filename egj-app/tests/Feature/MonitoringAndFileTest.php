<?php

namespace Tests\Feature;

use App\Models\GeneralJournalFile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MonitoringAndFileTest extends TestCase
{
    // ---------- Monitoring ----------

    public function test_monitoring_lists_all_statuses_with_stats(): void
    {
        $this->createJournal($this->staff, 'draft', ['document_number' => '1001', 'reference' => 'Payroll']);
        $this->createJournal($this->staff, 'submit', ['document_number' => '1002', 'reference' => 'Rent']);
        $this->createJournal($this->sectionHead, 'submit', ['document_number' => '1003', 'reference' => 'Tax']);

        $this->actingAs($this->deptHead)->get('/monitoring')
            ->assertInertia(fn (Assert $p) => $p->component('Monitoring/Index')
                ->has('journals.data', 3)
                ->where('stats.total', 3)
                ->where('stats.draft', 1)
                ->where('stats.waiting', 2)
                ->where('stats.approved', 0));

        $this->actingAs($this->staff)->get('/monitoring?status=Draft')
            ->assertInertia(fn (Assert $p) => $p->has('journals.data', 1)->where('stats.total', 3));
    }

    public function test_monitoring_in_column_filters(): void
    {
        $this->createJournal($this->staff, 'submit', ['document_number' => '2001', 'reference' => 'Payroll']);
        $this->createJournal($this->sectionHead, 'submit', ['document_number' => '2002', 'reference' => 'Rent', 'journal_date' => '2026-01-05']);

        $cases = [
            [['doc_number' => '2001'], 1],
            [['reference' => 'Rent'], 1],
            [['requester' => 'Budi'], 1],
            [['requester' => $this->sectionHead->id], 1],
            [['assign_to' => 'Alisa'], 1],
            [['assign_to' => $this->sectionHead->id], 1],
            [['date' => '2026-01-05'], 1],
            [['date_from' => '2026-09-01', 'date_to' => '2026-09-30'], 1],
            [['search' => 'Ahmad'], 2], // Ahmad is requester of one and assignee of the other
            [['search' => 'nothing-matches'], 0],
        ];

        foreach ($cases as [$filter, $count]) {
            $this->actingAs($this->staff)->get('/monitoring?' . http_build_query($filter))
                ->assertInertia(fn (Assert $p) => $p->has('journals.data', $count));
        }

        $this->actingAs($this->staff)->get('/monitoring?per_page=5000')
            ->assertInertia(fn (Assert $p) => $p->where('journals.per_page', 10));
    }

    public function test_monitoring_export_xlsx(): void
    {
        $this->createJournal($this->staff, 'submit', ['document_number' => '3001']);

        $response = $this->actingAs($this->staff)->get('/monitoring/export?status=Waiting+Approval&doc_number=3001');

        $response->assertOk()->assertDownload();
        $this->assertStringContainsString('spreadsheetml', $response->headers->get('Content-Type'));
        $this->assertStringStartsWith('PK', file_get_contents($response->baseResponse->getFile()->getPathname()));
    }

    // ---------- Files ----------

    public function test_preview_general_journal_renders_stamped_pdf(): void
    {
        $journal = $this->journalAtDeptHead();
        $file = GeneralJournalFile::getActive($journal->id, 'general_journal');

        $response = $this->actingAs($this->staff)->get("/files/{$file->id}/preview");

        $response->assertOk()->assertHeader('Content-Type', 'application/pdf')->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertStringStartsWith('inline;', $response->headers->get('Content-Disposition'));
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_download_general_journal_and_supporting_document(): void
    {
        $journal = $this->createJournal($this->staff, 'submit', [
            'document_number' => '5005',
            'supporting_documents' => [UploadedFile::fake()->createWithContent('invoice.png', base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='))],
        ]);
        $gj = GeneralJournalFile::getActive($journal->id, 'general_journal');
        $sd = GeneralJournalFile::getActive($journal->id, 'supporting_document');

        $gjResponse = $this->actingAs($this->sectionHead)->get("/files/{$gj->id}/download");
        $gjResponse->assertOk();
        $this->assertStringContainsString('attachment;', $gjResponse->headers->get('Content-Disposition'));
        $this->assertStringContainsString('GJ_JOT 5005_stamped.pdf', $gjResponse->headers->get('Content-Disposition'));

        $this->actingAs($this->sectionHead)->get("/files/{$sd->id}/download")->assertOk()->assertDownload('invoice.png');
        $this->actingAs($this->sectionHead)->get("/files/{$sd->id}/preview")->assertOk()->assertHeader('Content-Type', 'image/png');
    }

    public function test_file_missing_from_storage_returns_404(): void
    {
        $journal = $this->createJournal($this->staff, 'submit', [
            'supporting_documents' => [UploadedFile::fake()->create('doc.pdf', 5, 'application/pdf')],
        ]);
        $sd = GeneralJournalFile::getActive($journal->id, 'supporting_document');
        Storage::delete($sd->file_path);

        $this->actingAs($this->staff)->get("/files/{$sd->id}/download")->assertNotFound();
        $this->actingAs($this->staff)->get('/files/unknown/download')->assertNotFound();
    }

    public function test_verify_integrity_endpoint(): void
    {
        $journal = $this->createJournal($this->staff);
        $file = GeneralJournalFile::getActive($journal->id, 'general_journal');

        $this->actingAs($this->staff)->getJson("/files/{$file->id}/verify")
            ->assertOk()->assertJson(['verified' => true, 'file_hash' => $file->file_hash]);

        Storage::put($file->file_path, 'tampered');
        $this->actingAs($this->staff)->getJson("/files/{$file->id}/verify")->assertJson(['verified' => false]);
    }

    public function test_file_access_rules(): void
    {
        $journal = $this->createJournal($this->staff);
        $file = GeneralJournalFile::getActive($journal->id, 'general_journal');
        $otherStaff = User::factory()->staff()->create();

        $this->actingAs($otherStaff)->get("/files/{$file->id}/preview")->assertForbidden();
        $this->actingAs($otherStaff)->get("/files/{$file->id}/download")->assertForbidden();
        $this->actingAs($otherStaff)->get("/files/{$file->id}/verify")->assertForbidden();

        $this->actingAs($this->staff)->get("/files/{$file->id}/preview")->assertOk();       // requester
        $this->actingAs($this->sectionHead)->get("/files/{$file->id}/preview")->assertOk(); // approver
        $this->actingAs($this->admin)->get("/files/{$file->id}/preview")->assertOk();       // admin

        auth()->logout();
        $this->get("/files/{$file->id}/preview")->assertRedirect('/login');
    }
}
