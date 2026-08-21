<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

use App\Models\User;
use App\Models\GeneralJournal;
use App\Models\GeneralJournalFile;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;

$results = [];

function runStep($name, $closure) {
    global $results;
    try {
        $closure();
        $results[$name] = "✅ Berhasil";
    } catch (\Illuminate\Validation\ValidationException $e) {
        $results[$name] = "❌ Error Validasi: " . json_encode($e->errors());
    } catch (\Throwable $e) {
        $results[$name] = "❌ Error: " . $e->getMessage() . "\n" . $e->getFile() . ":" . $e->getLine();
    }
}

// Clean state
GeneralJournal::query()->delete();
\App\Models\EmailToken::query()->delete();

// Get users
$staff = User::where('email', 'budi.santoso@astra-visteon.com')->first();
$superior = User::where('email', 'ahmad.hidayat@astra-visteon.com')->first();
$superiorOfSuperior = User::where('email', 'alisa.wijaya@astra-visteon.com')->first();

runStep("Login sebagai Staff, Section Head, dan Superior of Superior", function() use ($staff, $superior, $superiorOfSuperior) {
    if (!$staff || !$superior || !$superiorOfSuperior) throw new Exception("Users not found");
});

$journalId = null;
$pdfPath = __DIR__ . '/valid_dummy.pdf';

runStep("Submit draft General Journal sebagai Staff", function() use ($staff, &$journalId, $pdfPath) {
    Auth::login($staff);
    $file = new UploadedFile($pdfPath, 'dummy.pdf', 'application/pdf', null, true);

    $request = Request::create('/general-journals', 'POST', [
        'document_number' => 'TEST-FLOW-001',
        'journal_date' => now()->format('Y-m-d'),
        'reference' => 'Test',
    ], [], [
        'general_journal_file' => $file
    ]);
    $request->setUserResolver(fn() => $staff);
    $controller = app(\App\Http\Controllers\GeneralJournalController::class);
    $response = $controller->store($request);
    
    // Check if it's a redirect response with errors
    if ($response->getSession() && $response->getSession()->has('errors')) {
        throw new Exception("Validation Error: " . json_encode($response->getSession()->get('errors')->all()));
    }

    $journal = GeneralJournal::first();
    if (!$journal) throw new Exception("Journal not created");
    $journalId = $journal->id;
});

runStep("Cek email notifikasi (ke Superior)", function() use (&$journalId) {
    if (!$journalId) throw new Exception("Skipped due to missing journal ID");
    $journal = GeneralJournal::find($journalId);
    $tokens = $journal->emailTokens()->count();
    if ($tokens == 0) throw new Exception("No email token generated for superior");
});

runStep("Buka halaman Approval sebagai Superior", function() use ($superior, &$journalId) {
    if (!$journalId) throw new Exception("Skipped due to missing journal ID");
    Auth::login($superior);
    $request = Request::create("/approval/{$journalId}", 'GET');
    $request->setUserResolver(fn() => $superior);
    $controller = app(\App\Http\Controllers\ApprovalController::class);
    $response = $controller->show($journalId);
    if (!($response instanceof \Inertia\Response)) throw new Exception("Page did not return Inertia view");
});

runStep("Approve sebagai Superior", function() use ($superior, &$journalId) {
    if (!$journalId) throw new Exception("Skipped due to missing journal ID");
    Auth::login($superior);
    $request = Request::create("/approval/{$journalId}/approve", 'POST', ['notes' => 'OK Superior']);
    $request->setUserResolver(fn() => $superior);
    $request->setLaravelSession(app('session.store'));
    $controller = app(\App\Http\Controllers\ApprovalController::class);
    $response = $controller->approve($request, $journalId);

    if ($response->getSession() && $response->getSession()->has('errors')) {
        throw new Exception("Validation Error: " . json_encode($response->getSession()->get('errors')->all()));
    }

    $journal = GeneralJournal::find($journalId);
    $approval = $journal->approvals()->where('approval_level', 'superior')->first();
    if ($approval->status !== 'Approved') throw new Exception("Status not Approved");
});

