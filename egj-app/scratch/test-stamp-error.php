<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$journal = App\Models\GeneralJournal::find(3);
if ($journal) {
    $stampService = app(App\Services\PdfApprovalStampService::class);
    $stampService->stampApproval($journal, 'accounting');
    echo "Stamping 'accounting' completed.\n";
} else {
    echo "Journal 3 not found.\n";
}
