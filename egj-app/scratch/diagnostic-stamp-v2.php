<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\GeneralJournal;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

$journal = GeneralJournal::whereHas('files', function ($q) {
    $q->where('category', 'general_journal')->where('is_active', true);
})->latest()->first();

$file = $journal->files()->where('category', 'general_journal')->where('is_active', true)->first();
$filePath = Storage::path($file->file_path);

$ptToMm = function($pt) { return round($pt * (25.4 / 72), 2); };

$coords = [
    'accounting'           => ['x' => 30.1,  'y' => 477.8, 'w' => 73.2, 'h' => 53.9],
];

$level = 'accounting';
$c = $coords[$level];
$user = User::find($journal->requested_by);
$date = now()->format('Y-m-d');
$userName = $user->name;

$mpdf = new \Mpdf\Mpdf([
    'unit' => 'mm',
    'format' => [297, 210]
]);

$pageCount = $mpdf->SetSourceFile($filePath);

for ($i = 1; $i <= $pageCount; $i++) {
    $tplId = $mpdf->ImportPage($i);
    $mpdf->UseTemplate($tplId);

    $x_mm = $ptToMm($c['x']);
    $y_mm = $ptToMm($c['y']);
    $w_mm = $ptToMm($c['w']);
    $h_mm = $ptToMm($c['h']);

    $html = '
    <div style="width:100%; font-size:8pt; font-family:Arial, sans-serif; text-align:center;">
        <div style="border-bottom:0.5pt solid #000; padding:2px 3px; font-weight:bold;">Approved</div>
        <div style="border-bottom:0.5pt solid #000; padding:2px 3px;">' . $date . '</div>
        <div style="padding:2px 3px;">' . htmlspecialchars($userName) . '</div>
    </div>';

    $mpdf->WriteFixedPosHTML($html, $x_mm, $y_mm, $w_mm, $h_mm, 'auto');

    if ($i < $pageCount) {
        $mpdf->AddPage();
    }
}

$diagPath = Storage::path('diagnostic_stamped_v2.pdf');
$mpdf->Output($diagPath, \Mpdf\Output\Destination::FILE);

clearstatcache();
echo "Saved: {$diagPath}\n";
echo "Size: " . filesize($diagPath) . " bytes\n";
echo "Done.\n";
