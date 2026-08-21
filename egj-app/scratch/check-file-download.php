<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$user = \App\Models\User::where('email', 'budi.santoso@astra-visteon.com')->first();
Illuminate\Support\Facades\Auth::login($user);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::create(
        '/files/1/download',
        'GET'
    )
);

echo "Status: " . $response->getStatusCode() . "\n";
