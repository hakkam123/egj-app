<?php

namespace Tests\Unit;

use App\Models\ErrorLog;
use App\Models\GeneralJournal;
use App\Models\GeneralJournalFile;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ModelTest extends TestCase
{
    public function test_user_role_helpers(): void
    {
        $this->assertTrue($this->staff->hasRole('Staff'));
        $this->assertTrue($this->staff->hasAnyRole(['Admin', 'Staff']));
        $this->assertFalse($this->staff->isApprover());
        $this->assertTrue($this->staff->canCreateJournal());

        $this->assertTrue($this->sectionHead->isApprover());
        $this->assertTrue($this->sectionHead->canCreateJournal());
        $this->assertTrue($this->deptHead->isApprover());
        $this->assertFalse($this->deptHead->canCreateJournal());
        $this->assertFalse($this->admin->isApprover());
    }

    public function test_user_password_is_hashed_and_hidden(): void
    {
        $user = User::factory()->create(['password' => 'secret-pass']);

        $this->assertNotSame('secret-pass', $user->getRawOriginal('password'));
        $this->assertTrue(Hash::check('secret-pass', $user->password));
        $this->assertArrayNotHasKey('password', $user->toArray());
    }

    public function test_journal_status_helpers(): void
    {
        $journal = new GeneralJournal(['status' => 'Draft']);
        $this->assertTrue($journal->isDraft());

        foreach (['Waiting Approval' => 'isWaitingApproval', 'Revised' => 'isRevised', 'Approved' => 'isApproved', 'Rejected' => 'isRejected'] as $status => $method) {
            $journal->status = $status;
            $this->assertTrue($journal->$method(), $method);
            $this->assertFalse($journal->isDraft());
        }
    }

    public function test_current_pending_approval_follows_level_order(): void
    {
        $journal = $this->createJournal($this->staff);

        $this->assertSame('superior', $journal->currentPendingApproval()->approval_level);

        $journal->approvals()->where('approval_level', 'superior')->update(['status' => 'Approved']);
        $this->assertSame('superior_of_superior', $journal->currentPendingApproval()->approval_level);

        $journal->approvals()->update(['status' => 'Approved']);
        $this->assertNull($journal->currentPendingApproval());
    }

    public function test_can_be_actioned_by_only_the_role_of_the_current_stage(): void
    {
        $journal = $this->createJournal($this->staff);

        $this->assertTrue($journal->canBeActionedBy($this->sectionHead));
        $this->assertFalse($journal->canBeActionedBy($this->deptHead), 'Dept Head must not act before Section Head');
        $this->assertFalse($journal->canBeActionedBy($this->staff));
        $this->assertFalse($journal->canBeActionedBy($this->admin));

        $journal->approvals()->where('approval_level', 'superior')->update(['status' => 'Approved']);
        $this->assertTrue($journal->canBeActionedBy($this->deptHead));
        $this->assertFalse($journal->canBeActionedBy($this->sectionHead));

        $journal->update(['status' => 'Revised']);
        $this->assertFalse($journal->canBeActionedBy($this->deptHead));
    }

    public function test_actionable_by_scope(): void
    {
        $atSection = $this->createJournal($this->staff);
        $atDept = $this->journalAtDeptHead();
        $this->createJournal($this->staff, 'draft');

        $this->assertEqualsCanonicalizing([$atSection->id], GeneralJournal::actionableBy($this->sectionHead)->pluck('id')->all());
        $this->assertEqualsCanonicalizing([$atDept->id], GeneralJournal::actionableBy($this->deptHead)->pluck('id')->all());
        $this->assertCount(0, GeneralJournal::actionableBy($this->staff)->get());
    }

    public function test_journal_file_helpers_and_integrity(): void
    {
        $journal = $this->createJournal($this->staff);
        $file = GeneralJournalFile::getActive($journal->id, 'general_journal');

        $this->assertTrue($file->isGeneralJournal());
        $this->assertFalse($file->isSupportingDocument());
        $this->assertSame(64, strlen($file->file_hash));
        $this->assertTrue($file->verifyIntegrity());

        Storage::put($file->file_path, 'tampered');
        $this->assertFalse($file->verifyIntegrity());

        Storage::delete($file->file_path);
        $this->assertFalse($file->verifyIntegrity());
    }

    public function test_journal_relations(): void
    {
        $journal = $this->createJournal($this->staff);

        $this->assertTrue($journal->requester->is($this->staff));
        $this->assertTrue($journal->assignee->is($this->sectionHead));
        $this->assertCount(1, $journal->activeFiles);
        $this->assertCount(3, $journal->approvals);
        $this->assertSame('submit', $journal->histories->first()->action);
        $this->assertTrue($journal->histories->first()->actor->is($this->staff));
        $this->assertTrue($journal->emailTokens->first()->generalJournal->is($journal));
    }

    public function test_notifications_and_error_logs_are_pruned(): void
    {
        $oldRead = Notification::create(['user_id' => $this->staff->id, 'message' => 'a', 'is_read' => true, 'created_at' => now()->subDays(31)]);
        $oldUnread = Notification::create(['user_id' => $this->staff->id, 'message' => 'b', 'is_read' => false, 'created_at' => now()->subDays(31)]);

        $resolved = ErrorLog::create(['message' => 'x', 'exception_class' => 'E', 'status' => 'Resolved']);
        $resolved->forceFill(['created_at' => now()->subDays(31)])->save();
        $new = ErrorLog::create(['message' => 'y', 'exception_class' => 'E', 'status' => 'New']);
        $new->forceFill(['created_at' => now()->subDays(31)])->save();

        $this->artisan('model:prune', ['--model' => [Notification::class, ErrorLog::class]]);

        $this->assertModelMissing($oldRead);
        $this->assertModelExists($oldUnread);
        $this->assertModelMissing($resolved);
        $this->assertModelExists($new);
    }
}
