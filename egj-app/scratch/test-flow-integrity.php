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
use App\Services\PdfApprovalStampService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

echo "=== STARTING FULL FLOW INTEGRITY & NOTIFICATION TEST ===\n\n";

// 1. Get users
$staff = User::where('email', 'budi.santoso@astra-visteon.com')->first();
$sectionHead = User::where('email', 'ahmad.hidayat@astra-visteon.com')->first();
$deptHead = User::where('email', 'alisa.wijaya@astra-visteon.com')->first();

echo "Staff: {$staff->name} ({$staff->id})\n";
echo "Section Head: {$sectionHead->name} ({$sectionHead->id})\n";
echo "Dept Head: {$deptHead->name} ({$deptHead->id})\n\n";

// Create a valid blank A4 landscape PDF for testing
$tempPdfPath = storage_path('app/test_sample.pdf');
$mpdfInit = new \Mpdf\Mpdf(['unit' => 'mm', 'format' => [297, 210]]);
$mpdfInit->WriteHTML('<div style="font-family:sans-serif; padding:20px;"><h1>TEST GENERAL JOURNAL</h1><p>Document for file integrity testing.</p></div>');
$mpdfInit->Output($tempPdfPath, \Mpdf\Output\Destination::FILE);

// 2. Submit journal as Staff
Auth::login($staff);

$docNumber = 'GJ-TEST-' . strtoupper(Str::random(6));
$journal = GeneralJournal::create([
    'document_number' => $docNumber,
    'journal_date' => now()->toDateString(),
    'reference' => 'Testing File Integrity Level 2',
    'status' => 'Waiting Approval',
    'requested_by' => $staff->id,
    'current_assign_to' => $sectionHead->id,
    'resubmit_count' => 0,
    'submitted_at' => now(),
    'last_updated_at' => now(),
]);

// Store original file (Version 1, stamp_level = null)
$storedPath = "general-journals/{$journal->id}/general_journal/original_" . Str::random(20) . ".pdf";
Storage::put($storedPath, file_get_contents($tempPdfPath));
$initialHash = hash_file('sha256', Storage::path($storedPath));

$v1 = GeneralJournalFile::create([
    'general_journal_id' => $journal->id,
    'category' => 'general_journal',
    'file_name' => 'General_Journal_Original.pdf',
    'file_path' => $storedPath,
    'file_size' => filesize(Storage::path($storedPath)),
    'mime_type' => 'application/pdf',
    'file_hash' => $initialHash,
    'stamp_level' => null,
    'version' => 1,
    'is_active' => true,
    'uploaded_at' => now(),
]);

echo "[STEP 1: Upload Original]\n";
echo "Created v1 file: ID={$v1->id}, Version={$v1->version}, stamp_level=" . var_export($v1->stamp_level, true) . ", is_active=" . var_export($v1->is_active, true) . ", Hash={$v1->file_hash}\n\n";

// Setup approval records
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

// Stamp accounting
$stampService = app(PdfApprovalStampService::class);
$v2 = $stampService->stampApproval($journal, 'accounting');

echo "[STEP 2: Auto Stamp Accounting]\n";
echo "Created v2 file: ID={$v2->id}, Version={$v2->version}, stamp_level={$v2->stamp_level}, is_active=" . var_export($v2->is_active, true) . ", Hash={$v2->file_hash}\n";
$v1Fresh = $v1->fresh();
echo "v1 is_active after v2 created: " . var_export($v1Fresh->is_active, true) . "\n\n";

// 3. Section Head approves
Auth::login($sectionHead);
echo "[STEP 3: Section Head Approves]\n";

// Execute approval
$approvalController = app(\App\Http\Controllers\ApprovalController::class);
$request = new \Illuminate\Http\Request();
$approvalController->approve($request, $journal->id);

$journal->refresh();
$activeFile = GeneralJournalFile::getActive($journal->id, 'general_journal');
echo "Journal status: {$journal->status}\n";
echo "Journal current_assign_to: {$journal->current_assign_to} (Expected Dept Head: {$deptHead->id})\n";
echo "Created v3 file: ID={$activeFile->id}, Version={$activeFile->version}, stamp_level={$activeFile->stamp_level}, is_active=" . var_export($activeFile->is_active, true) . ", Hash={$activeFile->file_hash}\n\n";

// 4. Dept Head approves
Auth::login($deptHead);
echo "[STEP 4: Dept Head Approves]\n";

$approvalController->approve($request, $journal->id);

$journal->refresh();
$finalFile = GeneralJournalFile::getActive($journal->id, 'general_journal');
echo "Journal status: {$journal->status} (Expected: Approved)\n";
echo "Journal current_assign_to: " . var_export($journal->current_assign_to, true) . " (Expected: NULL)\n";
echo "Created v4 file: ID={$finalFile->id}, Version={$finalFile->version}, stamp_level={$finalFile->stamp_level}, is_active=" . var_export($finalFile->is_active, true) . ", Hash={$finalFile->file_hash}\n\n";

// 5. Test FileController verify endpoint
echo "[STEP 5: Verify Endpoint Check]\n";
$fileController = app(\App\Http\Controllers\FileController::class);
$verifyResponse = $fileController->verify($finalFile->id);
echo "Verify Endpoint Result for active file: " . json_encode($verifyResponse->getData(), JSON_PRETTY_PRINT) . "\n\n";

// 6. DB Query report
echo "[STEP 6: Database Records for Journal {$journal->id}]\n";
$files = DB::select("SELECT id, version, stamp_level, is_active, file_hash FROM general_journal_files WHERE general_journal_id = '{$journal->id}' ORDER BY version ASC");
foreach ($files as $f) {
    echo sprintf("| %-26s | Version: %d | Level: %-20s | Active: %d | Hash: %s |\n", $f->id, $f->version, $f->stamp_level ?? 'NULL (original)', $f->is_active, $f->file_hash);
}

// Cleanup temp sample pdf
if (file_exists($tempPdfPath)) {
    unlink($tempPdfPath);
}

echo "\n=== TEST COMPLETED SUCCESSFULLY ===\n";

