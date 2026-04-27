# Appendix C: User Manual — Read Nest

## C.1 Introduction

This user manual provides a practical guide for using **Read Nest**, a web-based library management system. It explains how to access the system, navigate the interface, and perform common tasks according to your **role** (Administrator, Librarian, Student, or Member).

### C.1.1 Purpose

The purpose of this manual is to:

- **Guide** users in operating Read Nest day to day.  
- **Explain** main features and who may use them.  
- **Provide** step-by-step instructions for common tasks (login, catalogue, borrowing-related features, fines, reports, and smart tools).  

### C.1.2 Scope

This manual covers:

- **System access** (landing page, login, registration, logout).  
- **Main modules**: dashboard, books, loans, reservations, fines, reports, image search, recitations, settings, support.  
- **Role differences** (what Students/Members see versus Librarians/Admins).  
- **Data and reporting** at a user level (viewing and, where permitted, updating records).  
- **Basic troubleshooting** and safe usage.  

It does **not** replace technical deployment guides for developers (environment variables, database migrations, server hosting).

---

## C.2 System overview

### C.2.1 System description

**Read Nest** is a **web-based library management system** developed to help libraries **manage the book catalogue**, **track loans and returns**, **handle reservations and fines**, and offer **staff reporting**. It also includes optional **smart features**: an **AI chatbot** (library help), **book recitation / text-to-speech**, and **image search** (upload a cover image to search the catalogue—effectiveness depends on system configuration).

Users interact through a **browser**; data is stored on a **server** and **PostgreSQL database** behind the scenes.

### C.2.2 Target users

| Role | Description |
|------|-------------|
| **Administrator** | Full oversight; can manage **users** (`/admin/users`) and use all librarian capabilities. |
| **Librarian** | Manages **books**, **loans**, **reservations**, **reports**; supports day-to-day circulation. |
| **Student** | Typical patron: browse books, own **fines**, **loans** visibility as implemented; may use **Image Search**, **Recitations**, **chatbot**. |
| **Member** | Same broad patron experience as Student for catalogue and self-service features (registration default role options include Student and Member). |
| **Guest** *(not logged in)* | Can view the **public landing page** (`/`). **Sign in** or **Get started** (register) is required for the **dashboard** and library modules. |

*Note: New self-registration via **Get started** typically offers **Student** or **Member** only. **Admin** and **Librarian** accounts are normally created by an administrator or deployment process.*

---

## C.3 System requirements

### C.3.1 Hardware requirements

| Item | Recommendation |
|------|----------------|
| Device | Computer or laptop *(tablet/phone may work but layout is optimised for desktop)* |
| RAM | **Minimum 4 GB** *(8 GB recommended when running a local dev server or many browser tabs)* |
| Storage | Sufficient for **browser cache**; no large local install required *(approx. **500 MB** free disk space** on the device is ample for normal browser use)* |
| Display | **1024×768** or higher recommended |

### C.3.2 Software requirements

| Item | Requirement |
|------|-------------|
| **Operating system** | **Windows 10/11**, **macOS**, or **Linux** *(any OS that runs a supported browser)* |
| **Browser** | **Google Chrome**, **Microsoft Edge**, or **Mozilla Firefox** *(current stable version)* |
| **Internet** | **Required** — the application loads from a web server; catalogue, login, and APIs need connectivity. **Smart features** (chatbot, TTS, cloud storage for covers) need internet and correct server configuration. |

---

## C.4 Getting started

### C.4.1 System access

1. Open your web browser.  
2. Go to the application **URL** provided by your institution *(for local development this is often `http://localhost:3000`)*.  
3. You will see either the **landing page** (marketing home) or be redirected to **login** if a session is required.

**Useful paths:**

| Page | Typical URL path |
|------|------------------|
| Home / landing | `/` |
| Sign in | `/login` |
| Create account | `/register` |

### C.4.2 User login

Read Nest uses **email** and **password** (not a separate “username” field).

1. Open **`/login`**.  
2. Enter your **email** (the address registered in the system).  
3. Enter your **password**.  
4. Click **Sign in** *(or equivalent submit button)*.  
5. On success, you are taken to the **Dashboard** (`/dashboard`).  
6. If credentials are wrong, an **error message** appears (e.g. invalid email or password); correct your input and try again.

