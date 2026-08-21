<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\GeneralJournal;
use App\Models\GeneralJournalFile;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

// Find the latest journal
$journal = GeneralJournal::latest()->first();
if (!$journal) { echo "No journal found.\n"; exit; }

$file = $journal->files()->where('category', 'general_journal')->where('is_active', true)->first();
if (!$file) { echo "No active GJ file.\n"; exit; }

echo "Journal ID: {$journal->id}\n";
echo "File path: {$file->file_path}\n";

// Clear any previous test logs
$logFile = storage_path('logs/laravel.log');
$logSizeBefore = filesize($logFile);

// Run stamp
$stampService = app(App\Services\PdfApprovalStampService::class);
$stampService->stampApproval($journal, 'accounting');

// Check how many times it was called by reading new log entries
clearstatcache();
$logSizeAfter = filesize($logFile);

if ($logSizeAfter > $logSizeBefore) {
    $fh = fopen($logFile, 'r');
    fseek($fh, $logSizeBefore);
    $newLogs = fread($fh, $logSizeAfter - $logSizeBefore);
    fclose($fh);

    // Count occurrences of stampApproval() called
    $callCount = substr_count($newLogs, 'stampApproval() called');
    $successCount = substr_count($newLogs, 'Successfully stamped');
    echo "\nLog analysis:\n";
    echo "  stampApproval() called entries: {$callCount}\n";
    echo "  Successfully stamped entries: {$successCount}\n";
    echo "\nNew log entries:\n{$newLogs}\n";
}

// Generate diagnostic PDF with all 3 levels stamped on a fresh copy
echo "\n--- Generating diagnostic PDF with all 3 levels ---\n";

// First, find the original un-stamped file. We need to use a fresh upload.
// For testing, let's just stamp the current file with all 3 levels into a separate output.
$filePath = Storage::path($file->file_path);
$ptToMm = function($pt) { return $pt * (25.4 / 72); };

$coords = [
    'accounting'           => ['x' => 30.1,  'y' => 477.8, 'w' => 73.2, 'h' => 53.9],
    'superior'             => ['x' => 103.3, 'y' => 477.8, 'w' => 73.3, 'h' => 53.9],
    'superior_of_superior' => ['x' => 176.6, 'y' => 477.8, 'w' => 80.2, 'h' => 53.9],
];

$mpdf = new \Mpdf\Mpdf(['unit' => 'mm', 'format' => [297, 210]]);
$pageCount = $mpdf->SetSourceFile($filePath);

for ($i = 1; $i <= $pageCount; $i++) {
    $tplId = $mpdf->ImportPage($i);
    $mpdf->UseTemplate($tplId);

    foreach ($coords as $level => $c) {
        $x_mm = $ptToMm($c['x']);
        $y_mm = $ptToMm($c['y']);
        $w_mm = $ptToMm($c['w']);
        $h_mm = $ptToMm($c['h']);

        $date = '2026-08-21';
        $userName = 'Budi Santoso';
        if ($level === 'superior') $userName = 'Siti Rahayu';
        if ($level === 'superior_of_superior') $userName = 'Ahmad Wijaya';

        // Top block: Approved + date
        $topH = $h_mm * 0.55;
        $htmlTop = '<div style="font-size:8pt; font-family:Arial, sans-serif; text-align:center; padding:3px;">'
            . '<b>Approved</b><br>' . $date
            . '</div>';
        $mpdf->WriteFixedPosHTML($htmlTop, $x_mm, $y_mm, $w_mm, $topH, 'auto');

        // Bottom block: user name
        $bottomH = $h_mm * 0.30;
        $bottomY = $y_mm + ($h_mm * 0.62);
        $htmlBottom = '<div style="font-size:8pt; font-family:Arial, sans-serif; text-align:center; padding:3px;">'
            . htmlspecialchars($userName)
            . '</div>';
        $mpdf->WriteFixedPosHTML($htmlBottom, $x_mm, $bottomY, $w_mm, $bottomH, 'auto');
    }

    if ($i < $pageCount) {
        $mpdf->AddPage();
    }
}

$diagPath = Storage::path('diagnostic_layout_v3.pdf');
$mpdf->Output($diagPath, \Mpdf\Output\Destination::FILE);
echo "Saved: {$diagPath}\n";
echo "Done.\n";
