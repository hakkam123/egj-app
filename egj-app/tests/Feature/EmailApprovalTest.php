<?php

namespace Tests\Feature;

use App\Mail\ApprovalResultMail;
use App\Models\EmailToken;
use App\Models\GeneralJournal;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EmailApprovalTest extends TestCase
{
    private function tokenFor(GeneralJournal $journal, string $purpose): EmailToken
    {
        return EmailToken::where('general_journal_id', $journal->id)->where('purpose', $purpose)
            ->latest('created_at')->firstOrFail();
    }

    public function test_confirm_page_via_approval_link_without_login(): void
    {
        $journal = $this->journalAtDeptHead();
        $token = $this->tokenFor($journal, 'approval');

        $this->get("/approve-email/{$token->token}")
            ->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Confirm')->where('journal.id', $journal->id));
    }

    public function test_approve_via_email_link(): void
    {
        $journal = $this->journalAtDeptHead();
        $approve = $this->tokenFor($journal, 'approval');
        $revise = $this->tokenFor($journal, 'rejection');

        $this->post("/approve-email/{$approve->token}")
            ->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Success')->where('action', 'approved'));

        $this->assertSame('Approved', $journal->fresh()->status);
        $this->assertSame($this->deptHead->id, $journal->approvals()->where('approval_level', 'superior_of_superior')->value('approved_by_user_id'));
        $this->assertTrue($approve->fresh()->isUsed());
        $this->assertTrue($revise->fresh()->isUsed(), 'sibling revise link is consumed too');
        Mail::assertSent(ApprovalResultMail::class, fn ($m) => $m->result === 'approved');

        // Re-using the link fails
        $this->post("/approve-email/{$approve->token}")
            ->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Invalid'));
        $this->get("/approve-email/{$approve->token}")
            ->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Invalid')->where('message', 'This token has already been used.'));
    }

    public function test_revise_via_email_link(): void
    {
        $journal = $this->journalAtDeptHead();
        $revise = $this->tokenFor($journal, 'rejection');

        $this->get("/revise-email/{$revise->token}")
            ->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Reject'));
        $this->post("/revise-email/{$revise->token}", ['notes' => 'x'])->assertSessionHasErrors('notes');

        $this->post("/revise-email/{$revise->token}", ['notes' => 'Attach the invoice'])
            ->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Success')->where('action', 'revised'));

        $journal->refresh();
        $this->assertSame('Revised', $journal->status);
        $this->assertSame($this->staff->id, $journal->current_assign_to);
        Mail::assertSent(ApprovalResultMail::class, fn ($m) => $m->result === 'revised' && $m->notes === 'Attach the invoice');

        // Legacy /reject-email route still resolves (and is now used)
        $this->get("/reject-email/{$revise->token}")->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Invalid'));
    }

    public function test_expired_link_is_rejected_after_five_days(): void
    {
        $journal = $this->journalAtDeptHead();
        $approve = $this->tokenFor($journal, 'approval');

        $this->travel(4)->days();
        $this->get("/approve-email/{$approve->token}")->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Confirm'));

        $this->travel(1)->days();
        $this->travel(1)->minutes();
        $this->get("/approve-email/{$approve->token}")->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Invalid'));
        $this->post("/approve-email/{$approve->token}")->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Invalid'));
        $this->assertSame('Waiting Approval', $journal->fresh()->status);
    }

    public function test_unknown_or_wrong_purpose_token(): void
    {
        $journal = $this->journalAtDeptHead();
        $revise = $this->tokenFor($journal, 'rejection');

        $this->get('/approve-email/not-a-real-token')->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Invalid'));
        // A revise token cannot be used on the approve endpoint and vice versa
        $this->post("/approve-email/{$revise->token}")->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Invalid'));
        $this->assertSame('Waiting Approval', $journal->fresh()->status);
    }

    public function test_link_stops_working_once_journal_handled_in_portal(): void
    {
        $journal = $this->journalAtDeptHead();
        $approve = $this->tokenFor($journal, 'approval');

        $this->actingAs($this->deptHead)->post("/approval/{$journal->id}/revise", ['notes' => 'Handled in portal']);
        auth()->logout();

        $this->post("/approve-email/{$approve->token}")->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Invalid'));
        $this->assertSame('Revised', $journal->fresh()->status);
    }

    public function test_old_round_link_cannot_approve_resubmitted_journal(): void
    {
        $journal = $this->journalAtDeptHead();
        $oldLink = $this->tokenFor($journal, 'approval');

        $this->actingAs($this->deptHead)->post("/approval/{$journal->id}/revise", ['notes' => 'Fix please']);
        $this->travel(1)->hours();
        $this->actingAs($this->staff)->post("/general-journals/{$journal->id}/resubmit", ['reference' => 'fixed']);
        $this->actingAs($this->sectionHead)->post("/approval/{$journal->id}/approve");
        auth()->logout();

        $this->post("/approve-email/{$oldLink->token}")->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Invalid'));
        $this->assertSame('Waiting Approval', $journal->fresh()->status);

        // The new round's link works
        $this->post('/approve-email/' . $this->tokenFor($journal, 'approval')->token)
            ->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Success'));
    }

    public function test_token_email_must_belong_to_a_dept_head(): void
    {
        $journal = $this->journalAtDeptHead();
        $forged = EmailToken::issue($journal, $this->staff->email, 'approval');

        $this->post("/approve-email/{$forged->token}")
            ->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Invalid')->where('message', 'You are not authorized to approve this document.'));
    }

    public function test_approval_link_cannot_skip_the_section_head(): void
    {
        $journal = $this->createJournal($this->staff);
        $early = EmailToken::issue($journal, $this->deptHead->email, 'approval');

        $this->post("/approve-email/{$early->token}")->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Invalid'));
        $this->assertSame('Pending', $journal->approvals()->where('approval_level', 'superior')->value('status'));
    }

    public function test_preview_link(): void
    {
        $journal = $this->createJournal($this->staff);
        $preview = $this->tokenFor($journal, 'preview');

        $this->get("/preview/{$preview->token}")
            ->assertInertia(fn (Assert $p) => $p->component('Preview/Show')->where('journal.id', $journal->id));
        $this->get('/preview/unknown')
            ->assertInertia(fn (Assert $p) => $p->component('Preview/Invalid')->where('message', 'Invalid token.'));

        $this->travel(6)->days();
        $this->get("/preview/{$preview->token}")
            ->assertInertia(fn (Assert $p) => $p->component('Preview/Invalid')->where('message', 'This preview link has expired.'));
    }
}
