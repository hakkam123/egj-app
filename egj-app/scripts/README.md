# Scripts

Script operasional untuk JAGO di server Windows (IIS + SQL Server).

---

## 📋 Yang Harus Jalan di Server Production

Setelah deploy, pastikan **5 komponen** berikut aktif:

| # | Komponen | Dipakai Untuk | Cara Cek |
|---|---|---|---|
| 1 | **IIS Site** → point ke `egj-app/public/` | Melayani request HTTP user | `Get-IISSite` |
| 2 | **URL Rewrite + PHP Handler** | SPA routing + eksekusi PHP | IIS Manager → Handler Mappings |
| 3 | **SQL Server** service | Database | `Get-Service MSSQL*` |
| 4 | **SMTP mail config** di `.env` | Kirim email approval + reminder | `php artisan tinker` → `Mail::raw('test', fn($m) => $m->to('you@x.com')->subject('t'))` |
| 5 | **Windows Task Scheduler** → `php artisan schedule:run` tiap menit | **Reminder email + prune database** | `Get-ScheduledTask -TaskName "JAGO Laravel Scheduler"` |

> **PENTING:** Komponen #5 **sering terlupa** karena IIS sudah jalan. Tapi IIS **tidak** menjalankan task background. Tanpa Task Scheduler, reminder email tidak akan pernah terkirim.

---

## 🛠️ File di Folder Ini

### `install-scheduler.ps1`

Pasang Windows Task Scheduler supaya Laravel Scheduler (reminder, prune) jalan otomatis tiap menit.

**Kapan dijalankan:** sekali saat deploy ke server baru. Idempotent — aman kalau diulang.

**Cara pakai:**

```powershell
# Buka PowerShell SEBAGAI ADMINISTRATOR

cd "C:\path\to\jago\egj-app\scripts"
.\install-scheduler.ps1

# Kalau PHP tidak di PATH:
.\install-scheduler.ps1 -PhpPath "C:\PHP\8.4\php.exe"
```

**Verifikasi:**

```powershell
# Task terdaftar?
Get-ScheduledTask -TaskName "JAGO Laravel Scheduler"

# Terakhir jalan kapan?
Get-ScheduledTaskInfo -TaskName "JAGO Laravel Scheduler"

# Jalankan sekarang untuk tes (bukan nunggu jam 08:00):
Start-ScheduledTask -TaskName "JAGO Laravel Scheduler"
```

**Uninstall:**

```powershell
Unregister-ScheduledTask -TaskName "JAGO Laravel Scheduler" -Confirm:$false
```

---

### `test-smtp.bat`

Tes apakah konfigurasi SMTP di `.env` sudah benar — kirim 1 email tes ke alamat yang Anda pilih.

**Kapan dipakai:**
- Setelah set up `.env` baru di server production — **selalu** tes dulu sebelum sistem dipakai user
- Setelah ganti password SMTP
- Kalau user complain email tidak masuk

**Cara pakai:** double-click → masukkan email tujuan → cek inbox.

Kalau gagal, cek 4 hal paling umum:
1. `MAIL_SCHEME` → harus `tls` untuk port 587, `ssl` untuk port 465, kosong untuk port 25
2. `MAIL_PASSWORD` → kalau ada karakter `#`, `$`, `&`, `(`, `)` → **wajib** pakai double quote `"..."`
3. Firewall → outbound port 587 ke `astra-visteon.net` tidak diblok
4. Credential SMTP → coba login manual pakai Thunderbird/Outlook untuk verifikasi

---

### `run-pending-reminders.bat`

Trigger reminder email dept head sekarang, tanpa menunggu scheduler.

**Kapan dipakai:**
- Server baru menyala setelah mati beberapa hari → langsung cek apakah ada dokumen yang butuh reminder
- Testing manual
- Backup kalau Task Scheduler bermasalah

**Cara pakai:** double-click file-nya. Atau dari command prompt:

```cmd
cd C:\path\to\jago\egj-app
scripts\run-pending-reminders.bat
```

Aman dijalankan berkali-kali — dispatcher mengecek tabel `notifications` dulu, tidak akan kirim dobel di hari yang sama.

---

## 🏗️ Setup IIS (Untuk Referensi)

JAGO berjalan di IIS dengan setup standar Laravel on Windows:

1. **Install prerequisites:**
   - IIS dengan FastCGI, URL Rewrite Module
   - PHP for Windows (versi sama dengan `composer.json`, saat ini PHP 8.3+)
   - Extension PHP: `pdo_sqlsrv`, `sqlsrv`, `mbstring`, `openssl`, `gd`, `fileinfo`

2. **Buat site IIS:**
   - **Physical Path:** `C:\path\to\jago\egj-app\public`
   - **Binding:** HTTP port 80 atau HTTPS 443

3. **web.config** di dalam `public/` untuk URL rewrite (Laravel default sudah ada).

4. **Permission folder:**
   - Beri IIS user (`IIS_IUSRS`) **Modify** access ke:
     - `storage/`
     - `bootstrap/cache/`

5. **Deploy workflow:**
   ```bash
   git pull
   composer install --no-dev --optimize-autoloader
   npm ci && npm run build
   php artisan migrate --force
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   # IIS auto-serve, tidak perlu restart apapun
   ```

6. **Task Scheduler** → jalankan `install-scheduler.ps1` **sekali**.

---

## 🔍 Troubleshooting

### Reminder tidak terkirim walau sudah lewat 3 hari

Urutan cek:

1. **Task Scheduler sudah terpasang?**
   ```powershell
   Get-ScheduledTask -TaskName "JAGO Laravel Scheduler"
   ```
   Kalau tidak ada → jalankan `install-scheduler.ps1`.

2. **Task terakhir jalan kapan?**
   ```powershell
   Get-ScheduledTaskInfo -TaskName "JAGO Laravel Scheduler"
   # Lihat kolom LastRunTime dan LastTaskResult (0 = success)
   ```

3. **Server mati di jam 08:00?**
   Scheduler tidak "catch up" untuk jam yang terlewat. Jalankan `run-pending-reminders.bat` manual.

4. **SMTP config bermasalah?**
   Cek `storage/logs/laravel-YYYY-MM-DD.log` untuk "Failed sending reminder".

5. **Dokumen memang belum eligible?**
   Reminder cuma dikirim kalau:
   - Status = `Waiting Approval`
   - Tahap aktif = `superior_of_superior` (sudah lolos Section Head)
   - Belum ada reminder dikirim dalam 3 hari terakhir
   - Belum mencapai `MAX_REMINDERS = 2`

### Task Scheduler jalan tapi reminder tetap tidak terkirim

Jalankan manual untuk lihat error:

```powershell
cd "C:\path\to\jago\egj-app"
php artisan jago:dispatch-reminders -v
```

### Error "Access denied" saat install-scheduler.ps1

PowerShell harus dibuka **sebagai Administrator**. Klik kanan Start Menu → Windows PowerShell (Admin).
