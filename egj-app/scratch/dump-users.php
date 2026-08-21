<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

$user = User::where('email', 'budi.santoso@astra-visteon.com')->first();
var_dump("Budi ID:", $user->id);

$sectionHead = User::where('role', 'Section Head')->where('is_active', true)->first();
var_dump("Section Head ID:", $sectionHead->id);

$deptHead = User::where('role', 'Dept/Div Head')->where('is_active', true)->first();
var_dump("Dept Head ID:", $deptHead->id);

var_dump("Key Type:", $user->getKeyType());
var_dump("Incrementing:", $user->getIncrementing());