### C.4.3 User registration *(if enabled by your deployment)*

1. From the landing page, click **Get started** / **Create account**, or open **`/register`**.  
2. Complete **name**, **email**, **password**, optional **phone**, and select **role** (**Student** or **Member** where offered).  
3. Submit the form.  
4. If successful, sign in via **`/login`** using the same email and password.

### C.4.4 Logout

1. In the **sidebar**, scroll to **Logout** *(bottom section with Settings and Support)*.  
2. Click **Logout**.  
3. The session ends and you are returned to the **login** page (`/login`).

*Alternatively, use **Sign out** from the **user menu** in the top header if available.*

---

## C.5 System interface

### C.5.1 Dashboard (**Discover**)

After login, the **Dashboard** summarises activity appropriate to your role (for example book counts, active loans, or overdue information for **Librarian/Admin**). The **header** includes a menu toggle, a search-style field *(catalogue search is fully available on the **Books** page)*, notifications icon, and your **profile** menu.

### C.5.2 Navigation menu *(sidebar)*

Menu labels may vary slightly, but typically include:

| Menu item | Route | Who sees it |
|-----------|-------|-------------|
| **Read Nest** (brand) | `/dashboard` | All signed-in users |
| **Discover** | `/dashboard` | All |
| **Category** / **My Library** *(books)* | `/books` | All |
| **Loans** | `/loans` | **Admin**, **Librarian** |
| **Reservations** | `/reservations` | **Admin**, **Librarian** |
| **Users** | `/admin/users` | **Admin** only |
| **Reports** | `/reports` | **Admin**, **Librarian** |
| **Fines** | `/fines` | All *(scope of data may depend on role)* |
| **Image Search** | `/image-search` | All |
| **Recitations** | `/recitation` | All |
| **Settings** | `/settings` | All |
| **Support** | `/support` | All |
| **Logout** | *(action)* | All |

If a menu item is **missing**, your account role does not include that function.

### C.5.3 AI chatbot

A **floating chat** control is available on dashboard-style pages. Click it to ask library-related questions. You must be **signed in**; responses require the server to be configured with an AI provider.

---

## C.6 System modules / functions

### C.6.1 User management *(Administrator only)*

**Purpose:** Create and maintain staff/patron accounts as provided by the **Users** screen.

**Typical steps:**

1. Sign in as **Administrator**.  
2. Open **Users** in the sidebar (`/admin/users`).  
3. Use the page actions to **add**, **edit**, or **deactivate** users as implemented *(follow on-screen labels)*.  
4. Ensure **email** is unique and **role** is correct (**Admin**, **Librarian**, **Student**, **Member**).  
5. **Save** or confirm changes.

*Exact fields depend on your deployment version.*

---

### C.6.2 Book catalogue *(data management — books)*

**Purpose:** Browse, search, and *(for staff)* add or edit books.

**Browse and search**

1. Go to **Books** (`/books`) via **Category** or **My Library**.  
2. Use **search** and **category** filters and pagination to find titles.  
3. Click a book to open its **detail** page (`/books/[id]`).

**Add a new book** *(Administrator / Librarian)*

1. On **Books**, click **Add New Book** (`/books/new`).  
2. Fill in **title**, **author**, and other fields *(ISBN, category, description, copies, etc.)*.  
3. Submit **Save**.  
4. If you lack permission, the server will reject the action—contact an administrator.

**Edit a book** *(staff)*

1. Open the book **detail** page.  
2. Use **Edit** (`/books/[id]/edit`) if available.  
3. Update fields and save.

**Cover image** *(if offered)*

- Staff may upload a **cover image** where the UI allows; accepted types are usually **JPEG, PNG, WebP, GIF** up to a **5 MB** limit *(as configured on the server)*.

---

### C.6.3 Loans *(core circulation — Librarian / Admin)*

**Purpose:** Record **borrowing** and **returns** and monitor **due dates**.

**Typical steps**

1. Open **Loans** (`/loans`).  
2. Use **New loan** or equivalent (`/loans/new`) to link a **patron** and a **book**.  
3. Confirm **borrow date** and **due date** as shown.  
4. To return, open the relevant loan and use **Return** *(or equivalent)* so status updates to **Returned** and availability is restored.

