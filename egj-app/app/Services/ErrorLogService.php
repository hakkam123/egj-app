<?php

namespace App\Services;

use App\Models\ErrorLog;
use Illuminate\Support\Facades\Auth;
use Throwable;

class ErrorLogService
{
    /**
     * Log an exception to the database.
     */
    public static function log(Throwable $e): void
    {
        try {
            // Ignore validation and authentication exceptions to avoid noise
            if ($e instanceof \Illuminate\Validation\ValidationException ||
                $e instanceof \Illuminate\Auth\AuthenticationException) {
                return;
            }

            $req = request();

            ErrorLog::create([
                'message' => substr($e->getMessage() ?: get_class($e), 0, 5000),
                'exception_class' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'stack_trace' => substr($e->getTraceAsString(), 0, 10000),
                'url' => $req ? substr($req->fullUrl(), 0, 1000) : null,
                'method' => $req ? substr($req->method(), 0, 10) : null,
                'user_id' => Auth::id() ?: null,
                'ip_address' => $req ? $req->ip() : null,
                'user_agent' => $req ? substr($req->userAgent(), 0, 1000) : null,
                'status' => 'New',
            ]);
        } catch (\Throwable $loggingException) {
            // Silently fail if DB is unavailable or logging itself throws
        }
    }
}

