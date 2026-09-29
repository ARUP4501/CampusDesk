import React from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-stone-300 p-6 rounded-[6px] shadow-sm">
        <div className="flex items-center space-x-2 text-[#0f4c3a] mb-2">
          <ShieldCheck className="w-6 h-6" />
          <h1 className="text-2xl font-bold text-stone-900">CampusDesk Privacy Policy</h1>
        </div>
        <p className="text-xs text-stone-500">
          Last Updated: September 2026 &bull; Compliant with Digital Personal Data Protection Act, 2023 (India)
        </p>

        {/* Mandatory Legal Review Note */}
        <div className="mt-4 p-3.5 bg-amber-50 border border-amber-300 rounded-[4px] text-xs text-amber-950 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Legal Review Note:</strong> This policy is written for campus institutional operations and must be formally reviewed and adapted by the college&apos;s legal counsel before deployment in live academic environments.
          </div>
        </div>

        <div className="mt-6 space-y-6 text-xs text-stone-800 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              1. What Personal Data We Collect
            </h2>
            <p>
              CampusDesk collects and processes only the minimum personal data necessary to deliver daily hostel and academic services:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-700">
              <li><strong>Student Identity:</strong> Full legal name, college roll number, institutional email address, and personal phone number.</li>
              <li><strong>Hostel Residency:</strong> Assigned hostel block, wing, and room number.</li>
              <li><strong>Academic Enrollment:</strong> Academic branch, current study year, and admission batch.</li>
              <li><strong>Service Requests:</strong> Maintenance descriptions, gate pass departure and return destinations, parent contact numbers, and document request reasons.</li>
              <li><strong>Complaint Photos:</strong> User-uploaded photos of physical room defects (compressed and stored securely in the college database).</li>
              <li><strong>Academic Records:</strong> Course attendance figures and fee payment status imported from accounts records.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              2. Why We Collect Your Data (Purpose of Processing)
            </h2>
            <p>
              Your personal data is used solely for the following lawful institutional purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-700">
              <li>To auto-route, assign, and resolve maintenance tickets in your hostel room.</li>
              <li>To allow wardens and security personnel to verify and log authorized campus exits and entries.</li>
              <li>To deliver targeted academic circulars, timetable notices, and class cancellation alerts.</li>
              <li>To issue verified Bonafide certificates and document endorsements requested by you.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              3. Who Can See Your Information (Access Control)
            </h2>
            <p>
              Access to personal records is strictly role-restricted on the server:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-700">
              <li><strong>The Student:</strong> Can view their own complaints, attendance, fee status, and gate passes.</li>
              <li><strong>Assigned Department Staff:</strong> Can view only the room number, issue details, and student name relevant to their assigned maintenance ticket.</li>
              <li><strong>Hostel Warden:</strong> Can review gate pass requests, hostel complaint ageing, and residency logs for their designated hostel.</li>
              <li><strong>Central Administrators:</strong> Can view aggregated institutional oversight metrics and verify certificates.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              4. Data Retention Period
            </h2>
            <p>
              Active service records (tickets, passes, and notices) are retained for the duration of the student&apos;s active enrollment plus 12 months after graduation for audit and accreditation compliance, after which personal contact details and uploaded photos are permanently purged.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              5. Security Measures & Technical Safeguards
            </h2>
            <p>
              All account passwords are encrypted using modern Argon2 password hashing. Web sessions use secure httpOnly cookies. Uploaded photos are sanitized and stored internally in PostgreSQL bytea storage without third-party cloud sharing.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              6. Your Rights & Grievance Contact
            </h2>
            <p>
              Under the Digital Personal Data Protection Act, 2023, you have the right to request access to, correction of, or deletion of inaccurate personal records. For data protection inquiries or grievances, contact:
            </p>
            <div className="bg-stone-50 p-3 border border-stone-200 rounded-[4px] text-stone-700 space-y-1">
              <div><strong>Grievance Officer:</strong> Dean of Student Affairs / IT Nodal Officer</div>
              <div><strong>Email:</strong> privacy@campusdesk.edu</div>
              <div><strong>Office:</strong> Administration Block Room 101, College Campus</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