*Students/Members may see loan-related information depending on implementation; primary processing is staff-facing.*

---

### C.6.4 Reservations *(Librarian / Admin)*

**Purpose:** Manage **holds** on books.

1. Open **Reservations** (`/reservations`).  
2. Review existing reservations and use **All Statuses** to filter the list.  
3. Use on-screen actions to update records (for example, mark **Pending** as **Collected** or **Cancel** where allowed).

---

### C.6.5 Fines

**Purpose:** View and update **fine** records linked to loans.

1. Open **Fines** (`/fines`).  
2. Locate the fine *(filter or scroll as provided)*.  
3. Record **payment** or status changes as the UI allows.

*Physical payment may still occur outside the system; the software tracks status.*

---

### C.6.6 Reports *(Librarian / Admin)*

**Purpose:** Generate or view **operational reports**.

1. Open **Reports** (`/reports`).  
2. Choose the **report type** or filters offered.  
3. Click **Generate** / refresh as provided.  
4. **View** on screen; **export** to PDF/CSV only if that button exists in your version.

---

### C.6.7 Image search

**Purpose:** Upload an **image** of a book cover (or related picture) to help locate a catalogue entry.

1. Open **Image Search** (`/image-search`).  
2. Choose **Image file** under **Upload Book Cover or Barcode**.  
3. Click **Search Books**.  
4. Review **Matched Books** if any appear; click a result to open the book page.

*If no matches appear, try **text search** on the **Books** page. Match quality depends on backend image-recognition configuration.*

---

### C.6.8 Recitations *(text-to-speech)*

**Purpose:** Listen to **book-related audio** or generated speech where enabled.

1. Open **Recitations** (`/recitation`).  
2. Follow on-screen steps to **generate** or **play** audio.  
3. Ensure volume and browser **autoplay** permissions allow playback.

*Requires server-side configuration (e.g. AI TTS) where applicable.*

---

### C.6.9 Settings and support

- **Settings** (`/settings`): update personal preferences or profile options as implemented.  
- **Support** (`/support`): access help or contact information provided by your project.

---

## C.7 Error handling / troubleshooting

| Issue | Possible cause | What to do |
|--------|----------------|------------|
| **Cannot log in** | Wrong **email** or **password**; caps lock on | Re-type credentials; use **Forgot** flow only if implemented; ask admin to reset password |
| **“Unauthorized” or session errors** | Session expired; not logged in | **Logout**, then **login** again; clear site cookies if problems persist |
| **403 / Forbidden on an action** | Your **role** cannot perform that action | Ask **Administrator** or **Librarian** for the correct role |
| **Books page empty or error** | Server or database unavailable | Check **internet**; try later; contact support |
| **Add book fails** | Missing required fields; validation error | Fill **title**, **author**, and required numbers; ensure **copies available ≤ copies total** |
| **Chatbot does not reply** | API not configured or quota exceeded | Contact administrator; check server **OpenAI** configuration |
| **Recitation / TTS fails** | Missing keys or unsupported browser | Try **Chrome**; contact administrator |
| **Image search returns nothing** | Recognition not configured or poor image quality | Use **Books** text search; retake photo with good light and focus |
| **Cover upload rejected** | Wrong file type or file too large | Use **JPEG/PNG/WebP/GIF** under **5 MB** |
| **System not loading** | Wrong URL, server down, or no internet | Confirm URL; check connection; refresh page |

---

## C.8 Safety and usage guidelines

- **Do not share** your **email + password** with anyone.  
- **Log out** when using a **shared computer** (lab or library PC).  
- Enter **accurate** book and patron data; errors affect loans and fines.  
- **Do not** upload offensive or illegal images through **Image Search** or cover upload.  
- Report **suspected security issues** to your system administrator.

---

## C.9 Conclusion

This manual describes how to use **Read Nest** efficiently for browsing the catalogue, managing circulation *(staff)*, handling fines and reports *(as permitted)*, and using optional smart features. Follow the steps for your **role**, use **C.7** when something goes wrong, and contact your **library administrator** for account or policy questions beyond this document.

---

*End of Appendix C — User Manual*
