<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\GeneralJournalFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

echo "=== CLEANING UP STAMPED FILES ===\n\n";

$stampedFiles = GeneralJournalFile::whereNotNull('stamp_level')->get();
echo "Found " . $stampedFiles->count() . " stamped files to remove.\n";

foreach ($stampedFiles as $file) {
    if (Storage::exists($file->file_path)) {
        Storage::delete($file->file_path);
        echo "Deleted physical file: {$file->file_path}\n";
    }
    $file->delete();
    echo "Deleted DB record: {$file->id} (stamp_level: {$file->stamp_level})\n";
}

// Reset remaining original files to is_active = true, version = 1
$originalFiles = GeneralJournalFile::whereNull('stamp_level')->get();
foreach ($originalFiles as $file) {
    $file->update([
        'is_active' => true,
        'version' => 1,
    ]);
    echo "Reset original file {$file->id} ({$file->file_name}) to active=true, version=1\n";
}

echo "\nRemaining files count: " . GeneralJournalFile::count() . "\n";
echo "=== CLEANUP COMPLETED ===\n";

