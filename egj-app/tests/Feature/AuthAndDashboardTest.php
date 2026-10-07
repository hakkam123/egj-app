<?php

namespace Tests\Feature;

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AuthAndDashboardTest extends TestCase
{
    public function test_login_page_for_guests_only(): void
    {
        $this->get('/login')->assertInertia(fn (Assert $p) => $p->component('Auth/Login'));
        $this->actingAs($this->staff)->get('/login')->assertRedirect();
    }

    public function test_guest_is_redirected_from_protected_pages(): void
    {
        foreach (['/', '/dashboard', '/monitoring', '/drafts', '/approval', '/users', '/profile', '/tutorial'] as $url) {
            $this->get($url)->assertRedirect('/login');
        }
    }

    public function test_login_with_npk_or_email(): void
    {
        $this->post('/login', ['npk' => '1002', 'password' => 'password'])->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($this->staff);
        $this->post('/logout')->assertRedirect('/login');
        $this->assertGuest();

        $this->post('/login', ['npk' => $this->staff->email, 'password' => 'password'])->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($this->staff);
    }

    public function test_login_fails_for_wrong_password_or_inactive_account(): void
    {
        $this->post('/login', ['npk' => '1002', 'password' => 'wrong'])->assertSessionHasErrors('npk');
        $this->assertGuest();

        $inactive = User::factory()->inactive()->create(['npk' => '7777']);
        $this->post('/login', ['npk' => '7777', 'password' => 'password'])
            ->assertSessionHasErrors(['npk' => 'Invalid NPK or password, or the account is inactive.']);
        $this->assertGuest();

        $this->post('/login', [])->assertSessionHasErrors(['npk' => 'NPK is required.', 'password' => 'Password is required.']);
    }

    public function test_login_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->post('/login', ['npk' => '1002', 'password' => 'wrong']);
        }

        // Even the correct password is refused while throttled
        $this->post('/login', ['npk' => '1002', 'password' => 'password'])
            ->assertSessionHasErrors(['npk' => 'Too many login attempts. Please try again in a minute.']);
        $this->assertGuest();

        $this->travel(61)->seconds();
        $this->post('/login', ['npk' => '1002', 'password' => 'password'])->assertRedirect('/dashboard');
    }

    public function test_dashboard_per_role(): void
    {
        $old = $this->createJournal($this->staff);
        $this->createJournal($this->staff, 'draft');
        $old->update(['submitted_at' => now()->subDays(4)]);

        $this->actingAs($this->staff)->get('/dashboard')
            ->assertInertia(fn (Assert $p) => $p->component('Dashboard/Index')
                ->where('role', 'Staff')
                ->where('stats.total', 2)
                ->where('stats.draft', 1)
                ->where('stats.waiting', 1)
                ->has('recentData', 2));

        $this->actingAs($this->sectionHead)->get('/dashboard')
            ->assertInertia(fn (Assert $p) => $p->where('role', 'Section Head')
                ->where('stats.pending_approval', 1)
                ->has('actionRequiredDocs', 1)
                ->where('actionRequiredDocs.0.days_waiting', 4));

        $this->actingAs($this->deptHead)->get('/dashboard')
            ->assertInertia(fn (Assert $p) => $p->where('stats.pending_approval', 0));

        $this->actingAs($this->admin)->get('/')
            ->assertInertia(fn (Assert $p) => $p->where('role', 'Admin')
                ->where('stats.total_journals', 2)
                ->where('stats.total_users', 4)
                ->has('actionRequiredDocs', 1));
    }

    public function test_shared_inertia_props(): void
    {
        $this->createJournal($this->staff);

        $this->actingAs($this->sectionHead)->get('/dashboard')
            ->assertInertia(fn (Assert $p) => $p->where('auth.user.id', $this->sectionHead->id)
                ->where('auth.user.pending_count', 1)
                ->missing('auth.user.password'));
    }
}
