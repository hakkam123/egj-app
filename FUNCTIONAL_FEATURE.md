# Functional Features Documentation
## JAGO (Journal Approval General Operations) System

---

### 1. Authentication & Profile Management
- Secure session-based authentication with email and password.
- Role-based authorization: **`Staff`**, **`Section Head`**, **`Dept/Div Head`**, **`Admin`**.
- User profile editing (Name, Email, NPK) and password change with real-time validation.

---

### 2. General Journal Creation & Draft Management
- **Create Screen (`/general-journals/create`)**:
  - **Document Number**: Pre-formatted with real-time `JOT ` prefix (e.g., `JOT 12345`). Input is sanitized and validated for uniqueness.
  - **Journal Date**: Date picker. The selected date automatically governs the approval date shown in the digital **Accounting** stamp box.
  - **Reference**: Multi-line description field.
  - **General Journal PDF**: Mandatory 1 PDF file (max 10MB).
  - **Supporting Documents**: Multiple files allowed (PDF, JPG, PNG, XLSX, max 10MB each).
  - **Actions**:
    - `Save as Draft`: Saves the document with status `Draft`.
    - `Submit Journal`: Directly creates and enters the document into the approval queue.
- **Drafts Management (`/drafts`)**:
  - Lists all pending drafts created by the current requester.
  - **Multi-Select Checkboxes**: Select individual drafts or toggle "Select All".
  - **Bulk Submit**: Single-click modal to submit all checked drafts into the approval workflow simultaneously.
  - Individual actions: Edit, Submit, or Delete.

---

### 3. Sequential Approval Workflow & Digital Stamping
- **Approval Queue (`/approval`)**:
  - Accessible to `Section Head` and `Dept/Div Head`.
  - Filter by level (Superior vs Superior of Superior), quick KPI counters.
- **Workflow Routing**:
  - **Staff Submission**:
    1. `Accounting`: Automatically approved with date equal to requester's `journal_date`.
    2. `Superior` (`Section Head`): Assigned to review.
    3. `Superior of Superior` (`Dept/Div Head`): Assigned after Superior approval.
  - **Section Head Submission**:
    1. `Accounting` & `Superior`: Automatically stamped as approved upon submission.
    2. `Superior of Superior`: Assigned directly to Dept/Div Head.
- **Digital Stamping Rules**:
  - **Accounting Stamp**: Date displays exact `journal_date` selected by requester; approved by requester.
  - **Superior Stamp**: Displays date and time when Section Head approved, along with approver name.
  - **Superior of Superior Stamp**: Displays date and time when Dept/Div Head approved, along with approver name.

---

### 4. Revision & Self-Rejection Flow
- **Requesting Revision (`Revised`)**:
  - Approvers review submissions. If errors or missing supporting documentation are detected, the approver clicks **"Request Revision"**.
  - Approvers must supply mandatory revision notes explaining the required corrections.
  - The document status transitions to **`Revised`**, and the current assignee reverts to the requester.
  - Approvers do **not** permanently reject documents.
- **Requester Actions on `Revised` Status**:
  - **Re-upload & Resubmit**: The requester accesses `/general-journals/{id}/edit`. Uploading new General Journal or Supporting Document files replaces older active files (archiving previous versions). Clicking **"Resubmit Journal"** resets the approval chain back to Superior level.
  - **Self-Reject**: If the requester chooses not to proceed, they click **"Self Reject"**. The document status permanently changes to **`Rejected`** and is locked against further edits or resubmissions.

---

### 5. Real-Time Monitoring & In-Column Filtering
- Accessible across all roles at `/monitoring`.
- **Row Numbering Column (`#`)**: Accurate sequential index numbering across all table pages.
- **In-Column Searchbars**: Embedded directly beneath header columns:
  - `No Document`: Instant substring filter (e.g. `JOT 123`).
  - `Journal Date`: Date matching filter.
  - `Assign To`: Filter by assigned approver or user name.
  - `Requester` / `Person Request`: Filter by submitting user name.
- **KPI Quick Tabs**: Filter by `All`, `Waiting Approval`, `Revised`, `Approved`, `Rejected`, and `Draft`.
- **File Modal & History Modal**: Quick view of attached files and visual vertical timeline audit history.
- **Export to Excel**: One-click download of filtered monitoring records in `.xlsx` format.

---

### 6. Email Notifications & Remote One-Click Actions
- Automated notification emails dispatched upon:
  - New journal submission (sent to Superior).
  - Superior approval (sent to Dept/Div Head).
  - Revision requested (sent to Requester with approver notes).
  - Final approval or Self-rejection (sent to Requester).
- **Dept/Div Head Remote Actions**:
  - Email contains one-click buttons to Approve or Request Revision with a 5-day secure token, with no mandatory prior login.