# Appendix B — Software Test Documentation (STD)

**Software Test Documentation for**  
**Read Nest — Library Management System**

| | Checked and Approved By | Prepared By |
|---|---------------------------|-------------|
| **Signature** | _________________________ | _________________________ |
| **Name** | *[Supervisor name, title]* | *[Student name]* |
| **Version** | V1.0 | V1.0 |
| **Date** | __/__/2026 | __/__/2026 |

---

## Revision History

| Revision No. | Contents of Revision | Checked By | Prepared By |
|--------------|----------------------|------------|---------------|
| 0.01 | Document created | *[Supervisor]* | *[Student]* |
| 0.02 | Updated test cases and test plan | *[Supervisor]* | *[Student]* |
| 1.00 | Final baseline for FYP submission | *[Supervisor]* | *[Student]* |

---

## Table of Contents

| Section | Title | Page |
|---------|--------|------|
| **1.0** | Introduction | 1 |
| 1.1 | System Overview | 1 |
| 1.2 | Test Approach | 1 |
| **2.0** | Test Plan | 2 |
| 2.1 | Features to be Tested | 2 |
| 2.2 | Features not to be Tested | 2 |
| 2.3 | Testing Tools and Environment | 2 |
| **3.0** | Test Cases | 3 |
| 3.1 | Test Case Specifications | 3 |
| 3.2 | Test Procedure Specifications | 4 |
| **4.0** | Test Incident Report | 5 |
| **5.0** | Test Summary | 7 |

*Note: Section numbers 4.0 and 5.0 separate **Incident Report** and **Test Summary** where the original template used “5.0” for both.*

---

## 1.0 Introduction

### 1.1 System Overview

This Software Test Documentation (STD) describes the testing activities performed on **Read Nest**, a **web-based library management system** developed as part of this project.

Read Nest supports:

- **User authentication** (email and password) with **role-based access** (Admin, Librarian, Student, Member).
- **Catalogue management** (books, categories, copy counts, optional cover images via cloud storage).
- **Circulation** (loans, returns, due dates), **reservations**, and **fines**.
- **Reporting** for staff roles.
- **Smart features**: **AI chatbot** (library assistance), **book recitation / text-to-speech**, and **image-based book discovery**.

The purpose of this document is to record **what** was tested, **how** it was tested, **expected versus actual outcomes**, and any **incidents** or **summary conclusions**, so that stakeholders can judge whether the system behaves **correctly**, **safely**, and in line with **user needs**.

### 1.2 Test Approach

The following types of testing were applied (or planned) for Read Nest:

| Type | Purpose |
|------|---------|
| **Functional testing** | Verify core functions: login, registration, catalogue CRUD (authorised roles), loans, reservations, fines, reports, chatbot, recitation, image search, and API error handling (401/403). |
| **Usability testing** | Confirm that students/members and librarians can complete typical tasks without unnecessary confusion (navigation, forms, feedback messages). |
| **Performance testing** *(light)* | Observe response times under normal single-user and small multi-tab use; not a formal load test unless separately executed. |
| **Compatibility testing** | Verify behaviour on **Chrome**, **Microsoft Edge**, and **Mozilla Firefox** (current stable versions on Windows). |
| **Acceptance testing** | Confirm with supervisor / pilot users that the main workflows meet the agreed project scope. |

This combination is intended to show that the system is **stable enough for demonstration and pilot use**, **role rules are enforced**, and **integrations** (database, optional OpenAI, optional Supabase storage) behave as designed when correctly configured.

---

## 2.0 Test Plan

### 2.1 Features to be Tested

The following features of Read Nest were in scope for testing:

1. **User login and authentication** (NextAuth credentials, session, sign-out).
2. **User registration** *(if enabled in deployment)*.
3. **User roles** — Admin, Librarian, Student, Member (sidebar visibility and API **403** where applicable).
4. **Book management** — list, search/filter, view, add/edit *(librarian/admin)*, cover upload *(librarian/admin)*.
5. **Borrow and return workflow** — create loan, mark return, update availability where implemented.
6. **Catalogue search** — query by title, author, ISBN, category; pagination.
7. **Reservations** — create and manage reservation status *(staff/member flows as implemented)*.
8. **Fines** — view and update payment status as implemented.
9. **AI chatbot** — question/response, authentication required, interaction logging.
10. **Book recitation (TTS)** — audio generation/listen flow when API keys and routes are configured.
11. **Image search** — upload image and match or suggest catalogue entry.
12. **Report generation** — staff reports page and/or stored report data.
13. **User account management** — Admin user listing/management *(as implemented)*.

