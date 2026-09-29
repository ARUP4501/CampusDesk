# CampusDesk Institutional Adoption and Implementation Guide

CampusDesk replaces fragmented registers, notice boards, WhatsApp groups, and paper leave slips in college campuses with a unified operations platform.

---

## 1. Phased Rollout Schedule

### Phase 1: Weeks 1 to 2 (Complaints & Notices)
- **Objective:** Deploy digital notices and hostel maintenance ticketing.
- **Actions:**
  - Import initial student roster and hostel room mapping from CSV.
  - Train hostel caretakers on ticket review and category correction.
  - Publish all official circulars with read and action compliance tracking.

### Phase 2: Weeks 3 to 4 (Gate Pass & Security Log)
- **Objective:** Modernize campus outing and leave management.
- **Actions:**
  - Activate warden digital approval queue.
  - Deploy the Gate Security Log terminal at campus gates for QR code scanning.
  - Transition security guards from handwritten exit registers.

### Phase 3: Weeks 5 to 6 (Academic Schedule, Mess & Documents)
- **Objective:** Complete transition for academic operations.
- **Actions:**
  - Import academic timetables and fee clearance records.
  - Enable subject-wise attendance view and class cancellation notices.
  - Enable digital Bonafide certificate requests with PDF generation.

---

## 2. Data Migration CSV Specifications

CampusDesk includes built-in bulk CSV importers with row-by-row validation. Prepare the following four CSV files:

### 1. Students & Hostels (students.csv)
- **Header:** `rollNumber,fullName,email,phone,hostelBlock,roomNumber,branch,year,batch`
- **Example:** `2024CS101,Aarav Sharma,aarav@campusdesk.edu,9876543210,Hostel-A,A-204,CSE,2,2024`

### 2. Timetable & Schedule (timetable.csv)
- **Header:** `branch,year,subjectCode,subjectName,facultyName,dayOfWeek,startTime,endTime,room`
- **Example:** `CSE,2,CS201,Data Structures and Algorithms,Prof. R. Sengupta,1,09:00,10:00,Room-201`

### 3. Fee Clearance Register (fees.csv)
- **Header:** `rollNumber,studentName,totalFee,paidFee,dueFee,dueDate,semester,academicYear,status`
- **Example:** `2024CS101,Aarav Sharma,55000,55000,0,2026-10-15,4,2025-26,PAID`

### 4. Hostel Mess Weekly Menu (mess_menu.csv)
- **Header:** `hostelBlock,dayOfWeek,breakfast,lunch,snacks,dinner`
- **Example:** `Hostel-A,1,Idli Sambhar,Rice Dal Paneer,Tea & Samosa,Roti Dal Tadka`

---

## 3. Staff Training and Coexistence with WhatsApp

1. **Dual-Broadcast Transition:**
   During the first 3 weeks of rollout, official notices posted to CampusDesk automatically generate a one-line summary link shared to existing WhatsApp groups, encouraging students to log in and acknowledge.

2. **Hostel Office Kiosk Console:**
   For students without smartphones or during network downtime, hostel office staff use the Text Command Console (`COMPLAIN ...`) to submit requests on behalf of walk-in students and print immediate physical slips.

3. **Warden & Caretaker Workshop:**
   A 90-minute workshop covers queue assignment, escalation SLA triggers, category correction to train the ML router, and resolving maintenance tickets.

---

## 4. Technical Risk Mitigation

| Risk | Mitigation Strategy |
| :--- | :--- |
| **Hostel Network Interruptions** | IndexedDB offline action queue with automatic background sync upon reconnection. |
| **Students Without Smartphones** | In-app Text Command Console and printable physical ticket receipts. |
| **Category Misclassification** | TF-IDF and keyword classifier with continuous server-side learning from staff corrections. |
| **Data Privacy Compliance** | Role-based authorization, immutable audit trail, and compliance with the Digital Personal Data Protection Act, 2023. |
