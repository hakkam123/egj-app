# Route & Controller Architecture Map
## JAGO (Journal Approval General Operations) System

---

### 1. Web Routes (`routes/web.php`)

| Method | URI | Controller Action | Middleware | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/login` | `Auth\LoginController@showLoginForm` | `guest` | Login page |
| `POST` | `/login` | `Auth\LoginController@login` | `guest` | Authenticate user session |
| `POST` | `/logout` | `Auth\LoginController@logout` | `auth` | Destroy session & logout |
| `GET` | `/` | `DashboardController@index` | `auth` | Main dashboard with KPI metrics & charts |
| `GET` | `/monitoring` | `MonitoringController@index` | `auth` | Monitoring table with in-column searchbars & `#` column |
| `GET` | `/monitoring/export` | `MonitoringController@export` | `auth` | Export filtered monitoring data to Excel |
| `GET` | `/drafts` | `GeneralJournalController@drafts` | `auth` | Drafts management page with bulk submit |
| `POST` | `/general-journals/bulk-submit` | `GeneralJournalController@bulkSubmit` | `auth` | Bulk submit multiple selected draft journals |
| `GET` | `/general-journals/create` | `GeneralJournalController@create` | `auth` | Create General Journal draft or submit |
| `POST` | `/general-journals` | `GeneralJournalController@store` | `auth` | Store new draft or direct submission |
| `GET` | `/general-journals/{id}` | `GeneralJournalController@show` | `auth` | Document details page with file & stamp viewer |
| `GET` | `/general-journals/{id}/edit` | `GeneralJournalController@edit` | `auth` | Edit draft or prepare revision files |
| `POST` | `/general-journals/{id}` | `GeneralJournalController@update` | `auth` | Save updated draft |
| `POST` | `/general-journals/{id}/submit` | `GeneralJournalController@submitSingle`| `auth` | Submit single draft to approval queue |
| `POST` | `/general-journals/{id}/resubmit` | `GeneralJournalController@resubmit` | `auth` | Resubmit revised journal with new files |
| `POST` | `/general-journals/{id}/self-reject`| `GeneralJournalController@selfReject` | `auth` | Self-reject revised journal by requester |
| `DELETE`| `/general-journals/{id}` | `GeneralJournalController@destroy` | `auth` | Delete draft document |
| `GET` | `/approval` | `ApprovalController@index` | `auth`, `role:Section Head,Dept/Div Head` | Approval queue list |
| `GET` | `/approval/{id}` | `ApprovalController@show` | `auth`, `role:Section Head,Dept/Div Head` | Review journal, live PDF & stamp preview |
| `POST` | `/approval/{id}/approve` | `ApprovalController@approve` | `auth`, `role:Section Head,Dept/Div Head` | Approve journal with digital stamp |
| `POST` | `/approval/{id}/revise` | `ApprovalController@revise` | `auth`, `role:Section Head,Dept/Div Head` | Request revision with feedback notes |
| `GET` | `/tracking/{id}` | `TrackingController@show` | `auth` | Fetch JSON journal audit timeline data for History Modal |
| `GET` | `/general-journals/{id}/history` | `TrackingController@show` | `auth` | Fetch JSON journal audit timeline data |
| `GET` | `/preview/{token}` | `PreviewController@show` | `guest` | Secure token document preview |
| `GET` | `/approve-email/{token}` | `EmailApprovalController@approve` | `guest` | One-click remote email approval |
| `GET` | `/revise-email/{token}` | `EmailApprovalController@showRevise` | `guest` | Email revision form |
| `POST` | `/revise-email/{token}` | `EmailApprovalController@revise` | `guest` | Submit revision notes via email link |
| `GET` | `/files/{id}/download` | `FileController@download` | `auth` | Download attached file |
| `GET` | `/files/{id}/preview` | `FileController@preview` | `auth` | Stream attached PDF/image file for preview |
| `GET` | `/profile` | `ProfileController@edit` | `auth` | User profile & password management |
| `PUT` | `/profile` | `ProfileController@update` | `auth` | Update profile information |
| `PUT` | `/profile/password` | `ProfileController@updatePassword` | `auth` | Update account password |
| `GET` | `/tutorial` | `TutorialController@index` | `auth` | User guide and downloadable PDF manuals |
| `POST` | `/tutorial` | `TutorialController@store` | `auth`, `role:Admin` | Upload tutorial PDF |
| `DELETE`| `/tutorial/{id}` | `TutorialController@destroy` | `auth`, `role:Admin` | Delete tutorial document |
| `GET` | `/users` | `UserController@index` | `auth`, `role:Admin` | Admin user directory |
| `POST` | `/users` | `UserController@store` | `auth`, `role:Admin` | Create new system user |
| `PUT` | `/users/{id}` | `UserController@update` | `auth`, `role:Admin` | Update system user |
| `DELETE`| `/users/{id}` | `UserController@destroy` | `auth`, `role:Admin` | Delete system user |
| `GET` | `/error-monitoring` | `ErrorMonitoringController@index` | `auth`, `role:Admin` | System error log viewer |

---

### 2. Core Controller Responsibilities
1. **`GeneralJournalController`**: Manages the end-to-end lifecycle of journals: Draft creation, Drafts page listing, single and bulk submissions, file replacement on revision, and requester self-rejection.
2. **`ApprovalController`**: Handles the approver workflow: queue listing, detailed document review with stamped preview, approving, and requesting revisions.
3. **`MonitoringController`**: Powers real-time search, multi-column filtering, and Excel export.
4. **`EmailApprovalController`**: Implements remote token-based approval and revision requests without requiring prior login.