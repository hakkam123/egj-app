# Functional Features

## 1. Autentikasi & User Management
- Login menggunakan email dan password.
- Role: Staff, Section Head, Dept/Div Head.
- CRUD user (jika diperlukan).

## 2. Pembuatan General Journal
- Staff/Section Head membuat draft dengan input:
  - Document Number (manual)
  - Tanggal Journal
  - Reference
  - Upload General Journal (1 PDF)
  - Upload Supporting Document (gambar/PDF/Excel, max 10 MB/file, tanpa batas jumlah)
- Status awal: Draft.

## 3. Submit
- Mengubah status dari Draft menjadi Waiting Approval.
- Menentukan current_assign_to berdasarkan role requester:
  - Staff → Superior (Section Head)
  - Section Head → Superior of Superior (Dept/Div Head)
- Membuat record approval untuk setiap level.
- Jika requester Section Head, kolom Accounting dan Superior otomatis Approved.
- Mengirim email notifikasi ke approver pertama.

## 4. Approval & Reject
- Approver membuka sistem (atau via email untuk Dept/Div Head tertentu).
- Tindakan Approve:
  - Mengisi kolom "Approved YYYY-MM-DD Nama User".
  - Mengubah status approval level menjadi Approved.
  - Mencatat history.
  - Jika masih ada level berikutnya, ubah current_assign_to dan kirim email ke approver berikutnya.
  - Jika level terakhir, ubah status GJ menjadi Approved dan kirim email ke requester.
- Tindakan Reject:
  - Wajib mengisi notes alasan.
  - Mengubah status GJ menjadi Rejected.
  - current_assign_to = requester.
  - Mengirim email pemberitahuan reject ke requester.

## 5. Resubmit
- Requester (setelah reject) mengunggah ulang file (General Journal & Supporting Document) dengan versi baru.
- Approval level di-reset ke Pending (kecuali accounting otomatis Approved untuk requester Section Head).
- Status kembali Waiting Approval.
- current_assign_to sesuai alur awal.
- Mengirim email notifikasi ulang.

## 6. Monitoring
- Dapat diakses semua role.
- Menampilkan data GJ terbaru: Document Number, Tanggal Journal, Reference, Status, Assign To, Person Request, Last Updated, ikon attachment, ikon history.
- Filter: status, tanggal, user, role.

## 7. Tracking
- Timeline history lengkap per GJ: waktu, aktor, aksi, catatan.
- Ditampilkan di modal saat ikon history diklik.

## 8. Email Notification
- Saat submit → email ke Superior.
- Saat Superior approve → email ke Superior of Superior.
- Saat final approve/reject → email ke requester.
- Isi email: Document Number, Tanggal Journal, Reference, link/attachment dokumen.
- Untuk Dept/Div Head (Bu Alisa): tombol approve langsung di email, berlaku 5 hari kerja, tanpa login.
- Untuk Superior: link ke portal web untuk login.
- Preview dokumen: thumbnail halaman pertama PDF dan link preview tanpa login.

## 9. Preview Dokumen
- Di sistem: modal viewer untuk PDF, gambar, dan Excel (download/lihat).
- Di email: thumbnail PDF + link preview tanpa login (token).

## 10. Export Excel
- Data monitoring dapat diexport ke file Excel.