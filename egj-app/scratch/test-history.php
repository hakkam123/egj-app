<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$h = App\Models\ApprovalHistory::with('actor')->first();
var_dump($h ? $h->toArray() : 'null');