runStep("Approve sebagai Superior of Superior", function() use ($superiorOfSuperior, &$journalId) {
    if (!$journalId) throw new Exception("Skipped due to missing journal ID");
    Auth::login($superiorOfSuperior);
    $request = Request::create("/approval/{$journalId}/approve", 'POST', ['notes' => 'OK Boss']);
    $request->setUserResolver(fn() => $superiorOfSuperior);
    $request->setLaravelSession(app('session.store'));
    $controller = app(\App\Http\Controllers\ApprovalController::class);
    $controller->approve($request, $journalId);

    $journal = GeneralJournal::find($journalId);
    if ($journal->status !== 'Approved') throw new Exception("Status not Approved: " . $journal->status);
});

runStep("Cek file PDF sebagai requester setelah fully approved", function() use ($staff, &$journalId) {
    if (!$journalId) throw new Exception("Skipped due to missing journal ID");
    Auth::login($staff);
    $journal = GeneralJournal::find($journalId);
    $file = $journal->activeFiles()->where('category', 'general_journal')->first();
    if (!$file) throw new Exception("File missing");
    if (!\Illuminate\Support\Facades\Storage::exists($file->file_path)) throw new Exception("Physical file missing");
});

$rejectJournalId = null;
runStep("Test Reject - reject di tahap superior", function() use ($staff, $superior, &$rejectJournalId, $pdfPath) {
    Auth::login($staff);
    $file = new UploadedFile($pdfPath, 'dummy.pdf', 'application/pdf', null, true);
    $request = Request::create('/general-journals', 'POST', [
        'document_number' => 'TEST-REJ-002',
        'journal_date' => now()->format('Y-m-d'),
    ], [], ['general_journal_file' => $file]);
    $request->setUserResolver(fn() => $staff);
    $request->setLaravelSession(app('session.store'));
    $controller = app(\App\Http\Controllers\GeneralJournalController::class);
    $controller->store($request);
    
    $journal = GeneralJournal::where('document_number', 'TEST-REJ-002')->first();
    $rejectJournalId = $journal->id;

    Auth::login($superior);
    $reqReject = Request::create("/approval/{$rejectJournalId}/reject", 'POST', ['notes' => 'Salah ini bro']);
    $reqReject->setUserResolver(fn() => $superior);
    $reqReject->setLaravelSession(app('session.store'));
    $controllerApproval = app(\App\Http\Controllers\ApprovalController::class);
    $controllerApproval->reject($reqReject, $rejectJournalId);

    $journal->refresh();
    if ($journal->status !== 'Rejected') throw new Exception("Not Rejected");
});

runStep("Resubmit setelah rejected", function() use ($staff, &$rejectJournalId, $pdfPath) {
    if (!$rejectJournalId) throw new Exception("Skipped due to missing reject ID");
    Auth::login($staff);
    $file = new UploadedFile($pdfPath, 'dummy.pdf', 'application/pdf', null, true);
    
    $request = Request::create("/general-journals/{$rejectJournalId}/resubmit", 'POST', [
        'general_journal_file' => $file
    ], [], ['general_journal_file' => $file]);
    $request->setUserResolver(fn() => $staff);
    $request->setLaravelSession(app('session.store'));
    
    $controller = app(\App\Http\Controllers\GeneralJournalController::class);
    $response = $controller->resubmit($request, $rejectJournalId);

    if ($response->getSession() && $response->getSession()->has('errors')) {
        throw new Exception("Validation Error: " . json_encode($response->getSession()->get('errors')->all()));
    }

    $journal = GeneralJournal::find($rejectJournalId);
    if ($journal->status !== 'Waiting Approval') throw new Exception("Status not Waiting Approval: " . $journal->status);
    if ($journal->resubmit_count !== 1) throw new Exception("Resubmit count not updated, it is " . $journal->resubmit_count);
});

runStep("Monitoring General Journal", function() use ($staff) {
    Auth::login($staff);
    $request = Request::create("/monitoring", 'GET');
    $request->setUserResolver(fn() => $staff);
    $controller = app(\App\Http\Controllers\MonitoringController::class);
    $response = $controller->index($request);
    if (!($response instanceof \Inertia\Response)) throw new Exception("Did not return Inertia response");
});

echo "\n--- HASIL PENGUJIAN ---\n";
foreach ($results as $name => $status) {
    echo "{$name}\n{$status}\n\n";
}
