<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Notification;
use App\Models\User;
use App\Models\GeneralJournal;
use Illuminate\Support\Facades\Auth;

echo "=== TEST MARK NOTIF READ BY JOURNAL ===\n\n";

$sectionHead = User::where('email', 'ahmad.hidayat@astra-visteon.com')->first();
Auth::login($sectionHead);

$journal = GeneralJournal::first();

// Create unread notification for sectionHead on this journal
$notif = Notification::create([
    'user_id' => $sectionHead->id,
    'general_journal_id' => $journal->id,
    'type' => 'approval_request',
    'message' => 'Testing auto read',
    'is_read' => false,
    'created_at' => now(),
]);

echo "Created test unread notification: ID {$notif->id}, is_read = " . ($notif->is_read ? 'true' : 'false') . "\n";

// Call markReadByJournal
$controller = app(\App\Http\Controllers\NotificationController::class);
$response = $controller->markReadByJournal($journal->id);
echo "markReadByJournal response: " . json_encode($response->getData()) . "\n";

$notifFresh = $notif->fresh();
echo "After call, is_read = " . ($notifFresh->is_read ? 'true' : 'false') . "\n";

echo "\n=== TEST COMPLETED ===\n";

