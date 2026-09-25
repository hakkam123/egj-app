# Product Requirements Document (PRD)
## JAGO (Journal Approval General Operations) System
**PT Astra Visteon Indonesia**

---

### 1. Background & Objectives
The Accounting Department of PT Astra Visteon Indonesia requires a digital approval management platform (**JAGO**) to replace manual routing and physical stamping of General Journal vouchers. JAGO streamlines submission, multi-tiered digital stamp approval, tracking, monitoring, and auditing across the organization.

**Primary Objectives:**
- Automate multi-tiered approval workflows with real-time digital stamping.
- Eliminate lost paperwork and approval bottlenecks.
- Maintain a tamper-proof audit trail for every transaction.
- Provide real-time monitoring with in-column searching, draft bulk-submission, and email notifications.

---

### 2. Global Standards & UI Language
- **Language**: 100% English across the entire application (UI labels, table headers, status badges, action modals, toast alerts, and email templates).
- **Core Terminology**:
  - `Person Request` / `Requester`
  - `Created By`
  - `Assign To`
  - `Document Number` (prefixed with `JOT `)
  - `Journal Date`
  - `Status`

---

### 3. User Roles & Access Matrix
| Role | Responsibilities | Key Capabilities |
| :--- | :--- | :--- |
| **Staff (Requester)** | Prepares and submits General Journal documents. | Create Drafts, Edit Drafts, Bulk Submit Drafts, Resubmit Revisions, Self-Reject, View Monitoring & Timelines. |
| **Section Head (Superior)** | Reviews submissions, acts as Superior approver, and can submit General Journals. | Approval Queue, Approve, Request Revision, Create/Submit Journals (auto-approved up to Section Head level). |
| **Dept / Div Head (Superior of Superior)** | Final authority for General Journal approval. | Approval Queue, Approve, Request Revision, Email One-Click Approval / Revision. |
| **Admin** | System administration & user directory management. | User Management, System Error Log Monitoring, Guide / Tutorial Management. |

---

### 4. Key Functional Specifications

#### 4.1 Document Numbering & Prefix
- Every document number is prefixed with **`JOT `** (e.g., `JOT 12345`).
- The system renders and enforces the `JOT ` prefix in real time during input and display.
- Document numbers must be unique across the system.

#### 4.2 Journal Date & Digital Accounting Stamp
- When a General Journal is submitted, the digital **Accounting** stamp approval date is **automatically synchronized to the requester's selected Journal Date** (e.g., if Journal Date is `2026-09-24`, the Accounting approved date stamp is `2026-09-24`).
- Digital stamps for **Superior** and **Superior of Superior** reflect their exact date and time of approval.

#### 4.3 Document Lifecycle & Status Flow
The document transitions across 5 defined statuses:
1. **`Draft`**: Saved locally by the requester; not yet entered into the approval queue. Visible in the Drafts management menu and Monitoring.
2. **`Waiting Approval`**: Active in the sequential approval queue (`Superior` → `Superior of Superior`).
3. **`Revised`**: An approver has audited the submission, found discrepancies, and requested revisions with mandatory feedback notes.
4. **`Approved`**: Final approval completed by Dept/Div Head; digital stamps finalized.
5. **`Rejected`**: Permanently closed and locked. **Rejection can only be performed by the Requester** (Self-Reject) while the document is in `Revised` status. Approvers do not reject permanently; they request revisions.

#### 4.4 Draft Management & Bulk Submit
- **Create Draft**: Dedicated creation screen at `/general-journals/create`. Users can choose to "Save as Draft" or "Submit Journal".
- **Draft Documents Menu**: Dedicated listing at `/drafts` showing all drafts created by the user.
- **Bulk Submit**: Multi-select checkboxes on the Drafts page allow requesters to submit multiple draft documents into the approval pipeline simultaneously.
- Draft documents are also included and searchable in the main Monitoring view.

#### 4.5 Revision & Self-Reject Flow
- When a document is marked **`Revised`**:
  - The requester receives an email notification containing the approver's revision notes.
  - The requester can navigate to the edit/revision screen to upload replacement General Journal and/or Supporting Document files (previous versions are replaced).
  - The requester clicks **"Resubmit Journal"** to restart the approval queue from Superior level.
  - Alternatively, if the requester decides to discard the request entirely, they can click **"Self Reject"** to close the document permanently.

#### 4.6 Monitoring & In-Column Search
- **Row Numbering Column (`#`)**: Provides clear visual row index numbering across all paginated pages.
- **In-Column Searchbars**: Dedicated search inputs located directly beneath header columns:
  - `No Document`
  - `Journal Date`
  - `Assign To`
  - `Requester` / `Person Request`
- **KPI Quick Filters**: Filter tabs for All, Waiting Approval, Revised, Approved, Rejected, and Draft.
- **Excel Export**: Export filtered monitoring records to `.xlsx` with English column headers.

---

### 5. Non-Functional Requirements
- **Architecture**: Monolithic Laravel 12 + Inertia.js + React 19 SPA.
- **Database**: Microsoft SQL Server with strict foreign keys and check constraints.
- **Styling**: Tailwind CSS with Astra Visteon corporate navy theme (`#1a2540`), responsive design, and micro-animations.
- **Email Security**: Secure time-limited tokens (5 business days) for remote Dept Head one-click review and revision actions.