# AI Agent Development Constraints (DO & DON'TS)
## JAGO (Journal Approval General Operations) System

---

### 1. Objectives & Scope
This document outlines strict architectural and business constraints for the JAGO system at PT Astra Visteon Indonesia. All development must adhere strictly to these guidelines.

---

### 2. DO (Mandatory Requirements)

#### 2.1 Language & Global Terminology
- Use 100% English across the entire UI, flash notifications, badges, validation messages, and email templates.
- Consistently use standard terms:
  - `Person Request` / `Requester`
  - `Created By`
  - `Assign To`
  - `Document Number`
  - `Journal Date`
  - `Status`

#### 2.2 Document Numbering & Dates
- Ensure every document number begins with the prefix **`JOT `** (e.g. `JOT 12345`). Show and format this prefix in real time.
- Synchronize the digital **Accounting** stamp approval date with the requester's chosen `journal_date`.
- Ensure Superior and Superior of Superior stamps reflect their actual approval date and timestamp.

#### 2.3 Workflow, Revision & Self-Reject
- Enforce the 5 standard statuses: `Draft`, `Waiting Approval`, `Revised`, `Approved`, `Rejected`.
- Approvers must never permanently reject documents; their action is **"Request Revision"** (`Revised`), which requires feedback notes.
- Only the **Requester** can permanently reject a document (**"Self Reject"**) while in `Revised` status.
- When resubmitting a `Revised` journal, allow replacing General Journal and Supporting Document files. Previous files are replaced and file version is incremented.

#### 2.4 Drafts & Bulk Submission
- Keep the draft creation form on a distinct route: `/general-journals/create`.
- Provide the draft list with multi-select checkboxes and bulk submission on a separate page: `/drafts`.
- Include draft documents in the general Monitoring view with appropriate badges.

#### 2.5 Monitoring Table
- Include a sequential index `#` column.
- Provide dedicated in-column searchbars directly beneath header rows for `No Document`, `Journal Date`, `Assign To`, and `Requester`.

---

### 3. DON'T (Strict Prohibitions)

#### 3.1 Prohibited Practices
- **DO NOT** use Indonesian language in any part of the UI, email templates, status tags, or alerts.
- **DO NOT** omit the `JOT ` prefix from document numbering.
- **DO NOT** allow approvers to permanently reject documents; approver action must always be "Revise".
- **DO NOT** allow file edits or deletions on documents in `Waiting Approval` or `Approved` status.
- **DO NOT** allow re-uploading files if the document is in `Rejected` status (rejection permanently locks the document).
- **DO NOT** merge the "Create Draft" page into the "Drafts List" page (they must remain on distinct routes).
- **DO NOT** break the single-codebase monolith architecture (Inertia + Laravel + React).