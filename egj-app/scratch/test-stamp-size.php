<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$journal = App\Models\GeneralJournal::find(3);
if ($journal) {
    $file = $journal->files()->where('category', 'general_journal')->where('is_active', true)->first();
    $oldSize = $file->file_size;
    echo "Old size: " . $oldSize . "\n";
    
    $stampService = app(App\Services\PdfApprovalStampService::class);
    $stampService->stampApproval($journal, 'accounting');
    
    $file->refresh();
    $newSize = $file->file_size;
    echo "New size: " . $newSize . "\n";
    
    if ($oldSize != $newSize) {
        echo "Stamping SUCCESSFUL (size changed).\n";
    } else {
        echo "Stamping FAILED (size did not change).\n";
    }
} else {
    echo "Journal 3 not found.\n";
}
