# Product Requirements Document (PRD)
## General Journal Approval System (GJAS)

### 1. Latar Belakang
Departemen Accounting PT Astra Visteon Indonesia membutuhkan sistem persetujuan General Journal secara digital untuk menggantikan proses manual. Sistem ini memungkinkan pengajuan, persetujuan, monitoring, dan tracking dokumen General Journal beserta dokumen pendukungnya.

### 2. Tujuan
- Mempermudah proses approval General Journal.
- Menyediakan jejak audit (audit trail) setiap transaksi.
- Mengurangi risiko kehilangan atau keterlambatan approval.
- Menyediakan notifikasi email kepada pihak terkait.

### 3. Ruang Lingkup
- Pengguna: Staff, Section Head, Dept/Div Head.
- Dokumen: General Journal (1 PDF, multi-halaman) dan Supporting Document (gambar/PDF/Excel, maks 10 MB per file, tanpa batas jumlah).
- Proses: Draft → Submit → Approval (Superior → Superior of Superior) → Final Approved / Rejected.

### 4. User Roles
| Role           | Deskripsi                                  |
|----------------|--------------------------------------------|
| Staff          | Membuat dan mengajukan General Journal     |
| Section Head   | Menyetujui sebagai Superior, bisa juga mengajukan |
| Dept/Div Head  | Menyetujui sebagai Superior of Superior     |

### 5. Functional Requirements
1. **Login** - Autentikasi user berdasarkan email dan password.
2. **User Management** - CRUD user (hanya admin, jika ada).
3. **Create Draft** - User membuat draft GJ dengan input:
   - Document Number (manual)
   - Tanggal Journal
   - Reference (description)
   - Upload file General Journal (1 PDF)
   - Upload Supporting Document (multiple)
4. **Submit** - Draft dikirim ke alur approval. Status berubah menjadi "Waiting Approval".
5. **Approval** - Approver dapat menyetujui atau menolak.
   - Approve: mengisi kotak "Approved YYYY-MM-DD Nama User".
   - Reject: wajib mengisi notes alasan.
6. **Resubmit** - Setelah reject, requester mengunggah ulang file revisi dan mengirim ulang. Alur approval dimulai dari awal.
7. **Monitoring** - Semua role dapat melihat daftar GJ dengan status terbaru, assign to, filter.
8. **Tracking** - Melihat timeline history lengkap setiap GJ.
9. **Email Notification** - Mengirim email ke approver/requester sesuai tahapan.
10. **Preview Dokumen** - Preview PDF/gambar/Excel di sistem dan di email (via thumbnail/link).
11. **Export Excel** - Monitoring data dapat diexport ke Excel.

### 6. Non-Functional Requirements
- Web SPA (React, Inertia Laravel, MONOLITH).
- Database SQL Server.
- Email menggunakan SMTP kantor.
- Keamanan: token email kedaluwarsa 5 hari kerja.
- File storage di server.

### 7. Asumsi
- Tidak ada skenario request oleh Dept/Div Head.
- Request oleh Section Head: kolom Accounting dan Superior otomatis ter-approve.
- Staff hanya dapat melihat dokumennya sendiri di Monitoring? (perlu konfirmasi)

### 8. Acceptance Criteria
- Semua alur berjalan sesuai role.
- Email notifikasi terkirim dan token berfungsi.
- File tidak bisa diubah setelah submit, hanya bisa di-resubmit dengan file baru.