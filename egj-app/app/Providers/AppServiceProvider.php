<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Brute-force protection: 5 login attempts per minute per NPK + IP
        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)
                ->by(strtolower(trim((string) $request->input('npk'))) . '|' . $request->ip())
                ->response(function () {
                    return back()->withErrors([
                        'npk' => 'Too many login attempts. Please try again in a minute.',
                    ])->onlyInput('npk');
                });
        });

        // Notification polling: setiap tab buka JAGO memanggil /notifications/unread-count tiap 30 detik.
        // 60 panggilan per menit per user cukup untuk 2 tab + buka dropdown beberapa kali.
        RateLimiter::for('notifications', fn (Request $request) =>
            Limit::perMinute(60)->by((string) ($request->user()?->id ?: $request->ip()))
        );

        // PDF stamping ulang 100-500ms per request. Batasi preview/download file supaya tidak
        // bisa dijadikan amplifier CPU (buka 100 tab preview sekaligus).
        RateLimiter::for('files', fn (Request $request) =>
            Limit::perMinute(60)->by((string) ($request->user()?->id ?: $request->ip()))
        );

        // Excel export men-scan seluruh tabel. Batasi 10 export/menit per user.
        RateLimiter::for('exports', fn (Request $request) =>
            Limit::perMinute(10)->by((string) ($request->user()?->id ?: $request->ip()))
        );

        // Semua endpoint lain pakai throttle generic 120 req/menit per user — bantal pengaman
        // untuk mencegah satu client menggedor server.
        RateLimiter::for('global', fn (Request $request) =>
            Limit::perMinute(120)->by((string) ($request->user()?->id ?: $request->ip()))
        );
    }
}
