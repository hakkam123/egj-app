<?php

namespace Tests\Feature;

use Tests\TestCase;

class SmokeTest extends TestCase
{
    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/')->assertRedirect('/login');
    }

    public function test_full_happy_path(): void
    {
        $journal = $this->journalAtDeptHead();
        $this->actingAs($this->deptHead)->post("/approval/{$journal->id}/approve")->assertRedirect();
        $this->assertSame('Approved', $journal->fresh()->status);
    }
}
