<?php

namespace Tests\Feature;

use App\Mail\ApprovalResultMail;
use App\Mail\DeptHeadApprovalMail;
use App\Models\EmailToken;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ApprovalTest extends TestCase
{
    public function test_only_approvers_can_open_approval_routes(): void
    {
        $journal = $this->createJournal($this->staff);

        foreach ([$this->staff, $this->admin] as $user) {
            $this->actingAs($user)->get('/approval')->assertForbidden();
            $this->actingAs($user)->get("/approval/{$journal->id}")->assertForbidden();
            $this->actingAs($user)->post("/approval/{$journal->id}/approve")->assertForbidden();
            $this->actingAs($user)->post("/approval/{$journal->id}/revise", ['notes' => 'hello world'])->assertForbidden();
        }
    }

    public function test_queue_shows_each_approver_only_their_stage(): void
    {
        $atSection = $this->createJournal($this->staff);
        $atDept = $this->journalAtDeptHead();

        $this->actingAs($this->sectionHead)->get('/approval')
            ->assertInertia(fn (Assert $p) => $p->component('Approval/Index')
                ->has('journals.data', 1)
                ->where('journals.data.0.id', $atSection->id)
                ->where('stats.waiting', 1)
                ->where('stats.approved', 1));

        // Regression: Dept Head used to also see (and act on) journals still waiting for the Section Head
        $this->actingAs($this->deptHead)->get('/approval')
            ->assertInertia(fn (Assert $p) => $p->has('journals.data', 1)
                ->where('journals.data.0.id', $atDept->id)
                ->where('stats.waiting', 1));
    }

    public function test_queue_filters_and_per_page(): void
    {
        $this->createJournal($this->staff, 'submit', ['document_number' => '4401', 'reference' => 'Payroll']);
        $this->createJournal($this->staff, 'submit', ['document_number' => '4402', 'reference' => 'Rent']);

        foreach ([['doc_number' => '4401'], ['reference' => 'Rent'], ['search' => 'Payroll'], ['requester' => 'Budi'], ['status' => 'Waiting Approval'], ['date' => '2026-09-24'], ['date_from' => '2026-09-01', 'date_to' => '2026-09-30'], ['requested_by' => $this->staff->id]] as $filter) {
            $count = count(array_intersect(array_keys($filter), ['doc_number', 'reference', 'search'])) ? 1 : 2;
            $this->actingAs($this->sectionHead)->get('/approval?' . http_build_query($filter))
                ->assertInertia(fn (Assert $p) => $p->has('journals.data', $count));
        }

        $this->actingAs($this->sectionHead)->get('/approval?per_page=999999')
            ->assertInertia(fn (Assert $p) => $p->where('journals.per_page', 10));
    }

    public function test_show_review_page_permissions(): void
    {
        $journal = $this->createJournal($this->staff);

        $this->actingAs($this->sectionHead)->get("/approval/{$journal->id}")
            ->assertInertia(fn (Assert $p) => $p->component('Approval/Show')->where('journal.id', $journal->id));

        // Dept Head is in the chain (assigned to the final level) so may view, but not act yet
        $this->actingAs($this->deptHead)->get("/approval/{$journal->id}")->assertOk();

        $stranger = User::factory()->deptHead()->create();
        $this->actingAs($stranger)->get("/approval/{$journal->id}")->assertForbidden();
    }

    public function test_section_head_approval_hands_over_to_dept_head_with_email_links(): void
    {
        $journal = $this->createJournal($this->staff);
        $previewToken = EmailToken::where('purpose', 'preview')->first();

        $this->actingAs($this->sectionHead)->post("/approval/{$journal->id}/approve")
            ->assertRedirect(route('approval.index'));

        $journal->refresh();
        $this->assertSame('Waiting Approval', $journal->status);
        $this->assertSame($this->deptHead->id, $journal->current_assign_to);

        $superior = $journal->approvals->firstWhere('approval_level', 'superior');
        $this->assertSame('Approved', $superior->status);
        $this->assertSame($this->sectionHead->id, $superior->approved_by_user_id);

        Mail::assertSent(DeptHeadApprovalMail::class, fn ($m) => $m->hasTo($this->deptHead->email) && $m->reminderNumber === 0);
        $this->assertTrue(EmailToken::where('purpose', 'approval')->firstOrFail()->isValid());
        $this->assertTrue($previewToken->fresh()->isExpired(), 'old links revoked');
        $this->assertDatabaseHas('notifications', ['user_id' => $this->deptHead->id, 'type' => 'approval_request']);
    }

    public function test_dept_head_cannot_approve_or_revise_before_section_head(): void
    {
        $journal = $this->createJournal($this->staff);

        $this->actingAs($this->deptHead)->post("/approval/{$journal->id}/approve")->assertForbidden();
        $this->actingAs($this->deptHead)->post("/approval/{$journal->id}/revise", ['notes' => 'Skipping ahead'])->assertForbidden();

        $this->assertSame('Pending', $journal->approvals()->where('approval_level', 'superior_of_superior')->value('status'));
        $this->assertSame('Waiting Approval', $journal->fresh()->status);
    }

    public function test_final_approval_by_dept_head(): void
    {
        $journal = $this->journalAtDeptHead();
        $token = EmailToken::where('purpose', 'approval')->firstOrFail();

        $this->actingAs($this->deptHead)->post("/approval/{$journal->id}/approve")->assertRedirect();

        $journal->refresh();
        $this->assertSame('Approved', $journal->status);
        $this->assertNull($journal->current_assign_to);
        $this->assertTrue($journal->approvals->every(fn ($a) => $a->status === 'Approved'));
        $this->assertTrue($token->fresh()->isExpired(), 'emailed link no longer usable after portal approval');

        Mail::assertSent(ApprovalResultMail::class, fn ($m) => $m->hasTo($this->staff->email) && $m->result === 'approved');
        $this->assertDatabaseHas('notifications', ['user_id' => $this->staff->id, 'type' => 'approved']);

        // Cannot approve twice
        $this->actingAs($this->deptHead)->post("/approval/{$journal->id}/approve")->assertForbidden();
    }

    public function test_any_active_section_head_may_act_at_superior_stage(): void
    {
        $journal = $this->createJournal($this->staff);
        $backup = User::factory()->sectionHead(false)->create();

        $this->actingAs($backup)->post("/approval/{$journal->id}/approve")->assertRedirect();

        $this->assertSame($backup->id, $journal->approvals()->where('approval_level', 'superior')->value('approved_by_user_id'));
    }

    public function test_revise_requires_notes_and_returns_to_requester(): void
    {
        $journal = $this->createJournal($this->staff);

        $this->actingAs($this->sectionHead)->post("/approval/{$journal->id}/revise", ['notes' => ''])
            ->assertSessionHasErrors('notes');
        $this->actingAs($this->sectionHead)->post("/approval/{$journal->id}/revise", ['notes' => 'abc'])
            ->assertSessionHasErrors('notes');

        $this->actingAs($this->sectionHead)->post("/approval/{$journal->id}/revise", ['notes' => 'Amount does not match'])
            ->assertRedirect(route('approval.index'));

        $journal->refresh();
        $this->assertSame('Revised', $journal->status);
        $this->assertSame($this->staff->id, $journal->current_assign_to);
        $this->assertSame('Revised', $journal->approvals->firstWhere('approval_level', 'superior')->status);
        Mail::assertSent(ApprovalResultMail::class, fn ($m) => $m->result === 'revised' && $m->notes === 'Amount does not match');
        $this->assertDatabaseHas('approval_histories', ['general_journal_id' => $journal->id, 'action' => 'revise', 'target_level' => 'superior']);
    }

    public function test_legacy_reject_route_performs_revision(): void
    {
        $journal = $this->createJournal($this->staff);

        $this->actingAs($this->sectionHead)->post("/approval/{$journal->id}/reject", ['notes' => 'Legacy route'])->assertRedirect();

        $this->assertSame('Revised', $journal->fresh()->status);
    }

    public function test_timeline_json_endpoint(): void
    {
        $journal = $this->journalAtDeptHead();

        $this->actingAs($this->staff)->getJson("/general-journals/{$journal->id}/history")
            ->assertOk()
            ->assertJsonPath('journal.id', $journal->id)
            ->assertJsonCount(2, 'journal.histories')
            ->assertJsonPath('journal.histories.0.action', 'submit')
            ->assertJsonPath('journal.histories.1.action', 'approve')
            // The Drafts page file modal reads the files from this endpoint
            ->assertJsonCount(1, 'journal.active_files')
            ->assertJsonPath('journal.active_files.0.category', 'general_journal')
            ->assertJsonMissingPath('journal.requester.password');

        $this->actingAs($this->staff)->getJson("/tracking/{$journal->id}")->assertOk();
        $this->actingAs($this->staff)->get('/tracking')->assertRedirect(route('monitoring.index'));
    }
}
