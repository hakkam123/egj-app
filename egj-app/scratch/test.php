<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$journal = App\Models\GeneralJournal::with(['histories.actor'])->find(2);
echo json_encode($journal->histories, JSON_PRETTY_PRINT);
