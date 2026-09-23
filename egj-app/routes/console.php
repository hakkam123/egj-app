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

