<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\GeneralJournal;
use Illuminate\Support\Facades\Storage;

// Find journal with an original (un-stamped) PDF — use the oldest file version
$journal = GeneralJournal::latest()->first();
if (!$journal) { echo "No journal.\n"; exit; }

// Get ALL GJ files (including inactive old versions) to find the original upload
$allFiles = $journal->files()
    ->where('category', 'general_journal')
    ->orderBy('version', 'asc')
    ->get();

echo "Journal ID: {$journal->id}\n";
echo "Total GJ file versions: " . $allFiles->count() . "\n";

// Use version 1 (original upload) if available, otherwise active
$originalFile = $allFiles->first();
$filePath = Storage::path($originalFile->file_path);
echo "Using file: v{$originalFile->version}, path: {$originalFile->file_path}\n";
echo "Exists: " . (file_exists($filePath) ? 'YES' : 'NO') . "\n";

if (!file_exists($filePath)) {
    echo "FATAL: File not found.\n";
    exit;
}

// Stamp all 3 levels onto a fresh copy using absolute mm coordinates
$stampCoords = [
    'accounting'           => ['x' => 10.62, 'topY' => 168.56, 'w' => 25.82, 'topH' => 10, 'nameY' => 185.27, 'nameH' => 6],
    'superior'             => ['x' => 36.44, 'topY' => 168.56, 'w' => 25.86, 'topH' => 10, 'nameY' => 185.27, 'nameH' => 6],
    'superior_of_superior' => ['x' => 62.30, 'topY' => 168.56, 'w' => 28.29, 'topH' => 10, 'nameY' => 185.27, 'nameH' => 6],
];

$users = [
    'accounting'           => 'Budi Santoso',
    'superior'             => 'Siti Rahayu',
    'superior_of_superior' => 'Ahmad Wijaya',
];

$date = '2026-08-21';

$mpdf = new \Mpdf\Mpdf(['unit' => 'mm', 'format' => [297, 210]]);
$pageCount = $mpdf->SetSourceFile($filePath);

for ($i = 1; $i <= $pageCount; $i++) {
    $tplId = $mpdf->ImportPage($i);
    $mpdf->UseTemplate($tplId);

    foreach ($stampCoords as $level => $sc) {
        $userName = $users[$level];

        // Top block: Approved + date
        $htmlTop = '<div style="font-size:8pt; font-family:Arial, sans-serif; text-align:center; padding:3px;">'
            . '<b>Approved</b><br>' . $date
            . '</div>';
        $mpdf->WriteFixedPosHTML($htmlTop, $sc['x'], $sc['topY'], $sc['w'], $sc['topH'], 'auto');

        // Bottom block: user name
        $htmlBottom = '<div style="font-size:8pt; font-family:Arial, sans-serif; text-align:center; padding:3px;">'
            . htmlspecialchars($userName)
            . '</div>';
        $mpdf->WriteFixedPosHTML($htmlBottom, $sc['x'], $sc['nameY'], $sc['w'], $sc['nameH'], 'auto');
    }

    if ($i < $pageCount) {
        $mpdf->AddPage();
    }
}

$diagPath = Storage::path('diagnostic_absolute_v4.pdf');
$mpdf->Output($diagPath, \Mpdf\Output\Destination::FILE);

clearstatcache();
echo "\nSaved: {$diagPath}\n";
echo "Size: " . filesize($diagPath) . " bytes\n";
echo "Done.\n";