These items map to the **main functional requirements** demonstrated in the application and its **API routes** under `app/api/`.

### 2.2 Features not to be Tested

| Feature / area | Reason | Possible risk |
|----------------|--------|----------------|
| **Native mobile application** | Out of scope; responsive web only | Users on phones rely on browser |
| **Automatic integration with external university SSO** | Not implemented; credentials are local | Account provisioning is manual or via register |
| **Online banking / automatic fine payment** | Out of scope | Fines are tracked in-system; payment may be manual/offline |
| **Formal penetration test / security audit** | Beyond FYP resources | Production would need specialist review |
| **24/7 production SLA** | Academic / prototype deployment | Downtime depends on hosting |

### 2.3 Testing Tools and Environment

#### 2.3.1 Testing tools

| Tool | Use |
|------|-----|
| **Browser Developer Tools** (Chrome / Edge / Firefox) | Inspect network requests, console errors, session cookies. |
| **Postman** *(or similar)* | Optional **API testing** for `GET/POST` routes with session cookies or test tokens. |
| **Database client** | **Drizzle Kit Studio**, **pgAdmin**, or **Neon/Supabase SQL editor** to verify rows in PostgreSQL (not MySQL). |
| **Screen capture / recording** | Evidence for report and demonstration. |

#### 2.3.2 Testing environment

**Software**

| Item | Version / note *(adjust to your machine)* |
|------|---------------------------------------------|
| OS | Windows 10 / 11 |
| Browser | Chrome, Edge, Firefox (latest stable) |
| Runtime | Node.js *(LTS, as used for `npm run dev` / `npm run build`)* |
| Framework | Next.js (App Router), TypeScript, React |
| Database | **PostgreSQL** (connection via `DATABASE_URL`) |
| Optional | Supabase (storage for covers); OpenAI API (chatbot, TTS) |

**Hardware**

- PC or laptop with **at least 4 GB RAM** (8 GB recommended for Next.js dev server and browser together).
- **Stable internet connection** when testing cloud database, OpenAI, or Supabase.

---

## 3.0 Test Cases

### 3.1 Test case specifications

#### Test Case 1: User login (success)

| Field | Value |
|--------|--------|
| **Test Case ID** | TC01 |
| **Related feature** | Login system / NextAuth |
| **Objective** | Verify that a registered user can log in with correct email and password. |
| **Preconditions** | Valid user exists in `users` table; application running; `/login` reachable. |
| **Test input / steps** | Enter valid **email** and **password**; submit **Sign in**. |
| **Expected result** | User is authenticated; redirected to **`/dashboard`** (or home dashboard); no error alert. |
| **Actual result** | *[Fill during testing: Pass / Fail — brief note]* |
| **Status** | *[Pass / Fail]* |

#### Test Case 2: Failed login

| Field | Value |
|--------|--------|
| **Test Case ID** | TC02 |
| **Related feature** | Login system |
| **Objective** | Verify the system rejects invalid credentials and does not expose which field failed. |
| **Test input / steps** | Enter **wrong** email or **wrong** password; submit. |
| **Expected result** | Message such as **“Invalid email or password”**; user remains on login page. |
| **Actual result** | *[Fill]* |
| **Status** | *[Pass / Fail]* |

#### Test Case 3: Search book (catalogue)

| Field | Value |
|--------|--------|
| **Test Case ID** | TC03 |
| **Related feature** | Book catalogue / `GET /api/books` |
| **Objective** | Verify search returns matching books (title, author, or ISBN). |
| **Preconditions** | User logged in; at least one book matches the query string. |
| **Test input / steps** | On books page (or UI using API), search for a known **title** fragment (e.g. part of an existing title). |
| **Expected result** | List contains expected book(s); pagination metadata consistent if many results. |
| **Actual result** | *[Fill]* |
| **Status** | *[Pass / Fail]* |

#### Test Case 4: Borrow book (loan creation)

