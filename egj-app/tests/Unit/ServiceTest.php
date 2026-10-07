<?php

namespace Tests\Unit;

use App\Http\Middleware\CheckRole;
use App\Models\ErrorLog;
use App\Services\ErrorLogService;
use App\Services\PdfStampRenderService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class ServiceTest extends TestCase
{
    public function test_error_log_service_stores_exceptions(): void
    {
        $this->actingAs($this->staff);

        ErrorLogService::log(new \RuntimeException('Boom happened'));

        $log = ErrorLog::firstOrFail();
        $this->assertSame('Boom happened', $log->message);
        $this->assertSame(\RuntimeException::class, $log->exception_class);
        $this->assertSame($this->staff->id, $log->user_id);
        $this->assertSame('New', $log->status);
    }

    public function test_error_log_service_ignores_validation_errors(): void
    {
        ErrorLogService::log(ValidationException::withMessages(['a' => 'b']));

        $this->assertSame(0, ErrorLog::count());
    }

    public function test_pdf_stamp_render_keeps_pages_and_adds_stamps_per_approved_level(): void
    {
        $journal = $this->createJournal($this->staff, 'submit', ['general_journal_file' => $this->fakePdf('gj.pdf', 2)]);
        $service = app(PdfStampRenderService::class);

        // Draft-like state: no approved levels -> no stamps
        $journal->approvals()->update(['status' => 'Pending']);
        $unstamped = $service->render($journal->fresh());

        $journal->approvals()->update(['status' => 'Approved', 'approved_at' => now(), 'approved_by_user_id' => $this->sectionHead->id]);
        $stamped = $service->render($journal->fresh());

        $this->assertStringStartsWith('%PDF', $stamped);
        $this->assertSame(2, $this->pageCount($stamped));
        $this->assertGreaterThan(strlen($unstamped), strlen($stamped));
    }

    public function test_pdf_stamp_coordinates_differ_for_multi_page(): void
    {
        $service = app(PdfStampRenderService::class);
        $single = tempnam(sys_get_temp_dir(), 'pdf');
        $multi = tempnam(sys_get_temp_dir(), 'pdf');
        file_put_contents($single, $this->pdfContent(1));
        file_put_contents($multi, $this->pdfContent(3));

        $a = $service->getFallbackCoords($single);
        $b = $service->getFallbackCoords($multi);

        $this->assertSame(['accounting', 'superior', 'superior_of_superior'], array_keys($a));
        $this->assertNotEquals($a, $b);
        @unlink($single);
        @unlink($multi);
    }

    public function test_pdf_stamp_render_404_when_file_missing(): void
    {
        $journal = $this->createJournal($this->staff, 'draft', ['general_journal_file' => null]);

        $this->expectException(HttpException::class);
        app(PdfStampRenderService::class)->render($journal);
    }

    public function test_check_role_middleware(): void
    {
        $middleware = new CheckRole();
        $request = Request::create('/x');
        $request->setUserResolver(fn () => $this->sectionHead);

        $response = $middleware->handle($request, fn () => response('ok'), 'Section Head', 'Dept/Div Head');
        $this->assertSame('ok', $response->getContent());

        $request->setUserResolver(fn () => $this->staff);
        $this->expectException(HttpException::class);
        $middleware->handle($request, fn () => response('ok'), 'Section Head', 'Dept/Div Head');
    }

    private function pageCount(string $pdf): int
    {
        return preg_match_all('#/Type\s*/Page[^s]#', $pdf);
    }
}
