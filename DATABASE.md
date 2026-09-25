# Database Schema Documentation
## JAGO (Journal Approval General Operations) System
**Database Engine:** Microsoft SQL Server (`sqlsrv`)

---

### 1. Entity-Relationship Overview
```
users (1) ──────────< (N) general_journals [requested_by]
users (1) ──────────< (N) general_journals [current_assign_to]
general_journals (1) ─< (N) general_journal_files
general_journals (1) ─< (N) general_journal_approvals
general_journals (1) ─< (N) approval_histories
general_journals (1) ─< (N) email_tokens
users (1) ──────────< (N) general_journal_approvals [assigned_user_id, approved_by_user_id]
```

---

### 2. Table Definitions

#### 2.1 Table: `users`
Stores user credentials, organizational designation, and system roles.
| Column | Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | `INT IDENTITY` | Primary Key |
| `name` | `NVARCHAR(100)` | Full user name |
| `email` | `NVARCHAR(255)` | Unique corporate email address |
| `password` | `NVARCHAR(255)` | Bcrypt hash |
| `role` | `NVARCHAR(50)` | `'Staff'`, `'Section Head'`, `'Dept/Div Head'`, `'Admin'` |
| `npk` | `NVARCHAR(50)` | Employee identification number (NPK) |
| `is_active` | `BIT` | Active status (`1` = active, `0` = deactivated) |
| `created_at` | `DATETIME2` | Timestamp |
| `updated_at` | `DATETIME2` | Timestamp |

---

#### 2.2 Table: `general_journals`
Core transactional table storing general journal header details and workflow status.
| Column | Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | `INT IDENTITY` | Primary Key |
| `document_number` | `NVARCHAR(100)` | Unique document identifier with `JOT ` prefix (e.g., `JOT 12345`) |
| `journal_date` | `DATE` | General journal posting date (synced to Accounting stamp date) |
| `reference` | `NVARCHAR(MAX)` | Description / business purpose |
| `status` | `NVARCHAR(50)` | Check constraint: `('Draft', 'Waiting Approval', 'Revised', 'Approved', 'Rejected')` |
| `requested_by` | `INT` | Foreign Key → `users.id` (Requester / Person Request) |
| `current_assign_to` | `INT` | Foreign Key → `users.id`, nullable (Current workflow assignee) |
| `resubmit_count` | `INT` | Count of revisions/resubmissions (default `0`) |
| `submitted_at` | `DATETIME2` | Initial submission timestamp (null if draft) |
| `last_updated_at` | `DATETIME2` | Timestamp of latest workflow state change |
| `created_at` | `DATETIME2` | Timestamp |
| `updated_at` | `DATETIME2` | Timestamp |

---

#### 2.3 Table: `general_journal_files`
Manages attached General Journal vouchers and supporting attachments with version control.
| Column | Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | `INT IDENTITY` | Primary Key |
| `general_journal_id` | `INT` | Foreign Key → `general_journals.id` |
| `category` | `NVARCHAR(50)` | `'general_journal'` or `'supporting_document'` |
| `file_name` | `NVARCHAR(255)` | Original client file name |
| `file_path` | `NVARCHAR(500)` | Relative storage disk path |
| `file_size` | `BIGINT` | File size in bytes (max 10MB per file) |
| `mime_type` | `NVARCHAR(100)` | Content MIME type (`application/pdf`, etc.) |
| `version` | `INT` | Incrementing version number for file replacement on revision |
| `is_active` | `BIT` | Active flag (`1` = active/current version, `0` = archived) |
| `uploaded_at` | `DATETIME2` | Upload timestamp |
| `created_at` | `DATETIME2` | Timestamp |
| `updated_at` | `DATETIME2` | Timestamp |

---

#### 2.4 Table: `general_journal_approvals`
Tracks sequential multi-tier approval records and digital stamping data.
| Column | Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | `INT IDENTITY` | Primary Key |
| `general_journal_id` | `INT` | Foreign Key → `general_journals.id` |
| `approval_level` | `NVARCHAR(50)` | `'accounting'`, `'superior'`, `'superior_of_superior'` |
| `assigned_user_id` | `INT` | Foreign Key → `users.id` (Assigned approver) |
| `approved_by_user_id` | `INT` | Foreign Key → `users.id`, nullable (Actual signatory) |
| `status` | `NVARCHAR(50)` | `'Pending'`, `'Approved'`, `'Revised'`, `'Rejected'` |
| `approved_at` | `DATETIME2` | Timestamp of approval (Accounting level = synced to `journal_date`) |
| `notes` | `NVARCHAR(MAX)` | Revision comments or rejection rationale |
| `created_at` | `DATETIME2` | Timestamp |
| `updated_at` | `DATETIME2` | Timestamp |

---

#### 2.5 Table: `approval_histories`
Immutable audit log tracking all actions performed on every General Journal.
| Column | Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | `INT IDENTITY` | Primary Key |
| `general_journal_id` | `INT` | Foreign Key → `general_journals.id` |
| `action` | `NVARCHAR(50)` | `'submit'`, `'approve'`, `'revise'`, `'reject'`, `'resubmit'` |
| `actor_user_id` | `INT` | Foreign Key → `users.id` (User executing the action) |
| `target_level` | `NVARCHAR(50)` | Target level context (`accounting`, `superior`, etc.) |
| `notes` | `NVARCHAR(MAX)` | Action comments or revision request notes |
| `created_at` | `DATETIME2` | Timestamp |

---

#### 2.6 Table: `email_tokens`
Manages secure single-use or time-bounded tokens for remote email approval actions.
| Column | Type | Constraints / Details |
| :--- | :--- | :--- |
| `id` | `INT IDENTITY` | Primary Key |
| `general_journal_id` | `INT` | Foreign Key → `general_journals.id` |
| `token` | `NVARCHAR(255)` | Unique SHA-256 token string |
| `email` | `NVARCHAR(255)` | Recipient email address |
| `purpose` | `NVARCHAR(50)` | `'approval'`, `'preview'`, `'revise'` |
| `expires_at` | `DATETIME2` | Expiry deadline (5 business days) |
| `used_at` | `DATETIME2` | Nullable timestamp when consumed |
| `created_at` | `DATETIME2` | Timestamp |