# UI Mockup & Wireframes
## JAGO (Journal Approval General Operations) System

---

### 1. Navigation & App Shell
```
+-----------------------------------------------------------------------------------------+
| [JAGO LOGO]  Dashboard  Monitoring  Draft Documents  Approval (2)        [User (Role)]  |
+-----------------------------------------------------------------------------------------+
```

---

### 2. Draft Documents Page (`/drafts`)
```
+-----------------------------------------------------------------------------------------+
| Draft Documents                                                  [ + Create New Draft ] |
| Manage and bulk-submit pending draft journal entries                                     |
|                                                                                         |
| [X Selected: 3]   [ Bulk Submit Selected (3) ]   [ Search Drafts... ]                   |
+----+----+---------------------+--------------+----------------------+--------+----------+
| [x]| #  | Document Number     | Journal Date | Reference            | Files  | Actions  |
+----+----+---------------------+--------------+----------------------+--------+----------+
| [x]| 1  | JOT 10021           | Sep 24, 2026 | Utility Accrual Sep  | 2 file | Submit/Del|
| [x]| 2  | JOT 10022           | Sep 24, 2026 | Freight Expenses     | 3 file | Submit/Del|
| [x]| 3  | JOT 10023           | Sep 25, 2026 | Inventory Adjustment | 1 file | Submit/Del|
+----+----+---------------------+--------------+----------------------+--------+----------+
```

---

### 3. Create Draft Screen (`/general-journals/create`)
```
+-----------------------------------------------------------------------------------------+
| Create General Journal Draft                                                            |
| Fill in details to create a draft or submit directly for approval                       |
+-----------------------------------------------------------------------------------------+
| Document Number *                                                                       |
| [ JOT ] [ 12345                                                                       ] |
|                                                                                         |
| Journal Date *                                                                          |
| [ 2026-09-24                                                                        📅 ] |
| (Note: The Accounting approval stamp date will automatically synchronize to this date)  |
|                                                                                         |
| Reference / Description *                                                               |
| [ Enter detailed description of this journal transaction...                          ] |
|                                                                                         |
| General Journal PDF File * (Max 10MB)                                                   |
| [ Choose File: GeneralJournal_Sep24.pdf                                               ] |
|                                                                                         |
| Supporting Documents (Max 10MB each)                                                    |
| [ Choose Files: invoice_01.pdf, receipt.png                                           ] |
|                                                                                         |
|                                            [ Cancel ]  [ Save as Draft ]  [ Submit ]    |
+-----------------------------------------------------------------------------------------+
```

---

### 4. Monitoring Page (`/monitoring`)
```
+-----------------------------------------------------------------------------------------+
| General Journal Monitoring                                            [ 📥 Export Excel ]|
| Real-time overview of all journal submissions and workflow statuses                     |
|                                                                                         |
| [All (42)] [Waiting Approval (5)] [Revised (2)] [Approved (30)] [Rejected (1)] [Draft (4)]|
+----+-------------------+--------------+---------------+-----------------+---------------+
| #  | No Document       | Journal Date | Assign To     | Requester       | Status        |
+----+-------------------+--------------+---------------+-----------------+---------------+
|    | [🔍 Filter Doc...]| [🔍 Date... ]| [🔍 Assign...]| [🔍 Requester..]|               |
+----+-------------------+--------------+---------------+-----------------+---------------+
| 1  | JOT 12345         | 2026-09-24   | Section Head  | John Doe        | Waiting       |
| 2  | JOT 12344         | 2026-09-23   | John Doe      | John Doe        | Revised       |
| 3  | JOT 12340         | 2026-09-20   | -             | Jane Smith      | Approved      |
| 4  | JOT 12338         | 2026-09-18   | -             | Alex Wilson     | Rejected      |
+----+-------------------+--------------+---------------+-----------------+---------------+
```

---

### 5. Document Details & Review Page (`/general-journals/{id}`)
```
+-----------------------------------------------------------------------------------------+
| Document Details: JOT 12345                                              [ Status Badge ]|
+-----------------------------------------------------------------------------------------+
| Requester: John Doe           Journal Date: Sep 24, 2026      Assign To: Section Head   |
| Reference: Monthly amortization of prepaid insurance expenses                           |
+-----------------------------------------------------------------------------------------+
| DIGITAL APPROVAL STAMPS                                                                 |
| +-------------------------+ +-------------------------+ +-----------------------------+ |
| |       ACCOUNTING        | |        SUPERIOR         | |    SUPERIOR OF SUPERIOR     | |
| |        APPROVED         | |        APPROVED         | |           PENDING           | |
| |       2026-09-24        | |       2026-09-25        | |              -              | |
| |        John Doe         | |     Jane SectionHead    | |              -              | |
| +-------------------------+ +-------------------------+ +-----------------------------+ |
+-----------------------------------------------------------------------------------------+
| ATTACHED DOCUMENTS                                                                      |
| - General Journal: GeneralJournal_Sep24.pdf (142 KB)    [ Preview ] [ Download ]        |
| - Supporting Doc: Invoice_01.pdf (85 KB)                [ Preview ] [ Download ]        |
+-----------------------------------------------------------------------------------------+
| (If Approver):                  [ Request Revision (Notes Required) ]  [ Approve Journal]|
| (If Requester & Revised):       [ Self Reject (Cancel) ]               [ Resubmit File ]|
+-----------------------------------------------------------------------------------------+
```

---

### 6. Request Revision Dialog (Approver)
```
+---------------------------------------------------------+
| Request Document Revision                             X |
+---------------------------------------------------------+
| Please describe what needs to be corrected or attached: |
| [ Missing supplier invoice stamp on page 2. Please re- ]|
| [ upload the stamped supporting document.              ]|
|                                                         |
|                             [ Cancel ] [ Send Revision ]|
+---------------------------------------------------------+
```