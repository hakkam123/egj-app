<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;


Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


Schedule::command('jago:dispatch-reminders')->timezone('Asia/Jakarta')->dailyAt('07:30');

Schedule::command('model:prune')->timezone('Asia/Jakarta')->dailyAt('07:30');

Schedule::call(function () {
    foreach (glob(storage_path('logs/laravel-[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].log')) ?: [] as $file) {
        @unlink($file);
    }
})->name('cleanup-legacy-daily-logs')->timezone('Asia/Jakarta')->dailyAt('07:30');
