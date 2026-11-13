<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\PhpExecutableFinder;

/**
 * Starts a short-lived background queue worker after a web request has queued a job.
 *
 * Emails are queued so submit/approve returns immediately, but the server must not run a
 * permanent worker or a schedule:run every minute. So the worker is started only when there
 * is something to send, and it exits by itself once the queue is empty.
 */
class QueueKicker
{
    private static bool $scheduled = false;

    /**
     * Ask for a worker once this request finishes (called for every queued job; spawns once).
     */
    public static function kickAfterResponse(): void
    {
        if (self::$scheduled || ! self::enabled()) {
            return;
        }

        self::$scheduled = true;
        app()->terminating(fn () => self::spawn());
    }

    private static function enabled(): bool
    {
        // CLI already has its own worker (queue:work / the 07:30 schedule); tests must not spawn
        return config('queue.default') !== 'sync'
            && ! app()->runningInConsole()
            && ! app()->runningUnitTests();
    }

    private static function spawn(): void
    {
        try {
            $php = config('queue.php_binary') ?: (new PhpExecutableFinder())->find(false) ?: 'php';
            $artisan = base_path('artisan');
            $args = 'queue:work --stop-when-empty --tries=3 --max-time=300';

            if (PHP_OS_FAMILY === 'Windows') {
                // start /B detaches the worker so the web request is not held open
                pclose(popen('start "" /B "' . $php . '" "' . $artisan . '" ' . $args . ' > NUL 2>&1', 'r'));
            } else {
                exec(escapeshellarg($php) . ' ' . escapeshellarg($artisan) . ' ' . $args . ' > /dev/null 2>&1 &');
            }
        } catch (\Throwable $e) {
            // Jobs stay in the jobs table and are drained by the 07:30 schedule
            Log::warning('QueueKicker: could not start queue worker: ' . $e->getMessage());
        }
    }
}