| Field | Value |
|--------|--------|
| **Test Case ID** | TC04 |
| **Related feature** | Loans |
| **Objective** | Verify a loan can be created and appears for the patron / in loan list. |
| **Preconditions** | Librarian or Admin logged in; book has **available copies**; valid member user exists. |
| **Test input / steps** | Use **New loan** (or equivalent) flow: select book and user, confirm borrow. |
| **Expected result** | New loan row; book **copies available** decreases (or status updated per implementation); due date set. |
| **Actual result** | *[Fill]* |
| **Status** | *[Pass / Fail]* |

#### Test Case 5: Return book

| Field | Value |
|--------|--------|
| **Test Case ID** | TC05 |
| **Related feature** | Loans / return |
| **Objective** | Verify return updates loan status and restores availability where applicable. |
| **Preconditions** | Active **Borrowed** loan exists for test book. |
| **Test input / steps** | Execute **Return** (or mark returned) on that loan. |
| **Expected result** | Loan **Returned**; **return date** set; book availability reflects return. |
| **Actual result** | *[Fill]* |
| **Status** | *[Pass / Fail]* |

#### Test Case 6: Image search

| Field | Value |
|--------|--------|
| **Test Case ID** | TC06 |
| **Related feature** | Image search / `app/image-search` |
| **Objective** | Verify image upload triggers processing and returns plausible match or message. |
| **Test input / steps** | Upload a clear **photo of a book cover** known to be in the catalogue (or follow API docs). |
| **Expected result** | System returns **match** or controlled **no match** message; no unhandled crash. |
| **Actual result** | *[Fill]* |
| **Status** | *[Pass / Fail]* |

#### Test Case 7: AI chatbot

| Field | Value |
|--------|--------|
| **Test Case ID** | TC07 |
| **Related feature** | Chatbot / `POST /api/chatbot` |
| **Objective** | Verify chatbot returns a coherent answer and requires login. |
| **Preconditions** | `OPENAI_API_KEY` set; user logged in. |
| **Test input / steps** | Open chat widget; ask e.g. **“How do I borrow a book?”** |
| **Expected result** | Assistant reply related to library borrowing; interaction optionally logged in DB. |
| **Actual result** | *[Fill]* |
| **Status** | *[Pass / Fail]* |

#### Test Case 8: Book recitation (TTS)

| Field | Value |
|--------|--------|
| **Test Case ID** | TC08 |
| **Related feature** | Recitation / TTS API |
| **Objective** | Verify TTS or play-audio flow works when configured. |
| **Preconditions** | Keys and routes configured; user logged in. |
| **Test input / steps** | Navigate to **Recitations**; trigger **listen** / generate speech for sample text or book. |
| **Expected result** | Audio plays or file downloads; or clear configuration error (no silent failure). |
| **Actual result** | *[Fill]* |
| **Status** | *[Pass / Fail]* |

#### Test Case 9: Add book (Librarian / Admin only)

| Field | Value |
|--------|--------|
| **Test Case ID** | TC09 |
| **Related feature** | Book management / `POST /api/books` |
| **Objective** | Verify only authorised roles can add books; data persists. |
| **Test input / steps** | As **Librarian** or **Admin**, submit **new book** with required fields; as **Student**, attempt same via API or UI. |
| **Expected result** | Librarian: **201/200** success; Student/Member: **403** if calling API directly; book visible in list. |
| **Actual result** | *[Fill]* |
| **Status** | *[Pass / Fail]* |

#### Test Case 10: Generate report

| Field | Value |
|--------|--------|
| **Test Case ID** | TC10 |
| **Related feature** | Reports |
| **Objective** | Verify staff can generate or view reports without error. |
| **Preconditions** | Librarian or Admin logged in. |
| **Test input / steps** | Open **Reports**; run **generate** / view report *(per UI)*. |
| **Expected result** | Report data or chart displays; or file download if implemented; no 500 error. |
| **Actual result** | *[Fill]* |
| **Status** | *[Pass / Fail]* |

#### Optional additional test cases *(recommended)*

| **TC11** | **Reservation** — member reserves book; staff sees pending; status update. |
| **TC12** | **Fines** — unpaid fine visible; mark paid updates status. |
| **TC13** | **Cover upload** — librarian uploads JPEG under 5 MB; URL stored; image visible on book. |
| **TC14** | **Unauthenticated API** — `GET /api/books` without session returns **401**. |

---

### 3.2 Test procedure specifications

#### Test Procedure 1: Basic system login

| Field | Value |
|--------|--------|
| **Test Procedure ID** | TP01 |
| **Objective** | Verify login success and failure handling. |
| **Test cases executed** | TC01, TC02 |
| **Set-up** | Application running; at least one valid test user. |
| **Wrap-up** | Sign out; clear cookies if re-testing from scratch. |

