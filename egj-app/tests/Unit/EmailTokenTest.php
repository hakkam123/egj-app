<?php

namespace Tests\Unit;

use App\Models\EmailToken;
use Tests\TestCase;

class EmailTokenTest extends TestCase
{
    public function test_issue_creates_random_token_valid_for_five_days(): void
    {
        $this->freezeSecond();
        $journal = $this->createJournal($this->staff, 'draft');

        $token = EmailToken::issue($journal, 'x@example.com', 'approval');

        $this->assertSame(64, strlen($token->token));
        $this->assertSame(5, EmailToken::TTL_DAYS);
        $this->assertTrue($token->expires_at->equalTo(now()->addDays(5)));
        $this->assertTrue($token->isValid());
        $this->assertNotSame($token->token, EmailToken::issue($journal, 'x@example.com', 'approval')->token);
    }

    public function test_validity_helpers(): void
    {
        $journal = $this->createJournal($this->staff, 'draft');
        $token = EmailToken::issue($journal, 'x@example.com', 'approval');

        $this->travel(5)->days();
        $this->travel(1)->minutes();
        $this->assertTrue($token->isExpired());
        $this->assertFalse($token->isValid());

        $fresh = EmailToken::issue($journal, 'x@example.com', 'approval');
        $fresh->markAsUsed();
        $this->assertTrue($fresh->fresh()->isUsed());
        $this->assertFalse($fresh->fresh()->isValid());
    }

    public function test_revoke_for_expires_only_outstanding_tokens_of_that_journal(): void
    {
        $journal = $this->createJournal($this->staff, 'draft');
        $other = $this->createJournal($this->staff, 'draft');

        $a = EmailToken::issue($journal, 'a@example.com', 'approval');
        $b = EmailToken::issue($journal, 'b@example.com', 'approval');
        $used = EmailToken::issue($journal, 'a@example.com', 'approval');
        $used->markAsUsed();
        $keep = EmailToken::issue($other, 'a@example.com', 'approval');

        EmailToken::revokeFor($journal->id, 'a@example.com');

        $this->assertTrue($a->fresh()->isExpired());
        $this->assertTrue($b->fresh()->isValid(), 'other recipient untouched');
        $this->assertTrue($keep->fresh()->isValid(), 'other journal untouched');
        $this->assertTrue($used->fresh()->isUsed());

        EmailToken::revokeFor($journal->id);
        $this->assertTrue($b->fresh()->isExpired());
    }

    public function test_prunes_tokens_expired_more_than_seven_days_ago(): void
    {
        $journal = $this->createJournal($this->staff, 'draft');
        $old = EmailToken::issue($journal, 'a@example.com', 'approval');
        $old->update(['expires_at' => now()->subDays(8)]);
        $recent = EmailToken::issue($journal, 'a@example.com', 'approval');

        $this->artisan('model:prune', ['--model' => [EmailToken::class]]);

        $this->assertModelMissing($old);
        $this->assertModelExists($recent);
    }
}
