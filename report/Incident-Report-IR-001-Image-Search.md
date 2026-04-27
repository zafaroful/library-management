# 4.0 Test Incident Report — Completed Example

**Incident report identifier:** IR-001  

| Field | Value |
|--------|--------|
| **Scope** | Read Nest — **Image Search** module (`/image-search`, `POST /api/image-search`) |
| **References** | Test Procedure **TP03** (Smart Features Testing); Test Case **TC06** (Image Search) |

---

## Incident details

| Field | Value |
|--------|--------|
| **Test incident number** | INC-2026-001 |
| **Summary** | Image Search **does not return the correct book** (no relevant match shown for a valid catalogue cover image). |
| **Date and time of incident** | 11 April 2026, 14:30 *(replace with actual test date/time)* |
| **Context** | **OS:** Windows 11 (build 26200). **Browser:** Google Chrome (latest stable). **Build:** Development server (`npm run dev`), Next.js application. **User:** Logged-in Student/Member test account. **Database:** PostgreSQL with known seed book *“Database Systems”* (or any book with a clear cover in catalogue). |

### Description of incident

| Subfield | Content |
|----------|---------|
| **Test procedure** | **TP03** — Smart Features Testing |
| **Test data** | **File:** JPEG photograph of the physical book cover (or a high-resolution screenshot of the same cover art), filename `database-systems-cover.jpg`, size &lt; 2 MB, `image/jpeg`. Book **exists** in `books` table with matching title/author. |
| **Expected result** | System **extracts text or visual features** from the image, queries the catalogue, and returns **the matching book** (or a small ranked list including the correct title) in **Matched Books**. |
| **Actual result** | API responds **200 OK** with `matchedBooks: []` (empty array). UI shows **no “Matched Books”** card, or empty list. `recognizedText` in JSON response is **[]**. Search log row may still be inserted with **`matched_book_id` = null**. |
| **Unexpected outcome** | **Yes.** User-visible feature suggests “upload cover → find book,” but **no recognition pipeline** is active in the current build, so the correct book **never** appears. |
| **Procedure to reproduce the incident** | 1. Sign in as any authenticated user. 2. Open **Image Search** (`/image-search`). 3. Choose **Image file** and select a clear **JPEG/PNG** of a book cover that **is** in the catalogue. 4. Click **Search Books**. 5. Observe: no matches listed; optional DevTools → Network → `POST /api/image-search` → response body shows `matchedBooks: []`, `recognizedText: []`. |
| **Test environment** | Development (local); same behaviour expected wherever placeholder `recognizeImage` is unchanged. |
| **Attempt to repeat** | **Yes — reproducible** on every upload (100% under current code path). |
| **Tester’s name** | *[Your name]* |

### Status of incident

*(Tick one — example below reflects typical FYP state before vision API is integrated.)*

- ☑ **Open** *(incident recorded; fix not yet deployed)*  
- ☐ Assigned for Resolution  
- ☐ Retested — with the fix confirmed  
- ☐ Approved for Resolution  
- ☐ Fixed  

---

## Impact

*(Tick one)*

- ☐ **Mission critical** — Application will not function or system fails  
- ☑ **Major** — Severe problems for this feature, but **workaround exists** (use **Books** page text / ISBN search)  
- ☐ **Minor** — Does not materially impact core borrowing/catalogue for users who avoid Image Search  

**Rationale:** Core LMS (login, loans, books CRUD) still works; only the **Image Search** value proposition is blocked.

---

## Priority

*(Tick one)*

- ☐ **Immediate** — Must be fixed as soon as possible  
- ☑ **Delayed** — Should be fixed **before** treating Image Search as production-ready or before formal UAT sign-off on that feature  
- ☐ **Deferred** — Defect can remain documented as **known limitation** for submission if time/cost prevents integration in this phase  

---

## Description of the corrective action

1. **Implement real image understanding** in `app/api/image-search/route.ts`: replace the placeholder `recognizeImage()` (currently returns an **empty array**) with a call to **Google Cloud Vision API**, **AWS Rekognition**, **Azure Computer Vision**, or similar, to obtain **OCR text** and/or **labels** from `imageBuffer`.  
2. **Normalise** detected strings (trim, remove noise, split lines) and build **safe SQL `LIKE` patterns** (or full-text search) against `books.title`, `books.author`, and `books.isbn` — avoid SQL injection by using parameterised queries / Drizzle `like` with bound values only.  
3. **Rank results** (e.g. by best string overlap) and return top *N* matches; optionally require minimum confidence before returning a row.  
4. **Retest** TC06 and TP03: upload same test image; confirm **correct book** appears in **Matched Books** and `matched_book_id` in `image_search_log` is non-null when appropriate.  
5. **Document** dependency: API keys, quotas, and privacy (images sent to third party).

---

## Conclusions and recommendations

- The incident is **not a random glitch**; it follows from **documented placeholder code** (`recognizeImage` returns `[]`, so the conditional block that queries `books` **never runs** with real tokens).  
- For the **FYP report**, either **(a)** implement the corrective action above, or **(b)** clearly list **Image Search** as **partial / proof-of-concept** in **Limitations** and **Appendix B** test summary so examiners understand expected vs actual behaviour.  
- **Recommendation:** Do not mark TC06 as **Pass** until at least one **positive** test shows the **correct** catalogue row returned for a controlled cover image; until then, record TC06 as **Fail** or **Blocked** with reference to **INC-2026-001**.

---

*This incident report aligns with the project template (severity, priority, corrective action, conclusions) and with the current `POST /api/image-search` implementation as of repository review.*
