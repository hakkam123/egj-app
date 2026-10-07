<?php

namespace Tests;

use App\Models\GeneralJournal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Mpdf\Mpdf;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected User $staff;
    protected User $sectionHead;
    protected User $deptHead;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        // Inertia page components are not built in tests; don't require the Vite manifest / JSX files
        config(['inertia.testing.ensure_pages_exist' => false]);
        $this->withoutVite();

        Storage::fake('local');
        Mail::fake();

        $this->staff = User::factory()->staff()->create(['name' => 'Budi Staff', 'npk' => '1002']);
        $this->sectionHead = User::factory()->sectionHead()->create(['name' => 'Ahmad Section', 'npk' => '1004']);
        $this->deptHead = User::factory()->deptHead()->create(['name' => 'Alisa Dept', 'npk' => '1005']);
        $this->admin = User::factory()->admin()->create(['name' => 'Admin JAGO', 'npk' => '1001']);
    }

    /**
     * A real (tiny) PDF so mPDF can import it when stamping.
     */
    protected function pdfContent(int $pages = 1): string
    {
        $mpdf = new Mpdf(['mode' => 'utf-8', 'format' => 'A4-L', 'tempDir' => sys_get_temp_dir()]);
        for ($i = 1; $i <= $pages; $i++) {
            if ($i > 1) {
                $mpdf->AddPage();
            }
            $mpdf->WriteHTML("<h1>General Journal page {$i}</h1>");
        }

        return $mpdf->Output('', 'S');
    }

    protected function fakePdf(string $name = 'journal.pdf', int $pages = 1): UploadedFile
    {
        return UploadedFile::fake()->createWithContent($name, $this->pdfContent($pages));
    }

    /**
     * Create a journal through the real endpoint (draft or submitted) and return it.
     */
    protected function createJournal(User $as, string $action = 'submit', array $overrides = []): GeneralJournal
    {
        $docNumber = $overrides['document_number'] ?? (string) fake()->unique()->numberBetween(10000, 99999);

        $this->actingAs($as)->post('/general-journals', array_merge([
            'action' => $action,
            'document_number' => $docNumber,
            'journal_date' => '2026-09-24',
            'reference' => 'Accrual September',
            'general_journal_file' => $this->fakePdf(),
        ], $overrides))->assertSessionHasNoErrors();

        return GeneralJournal::where('document_number', 'JOT ' . preg_replace('/^JOT\s*/i', '', $docNumber))
            ->latest('created_at')->firstOrFail();
    }

    /**
     * Staff submits, Section Head approves -> journal waits at the Dept/Div Head.
     */
    protected function journalAtDeptHead(): GeneralJournal
    {
        $journal = $this->createJournal($this->staff);
        $this->actingAs($this->sectionHead)->post("/approval/{$journal->id}/approve")->assertRedirect();

        return $journal->fresh();
    }
}
