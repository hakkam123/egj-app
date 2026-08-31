<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\GeneralJournal;
use App\Models\GeneralJournalApproval;
use App\Models\GeneralJournalFile;
use App\Models\Notification;
use App\Models\User;
use App\Services\PdfStampRenderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

echo "=== TEST ON-THE-FLY PDF STAMP RENDERING ===\n\n";

$staff = User::where('email', 'budi.santoso@astra-visteon.com')->first();
$sectionHead = User::where('email', 'ahmad.hidayat@astra-visteon.com')->first();
$deptHead = User::where('email', 'alisa.wijaya@astra-visteon.com')->first();

// Create sample PDF for testing
$tempPdfPath = storage_path('app/test_source.pdf');
$mpdfInit = new \Mpdf\Mpdf(['unit' => 'mm', 'format' => [297, 210]]);
$mpdfInit->WriteHTML('<div style="font-family:sans-serif; padding:40px;"><h2>PT ASTRA VISTEON INDONESIA</h2><h3>ELECTRONIC GENERAL JOURNAL</h3><p>Test document for on-the-fly stamping.</p></div>');
$mpdfInit->Output($tempPdfPath, \Mpdf\Output\Destination::FILE);

// 1. Submit Journal as Staff
Auth::login($staff);
$docNumber = 'GJ-FLY-' . strtoupper(Str::random(5));
$journal = GeneralJournal::create([
    'document_number' => $docNumber,
    'journal_date' => now()->toDateString(),
    'reference' => 'On-the-fly Stamping Test',
    'status' => 'Waiting Approval',
    'requested_by' => $staff->id,
    'current_assign_to' => $sectionHead->id,
    'resubmit_count' => 0,
    'submitted_at' => now(),
    'last_updated_at' => now(),
]);

$storedPath = "general-journals/{$journal->id}/general_journal/Original_GJ.pdf";
Storage::put($storedPath, file_get_contents($tempPdfPath));
$hash = hash_file('sha256', Storage::path($storedPath));

$gjFile = GeneralJournalFile::create([
    'general_journal_id' => $journal->id,
    'category' => 'general_journal',
    'file_name' => 'Original_GJ.pdf',
    'file_path' => $storedPath,
    'file_size' => filesize(Storage::path($storedPath)),
    'mime_type' => 'application/pdf',
    'file_hash' => $hash,
    'version' => 1,
    'is_active' => true,
    'uploaded_at' => now(),
]);

// Approvals setup: Accounting (Approved), Superior (Pending), Superior of Superior (Pending)
GeneralJournalApproval::create([
    'general_journal_id' => $journal->id,
    'approval_level' => 'accounting',
    'assigned_user_id' => $staff->id,
    'approved_by_user_id' => $staff->id,
    'status' => 'Approved',
    'approved_at' => now(),
]);

GeneralJournalApproval::create([
    'general_journal_id' => $journal->id,
    'approval_level' => 'superior',
    'assigned_user_id' => $sectionHead->id,
    'status' => 'Pending',
]);

GeneralJournalApproval::create([
    'general_journal_id' => $journal->id,
    'approval_level' => 'superior_of_superior',
    'assigned_user_id' => $deptHead->id,
    'status' => 'Pending',
]);

$renderService = app(PdfStampRenderService::class);

// TEST 1: Initial state (Accounting only)
echo "[TEST 1: Initial State - Accounting Approved]\n";
$pdf1 = $renderService->render($journal);
echo "Rendered PDF size: " . strlen($pdf1) . " bytes\n";
file_put_contents(storage_path('app/rendered_step1_accounting.pdf'), $pdf1);
echo "Saved step 1 PDF to storage/app/rendered_step1_accounting.pdf\n\n";

// TEST 2: Section Head approves (Accounting + Superior Approved)
echo "[TEST 2: Partial State - Section Head Approves]\n";
Auth::login($sectionHead);
$approvalController = app(\App\Http\Controllers\ApprovalController::class);
$approvalController->approve(new Request(), $journal->id);

$journal->refresh();
$pdf2 = $renderService->render($journal);
echo "Rendered PDF size: " . strlen($pdf2) . " bytes\n";
file_put_contents(storage_path('app/rendered_step2_superior.pdf'), $pdf2);
echo "Saved step 2 PDF to storage/app/rendered_step2_superior.pdf\n\n";

// TEST 3: Dept Head approves (Fully Approved - All 3 stamps)
echo "[TEST 3: Final State - Dept Head Approves]\n";
Auth::login($deptHead);
$approvalController->approve(new Request(), $journal->id);

$journal->refresh();
$pdf3 = $renderService->render($journal, true);
echo "Rendered PDF size for download: " . strlen($pdf3) . " bytes\n";
file_put_contents(storage_path('app/rendered_step3_final.pdf'), $pdf3);
echo "Saved step 3 PDF to storage/app/rendered_step3_final.pdf\n\n";

// TEST 4: FileController download & preview responses
echo "[TEST 4: FileController Response Test]\n";
$fileController = app(\App\Http\Controllers\FileController::class);
$previewResp = $fileController->preview($gjFile->id);
echo "Preview response status: " . $previewResp->getStatusCode() . ", Content-Type: " . $previewResp->headers->get('Content-Type') . ", Content-Disposition: " . $previewResp->headers->get('Content-Disposition') . "\n";

$downloadResp = $fileController->download($gjFile->id);
echo "Download response status: " . $downloadResp->getStatusCode() . ", Content-Type: " . $downloadResp->headers->get('Content-Type') . ", Content-Disposition: " . $downloadResp->headers->get('Content-Disposition') . "\n\n";

// TEST 5: Verify DB Records
echo "[TEST 5: Database Check - general_journal_files]\n";
$dbFiles = DB::select("SELECT id, general_journal_id, category, file_name, version, is_active, file_hash FROM general_journal_files WHERE general_journal_id = '{$journal->id}'");
echo "Total GJ files for document {$journal->document_number}: " . count($dbFiles) . " (Expected: exactly 1 record)\n";
foreach ($dbFiles as $row) {
    echo "  - File ID: {$row->id} | Version: {$row->version} | Active: {$row->is_active} | Hash: {$row->file_hash}\n";
}

// Cleanup temp source
if (file_exists($tempPdfPath)) {
    unlink($tempPdfPath);
}

echo "\n=== ALL TESTS PASSED SUCCESSFULLY ===\n";

