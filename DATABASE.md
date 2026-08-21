# Database Schema
## General Journal Approval System

### ERD Overview
users 1 ──── * general_journals (requested_by)
users 1 ──── * general_journals (current_assign_to)
general_journals 1 ──── * general_journal_files
general_journals 1 ──── * general_journal_approvals
general_journals 1 ──── * approval_histories
general_journals 1 ──── * email_tokens
users 1 ──── * general_journal_approvals (assigned_user_id & approved_by_user_id)


### Tabel: users
| Kolom      | Tipe          | Keterangan                          |
|------------|---------------|-------------------------------------|
| id         | INT IDENTITY  | Primary key                         |
| name       | NVARCHAR(100) | Nama user                           |
| email      | NVARCHAR(255) | Email unik                          |
| password   | NVARCHAR(255) | Hash password                       |
| role       | NVARCHAR(20)  | Staff / Section Head / Dept/Div Head|
| is_active  | BIT           | Status aktif                        |
| created_at | DATETIME2     |                                     |
| updated_at | DATETIME2     |                                     |

### Tabel: general_journals
| Kolom              | Tipe          | Keterangan                                   |
|--------------------|---------------|----------------------------------------------|
| id                 | INT IDENTITY  | Primary key                                  |
| document_number    | NVARCHAR(100) | Manual input                                 |
| journal_date       | DATE          | Tanggal journal                              |
| reference          | NVARCHAR(MAX) | Description                                  |
| status             | NVARCHAR(20)  | Draft / Waiting Approval / Approved / Rejected|
| requested_by       | INT           | FK users.id                                  |
| current_assign_to  | INT           | FK users.id, nullable                        |
| resubmit_count     | INT           | Jumlah resubmit                              |
| submitted_at       | DATETIME2     | Null jika draft                              |
| last_updated_at    | DATETIME2     | Update terakhir status                       |
| created_at         | DATETIME2     |                                              |
| updated_at         | DATETIME2     |                                              |

### Tabel: general_journal_files
| Kolom              | Tipe          | Keterangan                                   |
|--------------------|---------------|----------------------------------------------|
| id                 | INT IDENTITY  | Primary key                                  |
| general_journal_id | INT           | FK general_journals.id                       |
| category           | NVARCHAR(20)  | 'general_journal' / 'supporting_document'    |
| file_name          | NVARCHAR(255) | Nama file asli                               |
| file_path          | NVARCHAR(500) | Path penyimpanan                             |
| file_size          | INT           | Ukuran bytes                                 |
| mime_type          | NVARCHAR(100) | MIME type                                    |
| version            | INT           | Versi file, naik setiap resubmit             |
| is_active          | BIT           | Menandai file aktif (1) / lama (0)           |
| uploaded_at        | DATETIME2     |                                              |

### Tabel: general_journal_approvals
| Kolom                | Tipe          | Keterangan                                   |
|----------------------|---------------|----------------------------------------------|
| id                   | INT IDENTITY  | Primary key                                  |
| general_journal_id   | INT           | FK general_journals.id                       |
| approval_level       | NVARCHAR(30)  | 'accounting' / 'superior' / 'superior_of_superior' |
| assigned_user_id     | INT           | FK users.id, approver yang ditugaskan        |
| approved_by_user_id  | INT           | FK users.id, nullable                        |
| status               | NVARCHAR(20)  | Pending / Approved / Rejected                |
| approved_at          | DATETIME2     | Null jika pending                            |
| notes                | NVARCHAR(MAX) | Catatan reject                               |
| created_at           | DATETIME2     |                                              |
| updated_at           | DATETIME2     |                                              |

### Tabel: approval_histories
| Kolom              | Tipe          | Keterangan                                   |
|--------------------|---------------|----------------------------------------------|
| id                 | INT IDENTITY  | Primary key                                  |
| general_journal_id | INT           | FK general_journals.id                       |
| action             | NVARCHAR(30)  | 'submit' / 'approve' / 'reject' / 'resubmit' |
| actor_user_id      | INT           | FK users.id                                  |
| target_level       | NVARCHAR(30)  | Level target aksi                            |
| notes              | NVARCHAR(MAX) | Catatan                                      |
| created_at         | DATETIME2     |                                              |

### Tabel: email_tokens
| Kolom              | Tipe          | Keterangan                                   |
|--------------------|---------------|----------------------------------------------|
| id                 | INT IDENTITY  | Primary key                                  |
| general_journal_id | INT           | FK general_journals.id                       |
| token              | NVARCHAR(255) | Token unik                                   |
| email              | NVARCHAR(255) | Email tujuan                                 |
| purpose            | NVARCHAR(20)  | 'approval' / 'preview'                       |
| expires_at         | DATETIME2     | 5 hari kerja                                 |
| used_at            | DATETIME2     | Null jika belum dipakai                      |
| created_at         | DATETIME2     |                                              |