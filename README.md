# CampusDesk: College Operations & Student Services Portal

CampusDesk is a unified web application that replaces registers, notice boards, WhatsApp groups, and paper forms used to manage daily life in a college.

---

## Quick Start in Under 10 Commands

```bash
# 1. Clone the repository
git clone <repo-url> && cd campusdesk

# 2. Start the app and PostgreSQL database with Docker Compose
docker compose up --build -d

# 3. Open your browser
# Visit http://localhost:5000
```

To run without Docker:
```bash
npm install
cd server && npm install && npx prisma generate && npx prisma db push && npx tsx prisma/seed.ts
cd ../client && npm install
npm run dev
```

---

## Demo Accounts & Credentials

All demo accounts use the standard password: `Password@123`

| Role | Email | Name / Department | Purpose |
| :--- | :--- | :--- | :--- |
| **Student** | `student@campusdesk.edu` | Aarav Sharma (2024CS101) | Submit complaints, gate passes, certificates |
| **Hostel Warden** | `warden@campusdesk.edu` | Dr. S. K. Mahapatra | Approve gate passes, view escalated tickets |
| **Department Staff** | `staff@campusdesk.edu` | Manoj Kumar (Plumbing) | Review assigned tickets, log resolution notes |
| **Central Admin** | `admin@campusdesk.edu` | Prof. R. N. Rath | Administrative oversight, CSV migrations, reports |

---

## Key Workflows & Features

1. **Complaint & Maintenance Ticketing:**
   - Text classification via TF-IDF machine learning into department queues.
   - 24-hour and 48-hour SLA escalation jobs to Wardens and Central Administration.
   - Recurring issue detection by hostel room and block within a 14-day window.
   - Immutable audit trail recording every status change.
   - In-database compressed photo storage using Sharp.
   - Physical ticket slip generation and printing.

2. **Gate Pass & Leave Management:**
   - Outing and home leave request workflows with parent contact verification.
   - Cryptographic QR code generation for approved passes.
   - Gate Security Log for security guards to record physical exit and entry times.
   - Overdue return monitoring for students outside campus.

3. **Targeted Notices & Action Compliance:**
   - Publish circulars targeted by Batch, Branch, Hostel, or Academic Year.
   - Per-student delivery, read receipt, and action completion tracking.
   - One-click reminder dispatch to students who have not acted.

4. **Supporting Academic Services:**
   - Course schedule and class cancellation notice board.
   - Subject-wise attendance percentage with shortage (&lt;75%) warnings.
   - Weekly 7-day mess menu and dining satisfaction feedback summaries.
   - Digital Bonafide Certificate generation with downloadable PDF.
   - Read-only fee clearance and dues tracking.

5. **Deterministic FAQ Assistant:**
   - Answers inquiries regarding cancellations, mess meals, fee dates, and ticket statuses strictly from database tables without hallucination.

6. **Offline Queue & Text Command Console:**
   - Workbox PWA service worker with IndexedDB offline queue for network resilience.
   - Staff-assisted Command Console accepting text commands (`COMPLAIN ...`, `STATUS ...`) for walk-in students without smartphones.
   - Multi-language support in English, Hindi, and Odia using i18next.

---

## Technical Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, i18next, Workbox PWA, IndexedDB
- **Backend:** Node.js, Express, TypeScript, Zod, Argon2, Sharp, PDFKit, QRCode
- **Database:** PostgreSQL with Prisma ORM
- **Background Jobs:** Automated escalation and reminder worker
- **Testing:** Vitest test suites

---

## Documentation

- [ADOPTION.md](file:///c:/Users/aarup/OneDrive/Desktop/BPUT%20Hackthon/ADOPTION.md): Phased rollout, training plan, and CSV templates.
- [DEPLOYMENT.md](file:///c:/Users/aarup/OneDrive/Desktop/BPUT%20Hackthon/DEPLOYMENT.md): Deployment on free HTTPS cloud hosts and local Docker.
- [Privacy Policy](/privacy): DPDP Act 2023 compliance guide.
- [Terms & Conditions](/terms): Campus acceptable use agreement.
