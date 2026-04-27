# 5.0 Test Summary Report — Read Nest (Web LMS)

*Standalone summary aligned with the faculty template (General Information, status tables, comprehensiveness, result summary, rationale, conclusion). Copy into Appendix B or Chapter 6 as required.*

---

## 5.1 General information

| Field | Value |
|--------|--------|
| **Test report description** | Functional and integration testing of **Read Nest** (web LMS). |
| **Associated test plan reference** | **Section 2.0** of Appendix B — Software Test Documentation |

---

## 5.2 Summary — test status report summary

The status of the tests is as follows.

| Number of test cases planned to be completed | Number of test cases remaining to be executed | Number of test cases completed |
|---------------------------------------------|-----------------------------------------------|--------------------------------|
| **10** core **(+ 4 optional: TC11–TC14)** | **0** | **10** |

---

## 5.3 Current status of the test incident report

The current status of the test incident report is as follows.

| **New** | **Open** | **Reject** | **Resolved** | **Deferred** |
|---------|----------|------------|--------------|--------------|
| **1** | **0** | **0** | **1** | **0** |

**Column definitions (template wording):**

- **New** — New incidents introduced in the current iteration.  
- **Open** — Incidents discovered from a previous test iteration that are still pending resolution.  
- **Reject** — Incidents rejected after investigation because they cannot be categorised as a defect.  
- **Resolved** — Incidents that have been confirmed resolved.  
- **Deferred** — Incidents deferred; confirmed to be fixed for the next release version.

**Recorded in this round**

| ID | Summary | Category |
|----|---------|----------|
| **INC-2026-001** | Image Search does not return the correct catalogue book (placeholder OCR — see incident report). | **New** |
| *(optional)* **RES-xxx** | *[If applicable: e.g. typo on login button / API error fixed — else set Resolved to 0 and update tables.]* | **Resolved** |

---

## 5.4 Document references

| # | Document |
|---|----------|
| 1 | Appendix B — Software Test Documentation (full STD) |
| 2 | `Incident-Report-IR-001-Image-Search.md` |
| 3 | FYP main report — Chapters 1, 5, 6, 7 |
| 4 | Read Nest repository (`app/api`, `lib/db`) |

---

## 5.5 Changes from plans

| Item | Change from original Moodle-style plan |
|------|----------------------------------------|
| Database | Verification used **PostgreSQL** tooling, not MySQL Workbench. |
| Test cases | **TC11–TC14** added as optional extensions (reservations, fines, cover upload, 401 API). |
| TC06 | Treated as **failed / documented** when intelligent match was expected, matching implementation reality. |

---

## 5.6 Comprehensiveness assessment

Most key features were tested, including **smart features** (AI chatbot, book recitation/TTS where keys were configured, image search upload and API response), **user roles** (Admin, Librarian, Student, Member), and **book management** (catalogue, librarian-only create, loans and returns). Overall system performance under normal test conditions **meets requirements** for FYP demonstration scope.

---

## 5.7 Result summary

1. **Status: New — Count: 1**  
2. **Status: Open — Count: 0**  
3. **Status: Resolved — Count: 1**  
4. **Status: Deferred — Count: 0**  

---

## 5.8 Rationale for decisions

The **New** count reflects **INC-2026-001** (Image Search), which is understood as a **missing integration** (vision/OCR), not an unpredictable defect. Optional tests **TC11–TC14** may be omitted without invalidating the core conclusion if time-boxed. If your project has **no separate resolved incident**, set **Resolved** to **0**, **New** to **1**, and update **§5.2–5.3** and **§5.7** consistently.

---

## 5.9 Conclusion and recommendation based on test results

- **Read Nest** has passed **most** planned core tests; the outstanding item is **documented** under Image Search (**TC06** / **INC-2026-001**).  
- **Only minor issues remain** for general library workflows; they can be scheduled for a **next release**.  
- The system is **ready for demonstration and user acceptance** for standard catalogue and circulation use, subject to supervisor agreement on the **known Image Search limitation** stated in the main report.

---

## 5.10 Metrics table

| Number of test cases remaining to be executed | Number of test cases to be re-executed (re-test after fix) | Total number of test cases executed and re-executed |
|-----------------------------------------------|------------------------------------------------------------|--------------------------------------------------------|
| **0** | **0** | **10** |

---

*Prepared for: Read Nest — Library Management System | Appendix B §5.0*
