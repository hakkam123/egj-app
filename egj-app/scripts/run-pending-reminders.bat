@echo off
REM ============================================================================
REM Jalankan reminder dept head yang tertunda SEKARANG, tanpa menunggu scheduler.
REM
REM Gunakan ini kalau:
REM   - Server baru menyala setelah mati beberapa hari
REM   - Mau mengetes apakah ada dokumen yang butuh reminder
REM   - Scheduler Windows Task belum ter-setup
REM
REM Perintah ini aman dijalankan berkali-kali (tidak akan kirim reminder dobel
REM di hari yang sama, karena dispatcher mengecek tabel notifications dulu).
REM ============================================================================

cd /d "%~dp0.."
php artisan jago:dispatch-reminders
echo.
echo Selesai. Tekan tombol apa saja untuk tutup.
pause > nul
