<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\DispatchApprovalReminders;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Reminder email approval Dept Head
Schedule::command('jago:dispatch-reminders')->dailyAt('08:00');

// Prune model yang punya trait Prunable (EmailToken, ErrorLog, Notification)
Schedule::command('model:prune')->dailyAt('02:00');


// Hapus file log lama berformat per-hari (sebelum rotasi bulanan)
Schedule::call(function () {
    foreach (glob(storage_path('logs/laravel-[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].log')) ?: [] as $file) {
        @unlink($file);
    }
})->name('cleanup-legacy-daily-logs')->dailyAt('02:30');
