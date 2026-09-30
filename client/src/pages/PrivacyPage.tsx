import React from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-campus-card border border-campus-border p-6 sm:p-8 rounded-lg shadow-2xl">
        <div className="flex items-center space-x-3 text-campus-gold mb-2">
          <div className="w-9 h-9 rounded bg-campus-elevated border border-campus-border flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-campus-gold" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-campus-text">CampusDesk Privacy Policy</h1>
            <p className="text-xs text-campus-muted font-mono">
              Last Updated: September 2026 • Compliant with Digital Personal Data Protection Act, 2023 (India)
            </p>
          </div>
        </div>

        {/* Mandatory Legal Review Note */}
        <div className="mt-5 p-4 bg-campus-warning/5 border border-campus-warning/30 rounded text-xs text-campus-warning flex items-start space-x-2.5 font-mono">
          <AlertCircle className="w-4 h-4 text-campus-warning flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-campus-text">Institutional Notice:</strong> This policy is configured for enterprise campus operations and data fiduciary obligations under the DPDP Act 2023 before deployment in live collegiate production environments.
          </div>
        </div>

        <div className="mt-6 space-y-6 text-xs text-campus-secondary leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-xs font-mono font-semibold text-campus-text uppercase tracking-wider border-b border-campus-border pb-1.5">
              1. What Personal Data We Collect
            </h2>
            <p>
              CampusDesk collects and processes only the minimum personal data necessary to deliver daily hostel and academic operations:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-campus-muted">
              <li><strong className="text-campus-text">Student Identity:</strong> Full legal name, college roll number, institutional email address, and personal phone number.</li>
              <li><strong className="text-campus-text">Hostel Residency:</strong> Assigned hostel block, wing, and room number.</li>
              <li><strong className="text-campus-text">Academic Enrollment:</strong> Academic branch, current study year, and admission batch.</li>
              <li><strong className="text-campus-text">Service Requests:</strong> Maintenance descriptions, gate pass departure and return destinations, parent contact numbers, and document request reasons.</li>
              <li><strong className="text-campus-text">Complaint Photos:</strong> User-uploaded photos of physical room defects (compressed and stored securely in PostgreSQL bytea storage).</li>
              <li><strong className="text-campus-text">Academic Records:</strong> Course attendance figures and fee payment status imported from accounts records.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-mono font-semibold text-campus-text uppercase tracking-wider border-b border-campus-border pb-1.5">
              2. Why We Collect Your Data (Purpose of Processing)
            </h2>
            <p>
              Your personal data is used solely for the following lawful institutional purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-campus-muted">
              <li>To auto-route, assign, and resolve maintenance tickets in your hostel room.</li>
              <li>To allow wardens and security personnel to verify and log authorized campus exits and entries.</li>
              <li>To deliver targeted academic circulars, timetable notices, and class cancellation alerts.</li>
              <li>To issue verified Bonafide certificates and document endorsements requested by you.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-mono font-semibold text-campus-text uppercase tracking-wider border-b border-campus-border pb-1.5">
              3. Who Can See Your Information (Access Control)
            </h2>
            <p>
              Access to personal records is strictly role-restricted on the server:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-campus-muted">
              <li><strong className="text-campus-text">The Student:</strong> Can view their own complaints, attendance, fee status, and gate passes.</li>
              <li><strong className="text-campus-text">Assigned Department Staff:</strong> Can view only the room number, issue details, and student name relevant to their assigned maintenance ticket.</li>
              <li><strong className="text-campus-text">Hostel Warden:</strong> Can review gate pass requests, hostel complaint ageing, and residency logs for their designated hostel.</li>
              <li><strong className="text-campus-text">Central Administrators:</strong> Can view aggregated institutional oversight metrics and verify certificates.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-mono font-semibold text-campus-text uppercase tracking-wider border-b border-campus-border pb-1.5">
              4. Data Retention Period
            </h2>
            <p className="text-campus-muted">
              Active service records (tickets, passes, and notices) are retained for the duration of the student&apos;s active enrollment plus 12 months after graduation for audit and accreditation compliance, after which personal contact details and uploaded photos are permanently purged.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-mono font-semibold text-campus-text uppercase tracking-wider border-b border-campus-border pb-1.5">
              5. Security Measures & Technical Safeguards
            </h2>
            <p className="text-campus-muted">
              All account passwords are encrypted using modern Argon2 password hashing. Web sessions use secure httpOnly cookies. Uploaded photos are sanitized and stored internally in PostgreSQL bytea storage without third-party cloud sharing.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-mono font-semibold text-campus-text uppercase tracking-wider border-b border-campus-border pb-1.5">
              6. Your Rights & Grievance Contact
            </h2>
            <p>
              Under the Digital Personal Data Protection Act, 2023, you have the right to request access to, correction of, or deletion of inaccurate personal records. For data protection inquiries or grievances, contact:
            </p>
            <div className="bg-campus-elevated/60 p-4 border border-campus-border rounded text-campus-secondary space-y-1.5 font-mono text-[11px]">
              <div><strong className="text-campus-text font-sans">Grievance Officer:</strong> Dean of Student Affairs / IT Nodal Officer</div>
              <div><strong className="text-campus-text font-sans">Email:</strong> privacy@campusdesk.edu</div>
              <div><strong className="text-campus-text font-sans">Office:</strong> Administration Block Room 101, College Campus</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
