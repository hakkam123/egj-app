# AI Agent Development Constraints (DO & DON'TS)

## TUJUAN
Dokumen ini adalah batasan mutlak bagi AI Agent yang membangun sistem General Journal Approval System (GJAS). Setiap pelanggaran terhadap aturan ini dianggap kesalahan implementasi.

## DO (Wajib Dilakukan)

### Teknologi & Arsitektur
- Gunakan Laravel (PHP) sebagai backend dan framework utama.
- Gunakan Inertia.js untuk menjembatani Laravel dan React.
- Gunakan React untuk komponen UI (di dalam project Laravel, folder `resources/js`).
- Gunakan SQL Server sebagai database.
- Gunakan struktur monolith utuh: satu project Laravel, satu codebase, satu deployment.
- Gunakan session-based authentication bawaan Laravel (bukan JWT/Sanctum).
- Gunakan SMTP kantor untuk pengiriman email.

### Database
- Ikuti skema tabel persis seperti di DATABASE.md.
- Gunakan nama tabel, kolom, tipe data, constraint sesuai definisi.
- Gunakan status values: `Draft`, `Waiting Approval`, `Approved`, `Rejected`.
- Gunakan approval levels: `accounting`, `superior`, `superior_of_superior`.
- Gunakan action types: `submit`, `approve`, `reject`, `resubmit`.
- Gunakan role names: `Staff`, `Section Head`, `Dept/Div Head` (tanpa perubahan).
- Simpan file path di storage, bukan di database sebagai blob.

### Fitur & Logika
- Document Number diinput manual oleh user (tidak auto-generate).
- File General Journal: wajib 1 file PDF, bisa multi-halaman.
- Supporting Document: boleh multiple, format gambar (jpg/png), PDF, Excel, ukuran per file maks 10 MB.
- Alur approval:
  - Staff request: Staff → Superior (Section Head) → Superior of Superior (Dept/Div Head).
  - Section Head request: Accounting otomatis approved, Superior otomatis approved, langsung menunggu Superior of Superior.
  - Tidak ada request oleh Dept/Div Head.
- Saat reject, approver wajib mengisi notes alasan.
- Setelah reject, requester harus mengunggah ulang file (versi baru) dan resubmit. Alur approval dimulai dari awal.
- Resubmit tidak mengedit record lama, tetapi membuat versi file baru dan me-reset status approval.
- Kolom "Last Updated" berubah setiap kali ada aksi (submit/approve/reject/resubmit).
- Monitoring dapat diakses semua role.
- Menu Approval General Journal hanya muncul untuk Section Head dan Dept/Div Head.
- Staff hanya melihat menu Monitoring dan Tracking (tidak ada menu Approval).

### Email Notification
- Saat submit → kirim email ke Superior.
- Saat Superior approve → kirim email ke Superior of Superior.
- Saat final approve/reject → kirim email ke requester.
- Email berisi: Document Number, Tanggal Journal, Reference, link/attachment dokumen.
- Untuk Dept/Div Head (Bu Alisa): sertakan tombol approval langsung di email, berlaku 5 hari kerja, tanpa login.
- Untuk Superior: email berisi link ke portal web (wajib login).
- Sertakan thumbnail halaman pertama PDF dan link preview tanpa login (token) untuk Superior & Superior of Superior.
- Token email expiry = 5 hari kerja (bukan 24 jam). Jika expired, kirim notifikasi ulang dengan token baru.

### Keamanan & Validasi
- Gunakan signed URL / token unik untuk akses approval dan preview tanpa login.
- Validasi ukuran file maks 10 MB.
- Validasi format file yang diizinkan.
- Lindungi seluruh route (kecuali route token preview/approval) dengan middleware `auth`.
- Route token preview/approval tidak memerlukan login, tetapi hanya bisa diakses dengan token valid.

### Output
- Implementasikan export data monitoring ke Excel.
- Sediakan modal preview untuk PDF, gambar, Excel.
- Sediakan modal history (timeline) untuk setiap GJ.

## DON'T (Dilarang Keras)

### Fitur & Scope
- Jangan menambahkan fitur yang tidak diminta (misal: reminder otomatis, notifikasi in-app, chat, dashboard statistik, dll).
- Jangan membuat request oleh Dept/Div Head.
- Jangan izinkan edit dokumen setelah submit.
- Jangan izinkan approve oleh user yang bukan assigned approver.
- Jangan menampilkan menu Approval untuk role Staff.
- Jangan mengirim email pengingat otomatis (untuk saat ini diminta di-hold).
- Jangan mengubah alur approval atau menambah level approval.
- Jangan menambahkan kolom/table yang tidak ada di DATABASE.md tanpa persetujuan eksplisit.

### Database & Kode
- Jangan mengubah nama tabel atau kolom yang sudah disepakati.
- Jangan menggunakan auto-increment Document Number.
- Jangan menyimpan file sebagai blob di database.
- Jangan menggunakan soft delete untuk general_journals (karena tidak diminta).
- Jangan mengubah status values atau menambah status baru.
- Jangan mengubah role names.
- Jangan menggunakan framework frontend selain React.
- Jangan menggunakan database selain SQL Server.
- Jangan memecah backend menjadi microservices.
- Jangan membuat REST API terpisah atau endpoint JSON untuk frontend (cukup controller Inertia).

### Email & Token
- Jangan membuat token email berlaku lebih dari 5 hari kerja.
- Jangan menggunakan token yang sama untuk approval dan preview (harus beda purpose).
- Jangan menampilkan tombol approval di email untuk role selain Dept/Div Head (Bu Alisa).
- Jangan mengirim link preview yang bisa diakses tanpa token (harus token valid).

### UI/UX
- Jangan menampilkan kolom "Created At" di Monitoring (cukup Last Updated).
- Jangan menampilkan history lengkap di tabel utama (harus via ikon/modal).
- Jangan menampilkan preview PDF langsung di body email (cukup thumbnail + link).

## PENUTUP
Setiap penyimpangan dari aturan di atas harus dikonfirmasi terlebih dahulu kepada pemilik proyek. AI Agent tidak boleh berasumsi atau menambahkan fitur di luar spesifikasi ini.