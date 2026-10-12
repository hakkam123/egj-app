@echo off
REM ============================================================================
REM Test apakah konfigurasi SMTP di .env sudah benar.
REM Script ini mengirim 1 email tes ke alamat yang Anda masukkan.
REM
REM Cara pakai: double-click file ini, lalu masukkan email tujuan saat diminta.
REM ============================================================================

cd /d "%~dp0.."

echo.
echo === JAGO SMTP Test ===
echo.
set /p RECIPIENT="Masukkan email tujuan tes: "

if "%RECIPIENT%"=="" (
    echo ERROR: Email tujuan tidak boleh kosong.
    pause
    exit /b 1
)

echo.
echo Mengirim email tes ke %RECIPIENT% ...
echo.

php artisan tinker --execute="try { Mail::raw('Ini email tes dari JAGO. Kalau Anda terima ini berarti SMTP sudah benar.', fn($m) => $m->to('%RECIPIENT%')->subject('[JAGO] SMTP Test ' . now()->format('Y-m-d H:i:s'))); echo 'SUKSES: email terkirim. Cek inbox %RECIPIENT% (dan folder spam).' . PHP_EOL; } catch (\Throwable $e) { echo 'GAGAL: ' . $e->getMessage() . PHP_EOL; echo 'Cek config MAIL_* di .env, terutama MAIL_SCHEME dan MAIL_PASSWORD.' . PHP_EOL; }"

echo.
pause
