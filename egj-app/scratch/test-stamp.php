<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// We will stamp Journal ID 2 (Assuming it exists and has an active file)
$journal = App\Models\GeneralJournal::find(2);
if ($journal) {
    $service = app(App\Services\PdfApprovalStampService::class);
    $service->stampApproval($journal, 'accounting');
    echo "Stamping 'accounting' completed.\n";
    $service->stampApproval($journal, 'superior');
    echo "Stamping 'superior' completed.\n";
} else {
    echo "Journal 2 not found.\n";
}
