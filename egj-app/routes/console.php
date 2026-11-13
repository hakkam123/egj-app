<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;


Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


Schedule::command('jago:dispatch-reminders')->timezone('Asia/Jakarta')->dailyAt('07:30');

// Emails are queued (QUEUE_CONNECTION=database). Web requests start a short-lived worker on
// demand (App\Support\QueueKicker); this daily run sends the reminder jobs dispatched above
// and anything left over (e.g. a retry that failed). Must stay AFTER dispatch-reminders.
Schedule::command('queue:work --stop-when-empty --tries=3 --max-time=600')
    ->timezone('Asia/Jakarta')->dailyAt('07:30');

Schedule::command('model:prune')->timezone('Asia/Jakarta')->dailyAt('07:30');

Schedule::call(function () {
    foreach (glob(storage_path('logs/laravel-[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].log')) ?: [] as $file) {
        @unlink($file);
    }
})->name('cleanup-legacy-daily-logs')->timezone('Asia/Jakarta')->dailyAt('07:30');
