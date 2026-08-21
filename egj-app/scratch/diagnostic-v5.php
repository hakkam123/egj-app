<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\GeneralJournal;
use Illuminate\Support\Facades\Storage;

$journal = GeneralJournal::latest()->first();
$file = $journal->files()->where('category', 'general_journal')->orderBy('version', 'asc')->first();
$filePath = Storage::path($file->file_path);

$stampCoords = [
    'accounting'           => ['x' => 10.62, 'topY' => 168.56, 'w' => 25.82, 'topH' => 10, 'nameY' => 183.00, 'nameH' => 6],
    'superior'             => ['x' => 36.44, 'topY' => 168.56, 'w' => 25.86, 'topH' => 10, 'nameY' => 183.00, 'nameH' => 6],
    'superior_of_superior' => ['x' => 62.30, 'topY' => 168.56, 'w' => 28.29, 'topH' => 10, 'nameY' => 183.00, 'nameH' => 6],
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

        $htmlTop = '<div style="font-size:8pt; font-family:Arial, sans-serif; text-align:center; width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center;">'
            . '<b>Approved</b><br>' . $date
            . '</div>';
        $mpdf->WriteFixedPosHTML($htmlTop, $sc['x'], $sc['topY'], $sc['w'], $sc['topH'], 'auto');

        $htmlBottom = '<div style="font-size:7pt; font-family:Arial, sans-serif; text-align:center; width:100%;">'
            . htmlspecialchars($userName)
            . '</div>';
        $mpdf->WriteFixedPosHTML($htmlBottom, $sc['x'], $sc['nameY'], $sc['w'], $sc['nameH'], 'auto');
    }

    if ($i < $pageCount) {
        $mpdf->AddPage();
    }
}

$diagPath = Storage::path('diagnostic_v5.pdf');
$mpdf->Output($diagPath, \Mpdf\Output\Destination::FILE);
echo "Saved: {$diagPath}\n";
echo "Done.\n";
