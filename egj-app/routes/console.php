<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Console\Commands\DispatchApprovalReminders;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// PENTING: semua job dijadwalkan di jam yang sama (07:30 WIB) karena Windows
// Task Scheduler "egj-app scheduler" hanya punya 1 trigger Daily 07:30.
// schedule:run hanya menjalankan job yang jatuh tepat di menit trigger, jadi
// kalau jam di sini diubah, trigger di Task Scheduler juga harus diubah.

// Reminder email approval Dept Head
Schedule::command('jago:dispatch-reminders')->timezone('Asia/Jakarta')->dailyAt('07:30');

// Prune model yang punya trait Prunable (EmailToken, ErrorLog, Notification)
Schedule::command('model:prune')->timezone('Asia/Jakarta')->dailyAt('07:30');

// Hapus file log lama berformat per-hari (sebelum rotasi bulanan)
Schedule::call(function () {
    foreach (glob(storage_path('logs/laravel-[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9].log')) ?: [] as $file) {
        @unlink($file);
    }
})->name('cleanup-legacy-daily-logs')->timezone('Asia/Jakarta')->dailyAt('07:30');
