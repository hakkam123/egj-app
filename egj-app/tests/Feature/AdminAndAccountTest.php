<?php

namespace Tests\Feature;

use App\Models\ErrorLog;
use App\Models\Notification;
use App\Models\Tutorial;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminAndAccountTest extends TestCase
{
    // ---------- User management ----------

    public function test_admin_only_routes(): void
    {
        foreach ([$this->staff, $this->sectionHead, $this->deptHead] as $user) {
            $this->actingAs($user)->get('/users')->assertForbidden();
            $this->actingAs($user)->post('/users', [])->assertForbidden();
            $this->actingAs($user)->get('/error-monitoring')->assertForbidden();
            $this->actingAs($user)->post('/tutorial', [])->assertForbidden();
        }
    }

    public function test_user_list_with_filters(): void
    {
        User::factory()->inactive()->create(['name' => 'Old Employee']);

        $this->actingAs($this->admin)->get('/users')
            ->assertInertia(fn (Assert $p) => $p->component('Users/Index')->has('users.data', 5)->missing('users.data.0.password'));
        $this->actingAs($this->admin)->get('/users?role=Staff')
            ->assertInertia(fn (Assert $p) => $p->has('users.data', 2));
        $this->actingAs($this->admin)->get('/users?status=inactive')
            ->assertInertia(fn (Assert $p) => $p->has('users.data', 1));
        $this->actingAs($this->admin)->get('/users?search=1004')
            ->assertInertia(fn (Assert $p) => $p->has('users.data', 1)->where('users.data.0.id', $this->sectionHead->id));
    }

    public function test_admin_creates_user_and_default_approver_is_unique(): void
    {
        $this->actingAs($this->admin)->post('/users', [
            'name' => 'New Head', 'email' => 'newhead@example.com', 'npk' => '3003',
            'password' => 'password123', 'password_confirmation' => 'password123',
            'role' => 'Section Head', 'is_active' => true, 'is_default_approver' => true,
        ])->assertRedirect(route('users.index'))->assertSessionHas('success', 'User created successfully.');

        $new = User::where('email', 'newhead@example.com')->firstOrFail();
        $this->assertTrue($new->is_default_approver);
        $this->assertFalse($this->sectionHead->fresh()->is_default_approver);
        $this->assertTrue(Hash::check('password123', $new->password));
    }

    public function test_user_validation(): void
    {
        $this->actingAs($this->admin)->post('/users', [
            'name' => '', 'email' => $this->staff->email, 'npk' => '1002',
            'password' => 'short', 'password_confirmation' => 'other', 'role' => 'SuperAdmin', 'is_active' => 'x',
        ])->assertSessionHasErrors(['name', 'email', 'npk', 'password', 'role', 'is_active']);
    }

    public function test_default_approver_flag_only_applies_to_section_heads(): void
    {
        $this->actingAs($this->admin)->put("/users/{$this->staff->id}", [
            'name' => 'Budi', 'email' => $this->staff->email, 'npk' => '1002',
            'role' => 'Staff', 'is_active' => true, 'is_default_approver' => true,
        ])->assertSessionHas('success', 'User updated successfully.');

        $this->assertFalse($this->staff->fresh()->is_default_approver);
        $this->assertTrue(Hash::check('password', $this->staff->fresh()->password), 'password unchanged when blank');
    }

    public function test_admin_updates_password_and_deactivates_user(): void
    {
        $this->actingAs($this->admin)->put("/users/{$this->staff->id}", [
            'name' => 'Budi', 'email' => $this->staff->email, 'npk' => '1002',
            'password' => 'newpassword', 'password_confirmation' => 'newpassword',
            'role' => 'Staff', 'is_active' => true,
        ]);
        $this->assertTrue(Hash::check('newpassword', $this->staff->fresh()->password));

        $this->actingAs($this->admin)->delete("/users/{$this->staff->id}")
            ->assertSessionHas('success', 'User deactivated successfully.');
        $this->assertModelExists($this->staff);
        $this->assertFalse($this->staff->fresh()->is_active);
    }

    // ---------- Profile ----------

    public function test_profile_update(): void
    {
        $this->actingAs($this->staff)->get('/profile')->assertInertia(fn (Assert $p) => $p->component('Profile/Edit'));

        $this->actingAs($this->staff)->put('/profile', [
            'name' => 'Budi Updated', 'email' => 'budi.new@example.com', 'npk' => '1002',
            'role' => 'Admin', 'is_active' => false, // must be ignored
        ])->assertSessionHas('success', 'Profile updated successfully.');

        $fresh = $this->staff->fresh();
        $this->assertSame('Budi Updated', $fresh->name);
        $this->assertSame('Staff', $fresh->role, 'cannot escalate own role');
        $this->assertTrue($fresh->is_active);

        $this->actingAs($this->staff)->put('/profile', ['name' => 'x', 'email' => $this->admin->email])
            ->assertSessionHasErrors('email');
    }

    public function test_password_change(): void
    {
        $this->actingAs($this->staff)->put('/profile/password', [
            'current_password' => 'wrong', 'new_password' => 'newpass123', 'new_password_confirmation' => 'newpass123',
        ])->assertSessionHasErrors(['current_password' => 'The current password is incorrect.']);

        $this->actingAs($this->staff)->put('/profile/password', [
            'current_password' => 'password', 'new_password' => 'newpass123', 'new_password_confirmation' => 'newpass123',
        ])->assertSessionHas('success', 'Password changed successfully.');

        $this->assertTrue(Hash::check('newpass123', $this->staff->fresh()->password));
    }

    // ---------- Notifications ----------

    public function test_notifications_are_scoped_to_owner(): void
    {
        $journal = $this->createJournal($this->staff); // creates approval_request for Section Head
        $mine = Notification::where('user_id', $this->sectionHead->id)->firstOrFail();

        $this->actingAs($this->sectionHead)->getJson('/notifications/unread-count')->assertJson(['unread_count' => 1]);
        $this->actingAs($this->sectionHead)->getJson('/notifications')->assertJsonCount(1, 'notifications');
        $this->actingAs($this->staff)->getJson('/notifications')->assertJsonCount(0, 'notifications');

        // Another user cannot mark it read (IDOR)
        $this->actingAs($this->staff)->postJson("/notifications/{$mine->id}/read")->assertNotFound();
        $this->assertFalse($mine->fresh()->is_read);

        $this->actingAs($this->sectionHead)->postJson("/notifications/{$mine->id}/read")->assertJson(['success' => true]);
        $this->assertTrue($mine->fresh()->is_read);
    }

    public function test_mark_all_and_by_journal(): void
    {
        $a = $this->createJournal($this->staff);
        $this->createJournal($this->staff);

        $this->actingAs($this->sectionHead)->postJson("/notifications/mark-read-by-journal/{$a->id}")->assertOk();
        $this->actingAs($this->sectionHead)->getJson('/notifications/unread-count')->assertJson(['unread_count' => 1]);

        $this->actingAs($this->sectionHead)->postJson('/notifications/read-all')->assertOk();
        $this->actingAs($this->sectionHead)->getJson('/notifications/unread-count')->assertJson(['unread_count' => 0]);
    }

    // ---------- Tutorials ----------

    public function test_tutorial_upload_preview_download_delete(): void
    {
        $this->actingAs($this->staff)->get('/tutorial')
            ->assertInertia(fn (Assert $p) => $p->component('Tutorial/Index')->where('manualExists', false));
        $this->actingAs($this->staff)->get('/tutorial/download')->assertSessionHas('error', 'No tutorial file has been uploaded yet.');

        $this->actingAs($this->admin)->post('/tutorial', ['title' => 'Guide', 'file' => UploadedFile::fake()->create('x.exe', 5)])
            ->assertSessionHasErrors('file');

        $this->actingAs($this->admin)->post('/tutorial', [
            'title' => 'User Guide', 'description' => 'How to', 'file' => $this->fakePdf('guide "v1".pdf'),
        ])->assertSessionHas('success', 'Tutorial PDF uploaded successfully.');

        $tutorial = Tutorial::firstOrFail();
        Storage::assertExists($tutorial->file_path);

        $preview = $this->actingAs($this->staff)->get("/tutorial/{$tutorial->id}/preview");
        $preview->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->assertStringNotContainsString('"v1"', $preview->headers->get('Content-Disposition'), 'quotes are escaped');

        $this->actingAs($this->staff)->get("/tutorial/download/{$tutorial->id}")->assertOk()->assertDownload();
        $this->actingAs($this->staff)->get('/tutorial/download')->assertOk()->assertDownload();
        $this->actingAs($this->staff)->delete("/tutorial/{$tutorial->id}")->assertForbidden();

        $this->actingAs($this->admin)->delete("/tutorial/{$tutorial->id}")->assertSessionHas('success', 'Tutorial deleted successfully.');
        $this->assertModelMissing($tutorial);
        Storage::assertMissing($tutorial->file_path);
    }

    // ---------- Error monitoring ----------

    public function test_error_monitoring(): void
    {
        $log = ErrorLog::create(['message' => 'SQL timeout', 'exception_class' => 'PDOException', 'url' => '/monitoring']);
        ErrorLog::create(['message' => 'Other', 'exception_class' => 'RuntimeException', 'status' => 'Resolved']);

        $this->actingAs($this->admin)->get('/error-monitoring')
            ->assertInertia(fn (Assert $p) => $p->component('ErrorMonitoring/Index')
                ->has('logs.data', 2)->where('stats.new', 1)->where('stats.resolved', 1));
        $this->actingAs($this->admin)->get('/error-monitoring?search=PDO&status=New')
            ->assertInertia(fn (Assert $p) => $p->has('logs.data', 1));

        $this->actingAs($this->admin)->patch("/error-monitoring/{$log->id}/status", ['status' => 'Hacked'])
            ->assertSessionHasErrors('status');
        $this->actingAs($this->admin)->patch("/error-monitoring/{$log->id}/status", ['status' => 'Ignored'])
            ->assertSessionHas('success', 'Error log status changed to Ignored.');
        $this->assertSame('Ignored', $log->fresh()->status);

        $this->actingAs($this->admin)->delete("/error-monitoring/{$log->id}")->assertSessionHas('success');
        $this->assertModelMissing($log);
    }

    public function test_unhandled_exceptions_are_recorded(): void
    {
        \Illuminate\Support\Facades\Route::middleware('web')->get('/_boom', fn () => throw new \LogicException('Kaboom'));

        $this->actingAs($this->staff)->get('/_boom')->assertStatus(500);

        $this->assertDatabaseHas('error_logs', ['exception_class' => \LogicException::class, 'message' => 'Kaboom', 'user_id' => $this->staff->id]);
    }
}
