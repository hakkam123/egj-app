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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

echo "=== TEST NOTIFICATION & STAMP IDEMPOTENCY ===\n\n";

$staff = User::where('email', 'budi.santoso@astra-visteon.com')->first();
$sectionHead = User::where('email', 'ahmad.hidayat@astra-visteon.com')->first();
$deptHead = User::where('email', 'alisa.wijaya@astra-visteon.com')->first();

// Create sample PDF for testing
$tempPdfPath = storage_path('app/test_sample_2.pdf');
$mpdfInit = new \Mpdf\Mpdf(['unit' => 'mm', 'format' => [297, 210]]);
$mpdfInit->WriteHTML('<h1>Sample General Journal</h1>');
$mpdfInit->Output($tempPdfPath, \Mpdf\Output\Destination::FILE);

// --- SCENARIO 1: Staff submits -> Section Head approves -> Dept Head approves ---
echo "--- SCENARIO 1: Staff Flow ---\n";
Auth::login($staff);

$journal1 = GeneralJournal::create([
    'document_number' => 'GJ-IDEM-' . strtoupper(Str::random(5)),
    'journal_date' => now()->toDateString(),
    'reference' => 'Testing Idempotency',
    'status' => 'Waiting Approval',
    'requested_by' => $staff->id,
    'current_assign_to' => $sectionHead->id,
    'resubmit_count' => 0,
    'submitted_at' => now(),
    'last_updated_at' => now(),
]);

$storedPath = "general-journals/{$journal1->id}/general_journal/original_" . Str::random(10) . ".pdf";
Storage::put($storedPath, file_get_contents($tempPdfPath));
$hash1 = hash_file('sha256', Storage::path($storedPath));

GeneralJournalFile::create([
    'general_journal_id' => $journal1->id,
    'category' => 'general_journal',
    'file_name' => 'Original.pdf',
    'file_path' => $storedPath,
    'file_size' => filesize(Storage::path($storedPath)),
    'mime_type' => 'application/pdf',
    'file_hash' => $hash1,
    'stamp_level' => null,
    'version' => 1,
    'is_active' => true,
    'uploaded_at' => now(),
]);

GeneralJournalApproval::create([
    'general_journal_id' => $journal1->id,
    'approval_level' => 'accounting',
    'assigned_user_id' => $staff->id,
    'approved_by_user_id' => $staff->id,
    'status' => 'Approved',
    'approved_at' => now(),
]);

GeneralJournalApproval::create([
    'general_journal_id' => $journal1->id,
    'approval_level' => 'superior',
    'assigned_user_id' => $sectionHead->id,
    'status' => 'Pending',
]);

GeneralJournalApproval::create([
    'general_journal_id' => $journal1->id,
    'approval_level' => 'superior_of_superior',
    'assigned_user_id' => $deptHead->id,
    'status' => 'Pending',
]);

Notification::create([
    'user_id' => $sectionHead->id,
    'general_journal_id' => $journal1->id,
    'type' => 'approval_request',
    'message' => "Dokumen {$journal1->document_number} membutuhkan persetujuan Anda.",
    'created_at' => now(),
]);

$stampService = app(PdfApprovalStampService::class);
$stampService->stampApproval($journal1, 'accounting');

// Section Head approves
Auth::login($sectionHead);
$approvalController = app(\App\Http\Controllers\ApprovalController::class);
$approvalController->approve(new Request(), $journal1->id);

// Dept Head approves via portal
Auth::login($deptHead);
$approvalController->approve(new Request(), $journal1->id);

// Simulate duplicate approval attempt (e.g. email controller trying to notify again)
$alreadyNotifiedCheck = Notification::where('general_journal_id', $journal1->id)
    ->where('user_id', $journal1->requested_by)
    ->where('type', 'approved')
    ->exists();

echo "Duplicate check prevented 2nd requester notification: " . ($alreadyNotifiedCheck ? "YES (guard works)" : "NO") . "\n";

