<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

use App\Models\User;
use App\Models\GeneralJournal;
use App\Models\GeneralJournalFile;
use App\Models\GeneralJournalApproval;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

// 1. Create a dummy journal and file
$budi = User::where('email', 'budi.santoso@astra-visteon.com')->first();
$ahmad = User::where('email', 'ahmad.hidayat@astra-visteon.com')->first();
$admin = User::where('role', 'Admin')->first();

$journal = GeneralJournal::create([
    'document_number' => 'TEST-001',
    'journal_date' => now(),
    'reference' => 'Test',
    'status' => 'Approved',
    'requested_by' => $budi->id,
    'current_assign_to' => null,
]);

GeneralJournalApproval::create([
    'general_journal_id' => $journal->id,
    'approval_level' => 'section_head',
    'assigned_user_id' => $ahmad->id,
    'approved_by_user_id' => $ahmad->id,
    'status' => 'Approved'
]);

$file = GeneralJournalFile::create([
    'general_journal_id' => $journal->id,
    'category' => 'general_journal',
    'file_name' => 'test.pdf',
    'file_path' => 'dummy/test.pdf',
    'file_size' => 100,
    'mime_type' => 'application/pdf',
    'uploaded_at' => now(),
]);

echo "Created File ID: {$file->id}\n";

// Function to test access
function testAccess($kernel, $user, $fileId, $roleName) {
    Auth::login($user);
    $response = $kernel->handle(
        Request::create("/files/{$fileId}/download", 'GET')
    );
    echo "{$roleName} ({$user->name}) Access Status: " . $response->getStatusCode() . "\n";
}

testAccess($kernel, $budi, $file->id, 'Requester');
testAccess($kernel, $ahmad, $file->id, 'Approver');
testAccess($kernel, $admin, $file->id, 'Other User (Admin)');

// Clean up
$file->delete();
GeneralJournalApproval::where('general_journal_id', $journal->id)->delete();
$journal->delete();
