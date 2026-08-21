# UI Mockup (Wireframe Tekstual)

## 1. Login Page
+-------------------------------------------+
| |
| [Logo GJAS] |
| |
| Email: [] |
| Password: [] |
| |
| [ Login ] |
| |
+-------------------------------------------+

text

## 2. Layout Utama (Sidebar)
+----------------+-----------------------------------+
| Sidebar | Header (user info, logout) |
| +-----------------------------------+
| - Monitoring | Content Area |
| - Approval * | |
| - Tracking | |
| - Buat Draft **| |
+----------------+-----------------------------------+

text
*Menu Approval hanya muncul untuk Section Head & Dept/Div Head.  
**Menu Buat Draft muncul untuk Staff & Section Head (jika belum ada draft aktif).

## 3. Monitoring Page
+---------------------------------------------------------------+
| Monitoring General Journal [Export Excel]|
| |
| Filter: [Status ▼] [Tanggal ▼] [User/Role ▼] [Search] |
| |
| Tabel: |

Doc Number	Tgl Journal	Reference	Status	Assign To	Person Request	Last Updated	Aksi
GJ-001	2025-08-01	...	Waiting	Section	Staff A	2025-08-01	📎 📜
GJ-002	2025-08-02	...	Approved	-	Staff B	2025-08-02	📎 📜
[Pagination]							
+---------------------------------------------------------------+							
text
Keterangan:
- Ikon 📎 : membuka modal daftar file (general journal & supporting docs).
- Ikon 📜 : membuka modal timeline history.

## 4. Modal Detail File & History
+--------------------------------------------------+
| Attachment / History [X] |
+--------------------------------------------------+
| [Tab: Files] [Tab: History] |
| |
| Files: |
| - General Journal: GJ-001.pdf [Preview] [Download]|
| - Supporting: doc1.xlsx [Preview] [Download] |
| - Supporting: bukti.png [Preview] [Download] |
| |
| History (timeline): |
| 2025-08-01 10:00 - Staff A submit |
| 2025-08-01 11:00 - Section Head approve |
| 2025-08-01 13:00 - Dept/Div Head approve |
| |
+--------------------------------------------------+

text

## 5. Approval Page (Section Head / Dept/Div Head)
+---------------------------------------------------------------+
| Approval General Journal |
| |
| Tabel antrian: |

Doc Number	Tgl Journal	Reference	Status	Assign To	Aksi
GJ-001	2025-08-01	...	Waiting	You	[Approve] [Reject] [Detail]
GJ-003	2025-08-03	...	Waiting	You	[Approve] [Reject] [Detail]
+---------------------------------------------------------------+					
text
Detail / Modal Approval:
+--------------------------------------------------+
| Document Number: GJ-001 |
| Tanggal Journal: 2025-08-01 |
| Reference: ... |
| |
| [Preview General Journal PDF] |
| [List Supporting Documents] |
| |
| Notes (jika Reject): [________________________] |
| |
| [Approve] [Reject] |
+--------------------------------------------------+

text

## 6. Buat Draft / Submit / Resubmit
+--------------------------------------------------+
| Buat / Edit Draft |
| |
| Document Number: [] (manual) |
| Tanggal Journal: [] (date picker) |
| Reference: [________________________] |
| |
| General Journal (PDF): [Upload] |
| Supporting Documents: [Upload multiple] |
| |
| [Simpan Draft] [Submit] |
+--------------------------------------------------+

text
Saat resubmit setelah reject:
- Form hanya menampilkan tombol upload ulang file (versi baru), tidak bisa mengubah data lain.
- Tombol "Resubmit" menggantikan "Simpan Draft/Submit".

## 7. Tracking Page
Mirip monitoring, tetapi tanpa filter assign to. Terdapat ikon timeline untuk melihat detail. Staff mungkin hanya melihat tracking miliknya sendiri (sesuai kebijakan).