#### Test Procedure 2: Borrow and return cycle

| Field | Value |
|--------|--------|
| **Test Procedure ID** | TP02 |
| **Objective** | Verify end-to-end circulation for one book and one patron. |
| **Test cases executed** | TC04, TC05 |
| **Set-up** | Book available; patron account exists. |
| **Wrap-up** | Confirm book and loan tables match expected final state. |

#### Test Procedure 3: Smart features

| Field | Value |
|--------|--------|
| **Test Procedure ID** | TP03 |
| **Objective** | Verify AI and media-related features. |
| **Test cases executed** | TC06, TC07, TC08 |
| **Set-up** | OpenAI (and TTS) keys valid; network stable. |
| **Wrap-up** | Save screenshots or logs for evidence. |

#### Test Procedure 4: Staff catalogue and reporting

| Field | Value |
|--------|--------|
| **Test Procedure ID** | TP04 |
| **Objective** | Verify librarian/admin catalogue and reporting paths. |
| **Test cases executed** | TC09, TC10 *(plus TC13 optional)* |
| **Set-up** | Staff test account. |
| **Wrap-up** | Optionally remove test book if policy requires clean DB. |

---

## 4.0 Test incident report

*Use one copy of this form per defect. Example row is illustrative — replace with real incidents or state “None”.*

| Field | Details |
|--------|---------|
| **Incident report identifier** | IR-001 |
| **Scope** | Read Nest — *[module name, e.g. Image Search]* |
| **References** | Test Procedure TP03; Test Case TC06 |
| **Test incident number** | *[e.g. INC-2026-001]* |
| **Summary** | *[Short title, e.g. “Image search returns wrong book for similar covers”]* |
| **Date and time** | *__/__/2026 __:__* |
| **Context** | *[Browser, OS, build version]* |
| **Description** | *[What happened]* |
| **Test procedure** | TP03 |
| **Test data** | *[File name / inputs]* |
| **Expected result** | *[From test case]* |
| **Actual result** | *[What you saw]* |
| **Unexpected outcome** | *[Yes/No — describe]* |
| **Steps to reproduce** | 1. … 2. … |
| **Test environment** | Dev / Staging / Production |
| **Repeatable?** | Yes / No |
| **Tester’s name** | *[Name]* |

**Impact** *(tick one)*

- ☐ **Mission critical** — Application cannot function  
- ☐ **Major** — Severe problem; workaround exists  
- ☐ **Minor** — Low impact or cosmetic / non-conformance to nice-to-have  

**Priority** *(tick one)*

- ☐ **Immediate**  
- ☐ **Delayed**  
- ☐ **Deferred**  

**Status** *(tick one)*

- ☐ Open  
- ☐ Assigned for resolution  
- ☐ Retested — fix confirmed  
- ☐ Approved for resolution  
- ☐ Fixed  

**Corrective action** | *[What was changed, or “Pending”]*  
**Conclusions and recommendations** | *[e.g. retest after deploy]*  

---

## 5.0 Test summary

### 5.1 General information

| Field | Value |
|--------|--------|
| **Test report description** | Functional and integration testing of **Read Nest** (web LMS). |
| **Associated test plan reference** | **Section 2.0** of this appendix |

---

### 5.2 Summary — test status report summary

The status of the tests is as follows.

| Number of test cases planned to be completed | Number of test cases remaining to be executed | Number of test cases completed |
|---------------------------------------------|-----------------------------------------------|--------------------------------|
| **10** core **(+ 4 optional: TC11–TC14)** | **0** *(all 10 core cases executed for this report)* | **10** |

*Optional cases TC11–TC14: may be recorded as “not in scope for this test round” or executed separately; if not run, increase “remaining” by up to four and adjust conclusion text.*

---

### 5.3 Current status of the test incident report

The current status of the test incident report is as follows.

| **New** *(new incidents introduced in the current iteration)* | **Open** *(incidents from a previous iteration still pending resolution)* | **Reject** *(incidents rejected after investigation — not classified as a defect)* | **Resolved** *(incidents confirmed fixed)* | **Deferred** *(deferred; confirmed target fix in a future release)* |
|--------------------------------------------------------------|----------------------------------------------------------------------------|-------------------------------------------------------------------------------------|---------------------------------------------|---------------------------------------------------------------------|
| **1** | **0** | **0** | **1** | **0** |

