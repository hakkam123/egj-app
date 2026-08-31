<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$files = DB::select("SELECT id, version, is_active, file_hash, file_name FROM general_journal_files ORDER BY uploaded_at ASC");

echo "Total records in general_journal_files: " . count($files) . "\n\n";
echo str_repeat('-', 105) . "\n";
printf("| %-26s | %-7s | %-6s | %-32s | %-20s |\n", 'ID', 'Version', 'Active', 'File Name', 'File Hash (SHA-256)');
echo str_repeat('-', 105) . "\n";

foreach ($files as $f) {
    printf("| %-26s | %-7d | %-6d | %-32s | %-20s |\n", 
        $f->id, 
        $f->version, 
        $f->is_active, 
        substr($f->file_name, 0, 32), 
        substr($f->file_hash, 0, 16) . '...'
    );
}
echo str_repeat('-', 105) . "\n";

