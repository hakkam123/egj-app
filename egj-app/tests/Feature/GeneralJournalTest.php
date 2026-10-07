<?php

namespace Tests\Feature;

use App\Mail\ApprovalRequestMail;
use App\Mail\DeptHeadApprovalMail;
use App\Models\ApprovalHistory;
use App\Models\EmailToken;
use App\Models\GeneralJournal;
use App\Models\GeneralJournalFile;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class GeneralJournalTest extends TestCase
{
    // ---------- Create / Store ----------

    public function test_create_page_is_for_staff_section_head_and_admin_only(): void
    {
        $this->actingAs($this->staff)->get('/general-journals/create')
            ->assertInertia(fn (Assert $p) => $p->component('GeneralJournal/Create'));
        $this->actingAs($this->sectionHead)->get('/general-journals/create')->assertOk();
        $this->actingAs($this->deptHead)->get('/general-journals/create')->assertForbidden();
        $this->actingAs($this->deptHead)->post('/general-journals', [])->assertForbidden();
    }

    public function test_save_draft_without_pdf(): void
    {
        $this->actingAs($this->staff)->post('/general-journals', [
            'action' => 'draft',
            'document_number' => '12345',
            'journal_date' => '2026-09-24',
            'reference' => 'Draft ref',
        ])->assertRedirect(route('drafts.index'));

        $journal = GeneralJournal::firstOrFail();
        $this->assertSame('Draft', $journal->status);
        $this->assertSame('JOT 12345', $journal->document_number);
        $this->assertNull($journal->current_assign_to);
        $this->assertCount(0, $journal->approvals);
        Mail::assertNothingSent();
    }

    #[DataProvider('documentNumbers')]
    public function test_document_number_always_gets_single_jot_prefix(string $input, string $expected): void
    {
        $this->actingAs($this->staff)->post('/general-journals', [
            'action' => 'draft', 'document_number' => $input, 'journal_date' => '2026-09-24', 'reference' => 'x',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('general_journals', ['document_number' => $expected]);
    }

    public static function documentNumbers(): array
    {
        return [
            ['123', 'JOT 123'],
            ['JOT 123', 'JOT 123'],
            ['jot-123', 'JOT 123'],
            ['JOT_123', 'JOT 123'],
            ['  JOT   123 ', 'JOT 123'],
        ];
    }

    public function test_document_number_must_be_unique_unless_rejected(): void
    {
        $first = $this->createJournal($this->staff, 'draft', ['document_number' => '777', 'general_journal_file' => null]);

        $this->actingAs($this->staff)->post('/general-journals', [
            'action' => 'draft', 'document_number' => 'JOT 777', 'journal_date' => '2026-09-24', 'reference' => 'x',
        ])->assertSessionHasErrors('document_number');

        $first->update(['status' => 'Rejected']);

        $this->actingAs($this->staff)->post('/general-journals', [
            'action' => 'draft', 'document_number' => '777', 'journal_date' => '2026-09-24', 'reference' => 'x',
        ])->assertSessionHasNoErrors();
    }

    public function test_submit_requires_pdf_and_valid_fields(): void
    {
        $this->actingAs($this->staff)->post('/general-journals', [
            'action' => 'submit', 'document_number' => '1', 'journal_date' => 'not-a-date', 'reference' => '',
        ])->assertSessionHasErrors(['general_journal_file', 'journal_date', 'reference']);

        $this->actingAs($this->staff)->post('/general-journals', [
            'action' => 'submit', 'document_number' => '1', 'journal_date' => '2026-09-24', 'reference' => 'x',
            'general_journal_file' => UploadedFile::fake()->create('gj.docx', 10, 'application/msword'),
        ])->assertSessionHasErrors('general_journal_file');

        $this->actingAs($this->staff)->post('/general-journals', [
            'action' => 'submit', 'document_number' => '1', 'journal_date' => '2026-09-24', 'reference' => 'x',
            'general_journal_file' => $this->fakePdf(),
            'supporting_documents' => [UploadedFile::fake()->create('evil.php', 1, 'application/x-php')],
        ])->assertSessionHasErrors('supporting_documents.0');

        $this->assertSame(0, GeneralJournal::count());
    }

    public function test_staff_submit_builds_chain_and_notifies_section_head(): void
    {
        $journal = $this->createJournal($this->staff, 'submit', [
            'supporting_documents' => [UploadedFile::fake()->image('receipt.jpg')],
        ]);

        $this->assertSame('Waiting Approval', $journal->status);
        $this->assertSame($this->sectionHead->id, $journal->current_assign_to);
        $this->assertNotNull($journal->submitted_at);

        $approvals = $journal->approvals->keyBy('approval_level');
        $this->assertSame('Approved', $approvals['accounting']->status);
        $this->assertSame('2026-09-24', $approvals['accounting']->approved_at->format('Y-m-d'), 'Accounting stamp uses journal date');
        $this->assertSame('Pending', $approvals['superior']->status);
        $this->assertSame($this->sectionHead->id, $approvals['superior']->assigned_user_id);
        $this->assertSame('Pending', $approvals['superior_of_superior']->status);

        $this->assertCount(2, $journal->activeFiles);
        foreach ($journal->activeFiles as $file) {
            Storage::assertExists($file->file_path);
        }

        Mail::assertSent(ApprovalRequestMail::class, fn ($m) => $m->hasTo($this->sectionHead->email));
        $preview = EmailToken::where('purpose', 'preview')->firstOrFail();
        $this->assertTrue($preview->expires_at->between(now()->addDays(5)->subMinute(), now()->addDays(5)->addMinute()));

        $this->assertDatabaseHas('notifications', ['user_id' => $this->sectionHead->id, 'type' => 'approval_request']);
        $this->assertDatabaseHas('approval_histories', ['general_journal_id' => $journal->id, 'action' => 'submit']);
    }

    public function test_section_head_submit_skips_to_dept_head(): void
    {
        $journal = $this->createJournal($this->sectionHead);

        $this->assertSame($this->deptHead->id, $journal->current_assign_to);
        $approvals = $journal->approvals->keyBy('approval_level');
        $this->assertSame('Approved', $approvals['superior']->status);
        $this->assertSame('Pending', $approvals['superior_of_superior']->status);

        Mail::assertSent(DeptHeadApprovalMail::class, fn ($m) => $m->hasTo($this->deptHead->email));
        $this->assertSame(1, EmailToken::where('purpose', 'approval')->count());
        $this->assertSame(1, EmailToken::where('purpose', 'rejection')->count());
    }

    public function test_default_approver_section_head_is_preferred(): void
    {
        $this->sectionHead->update(['is_default_approver' => false]);
        $other = \App\Models\User::factory()->sectionHead(true)->create();

        $journal = $this->createJournal($this->staff);

        $this->assertSame($other->id, $journal->current_assign_to);
    }

    // ---------- Drafts ----------

    public function test_drafts_page_lists_only_own_drafts(): void
    {
        $mine = $this->createJournal($this->staff, 'draft');
        $otherStaff = \App\Models\User::factory()->staff()->create();
        $this->createJournal($otherStaff, 'draft');
        $this->createJournal($this->staff, 'submit');

        $this->actingAs($this->staff)->get('/drafts')
            ->assertInertia(fn (Assert $p) => $p->component('GeneralJournal/Drafts')
                ->has('drafts.data', 1)
                ->where('drafts.data.0.id', $mine->id)
                ->where('stats.total_drafts', 1));

        $this->actingAs($this->admin)->get('/drafts')
            ->assertInertia(fn (Assert $p) => $p->has('drafts.data', 2));

        $this->actingAs($this->deptHead)->get('/drafts')->assertForbidden();
    }

    public function test_drafts_filters_work(): void
    {
        $this->createJournal($this->staff, 'draft', ['document_number' => '5001', 'reference' => 'Payroll']);
        $this->createJournal($this->staff, 'draft', ['document_number' => '5002', 'reference' => 'Rent', 'journal_date' => '2026-01-10']);

        foreach ([
            ['search' => 'Payroll'], ['doc_number' => '5002'], ['reference' => 'Rent'],
            ['file_name' => 'journal'], ['date' => '2026-01-10'], ['date_from' => '2026-01-01', 'date_to' => '2026-01-31'],
        ] as $filter) {
            $expected = isset($filter['file_name']) ? 2 : 1;
            $this->actingAs($this->staff)->get('/drafts?' . http_build_query($filter))
                ->assertInertia(fn (Assert $p) => $p->has('drafts.data', $expected));
        }
    }

    public function test_drafts_per_page_is_whitelisted(): void
    {
        $this->createJournal($this->staff, 'draft');

        $this->actingAs($this->staff)->get('/drafts?per_page=100000')
            ->assertInertia(fn (Assert $p) => $p->where('drafts.per_page', 10));
        $this->actingAs($this->staff)->get('/drafts?per_page=25')
            ->assertInertia(fn (Assert $p) => $p->where('drafts.per_page', 25));
    }

    public function test_bulk_submit_submits_complete_drafts_and_skips_incomplete(): void
    {
        $complete = $this->createJournal($this->staff, 'draft');
        $noPdf = $this->createJournal($this->staff, 'draft', ['general_journal_file' => null]);
        $foreign = $this->createJournal(\App\Models\User::factory()->staff()->create(), 'draft');

        $this->actingAs($this->staff)->post('/general-journals/bulk-submit', [
            'ids' => [$complete->id, $noPdf->id, $foreign->id],
        ])->assertRedirect(route('monitoring.index'))->assertSessionHas('success');

        $this->assertSame('Waiting Approval', $complete->fresh()->status);
        $this->assertSame('Draft', $noPdf->fresh()->status);
        $this->assertSame('Draft', $foreign->fresh()->status, 'cannot submit someone else\'s draft');
    }

    public function test_bulk_submit_with_nothing_valid_returns_error(): void
    {
        $noPdf = $this->createJournal($this->staff, 'draft', ['general_journal_file' => null]);

        $this->actingAs($this->staff)->post('/general-journals/bulk-submit', ['ids' => [$noPdf->id]])
            ->assertSessionHas('error');
        $this->actingAs($this->staff)->post('/general-journals/bulk-submit', ['ids' => []])
            ->assertSessionHasErrors('ids');
        $this->actingAs($this->staff)->post('/general-journals/bulk-submit', ['ids' => ['does-not-exist']])
            ->assertSessionHasErrors('ids.0');
    }

    public function test_submit_single_draft(): void
    {
        $draft = $this->createJournal($this->staff, 'draft');
        $noPdf = $this->createJournal($this->staff, 'draft', ['general_journal_file' => null]);

        $this->actingAs($this->sectionHead)->post("/general-journals/{$draft->id}/submit")->assertForbidden();

        $this->actingAs($this->staff)->post("/general-journals/{$noPdf->id}/submit")->assertSessionHas('error');
        $this->assertSame('Draft', $noPdf->fresh()->status);

        $this->actingAs($this->staff)->post("/general-journals/{$draft->id}/submit")->assertRedirect(route('monitoring.index'));
        $this->assertSame('Waiting Approval', $draft->fresh()->status);

        $this->actingAs($this->staff)->post("/general-journals/{$draft->id}/submit")->assertSessionHas('error');
    }

    // ---------- Edit / Update / Delete ----------

    public function test_edit_page_only_for_owner_and_editable_status(): void
    {
        $draft = $this->createJournal($this->staff, 'draft');
        $waiting = $this->createJournal($this->staff);

        $this->actingAs($this->staff)->get("/general-journals/{$draft->id}/edit")
            ->assertInertia(fn (Assert $p) => $p->component('GeneralJournal/Edit'));
        $this->actingAs($this->sectionHead)->get("/general-journals/{$draft->id}/edit")->assertForbidden();
        $this->actingAs($this->staff)->get("/general-journals/{$waiting->id}/edit")
            ->assertRedirect(route('general-journals.show', $waiting->id));
    }

    public function test_update_draft_replaces_files(): void
    {
        $draft = $this->createJournal($this->staff, 'draft');
        $oldFile = $draft->activeFiles->first();

        $this->actingAs($this->staff)->post("/general-journals/{$draft->id}/update", [
            'document_number' => '99999',
            'journal_date' => '2026-10-01',
            'reference' => 'Updated',
            'general_journal_file' => $this->fakePdf('new.pdf'),
        ])->assertRedirect(route('drafts.index'));

        $draft->refresh();
        $this->assertSame('JOT 99999', $draft->document_number);
        $this->assertSame('Updated', $draft->reference);
        $this->assertSame(['new.pdf'], $draft->activeFiles->pluck('file_name')->all());
        Storage::assertMissing($oldFile->file_path);
    }

    public function test_update_rejected_for_non_draft_or_non_owner(): void
    {
        $waiting = $this->createJournal($this->staff);
        $draft = $this->createJournal($this->staff, 'draft');
        $payload = ['document_number' => '1', 'journal_date' => '2026-10-01', 'reference' => 'x'];

        $this->actingAs($this->staff)->post("/general-journals/{$waiting->id}/update", $payload)->assertSessionHas('error');
        $this->actingAs($this->sectionHead)->put("/general-journals/{$draft->id}", $payload)->assertForbidden();
    }

    public function test_destroy_only_own_drafts(): void
    {
        $draft = $this->createJournal($this->staff, 'draft');
        $waiting = $this->createJournal($this->staff);
        $path = $draft->activeFiles->first()->file_path;

        $this->actingAs($this->sectionHead)->delete("/general-journals/{$draft->id}")->assertForbidden();
        $this->actingAs($this->staff)->delete("/general-journals/{$waiting->id}")->assertSessionHas('error');

        $this->actingAs($this->staff)->delete("/general-journals/{$draft->id}")->assertRedirect(route('drafts.index'));
        $this->assertModelMissing($draft);
        Storage::assertMissing($path);
    }

    public function test_show_page(): void
    {
        $journal = $this->createJournal($this->staff);

        $this->actingAs($this->deptHead)->get("/general-journals/{$journal->id}")
            ->assertInertia(fn (Assert $p) => $p->component('GeneralJournal/Show')
                ->where('journal.id', $journal->id)
                ->has('journal.approvals', 3)
                ->missing('journal.requester.password'));

        $this->actingAs($this->staff)->get('/general-journals/nope')->assertNotFound();
    }

    // ---------- Revise / Resubmit / Self-reject ----------

    public function test_resubmit_revised_journal_rebuilds_chain(): void
    {
        $journal = $this->createJournal($this->staff);
        $this->actingAs($this->sectionHead)->post("/approval/{$journal->id}/revise", ['notes' => 'Wrong amount'])->assertRedirect();
        $this->assertSame('Revised', $journal->fresh()->status);

        $oldPath = $journal->activeFiles->first()->file_path;
        $this->actingAs($this->staff)->post("/general-journals/{$journal->id}/resubmit", [
            'reference' => 'Fixed amount',
            'general_journal_file' => $this->fakePdf('fixed.pdf'),
        ])->assertRedirect(route('monitoring.index'));

        $journal->refresh();
        $this->assertSame('Waiting Approval', $journal->status);
        $this->assertSame(1, $journal->resubmit_count);
        $this->assertSame('Fixed amount', $journal->reference);
        $this->assertSame($this->sectionHead->id, $journal->current_assign_to);
        $this->assertSame(['Approved', 'Pending', 'Pending'], $journal->approvals->sortBy(fn ($a) => array_search($a->approval_level, ['accounting', 'superior', 'superior_of_superior']))->pluck('status')->values()->all());

        $file = GeneralJournalFile::getActive($journal->id, 'general_journal');
        $this->assertSame('fixed.pdf', $file->file_name);
        $this->assertSame(2, $file->version);
        Storage::assertMissing($oldPath);
        $this->assertDatabaseHas('approval_histories', ['general_journal_id' => $journal->id, 'action' => 'resubmit']);
    }

    public function test_resubmit_guards(): void
    {
        $waiting = $this->createJournal($this->staff);

        $this->actingAs($this->staff)->post("/general-journals/{$waiting->id}/resubmit", ['reference' => 'x'])
            ->assertSessionHas('error');

        $this->actingAs($this->sectionHead)->post("/approval/{$waiting->id}/revise", ['notes' => 'Please fix'])->assertRedirect();
        $this->actingAs($this->sectionHead)->post("/general-journals/{$waiting->id}/resubmit", ['reference' => 'x'])
            ->assertForbidden();
        $this->actingAs($this->staff)->post("/general-journals/{$waiting->id}/resubmit", ['reference' => ''])
            ->assertSessionHasErrors('reference');
    }

    public function test_self_reject_only_by_requester_and_only_when_revised(): void
    {
        $journal = $this->createJournal($this->staff);

        $this->actingAs($this->staff)->post("/general-journals/{$journal->id}/self-reject")->assertSessionHas('error');

        $this->actingAs($this->sectionHead)->post("/approval/{$journal->id}/revise", ['notes' => 'Please fix'])->assertRedirect();
        $this->actingAs($this->sectionHead)->post("/general-journals/{$journal->id}/self-reject")->assertForbidden();

        $this->actingAs($this->staff)->post("/general-journals/{$journal->id}/self-reject", ['notes' => 'Not needed'])
            ->assertRedirect(route('monitoring.index'));

        $journal->refresh();
        $this->assertSame('Rejected', $journal->status);
        $this->assertNull($journal->current_assign_to);
        $this->assertTrue(ApprovalHistory::where('general_journal_id', $journal->id)->where('action', 'reject')->where('notes', 'Not needed')->exists());
    }
}
