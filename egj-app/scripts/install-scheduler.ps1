# Install Windows Task Scheduler untuk Laravel Scheduler JAGO.
#
# WAJIB di-setup di SETIAP server (termasuk production dengan IIS), karena IIS
# hanya melayani HTTP request — tidak menjalankan tugas background (reminder email,
# prune database). Keduanya harus jalan bersamaan.
#
# Cara pakai (jalankan sebagai Administrator):
#
#   .\install-scheduler.ps1
#   .\install-scheduler.ps1 -PhpPath "C:\PHP\8.4\php.exe"   # kalau PHP tidak di PATH
#
# Untuk uninstall:
#   Unregister-ScheduledTask -TaskName "JAGO Laravel Scheduler" -Confirm:$false

param(
    [string]$PhpPath = ""
)

$ErrorActionPreference = "Stop"

# ---------- 1. Deteksi path proyek dari lokasi script ini ----------
$projectPath = (Resolve-Path "$PSScriptRoot\..").Path
$artisanPath = Join-Path $projectPath "artisan"

if (-not (Test-Path $artisanPath)) {
    Write-Error "File artisan tidak ditemukan di $artisanPath"
    exit 1
}

# ---------- 2. Deteksi php.exe ----------
$phpExe = $null
if ($PhpPath -and (Test-Path $PhpPath)) {
    $phpExe = $PhpPath
}
elseif (Get-Command php -ErrorAction SilentlyContinue) {
    $phpExe = (Get-Command php).Source
}
else {
    # Fallback umum: Laragon (dev) dan beberapa lokasi PHP production
    $fallbacks = @(
        "C:\laragon\bin\php\php-8.4.22\php.exe",
        "C:\PHP\php.exe",
        "C:\Program Files\PHP\v8.4\php.exe",
        "C:\inetpub\php\php.exe"
    )
    foreach ($candidate in $fallbacks) {
        if (Test-Path $candidate) { $phpExe = $candidate; break }
    }
}

if (-not $phpExe) {
    Write-Error "php.exe tidak ditemukan. Pass path manual dengan: .\install-scheduler.ps1 -PhpPath 'C:\path\to\php.exe'"
    exit 1
}

# ---------- 3. Validasi: php artisan harus bisa jalan ----------
Write-Host "Memeriksa apakah artisan bisa dieksekusi..." -ForegroundColor Cyan
try {
    $testOutput = & $phpExe $artisanPath --version 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Exit code: $LASTEXITCODE. Output: $testOutput" }
    Write-Host "  OK: $testOutput" -ForegroundColor Green
} catch {
    Write-Error "Gagal menjalankan 'php artisan --version'. Error: $_"
    exit 1
}

Write-Host "Project path : $projectPath"
Write-Host "PHP binary   : $phpExe"
Write-Host "Artisan      : $artisanPath"
Write-Host ""

# Hapus task lama kalau sudah ada (idempotent install)
$existing = Get-ScheduledTask -TaskName "JAGO Laravel Scheduler" -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Menghapus task lama..."
    Unregister-ScheduledTask -TaskName "JAGO Laravel Scheduler" -Confirm:$false
}

# Buat action: jalankan `php artisan schedule:run` dari direktori proyek
$action = New-ScheduledTaskAction `
    -Execute $phpExe `
    -Argument "artisan schedule:run" `
    -WorkingDirectory $projectPath

# Trigger: tiap menit, selamanya, mulai sekarang
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes 1) `
    -RepetitionDuration (New-TimeSpan -Days 3650)

# Settings: jalan di background, idak muncul window, retry kalau gagal
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# Jalankan sebagai akun SYSTEM supaya tidak butuh user login
$principal = New-ScheduledTaskPrincipal `
    -UserId "SYSTEM" `
    -LogonType ServiceAccount `
    -RunLevel Highest

try {
    Register-ScheduledTask `
        -TaskName "JAGO Laravel Scheduler" `
        -Description "Menjalankan Laravel Scheduler JAGO tiap menit (reminder email, prune database)." `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -ErrorAction Stop | Out-Null
} catch {
    Write-Host ""
    Write-Error "Gagal memasang Task Scheduler. Pastikan Anda membuka PowerShell SEBAGAI ADMINISTRATOR."
    Write-Host "  Detail: $_" -ForegroundColor Yellow
    exit 1
}

Write-Host "Task Scheduler 'JAGO Laravel Scheduler' berhasil dipasang." -ForegroundColor Green
Write-Host ""
Write-Host "Cek status dengan:"
Write-Host "    Get-ScheduledTask -TaskName 'JAGO Laravel Scheduler'"
Write-Host ""
Write-Host "Jalankan manual (tes):"
Write-Host "    Start-ScheduledTask -TaskName 'JAGO Laravel Scheduler'"
Write-Host ""
Write-Host "Lihat kapan terakhir jalan:"
Write-Host "    Get-ScheduledTaskInfo -TaskName 'JAGO Laravel Scheduler'"
