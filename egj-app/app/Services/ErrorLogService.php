<?php

namespace App\Services;

use App\Models\ErrorLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class ErrorLogService
{
    /** Batas ukuran agar tabel tidak membengkak. */
    private const MAX_MESSAGE = 300;
    private const MAX_TRACE_FRAMES = 5;
    private const DEDUP_HOURS = 24;

    /**
     * Simpan exception ke database.
     * - Abaikan error sisi user (validasi, auth, HTTP 4xx).
     * - Error yang sama (class + file + line) berstatus New dalam 24 jam
     *   tidak dibuat row baru, hanya updated_at yang diperbarui.
     */
    public static function log(Throwable $e): void
    {
        try {
            if ($e instanceof \Illuminate\Validation\ValidationException ||
                $e instanceof \Illuminate\Auth\AuthenticationException ||
                ($e instanceof HttpExceptionInterface && $e->getStatusCode() < 500)) {
                return;
            }

            $file = self::relativePath($e->getFile());

            $existing = ErrorLog::query()
                ->where('status', 'New')
                ->where('exception_class', get_class($e))
                ->where('file', $file)
                ->where('line', $e->getLine())
                ->where('created_at', '>=', now()->subHours(self::DEDUP_HOURS))
                ->first();

            if ($existing) {
                $existing->touch();
                return;
            }

            $req = app()->runningInConsole() ? null : request();

            ErrorLog::create([
                'message' => self::shortMessage($e),
                'exception_class' => get_class($e),
                'file' => $file,
                'line' => $e->getLine(),
                'stack_trace' => self::shortTrace($e),
                'url' => $req ? Str::limit($req->fullUrl(), 500) : null,
                'method' => $req ? $req->method() : 'CLI',
                'user_id' => Auth::id() ?: null,
                'ip_address' => $req?->ip(),
                'user_agent' => $req ? Str::limit((string) $req->userAgent(), 255) : null,
                'status' => 'New',
            ]);
        } catch (\Throwable) {
            // Silently fail if DB is unavailable or logging itself throws
        }
    }

    /**
     * Pesan error ringkas: buang prefix driver ODBC & bagian "(Connection: ..., SQL: ...)".
     */
    public static function shortMessage(Throwable $e): string
    {
        $msg = $e->getMessage() ?: (class_basename($e) . ' occurred');
        $msg = preg_replace('/(\[Microsoft\]|\[ODBC Driver [^\]]*\]|\[SQL Server\])/', '', $msg);
        $msg = preg_replace('/\s*\(Connection: .*$/s', '', $msg);
        $msg = preg_split('/\R/', trim($msg))[0];

        return Str::limit(trim(preg_replace('/\s+/', ' ', $msg)), self::MAX_MESSAGE);
    }

    /**
     * Stack trace ringkas: hanya beberapa frame teratas, path relatif.
     */
    public static function shortTrace(Throwable $e): string
    {
        $lines = [];
        foreach (array_slice($e->getTrace(), 0, self::MAX_TRACE_FRAMES) as $i => $f) {
            $lines[] = sprintf(
                '#%d %s(%s): %s%s%s()',
                $i,
                self::relativePath($f['file'] ?? '?'),
                $f['line'] ?? '?',
                $f['class'] ?? '',
                $f['type'] ?? '',
                $f['function'] ?? ''
            );
        }

        return implode("\n", $lines);
    }

    public static function relativePath(string $path): string
    {
        return ltrim(str_replace([base_path(), '\\'], ['', '/'], $path), '/');
    }
}
