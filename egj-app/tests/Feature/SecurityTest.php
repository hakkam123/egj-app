<?php

namespace Tests\Feature;

use App\Models\GeneralJournal;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    public static function sqlInjectionPayloads(): array
    {
        return [
            'tautology' => ["' OR '1'='1"],
            'comment' => ["x' OR 1=1 --"],
            'stacked' => ["'; DROP TABLE users; --"],
            'union' => ["' UNION SELECT id, password, email FROM users --"],
            'mssql batch' => ["1'; EXEC xp_cmdshell('dir'); --"],
            'like wildcard' => ['%'],
            'bracket' => ["[%]' OR 1=1 --"],
        ];
    }

    /**
     * Every free-text filter goes through query bindings, so payloads are treated as plain text:
     * no error, no data leak, no dropped tables.
     */
    #[DataProvider('sqlInjectionPayloads')]
    public function test_filters_are_not_injectable(string $payload): void
    {
        $this->createJournal($this->staff, 'draft', ['document_number' => '8001']);
        $this->createJournal($this->staff, 'submit', ['document_number' => '8002']);

        $requests = [
            [$this->staff, '/monitoring', ['doc_number', 'reference', 'requester', 'assign_to', 'search', 'status', 'per_page'], 'journals.data'],
            [$this->staff, '/drafts', ['search', 'doc_number', 'reference', 'file_name'], 'drafts.data'],
            [$this->sectionHead, '/approval', ['doc_number', 'reference', 'requester', 'search', 'status', 'requested_by'], 'journals.data'],
            [$this->admin, '/users', ['search', 'role', 'status'], 'users.data'],
            [$this->admin, '/error-monitoring', ['search', 'status'], 'logs.data'],
        ];

        foreach ($requests as [$user, $url, $params, $dataKey]) {
            foreach ($params as $param) {
                $response = $this->actingAs($user)->get($url . '?' . http_build_query([$param => $payload]));
                $response->assertOk();

                // '%' is a legitimate LIKE match-all; per_page and /users status ignore unknown values
                // instead of filtering. Every other payload must match nothing.
                if ($payload !== '%' && !in_array("{$url}:{$param}", ['/monitoring:per_page', '/users:status'])) {
                    $response->assertInertia(fn (Assert $p) => $p->has($dataKey, 0));
                }
            }
        }

        $this->actingAs($this->staff)->get('/monitoring/export?' . http_build_query(['search' => $payload, 'doc_number' => $payload]))->assertOk();

        $this->assertTrue(Schema::hasTable('users'));
        $this->assertSame(4, User::count());
        $this->assertSame(2, GeneralJournal::count());
    }

    public function test_route_ids_are_not_injectable(): void
    {
        $this->actingAs($this->staff)->get("/general-journals/1' OR '1'='1")->assertNotFound();
        $this->actingAs($this->staff)->getJson("/tracking/1' OR '1'='1")->assertNotFound();
        $this->actingAs($this->staff)->get("/files/1' OR '1'='1/preview")->assertNotFound();
        $this->get("/approve-email/' OR '1'='1")->assertInertia(fn (Assert $p) => $p->component('EmailApproval/Invalid'));
        $this->post('/general-journals/bulk-submit', ['ids' => ["' OR 1=1 --"]]);
        $this->assertTrue(Schema::hasTable('general_journals'));
    }

    public function test_injected_document_number_is_stored_as_plain_text(): void
    {
        $payload = "1'); DELETE FROM users; --";
        $this->actingAs($this->staff)->post('/general-journals', [
            'action' => 'draft', 'document_number' => $payload, 'journal_date' => '2026-09-24', 'reference' => '<img src=x onerror=alert(1)>',
        ])->assertSessionHasNoErrors();

        $this->assertSame(4, User::count());
        $this->assertDatabaseHas('general_journals', ['document_number' => 'JOT ' . $payload]);
    }

    public function test_stored_html_is_escaped_in_inertia_page(): void
    {
        $journal = $this->createJournal($this->staff, 'draft', ['reference' => '<script>alert("xss")</script>']);

        $html = $this->actingAs($this->staff)->get("/general-journals/{$journal->id}")->getContent();

        $this->assertStringNotContainsString('<script>alert("xss")</script>', $html);
    }

    public function test_sensitive_fields_never_serialized(): void
    {
        $journal = $this->createJournal($this->staff);

        $json = json_encode($this->actingAs($this->sectionHead)->getJson("/tracking/{$journal->id}")->json());
        $this->assertStringNotContainsString('password', $json);

        $page = $this->actingAs($this->admin)->get('/users')->getContent();
        $this->assertStringNotContainsString(DB::table('users')->value('password'), $page);
    }

    public function test_role_escalation_through_mass_assignment_is_blocked(): void
    {
        // Non-admin cannot reach user management at all
        $this->actingAs($this->staff)->put("/users/{$this->staff->id}", ['role' => 'Admin'])->assertForbidden();
        $this->assertSame('Staff', $this->staff->fresh()->role);
    }

    public function test_staff_cannot_act_on_other_peoples_journals(): void
    {
        $victim = User::factory()->staff()->create();
        $draft = $this->createJournal($victim, 'draft');
        $journal = $this->createJournal($victim);
        $this->actingAs($this->sectionHead)->post("/approval/{$journal->id}/revise", ['notes' => 'please fix']);

        $this->actingAs($this->staff)->get("/general-journals/{$draft->id}/edit")->assertForbidden();
        $this->actingAs($this->staff)->post("/general-journals/{$draft->id}/update", ['document_number' => '1', 'journal_date' => '2026-01-01', 'reference' => 'x'])->assertForbidden();
        $this->actingAs($this->staff)->delete("/general-journals/{$draft->id}")->assertForbidden();
        $this->actingAs($this->staff)->post("/general-journals/{$draft->id}/submit")->assertForbidden();
        $this->actingAs($this->staff)->post("/general-journals/{$journal->id}/resubmit", ['reference' => 'x'])->assertForbidden();
        $this->actingAs($this->staff)->post("/general-journals/{$journal->id}/self-reject")->assertForbidden();

        $this->assertSame('Draft', $draft->fresh()->status);
        $this->assertSame('Revised', $journal->fresh()->status);
    }

    public function test_inactive_user_cannot_login(): void
    {
        $this->staff->update(['is_active' => false]);

        $this->post('/login', ['npk' => '1002', 'password' => 'password'])->assertSessionHasErrors('npk');
        $this->assertGuest();
    }

    public function test_session_is_regenerated_on_login(): void
    {
        $this->startSession();
        $before = session()->getId();

        $this->post('/login', ['npk' => '1002', 'password' => 'password']);

        $this->assertNotSame($before, session()->getId());
    }
}
