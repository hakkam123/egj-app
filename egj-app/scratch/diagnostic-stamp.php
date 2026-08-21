<?php
/**
 * Diagnostic script v2: uses only mPDF (no standalone FPDI)
 */
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\GeneralJournal;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

// ---- Pick the latest journal with an active GJ file ----
$journal = GeneralJournal::whereHas('files', function ($q) {
    $q->where('category', 'general_journal')->where('is_active', true);
})->latest()->first();

if (!$journal) {
    echo "No journal with active GJ file found.\n";
    exit;
}

$file = $journal->files()
    ->where('category', 'general_journal')
    ->where('is_active', true)
    ->first();

$filePath = Storage::path($file->file_path);

echo "=== DIAGNOSTIC REPORT ===\n\n";
echo "Journal ID : {$journal->id}\n";
echo "Doc Number : {$journal->document_number}\n";
echo "DB file_path : {$file->file_path}\n";
echo "Resolved path: {$filePath}\n";
echo "File exists  : " . (file_exists($filePath) ? 'YES' : 'NO') . "\n";

if (!file_exists($filePath)) {
    echo "\nFATAL: File does not exist on disk. Aborting.\n";
    exit;
}

clearstatcache();
$oldSize = filesize($filePath);
echo "File size (before stamp): {$oldSize} bytes\n\n";

// ---- Coordinates being used ----
echo "--- 1. COORDINATES (as defined in code) ---\n";
$coords = [
    'accounting'           => ['x' => 30.1,  'y' => 477.8, 'w' => 73.2, 'h' => 53.9],
    'superior'             => ['x' => 103.3, 'y' => 477.8, 'w' => 73.3, 'h' => 53.9],
    'superior_of_superior' => ['x' => 176.6, 'y' => 477.8, 'w' => 80.2, 'h' => 53.9],
];

$ptToMm = function($pt) { return round($pt * (25.4 / 72), 2); };

foreach ($coords as $level => $c) {
    $x_mm = $ptToMm($c['x']);
    $y_mm = $ptToMm($c['y']);
    $w_mm = $ptToMm($c['w']);
    $h_mm = $ptToMm($c['h']);
    echo "  [{$level}]\n";
    echo "    Original (pt) : x={$c['x']}, y={$c['y']}, w={$c['w']}, h={$c['h']}\n";
    echo "    Converted (mm): x={$x_mm}, y={$y_mm}, w={$w_mm}, h={$h_mm}\n";
    echo "    Bottom edge y+h (mm): " . round($y_mm + $h_mm, 2) . "\n";
}

echo "\n--- A4 LANDSCAPE REFERENCE ---\n";
echo "  A4 Landscape (mm): 297 x 210\n";
echo "  A4 Landscape (pt): 842 x 595\n";
$yMm = $ptToMm(477.8);
$hMm = $ptToMm(53.9);
echo "  Stamp Y (mm) = {$yMm}\n";
echo "  Page height (mm) = 210\n";
if ($yMm > 210) {
    echo "  *** PROBLEM: Y={$yMm}mm EXCEEDS page height 210mm! Stamp is OFF-PAGE! ***\n";
} else {
    echo "  Y is within page bounds.\n";
}

// ---- Now run stamp using mPDF and inspect page sizes ----
echo "\n--- 2. PAGE INFO & STAMPING (accounting level) ---\n";

$level = 'accounting';
$c = $coords[$level];
$user = User::find($journal->requested_by);
$date = now()->format('Y-m-d');
$userName = $user ? $user->name : 'Unknown';

echo "  Stamp user: {$userName}\n";
echo "  Stamp date: {$date}\n\n";

try {
    $mpdf = new \Mpdf\Mpdf([
        'unit' => 'mm',
        'format' => [297, 210]
    ]);

    $pageCount = $mpdf->SetSourceFile($filePath);
    echo "  Source page count: {$pageCount}\n";

    for ($i = 1; $i <= $pageCount; $i++) {
        $tplId = $mpdf->ImportPage($i);
        // getTemplateSize returns dimensions of the imported page
        $tplSize = $mpdf->getTemplateSize($tplId);
        echo "  Page {$i} template size: width={$tplSize['width']}mm, height={$tplSize['height']}mm";
        echo " (" . ($tplSize['width'] > $tplSize['height'] ? 'LANDSCAPE' : 'PORTRAIT') . ")\n";

        $mpdf->UseTemplate($tplId);

        $x_mm = $ptToMm($c['x']);
        $y_mm = $ptToMm($c['y']);
        $w_mm = $ptToMm($c['w']);
        $h_mm = $ptToMm($c['h']);

        echo "    -> Writing stamp at: x={$x_mm}mm, y={$y_mm}mm, w={$w_mm}mm, h={$h_mm}mm\n";

        $html = '<div style="text-align:center; font-size:8pt; font-family: Arial, sans-serif;">
            <b>Approved</b><br>
            ' . $date . '<br>
            ' . htmlspecialchars($userName) . '
        </div>';

        $mpdf->WriteFixedPosHTML($html, $x_mm, $y_mm, $w_mm, $h_mm, 'auto');

        if ($i < $pageCount) {
            $mpdf->AddPage();
        }
    }

    // Save to diagnostic copy
    $diagPath = Storage::path('diagnostic_stamped.pdf');
    $mpdf->Output($diagPath, \Mpdf\Output\Destination::FILE);

    clearstatcache();
    $newSize = filesize($diagPath);
    echo "\n--- 3. FILE SIZE COMPARISON ---\n";
    echo "  Original file size : {$oldSize} bytes\n";
    echo "  Stamped file size  : {$newSize} bytes\n";
    echo "  Size changed       : " . ($newSize != $oldSize ? "YES (delta=" . ($newSize - $oldSize) . " bytes)" : "NO") . "\n";
    echo "  Diagnostic PDF at  : {$diagPath}\n";

} catch (\Exception $e) {
    echo "\n  ERROR: " . $e->getMessage() . "\n";
    echo "  File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}

echo "\n=== END DIAGNOSTIC ===\n";