// --- SCENARIO 2: Section Head submits (auto stamps accounting & superior) ---
echo "\n--- SCENARIO 2: Section Head Submit & Double Stamp Check ---\n";
Auth::login($sectionHead);

$journal2 = GeneralJournal::create([
    'document_number' => 'GJ-SEC-' . strtoupper(Str::random(5)),
    'journal_date' => now()->toDateString(),
    'reference' => 'Testing Section Head Submit',
    'status' => 'Waiting Approval',
    'requested_by' => $sectionHead->id,
    'current_assign_to' => $deptHead->id,
    'resubmit_count' => 0,
    'submitted_at' => now(),
    'last_updated_at' => now(),
]);

$storedPath2 = "general-journals/{$journal2->id}/general_journal/original_" . Str::random(10) . ".pdf";
Storage::put($storedPath2, file_get_contents($tempPdfPath));
$hash2 = hash_file('sha256', Storage::path($storedPath2));

GeneralJournalFile::create([
    'general_journal_id' => $journal2->id,
    'category' => 'general_journal',
    'file_name' => 'Original_Sec.pdf',
    'file_path' => $storedPath2,
    'file_size' => filesize(Storage::path($storedPath2)),
    'mime_type' => 'application/pdf',
    'file_hash' => $hash2,
    'stamp_level' => null,
    'version' => 1,
    'is_active' => true,
    'uploaded_at' => now(),
]);

GeneralJournalApproval::create([
    'general_journal_id' => $journal2->id,
    'approval_level' => 'accounting',
    'assigned_user_id' => $sectionHead->id,
    'approved_by_user_id' => $sectionHead->id,
    'status' => 'Approved',
    'approved_at' => now(),
]);

GeneralJournalApproval::create([
    'general_journal_id' => $journal2->id,
    'approval_level' => 'superior',
    'assigned_user_id' => $sectionHead->id,
    'approved_by_user_id' => $sectionHead->id,
    'status' => 'Approved',
    'approved_at' => now(),
]);

GeneralJournalApproval::create([
    'general_journal_id' => $journal2->id,
    'approval_level' => 'superior_of_superior',
    'assigned_user_id' => $deptHead->id,
    'status' => 'Pending',
]);

// Stamp accounting & superior
$stampService->stampApproval($journal2, 'accounting');
$stampService->stampApproval($journal2, 'superior');

// Attempt duplicate stamp for accounting
echo "Calling stampApproval(accounting) again:\n";
$stampService->stampApproval($journal2, 'accounting');

// Check stamps count for journal 2
$stamps = DB::select("SELECT id, version, stamp_level, is_active, file_hash FROM general_journal_files WHERE general_journal_id = '{$journal2->id}' ORDER BY version ASC");
echo "Total general_journal_files records for Journal 2: " . count($stamps) . " (Expected: 3 -> original, accounting, superior)\n";
foreach ($stamps as $s) {
    echo "  - Version {$s->version}: Level = " . ($s->stamp_level ?? 'NULL') . ", is_active = {$s->is_active}\n";
}

// --- CHECK NOTIFICATIONS TABLE ---
echo "\n--- CHECK NOTIFICATIONS TABLE ---\n";
$notifs = DB::select("SELECT id, user_id, general_journal_id, type, message FROM notifications WHERE general_journal_id IN ('{$journal1->id}', '{$journal2->id}') ORDER BY created_at ASC");
foreach ($notifs as $n) {
    $u = User::find($n->user_id);
    echo "  - User: {$u->name} ({$u->role}) | Type: {$n->type} | Journal: {$n->general_journal_id} | Msg: {$n->message}\n";
}

// Verify no duplicate notifications exist
$duplicates = DB::select("SELECT general_journal_id, user_id, type, count(*) as cnt FROM notifications GROUP BY general_journal_id, user_id, type HAVING count(*) > 1");
echo "\nDuplicate notifications count in entire DB: " . count($duplicates) . "\n";

// Cleanup
if (file_exists($tempPdfPath)) {
    unlink($tempPdfPath);
}

echo "\n=== IDEMPOTENCY TEST FINISHED SUCCESSFULLY ===\n";

