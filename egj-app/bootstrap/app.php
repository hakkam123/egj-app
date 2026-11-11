<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Satu error = 1 baris pendek di log file + 1 row (dedup) di error_logs.
        // ->stop() mematikan logging default Laravel yang menulis full stack trace ke file.
        $exceptions->report(function (\Throwable $e) {
            try {
                \Illuminate\Support\Facades\Log::error(sprintf(
                    '%s: %s @ %s:%d',
                    class_basename($e),
                    \App\Services\ErrorLogService::shortMessage($e),
                    \App\Services\ErrorLogService::relativePath($e->getFile()),
                    $e->getLine()
                ));
            } catch (\Throwable) {
                // jangan ganggu alur error
            }

            \App\Services\ErrorLogService::log($e);
        })->stop();
    })->create();
