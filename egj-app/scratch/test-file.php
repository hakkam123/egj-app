<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$f = App\Models\GeneralJournalFile::first();
if ($f) {
    echo "Path: " . $f->file_path . "\n";
    echo "Exists on default: " . (Storage::exists($f->file_path) ? 'Yes' : 'No') . "\n";
    echo "Exists on public: " . (Storage::disk('public')->exists($f->file_path) ? 'Yes' : 'No') . "\n";
} else {
    echo "No files found.\n";
}
