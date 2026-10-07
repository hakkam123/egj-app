<?php

namespace Tests\Feature;

use App\Console\Commands\DispatchApprovalReminders;
use App\Jobs\SendApprovalReminderJob;
use App\Mail\DeptHeadApprovalMail;
use App\Models\EmailToken;
use App\Models\Notification;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ApprovalReminderTest extends TestCase
{
    private function runReminders(): void
    {
        $this->artisan('jago:dispatch-reminders')->assertSuccessful();
    }

    private function reminderMails(): int
    {
        return Mail::sent(DeptHeadApprovalMail::class, fn ($m) => $m->reminderNumber > 0)->count();
    }

    public function test_no_reminder_before_three_days(): void
    {
        $this->journalAtDeptHead();

        $this->travel(2)->days();
        $this->runReminders();

        $this->assertSame(0, $this->reminderMails());
    }

    public function test_reminder_sent_after_three_days_with_fresh_five_day_links(): void
    {
        $journal = $this->journalAtDeptHead();
        $firstLink = EmailToken::where('purpose', 'approval')->firstOrFail();

        $this->travel(3)->days();
        $this->runReminders();

        Mail::assertSent(DeptHeadApprovalMail::class, fn ($m) => $m->reminderNumber === 1
            && $m->daysPending === 3
            && $m->hasTo($this->deptHead->email)
            && str_starts_with($m->envelope()->subject, '[Reminder #1]'));

        $this->assertTrue($firstLink->fresh()->isExpired(), 'old link revoked');
        $newLink = EmailToken::where('purpose', 'approval')->latest('created_at')->firstOrFail();
        $this->assertTrue($newLink->isValid());
        $this->assertTrue($newLink->expires_at->between(now()->addDays(5)->subMinute(), now()->addDays(5)->addMinute()));

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->staff->id,
            'general_journal_id' => $journal->id,
            'type' => 'reminder_pending',
        ]);
    }

    public function test_reminders_repeat_every_three_days_up_to_the_max(): void
    {
        $this->journalAtDeptHead();

        $this->travel(3)->days();
        $this->runReminders();
        $this->runReminders(); // same day: no duplicate
        $this->assertSame(1, $this->reminderMails());

        $this->travel(2)->days();
        $this->runReminders(); // only 2 days since last reminder
        $this->assertSame(1, $this->reminderMails());

        $this->travel(1)->days();
        $this->runReminders();
        $this->assertSame(2, $this->reminderMails());
        Mail::assertSent(DeptHeadApprovalMail::class, fn ($m) => $m->reminderNumber === 2 && $m->daysPending === 6);

        $this->travel(10)->days();
        $this->runReminders();
        $this->assertSame(DispatchApprovalReminders::MAX_REMINDERS, $this->reminderMails());
    }

    public function test_no_reminder_while_waiting_for_section_head_or_after_decision(): void
    {
        $atSection = $this->createJournal($this->staff);
        $approved = $this->journalAtDeptHead();
        $this->actingAs($this->deptHead)->post("/approval/{$approved->id}/approve");

        $this->travel(4)->days();
        $this->runReminders();

        $this->assertSame(0, $this->reminderMails());
        $this->assertSame('Waiting Approval', $atSection->fresh()->status);
    }

    public function test_resubmitted_journal_starts_a_new_reminder_round(): void
    {
        $journal = $this->journalAtDeptHead();

        $this->travel(3)->days();
        $this->runReminders();
        $this->travel(3)->days();
        $this->runReminders();
        $this->assertSame(2, $this->reminderMails());

        $this->actingAs($this->deptHead)->post("/approval/{$journal->id}/revise", ['notes' => 'Needs fixing']);
        $this->actingAs($this->staff)->post("/general-journals/{$journal->id}/resubmit", ['reference' => 'fixed']);
        $this->actingAs($this->sectionHead)->post("/approval/{$journal->id}/approve");

        $this->travel(3)->days();
        $this->runReminders();
        $this->assertSame(3, $this->reminderMails());
    }

    public function test_job_skips_journal_no_longer_pending(): void
    {
        $journal = $this->journalAtDeptHead();
        $this->actingAs($this->deptHead)->post("/approval/{$journal->id}/approve");

        (new SendApprovalReminderJob($journal->id, 1))->handle();
        (new SendApprovalReminderJob('missing-id', 1))->handle();

        $this->assertSame(0, $this->reminderMails());
        $this->assertSame(0, Notification::where('type', 'reminder_pending')->count());
    }

    public function test_reminder_email_links_work(): void
    {
        $journal = $this->journalAtDeptHead();
        $this->travel(3)->days();
        $this->runReminders();

        $link = EmailToken::where('purpose', 'approval')->latest('created_at')->firstOrFail();
        $this->post("/approve-email/{$link->token}");

        $this->assertSame('Approved', $journal->fresh()->status);
    }

    public function test_command_is_scheduled_daily(): void
    {
        $events = collect(app(\Illuminate\Console\Scheduling\Schedule::class)->events())
            ->map(fn ($e) => [$e->command, $e->expression]);

        $this->assertTrue($events->contains(fn ($e) => str_contains($e[0], 'jago:dispatch-reminders') && $e[1] === '0 8 * * *'));
        $this->assertTrue($events->contains(fn ($e) => str_contains($e[0], 'model:prune')));
    }
}
