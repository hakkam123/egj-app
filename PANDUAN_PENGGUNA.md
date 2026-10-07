# PANDUAN PENGGUNA JAGO
### *Journal Approval General Operations*
#### PT Astra Visteon Indonesia

---

## Daftar Isi

1. [Pendahuluan](#1-pendahuluan)
2. [Masuk ke Sistem (Login)](#2-masuk-ke-sistem-login)
3. [Mengenal Antarmuka](#3-mengenal-antarmuka)
4. [Notifikasi](#4-notifikasi)
5. [Pengaturan Akun (My Account)](#5-pengaturan-akun-my-account)
6. [Panduan untuk Staff](#6-panduan-untuk-staff)
7. [Panduan untuk Section Head](#7-panduan-untuk-section-head)
8. [Panduan untuk Dept/Div Head](#8-panduan-untuk-deptdiv-head)
9. [Panduan untuk Admin](#9-panduan-untuk-admin)
10. [Alur Lengkap Satu Dokumen (Contoh)](#10-alur-lengkap-satu-dokumen-contoh)
11. [Tanya Jawab (FAQ)](#11-tanya-jawab-faq)
12. [Daftar Istilah](#12-daftar-istilah)

---

## 1. Pendahuluan

### 1.1 Apa itu JAGO?

**JAGO** (*Journal Approval General Operations*) adalah aplikasi web yang digunakan Departemen Accounting PT Astra Visteon Indonesia untuk mengelola **persetujuan dokumen General Journal secara digital**. JAGO menggantikan proses manual pengecapan dan pengantaran dokumen fisik ke setiap approver.

Dengan JAGO, Anda bisa:

- Membuat dan menyimpan draft dokumen General Journal.
- Mengirim dokumen untuk disetujui atasan (Section Head → Dept/Div Head).
- Melakukan persetujuan secara digital, termasuk melalui tautan di email.
- Memantau status seluruh dokumen beserta histori lengkapnya.
- Mengekspor laporan monitoring ke Excel.

### 1.2 Siapa Pengguna JAGO?

Terdapat empat peran (role) dalam sistem:

| Peran | Tugas Utama |
|---|---|
| **Staff** | Membuat, menyunting, dan mengirimkan dokumen General Journal untuk disetujui. |
| **Section Head** | Menyetujui atau meminta revisi di tingkat pertama. Section Head juga bisa membuat jurnal (otomatis lolos tingkat Superior). |
| **Dept/Div Head** | Pemegang keputusan akhir. Menyetujui lewat portal maupun lewat tautan di email. |
| **Admin** | Mengelola pengguna, memantau log error sistem, dan mengelola file tutorial. |

### 1.3 Lima Status Dokumen

Setiap dokumen General Journal selalu berada di salah satu dari lima status berikut:

| Status | Arti |
|---|---|
| **Draft** | Dokumen baru dibuat, belum dikirim untuk approval. Hanya pembuat yang bisa melihat & menyunting. |
| **Waiting Approval** | Dokumen sedang berada di antrian persetujuan Section Head atau Dept/Div Head. |
| **Revised** | Approver menolak sementara dan meminta perbaikan. Dokumen kembali ke pembuat. |
| **Approved** | Dokumen sudah lolos semua tingkat persetujuan. Stempel digital terbentuk otomatis. |
| **Rejected** | Dokumen dibatalkan permanen. **Hanya pembuat (Requester)** yang bisa men-reject (saat status Revised). |

> **Catatan penting:** Approver (Section Head / Dept Head) **tidak pernah menolak secara permanen**. Tindakan approver hanyalah **Approve** atau **Request Revision** (dengan catatan wajib). Rejection permanen hanya bisa dilakukan oleh pembuat dokumen (Self Reject) ketika status dokumen sedang **Revised**.

### 1.4 Nomor Dokumen `JOT`

Semua nomor dokumen di JAGO otomatis diberi awalan **`JOT `**. Anda cukup mengetik bagian angka/kode saja, sistem akan menambahkan prefix `JOT ` secara otomatis. Contoh: jika Anda mengetik `12345`, nomor yang tersimpan adalah `JOT 12345`.

---

## 2. Masuk ke Sistem (Login)

### 2.1 Membuka Aplikasi

1. Buka browser (direkomendasikan Google Chrome, Microsoft Edge, atau Mozilla Firefox versi terbaru).
2. Kunjungi alamat JAGO yang diberikan oleh IT (contoh: `http://jago.astra-visteon.local`).
3. Anda akan diarahkan ke halaman **Sign In**.

### 2.2 Mengisi Form Login

Form Login memiliki dua kolom:

- **Employee ID (NPK)** → isi dengan NPK Anda. Contoh: `1002`.
- **Password** → isi dengan password Anda.

Lalu klik tombol **Sign In**.

> **Tips:** Anda juga dapat menggunakan alamat email korporat sebagai pengganti NPK pada kolom NPK, jika email Anda sudah terdaftar.

### 2.3 Jika Login Gagal

- **"Invalid NPK or password, or the account is inactive."**
  Pastikan NPK dan password benar, serta akun Anda masih aktif. Hubungi Admin JAGO jika sudah pensiun/mutasi.
- **"Too many login attempts. Please try again in a minute."**
  Sistem memblokir sementara setelah 5 kali gagal dalam satu menit. Tunggu 60 detik sebelum mencoba lagi.
- **Lupa password?** Hubungi Admin JAGO untuk direset.

### 2.4 Keluar (Logout)

Klik nama Anda di sudut kanan atas → **Logout**.

---

## 3. Mengenal Antarmuka

Setelah login, Anda akan melihat **top navigation bar** berwarna navy (`#1a2540`) khas Astra Visteon.

### 3.1 Menu yang Terlihat per Peran

| Menu | Staff | Section Head | Dept/Div Head | Admin |
|---|:---:|:---:|:---:|:---:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Monitoring | ✅ | ✅ | ✅ | ✅ |
| Approval | — | ✅ | ✅ | — |
| Draft Documents | ✅ | ✅ | — | — |
| Error Monitoring | — | — | — | ✅ |
| User Management | — | — | — | ✅ |

Menu yang tidak relevan dengan peran Anda tidak akan muncul.

### 3.2 Pojok Kanan Atas

- **Ikon lonceng** → notifikasi dalam aplikasi. Angka merah menunjukkan jumlah notifikasi belum dibaca (maksimal `99+`).
- **Nama & peran Anda** → klik untuk membuka menu:
  - **Account Settings** → ubah profil & password.
  - **User Manual** → unduh buku panduan ini.
  - **Logout** → keluar dari sistem.

### 3.3 Pesan Pop-up (Toast)

Pesan singkat berwarna hijau (sukses), merah (error), atau kuning (peringatan) akan muncul di pojok kanan atas setiap kali Anda menyelesaikan sebuah aksi.

---

## 4. Notifikasi

JAGO memiliki tiga jenis notifikasi:

1. **Notifikasi dalam aplikasi** (lonceng di navbar).
2. **Email**.
3. **Pop-up toast** (hanya saat Anda sedang online).

### 4.1 Jenis Notifikasi

| Tipe | Diterima Oleh | Dipicu Oleh |
|---|---|---|
| `approval_request` | Approver | Dokumen baru masuk antrian approval |
| `approved` | Requester | Dokumen Anda disetujui penuh oleh Dept Head |
| `revised` | Requester | Approver meminta revisi |
| `rejected` | Requester | Anda sendiri melakukan Self Reject |
| `reminder_pending` | Requester & Dept Head | Dokumen belum ditindaklanjuti ≥ 3 hari di tingkat Dept Head |

### 4.2 Cara Membuka Notifikasi

1. Klik **ikon lonceng** di navbar.
2. Daftar 10 notifikasi terbaru muncul.
3. Klik salah satu notifikasi untuk:
   - Menandai sebagai sudah dibaca.
   - Langsung membuka dokumen terkait (jika ada).

Anda juga bisa klik **"Mark all read"** untuk menandai semuanya sekaligus.

### 4.3 Pembersihan Otomatis

Notifikasi yang sudah dibaca akan dihapus otomatis dari database setelah **30 hari** supaya daftar tidak membengkak.

---

## 5. Pengaturan Akun (My Account)

Akses: Klik nama Anda di pojok kanan atas → **Account Settings**.

### 5.1 Mengubah Profil

Pada bagian **Profile Information**:

1. Ubah **Name**, **Email**, atau **NPK** sesuai kebutuhan.
2. Klik **Save Profile**.
3. Email yang digunakan sebagai alamat tujuan notifikasi (termasuk tautan approval untuk Dept Head) akan mengikuti email ini.

> Anda **tidak dapat** mengubah peran (role) atau status aktif akun Anda sendiri. Perubahan tersebut hanya bisa dilakukan oleh Admin.

### 5.2 Mengubah Password

Pada bagian **Change Password**:

1. **Current Password** → isi dengan password Anda saat ini.
2. **New Password** → minimal 8 karakter.
3. **New Password Confirmation** → ketik ulang password baru.
4. Klik **Change Password**.

Ikon mata di kanan kolom bisa diklik untuk melihat/menyembunyikan karakter password.

---

## 6. Panduan untuk Staff

Peran **Staff** adalah peran pembuat dokumen (Requester). Alur kerja utama Staff:

```
Create Draft → Save as Draft (opsional) → Submit for Approval
                 ↓                                 ↓
            Draft Documents                 Waiting Approval
                                                   ↓
                           ┌───────────────────────┴──────────────────┐
                           ↓                                          ↓
                       Approved                                    Revised
                                                                      ↓
                                                      Resubmit atau Self Reject
```

### 6.1 Dashboard Staff

Setelah login, Dashboard menampilkan ringkasan dokumen Anda:

- **5 kartu statistik**: Drafts, Waiting Approval, Revised, Approved, Rejected.
- **Status Distribution** → diagram batang untuk melihat proporsi.
- **Recent Documents** → 5 dokumen terakhir Anda beserta status dan assignee.

### 6.2 Membuat Draft Baru

**Jalur akses:**
- Dari **Dashboard** atau **Monitoring**: klik `+ New Draft` (menu mobile) **atau**
- Buka langsung URL **`/general-journals/create`** melalui menu **Draft Documents → Create New Draft**.

**Langkah pengisian:**

1. **Document Number** (wajib)
   - Ketik hanya angka/kode (contoh: `12345`).
   - Prefix `JOT ` muncul otomatis di sisi kiri input dan akan menyatu saat tersimpan.
   - Nomor dokumen harus unik — belum pernah dipakai di dokumen lain yang masih aktif (Draft/Waiting Approval/Revised/Approved).
2. **Journal Date** (wajib)
   - Pilih tanggal dari date-picker.
   - Tanggal ini akan menjadi **tanggal stempel Accounting** otomatis saat dokumen Anda disubmit.
3. **Reference** (wajib)
   - Deskripsi/alasan jurnal (contoh: `Accrual Payroll September 2026`).
4. **General Journal (PDF)** (wajib untuk Submit, opsional untuk Save as Draft)
   - Klik area upload → pilih file PDF.
   - Ukuran maksimal **10 MB**.
   - Setelah dipilih, preview langsung muncul di bawah tombol.
5. **Supporting Documents** (opsional, bisa banyak)
   - Format yang diterima: PDF, JPG/PNG, XLS/XLSX.
   - Ukuran maksimal **10 MB per file**.

**Dua tombol di bawah form:**

- **Save as Draft** → menyimpan tanpa mengirim. Dokumen status jadi **Draft**, Anda masih bisa menyuntingnya kapan saja.
- **Submit for Approval** → mengirim langsung ke approval. Status menjadi **Waiting Approval**.

> **Tips:** Jika Anda belum yakin, pilih **Save as Draft**. Nanti bisa di-submit dari halaman **Draft Documents**.

### 6.3 Mengelola Draft (Halaman Draft Documents)

**Akses:** menu **Draft Documents**.

Halaman ini hanya menampilkan dokumen **Draft** milik Anda sendiri (Admin bisa melihat semua).

**Fitur:**

- **Checkbox di setiap baris** → pilih satu atau lebih draft.
- **Select All** → menandai semua draft di halaman saat ini.
- **Bulk submit** → mengirim beberapa draft sekaligus (lihat 6.4).
- **In-column search**:
  - Search Doc (nomor dokumen)
  - Journal Date (date-picker)
  - Search Reference
  - Search File Name
- **Clear Filters** → kembali ke daftar penuh.
- **Edit** → masuk ke halaman edit.
- **Submit** per baris → mengirim satu draft saja.
- **Trash icon** → menghapus draft.

**Indikator kelengkapan:**
- Badge merah **`Missing PDF`** = draft belum punya file PDF utama → tidak bisa disubmit.
- Badge abu-abu **`2 files`** = jumlah supporting documents.

### 6.4 Bulk Submit

1. Centang beberapa draft di kolom paling kiri.
2. Banner **"X draft documents selected"** muncul di atas tabel.
3. Klik **"Submit Selected (X)"**.
4. Dialog konfirmasi akan membedakan dua hal:
   - **Jika semua draft lengkap:** klik **"Submit X Drafts"** → semua dikirim.
   - **Jika sebagian tidak lengkap** (misal belum ada PDF): sistem akan menampilkan daftar dokumen yang bermasalah dan menawarkan tombol **"Submit X Ready Drafts"** → hanya yang lengkap yang dikirim, sisanya tetap Draft.

### 6.5 Menyunting Draft

1. Dari halaman **Draft Documents**, klik nomor dokumen atau tombol **Edit**.
2. Halaman edit mirip halaman Create tetapi semua kolom sudah terisi dengan data draft.
3. File PDF/Supporting Documents yang sudah ada akan ditampilkan dengan label **"Current Active File"**.
4. Anda bisa:
   - Mengubah teks (Document Number, Journal Date, Reference).
   - Mengunggah PDF pengganti → file lama otomatis diganti saat disimpan.
   - Mengunggah supporting documents baru → **mengganti seluruh** supporting documents sebelumnya.
5. Dua tombol:
   - **Save Draft Changes** → simpan perubahan, status tetap Draft.
   - **Submit for Approval** → simpan **lalu** kirim ke approval. (Sistem otomatis save dulu sebelum submit, jadi perubahan tidak hilang.)

### 6.6 Menghapus Draft

Hanya dokumen **Draft** yang bisa dihapus:

1. Klik ikon tempat sampah pada baris draft.
2. Konfirmasi: **"Yes, Delete Draft"**.
3. Draft beserta semua file-nya hilang permanen.

### 6.7 Monitoring Dokumen Anda

**Akses:** menu **Monitoring**.

Halaman ini menampilkan **semua** dokumen Anda (dari Draft sampai Approved/Rejected), lengkap dengan:

- Kolom **#** = nomor urut baris.
- **In-column search** di bawah header untuk filter cepat.
- **Status Distribution** di statistik atas (Draft, Waiting, Revised, Approved, Rejected, Total).
- **Export to Excel** di sudut kanan atas → mengunduh daftar sesuai filter aktif.

Dari sini Anda bisa:
- Klik nomor dokumen → masuk ke halaman detail (lihat 6.8).
- Klik ikon **History** → melihat timeline aktivitas dokumen.

### 6.8 Halaman Detail Dokumen

**Akses:** klik nomor dokumen dari Monitoring atau Dashboard.

Isi halaman:

- **Info kiri atas**: nomor dokumen, status pill, badge status.
- **Document Information** — Journal Date, Person Request, Current Assign To, Reference.
- **Approval Workflow Chain** — 3 tahap: Accounting, Superior (Section Head), Superior of Superior (Dept/Div Head). Setiap tahap menampilkan status, nama approver, tanggal, dan catatan.
- **General Journal PDF** — preview PDF yang sudah ditambahkan stempel digital (jika sudah ada tahap yang Approved). Tombol **Download PDF** mengunduh versi dengan stempel.
- **Supporting Documents** — daftar file pendukung.

### 6.9 Jika Dokumen Di-Revisi (Status Revised)

Ketika approver meminta revisi, Anda akan:

1. Menerima **notifikasi dalam aplikasi** dan **email** berisi catatan revisi dari approver.
2. Melihat dokumen di Monitoring berstatus **Revised**.
3. Pada halaman detail dokumen, muncul banner kuning **"Revision Requested by Approver"**.

**Dua pilihan tindakan:**

#### A. Revisi dan Kirim Ulang

1. Klik tombol **Revise** → halaman edit terbuka.
2. Banner kuning menampilkan **catatan revisi** dari approver.
3. **Document Number** dan **Journal Date** **terkunci** (tidak bisa diubah).
4. Anda boleh:
   - Mengubah **Reference**.
   - Mengunggah PDF utama baru (opsional — jika tidak diunggah, PDF lama tetap dipakai).
   - Mengunggah supporting documents baru (akan menggantikan yang lama).
5. Klik **Resubmit for Approval** → konfirmasi **"Yes, Resubmit"**.
6. Chain approval dimulai ulang dari Section Head. Setiap kali resubmit, **resubmit_count** bertambah 1.

#### B. Membatalkan Dokumen (Self Reject)

Jika Anda memutuskan dokumen tidak jadi diajukan:

1. Klik tombol **Reject** di halaman edit (atau detail).
2. Konfirmasi **"Yes, Reject Permanently"**.
3. Status dokumen menjadi **Rejected** permanen. **Tidak bisa dikembalikan**.

> **Peringatan:** Self Reject hanya tersedia saat status dokumen **Revised**. Setelah di-reject, dokumen tidak bisa diedit atau disubmit ulang. Jika masih diperlukan, Anda harus membuat Draft baru dengan Document Number yang berbeda (atau pakai nomor lama hanya jika yang direject sudah berstatus Rejected).

### 6.10 Melihat Timeline (History)

Pada halaman Monitoring, klik ikon jam/history pada baris dokumen. Modal **Document Timeline** menampilkan:

- **Submitted** / **Resubmitted** — oleh siapa, kapan.
- **Approved** — tiap tahap, tanggal & nama approver.
- **Revision Requested** — tanggal, approver, dan catatan.
- **Rejected** — jika Anda melakukan Self Reject.

---

## 7. Panduan untuk Section Head

**Peran:** approver tingkat pertama (Superior). Section Head juga dapat **membuat jurnal** sendiri — ketika Section Head membuat jurnal, tingkat Accounting **dan** Superior otomatis ter-approve, sehingga dokumen langsung masuk antrian Dept/Div Head.

### 7.1 Dashboard Section Head

- **Pending Approval** → jumlah dokumen yang menunggu persetujuan Anda.
- **Approved** → total dokumen yang pernah Anda approve.
- **Revisions Requested** → total revisi yang pernah Anda minta.
- **My Drafts** / **My Submissions** → aktivitas Anda sebagai Requester (jika Anda juga sering membuat jurnal).
- **Documents Requiring Action** → daftar dokumen yang menunggu Anda lebih dari **3 hari**.

### 7.2 Antrian Persetujuan (Approval Queue)

**Akses:** menu **Approval**.

Halaman ini menampilkan daftar dokumen yang **menanti tindakan Anda**:

- Hanya dokumen yang **sudah lolos tingkat Accounting** dan **belum lolos tingkat Superior**.
- Dokumen yang **sudah di tingkat Dept Head** tidak muncul di antrian Section Head.
- **In-column search**: Nomor Dokumen, Tanggal, Reference, Status, Person Request.
- Statistik atas: **Waiting**, **Approved**, **Revised**.

Klik nomor dokumen atau ikon mata → halaman **Review**.

### 7.3 Mereview & Memverifikasi Dokumen

Halaman **Approval Review** menampilkan dua kolom:

**Kolom kiri (metadata & tindakan):**
- Document overview: Journal Date, Person Request, Reference.
- Timeline **Approval Workflow Progress**.
- Panel **Approval Decision** (muncul hanya jika Anda approver aktif untuk dokumen tersebut).

**Kolom kanan (file):**
- Preview PDF General Journal dengan stempel digital yang sudah ditambahkan (dinamis).
- Daftar Supporting Documents dengan tombol Preview & Download.

**Hal yang perlu Anda verifikasi:**
- Nomor dokumen, tanggal, dan Reference konsisten.
- Isi PDF General Journal benar.
- Lampiran pendukung lengkap dan sesuai.

### 7.4 Approve Dokumen

1. Klik **Approve Document**.
2. Konfirmasi: **"Yes, Approve"**.
3. Yang terjadi:
   - Record approval tingkat **Superior** diubah menjadi `Approved`, dengan tanggal dan nama Anda.
   - **current_assign_to** berpindah ke Dept/Div Head aktif.
   - Dokumen hilang dari antrian Anda.
   - Dept/Div Head menerima **notifikasi** dan **email** berisi tautan satu-klik (Approve / Request Revision) serta lampiran PDF.
   - Jika sebelumnya Anda mengerjakan dokumen lewat email, tautan email lama otomatis dinonaktifkan.

### 7.5 Request Revision

Jika ada yang perlu diperbaiki oleh Requester:

1. Klik **Request Revision**.
2. Pada modal, isi **Revision Notes** — minimal **5 karakter** (spasi tidak dihitung).
3. Tuliskan catatan sejelas mungkin. Contoh:
   - "Nominal GL 500100 di baris 3 harus Rp 1.250.000, bukan Rp 1.025.000."
   - "Lampiran faktur bulan September belum ada. Mohon ditambahkan."
4. Klik **Send Revision Request**.
5. Yang terjadi:
   - Record approval tingkat Superior diberi status `Revised` dengan catatan Anda.
   - Status dokumen berubah menjadi **Revised**.
   - Requester mendapat **email** dan **notifikasi**.
   - Dokumen kembali ke Requester untuk diperbaiki.

### 7.6 Membuat Jurnal Sebagai Section Head

Section Head boleh membuat jurnal sendiri. Prosesnya sama dengan Staff (poin 6.2), **kecuali**:

- Pada form Create, pesan di bawah Journal Date berbunyi:
  *"This date will automatically be registered as the official approval date on the Accounting & Superior stamp."*
  → Ini artinya baik stempel Accounting maupun Superior akan menggunakan Journal Date Anda otomatis.
- Setelah Submit, dokumen **langsung** masuk ke antrian Dept/Div Head (bukan ke Section Head lain).

### 7.7 Monitoring (Section Head)

Section Head dapat melihat **seluruh** dokumen (tidak hanya milik sendiri) di menu **Monitoring**. Berguna untuk mengaudit riwayat.

---

## 8. Panduan untuk Dept/Div Head

**Peran:** approver tingkat tertinggi (Superior of Superior). Dept/Div Head biasanya tidak membuat jurnal.

Keistimewaan Dept/Div Head: dapat melakukan approval **melalui dua cara**:

1. **Portal JAGO** (seperti Section Head).
2. **Tautan satu-klik di email** — tanpa perlu login.

### 8.1 Dashboard Dept/Div Head

Mirip Section Head, tetapi menampilkan dokumen di tingkat **superior_of_superior** saja.

### 8.2 Antrian Approval di Portal

**Akses:** menu **Approval**.

Hanya menampilkan dokumen yang **sudah lolos Section Head** dan menunggu Anda. **Dokumen yang masih menunggu Section Head tidak akan muncul**, sehingga Anda tidak bisa men-approve mendahului Section Head.

Alur approve / request revision di portal **persis sama** dengan Section Head (poin 7.3 – 7.5).

### 8.3 Approval via Email

Setiap kali ada dokumen yang membutuhkan tindakan Dept/Div Head, Anda akan menerima email berjudul:

> **"Approval Required: General Journal JOT 12345"**

Isi email:

- Informasi dokumen (nomor, tanggal, Person Request, Reference).
- **Lampiran PDF General Journal** (sudah dengan stempel dari tingkat Accounting dan Superior).
- Lampiran file pendukung — selama total ukuran ≤ 20 MB. File yang melebihi batas akan ditampilkan sebagai **tautan download**.
- Dua tombol besar:
  - **Approve Document** (biru/navy).
  - **Request Revision** (abu-abu).

#### A. Menyetujui via Email

1. Klik tombol **Approve Document**.
2. Browser membuka halaman konfirmasi JAGO.
3. Klik tombol **Approve** sekali lagi untuk konfirmasi.
4. Halaman sukses tampil ("Document Approved Successfully") dan menutup sendiri setelah 2–3 detik.
5. Yang terjadi di sistem:
   - Record approval tingkat **superior_of_superior** menjadi `Approved`.
   - Status dokumen menjadi **Approved**.
   - **Semua tautan email lain** untuk dokumen ini (termasuk tautan Revise) otomatis **dinonaktifkan**.
   - Requester menerima email **"General Journal JOT xxxxx - Approved"**.

#### B. Meminta Revisi via Email

1. Klik tombol **Request Revision** di email.
2. Halaman form terbuka dengan textarea **Revision Notes**.
3. Isi minimal **5 karakter** (spasi tidak dihitung). Contoh:
   `"Mohon lampirkan bukti kuitansi pembayaran vendor PT XYZ."`
4. Klik **Send Revision**.
5. Hasil: status dokumen menjadi **Revised**, kembali ke Requester, tautan email dinonaktifkan.

#### C. Masa Berlaku Tautan Email

- **Setiap tautan berlaku 5 hari.**
- Jika Anda tidak bertindak dalam **3 hari**, sistem akan mengirim **email reminder #1** dengan tautan **baru** (yang lama otomatis dinonaktifkan).
- Jika masih belum ditindaklanjuti setelah 3 hari berikutnya (hari ke-6 sejak submit), **reminder #2** dikirim lagi dengan tautan baru.
- Maksimal **2 reminder** per putaran approval. Setelah itu, gunakan portal JAGO.

#### D. Pesan Error di Halaman Email Approval

| Pesan | Artinya |
|---|---|
| *"This approval link has expired."* | Tautan sudah lewat 5 hari atau sudah diganti reminder baru. Buka email terbaru atau login ke portal. |
| *"This token has already been used."* | Tautan sudah pernah dipakai (misalnya di-klik dua kali). |
| *"This document is no longer pending approval."* | Dokumen sudah diproses lewat portal atau tautan lain. |
| *"You are not authorized to approve this document."* | Email tujuan tautan tidak cocok dengan Dept/Div Head aktif. |

### 8.4 Monitoring (Dept/Div Head)

Sama seperti Section Head: dapat melihat seluruh dokumen di menu **Monitoring**.

---

## 9. Panduan untuk Admin

Admin bertanggung jawab atas pengelolaan sistem, bukan dokumen jurnal.

### 9.1 Dashboard Admin

Statistik system-wide:

- Total Users, Total Documents, Waiting, Revised, Approved, Rejected.
- Daftar **Documents Requiring Action** (menanti lebih dari 3 hari).

### 9.2 User Management

**Akses:** menu **User Management**.

#### A. Melihat Daftar Pengguna

- Kolom: Name, Email, NPK, Role, Status (Active/Inactive), Actions.
- Filter: Search (nama/email/NPK), Role, Status.
- Pagination 10/25/50/100 per halaman.

#### B. Menambah Pengguna Baru

1. Klik **+ Add User**.
2. Isi form:
   - **Name** (wajib, maks. 100 karakter).
   - **Email** (wajib, harus unik).
   - **Employee ID (NPK)** (opsional, harus unik jika diisi).
   - **Role**: Staff / Section Head / Dept/Div Head / Admin.
   - **Password** (wajib, minimal 8 karakter).
   - **Password Confirmation** (ulangi).
   - **Account Active** (checkbox).
   - **Default Section Head Approver** → **hanya muncul jika Role = Section Head**. Centang jika Section Head ini menjadi tujuan default saat Staff submit jurnal.
3. Klik **Add User**.

> **Catatan tentang Default Approver:** Hanya **satu** Section Head yang bisa menjadi default. Jika Anda mencentang `is_default_approver` pada Section Head baru, Section Head default sebelumnya otomatis tidak lagi default.

#### C. Mengubah Pengguna

1. Klik ikon **Edit** di baris pengguna.
2. Ubah data yang perlu.
3. **Password** → kosongkan jika tidak ingin mengganti.
4. Klik **Save Changes**.

#### D. Menonaktifkan Pengguna

Alih-alih menghapus (yang akan merusak integritas histori dokumen), JAGO menonaktifkan:

1. Klik ikon tempat sampah.
2. Konfirmasi **"Yes, Deactivate"**.
3. Pengguna tidak bisa login lagi, tetapi semua dokumen dan histori milik mereka tetap utuh.

Untuk mengaktifkan kembali: Edit → centang **Account Active** → Save.

### 9.3 Error Monitoring

**Akses:** menu **Error Monitoring**.

Setiap exception yang terjadi di aplikasi tercatat otomatis di sini:

- **Message**, **Exception Class**, **File:Line**, **URL**, **Method**, **User** (jika sudah login), **IP**, **User Agent**.
- Status log: **New** / **Resolved** / **Ignored**.
- Statistik atas: Total, New, Resolved, Ignored.
- Filter: Search, Status, rentang tanggal.

#### A. Melihat Detail

Klik ikon **View Stack Trace**. Panel samping menampilkan stack trace lengkap dengan tombol:
- **Copy** → menyalin stack trace ke clipboard.
- **Mark as New** / **Mark as Resolved** / **Ignore**.
- **Delete** → hapus log permanen.

#### B. Pembersihan Otomatis

Log dengan status **Resolved** atau **Ignored** yang lebih tua dari **30 hari** akan dihapus otomatis oleh sistem.

### 9.4 Mengelola Tutorial / Manual Book

**Akses:** klik nama Anda di navbar → **User Manual**.

Admin dapat mengunggah file PDF panduan agar semua pengguna bisa mengunduhnya.

#### A. Mengunggah Tutorial

1. Klik **+ Add Tutorial**.
2. Isi:
   - **Title** (wajib).
   - **Description** (opsional).
   - **File** → pilih file PDF (maks. 20 MB).
3. Klik **Upload**.

#### B. Menghapus Tutorial

Klik ikon tempat sampah di kartu tutorial → konfirmasi.

### 9.5 Hal yang Admin **Tidak Bisa** Lakukan

- Mengubah status dokumen jurnal (bukan approver).
- Melakukan Self Reject atas nama Requester.
- Melihat password pengguna (semua password terenkripsi bcrypt).

Admin **bisa** melihat seluruh dokumen di menu Monitoring untuk kepentingan audit.

---

## 10. Alur Lengkap Satu Dokumen (Contoh)

Studi kasus nyata, langkah demi langkah:

### Latar

- **Budi (Staff)** membuat jurnal `JOT 20260001` untuk accrual payroll.
- Section Head default: **Ahmad**.
- Dept/Div Head: **Alisa**.
- Journal Date: `24 September 2026`.

### Hari-H (24 September 2026, 09:00)

1. **Budi** login dengan NPK `1002` → Dashboard muncul.
2. Buka **Draft Documents → Create New Draft**.
3. Isi:
   - Document Number: `20260001` → tampil `JOT 20260001`.
   - Journal Date: `2026-09-24`.
   - Reference: `Accrual Payroll September 2026`.
   - Unggah `GJ_20260001.pdf` (3 MB).
   - Unggah lampiran `Payroll_Breakdown.xlsx`.
4. Klik **Submit for Approval**.
5. Sistem:
   - Nomor dokumen tersimpan `JOT 20260001`, status `Waiting Approval`.
   - Record approval tingkat **accounting** otomatis `Approved`, tanggal = **24 Sep 2026 09:00** (mengikuti Journal Date).
   - Record **superior** = `Pending`, assigned to Ahmad.
   - Record **superior_of_superior** = `Pending`, assigned to Alisa.
   - Email **"Approval Required: General Journal JOT 20260001"** dikirim ke Ahmad.
   - Notifikasi dalam aplikasi masuk ke lonceng Ahmad.

### Hari-H+1 (25 September 2026, 10:30)

6. **Ahmad** login → Dashboard menampilkan **"Pending Approval: 1"**.
7. Buka **Approval**. Dokumen `JOT 20260001` ada di antrian.
8. Klik dokumen → masuk halaman Review.
9. Ahmad memeriksa PDF dan lampiran. Angka di `GJ_20260001.pdf` tampak keliru.
10. Klik **Request Revision** → ketik: *"Baris 4 jumlah di-input Rp 10.250.000, seharusnya Rp 10.025.000."*
11. Klik **Send Revision Request**.
12. Status dokumen menjadi **Revised**, kembali ke Budi.

### Hari-H+1 (25 September 2026, 14:15)

13. **Budi** menerima email **"General Journal JOT 20260001 - Revision Requested"** dan notifikasi.
14. Login → buka Monitoring → status `JOT 20260001` = **Revised**.
15. Klik dokumen → halaman detail menampilkan banner kuning.
16. Klik **Revise** → halaman edit terbuka dengan catatan Ahmad.
17. Document Number & Journal Date terkunci. Budi mengunggah `GJ_20260001_v2.pdf` yang sudah diperbaiki.
18. Klik **Resubmit for Approval** → konfirmasi.
19. Sistem:
   - File PDF v1 dihapus; v2 tersimpan dengan `version = 2`.
   - `resubmit_count` menjadi 1.
   - Record approval di-reset: accounting `Approved`, superior & superior_of_superior kembali `Pending`.
   - Status dokumen `Waiting Approval` lagi. Masuk antrian Ahmad.
   - Email baru ke Ahmad.

### Hari-H+2 (26 September 2026, 08:00)

20. Ahmad approve → status superior = `Approved`.
21. Dokumen pindah ke antrian Alisa.
22. Alisa menerima email dengan tombol Approve / Request Revision + lampiran PDF (sudah ada 2 stempel) + Payroll_Breakdown.xlsx.

### Alur A: Alisa Setuju Hari Itu Juga

23a. Alisa klik **Approve Document** di email.
24a. Halaman konfirmasi muncul → klik **Approve**.
25a. Record superior_of_superior = `Approved`. Status dokumen = **Approved**.
26a. Semua tautan email untuk dokumen ini otomatis dinonaktifkan.
27a. Budi menerima email **"General Journal JOT 20260001 - Approved"** dan notifikasi.
28a. Di Monitoring, PDF General Journal kini menampilkan **3 stempel digital**.

### Alur B: Alisa Baru Approve Setelah 4 Hari

23b. Pada **hari ke-5 dari 26 September** (yaitu 30 September pagi 08:00), sistem cron (`jago:dispatch-reminders`) berjalan:
   - Mengecek dokumen di tingkat Dept Head yang sudah ≥3 hari pasca Section Head approve.
   - `JOT 20260001` memenuhi syarat. Reminder #1 dibuat.
   - Tautan email lama Alisa dinonaktifkan.
   - Tautan baru dengan masa berlaku 5 hari dikirim ke Alisa (subject: `[Reminder #1] Approval Required...`).
24b. Alisa buka email reminder → klik Approve. Alur selesai sama seperti Alur A.
25b. Jika Alisa masih tidak merespons, pada hari ke-3 setelah reminder #1, reminder #2 akan dikirim (maksimal 2 reminder).

---

## 11. Tanya Jawab (FAQ)

**Q: Apa bedanya "Save as Draft" dan "Submit for Approval" di halaman Create?**
A: Save as Draft hanya menyimpan dokumen di menu Draft Documents (status Draft) tanpa mengirim ke approver. Submit for Approval langsung mengirim dokumen ke antrian approval dan statusnya menjadi Waiting Approval. Setelah Submit, Document Number dan Journal Date tidak bisa diubah tanpa Revised.

**Q: Mengapa tanggal stempel Accounting selalu sama dengan Journal Date?**
A: Agar pembukuan jurnal konsisten dengan periode akuntansi yang benar — stempel Accounting mencerminkan tanggal transaksi, bukan tanggal pengajuan dokumen di sistem.

**Q: Saya salah upload PDF di draft. Bisa diganti?**
A: Bisa. Buka draft → Edit → unggah PDF baru. Saat disimpan, PDF lama otomatis dihapus dari storage.

**Q: Dokumen saya status Revised. Boleh saya ubah Document Number?**
A: Tidak. Document Number dan Journal Date terkunci saat Revised. Anda hanya bisa mengganti file dan Reference. Jika memang perlu nomor baru, lakukan **Self Reject**, lalu buat Draft baru.

**Q: Saya sebagai Dept Head klik Approve di email, tapi muncul pesan "This document is no longer pending approval."**
A: Dokumen tersebut sudah diproses — baik lewat portal JAGO maupun lewat tautan email lain. Buka portal untuk melihat statusnya.

**Q: Saya tidak bisa menyetujui dokumen di menu Approval, tombolnya tidak muncul.**
A: Kemungkinan: (1) Anda bukan approver aktif untuk dokumen itu, atau (2) tahap yang menanti bukan tahap Anda (misalnya Anda Dept Head tetapi Section Head belum approve). Dokumen baru muncul tombolnya setelah tingkat sebelumnya selesai.

**Q: Bisakah saya me-reject dokumen secara permanen sebagai approver?**
A: Tidak. Approver hanya bisa **Request Revision**. Yang bisa menolak permanen hanyalah pembuat dokumen (Self Reject) ketika status sedang Revised.

**Q: Email dari JAGO masuk ke folder Spam. Bagaimana solusinya?**
A: Minta IT menambahkan domain pengirim JAGO ke whitelist di server email Anda.

**Q: Apakah file General Journal yang sudah ter-stempel bisa diverifikasi keasliannya?**
A: Ya. Sistem menyimpan **SHA-256 hash** dari file asli. Endpoint `/files/{id}/verify` dapat memeriksa apakah file asli masih utuh. Fitur ini biasanya dipakai Admin saat audit internal.

**Q: Bagaimana cara mengekspor laporan ke Excel?**
A: Buka menu **Monitoring**, pakai filter sesuai kebutuhan, lalu klik **Export to Excel** di pojok kanan atas. File `.xlsx` akan terunduh berisi daftar dokumen sesuai filter.

**Q: Berapa lama tautan di email berlaku?**
A: 5 hari sejak dikirim. Jika email reminder dikirim, tautan lama dinonaktifkan dan tautan baru berlaku 5 hari lagi.

**Q: Saya Section Head membuat jurnal untuk diri sendiri. Apakah ada perlakuan khusus?**
A: Ya. Saat Section Head submit, tingkat Accounting **dan** Superior otomatis `Approved` dengan tanggal = Journal Date. Dokumen langsung masuk antrian Dept Head.

**Q: Apakah pengguna yang di-deactivate datanya hilang?**
A: Tidak. Pengguna hanya ditandai `is_active = false`. Semua dokumen dan histori milik mereka tetap tersimpan untuk kepentingan audit.

**Q: Password minimal berapa karakter?**
A: Minimal **8 karakter**. Disarankan kombinasi huruf besar, huruf kecil, angka, dan simbol.

**Q: Berapa kali login salah sebelum diblokir?**
A: **5 kali** dalam satu menit. Setelah itu Anda harus menunggu 60 detik.

---

## 12. Daftar Istilah

| Istilah | Arti |
|---|---|
| **Accounting (level approval)** | Tingkat approval pertama. Otomatis ter-approve saat Requester submit, dengan tanggal = Journal Date. |
| **Approver** | Pengguna dengan peran Section Head atau Dept/Div Head yang bertugas menyetujui dokumen. |
| **Bulk Submit** | Mengirim beberapa draft sekaligus ke antrian approval dari halaman Draft Documents. |
| **Default Section Head Approver** | Section Head yang menjadi tujuan default saat Staff mengirim jurnal baru. |
| **Dept/Div Head** | Peran approver tingkat tertinggi (Superior of Superior). |
| **Draft** | Status dokumen yang baru dibuat dan belum dikirim ke approval. |
| **Email Token** | Token acak 64 karakter dalam tautan email approval/revise/preview. Berlaku 5 hari. |
| **JOT** | Prefix wajib pada setiap Document Number di JAGO. |
| **Journal Date** | Tanggal transaksi akuntansi, dipilih oleh Requester. Menjadi tanggal stempel Accounting. |
| **NPK** | Nomor Pokok Karyawan — identitas login utama di JAGO. |
| **Person Request / Requester** | Pengguna yang membuat dokumen (Staff atau Section Head). |
| **Request Revision** | Tindakan approver meminta perbaikan dokumen dengan catatan. Status jadi Revised. |
| **Resubmit** | Mengirim ulang dokumen setelah direvisi. Chain approval dimulai ulang dari Section Head. |
| **Section Head** | Peran approver tingkat pertama (Superior). |
| **Self Reject** | Tindakan Requester menolak dokumen sendiri secara permanen saat status Revised. |
| **SHA-256** | Algoritma hash untuk memverifikasi integritas file General Journal yang disimpan. |
| **Superior / Superior of Superior** | Nama internal untuk tingkat approval kedua (Section Head) dan ketiga (Dept/Div Head). |
| **Waiting Approval** | Status dokumen yang sedang dalam antrian approval (Section Head atau Dept Head). |

---

### Lampiran: Kontak Dukungan

Jika Anda mengalami kendala yang tidak dapat diselesaikan dengan panduan ini, hubungi:

- **Admin JAGO** — untuk masalah akun, reset password, atau konfigurasi role.
- **IT Infrastructure PT Astra Visteon** — untuk masalah jaringan, email, dan akses ke aplikasi.
- **Supervisor Accounting** — untuk pertanyaan terkait kebijakan jurnal, bukan sistem.

---

*Buku panduan ini merujuk pada JAGO versi terakhir per Oktober 2026. Jika terdapat perubahan antarmuka atau alur kerja, versi terbaru akan diunggah oleh Admin JAGO di menu User Manual.*