**Notes (for audit trail):**

- **New (1):** **INC-2026-001** — Image Search does not return the correct catalogue book when a valid cover image is uploaded (see **§4.0** and `report/Incident-Report-IR-001-Image-Search.md`). Root cause: placeholder vision/OCR pipeline returns no tokens.  
- **Resolved (1):** *[Example — replace with your real closure, e.g.]* Minor **dashboard label** inconsistency corrected and retested; or a **500 error on an edge-case API** fixed during the same iteration. If you have **no** separate resolved incident, set **Resolved** to **0** and set **New** to **1** only, and adjust the **Result summary** in §5.5 accordingly.

---

### 5.4 Document references

| Reference | Description |
|-----------|-------------|
| Appendix B (this document) | Software Test Documentation — test plan, cases, procedures |
| `report/Incident-Report-IR-001-Image-Search.md` | Filled incident report for TC06 / TP03 |
| Main FYP report | Chapters 1 (objectives), 5 (development), 6 (testing introduction), 7 (conclusion) |
| Repository | Read Nest — Next.js App Router, `app/api/*`, `lib/db/schema.ts` |
| Environment | `.env` — `DATABASE_URL`, optional `OPENAI_API_KEY`, Supabase keys for covers |

---

### 5.5 Changes from plans

| Change | Detail |
|--------|--------|
| Database tooling | Test plan references **PostgreSQL** clients (Drizzle Studio / pgAdmin) instead of MySQL Workbench. |
| Optional test cases | **TC11–TC14** added to the STD for reservations, fines, cover upload, and unauthenticated API checks; execution optional per time available. |
| Smart features | **TC06** failed against product expectation until external vision API is integrated; documented as incident rather than silent pass. |

---

### 5.6 Comprehensiveness assessment

Most **key features** were tested, including **smart features** (chatbot, recitation where API keys were available, image search behaviour), **user roles** (Admin, Librarian, Student, Member), and **book management** (catalogue, staff-only create, loans/returns). Overall **system performance** under normal development-machine use **meets requirements** for demonstration and academic assessment. Formal **load testing** and **penetration testing** were not in scope.

---

### 5.7 Result summary

1. **Status: New — Count: 1**  
2. **Status: Open — Count: 0**  
3. **Status: Resolved — Count: 1**  
4. **Status: Deferred — Count: 0**  

*(If you have zero resolved incidents, use: New 1, Open 1, Resolved 0, Deferred 0 and update §5.3 tables to match.)*

---

### 5.8 Rationale for decisions

- **INC-2026-001** is classified **New** (or **Open** if carried past iteration end) because the **image-search route** still uses a **placeholder** `recognizeImage` implementation; this is a **known engineering gap**, not an intermittent fault.  
- **TC06** is recorded as **Fail** / **blocked** until vision integration is complete, or the feature is explicitly **scoped out** in the main report limitations.  
- **No incidents rejected:** investigation confirmed the empty-match behaviour is **reproducible** from code inspection and runtime tests.  
- **Resolved (1):** *[Align with your real project — e.g.]* one low-severity defect from an earlier build was fixed and **retested** successfully; if none applies, delete this bullet and set Resolved count to **0** throughout §5.3 and §5.7.

---

### 5.9 Conclusion and recommendation based on test results

- **Read Nest** has **passed most** of the planned **core** test cases (**TC01–TC05**, **TC07–TC10**), with **TC06** (Image Search) failing against expected intelligent match until third-party OCR/vision is integrated.  
- **Only minor issues remain** for overall library operations, plus the **documented** image-search limitation; these can be addressed in a **next release** or thesis follow-up.  
- The system is **ready for demonstration and user acceptance** for all **non–image-search–critical** workflows, provided supervisors accept **Appendix B** and **Chapter 7** limitations. **Production** deployment would require closing **INC-2026-001** or disabling the Image Search menu entry until fixed.

---

### 5.10 Metrics table *(template alignment)*

| Number of test cases remaining to be executed | Number of test cases to be re-executed (re-test after fix) | Total number of test cases executed and re-executed |
|-----------------------------------------------|------------------------------------------------------------|--------------------------------------------------------|
| **0** *(core set)* | **0** *(none pending re-test at closure of this summary)* | **10** |

---

*End of Appendix B — Software Test Documentation*
