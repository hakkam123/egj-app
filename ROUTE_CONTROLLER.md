# Route & Controller Map

## Struktur Route (web.php)

| Method | URI | Controller@Method | Middleware | Keterangan |
|--------|-----|-------------------|------------|------------|
| GET | `/login` | `Auth\LoginController@showLoginForm` | guest | Halaman login |
| POST | `/login` | `Auth\LoginController@login` | guest | Proses login |
| POST | `/logout` | `Auth\LoginController@logout` | auth | Logout |
| GET | `/` | `DashboardController@index` | auth | Redirect ke monitoring |
| GET | `/monitoring` | `MonitoringController@index` | auth | Halaman monitoring GJ |
| GET | `/monitoring/export` | `MonitoringController@export` | auth | Export data ke Excel |
| GET | `/general-journals/create` | `GeneralJournalController@create` | auth | Form buat draft (Staff/Section Head) |
| POST | `/general-journals` | `GeneralJournalController@store` | auth | Simpan draft |
| GET | `/general-journals/{id}/edit` | `GeneralJournalController@edit` | auth | Edit draft sebelum submit |
| PUT | `/general-journals/{id}` | `GeneralJournalController@update` | auth | Update draft |
| POST | `/general-journals/{id}/submit` | `GeneralJournalController@submit` | auth | Submit draft ke alur approval |
| GET | `/general-journals/{id}` | `GeneralJournalController@show` | auth | Detail GJ (modal/page) |
| GET | `/approval` | `ApprovalController@index` | auth, role:Section Head/Dept Div Head | Daftar antrian approval |
| GET | `/approval/{id}` | `ApprovalController@show` | auth, role:Section Head/Dept Div Head | Detail approval |
| POST | `/approval/{id}/approve` | `ApprovalController@approve` | auth, role:Section Head/Dept Div Head | Aksi approve |
| POST | `/approval/{id}/reject` | `ApprovalController@reject` | auth, role:Section Head/Dept Div Head | Aksi reject + notes |
| GET | `/tracking` | `TrackingController@index` | auth | Daftar GJ untuk tracking |
| GET | `/tracking/{id}` | `TrackingController@show` | auth | Timeline history (modal) |
| GET | `/preview/{token}` | `PreviewController@show` | guest, token valid | Preview dokumen tanpa login |
| GET | `/approve-email/{token}` | `EmailApprovalController@approve` | guest, token valid | Approve via email (khusus Bu Alisa) |
| GET | `/files/{id}/download` | `FileController@download` | auth | Download file (versi aktif) |
| GET | `/files/{id}/preview` | `FileController@preview` | auth | Preview file di modal |

## Catatan Middleware
- `auth`: hanya user yang sudah login.
- `role:Section Head/Dept Div Head`: custom middleware untuk membatasi akses berdasarkan role.
- `guest`: khusus untuk user yang belum login (login page).
- Token route (`/preview/{token}` dan `/approve-email/{token}`) menggunakan validasi token dari tabel `email_tokens`.

## Controller Utama
1. `Auth\LoginController` – autentikasi session.
2. `DashboardController` – halaman awal (redirect).
3. `MonitoringController` – daftar GJ, filter, export Excel.
4. `GeneralJournalController` – CRUD draft, submit, resubmit.
5. `ApprovalController` – daftar antrian, approve, reject.
6. `TrackingController` – daftar tracking, timeline.
7. `PreviewController` – preview dokumen tanpa login.
8. `EmailApprovalController` – approve via email token.
9. `FileController` – download/preview file.