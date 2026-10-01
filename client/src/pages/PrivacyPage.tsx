import React from "react";
import { ShieldCheck, AlertCircle } from "lucide-react";

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-panel border border-[rgba(77,42,0,0.1)] p-6 sm:p-8 rounded-3xl shadow-glass">
        <div className="flex items-center space-x-3 text-[#CC6F00] mb-2">
          <div className="w-11 h-11 rounded-2xl bg-[#FDB773]/40 border border-[#CC6F00]/25 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#4D2A00]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#4D2A00]">CampusDesk Privacy Policy</h1>
            <p className="text-xs text-[#4D2A00]/70 font-mono">
              Last Updated: September 2026 • Compliant with Digital Personal Data Protection Act, 2023 (India)
            </p>
          </div>
        </div>

        {/* Mandatory Legal Review Note */}
        <div className="mt-5 p-4 bg-[#FDB773]/20 border border-[#CC6F00]/30 rounded-2xl text-xs text-[#4D2A00] flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-[#CC6F00] flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-[#4D2A00]">Institutional Notice:</strong> This policy is configured for enterprise campus operations and data fiduciary obligations under the DPDP Act 2023 before deployment in live collegiate production environments.
          </div>
        </div>

        <div className="mt-6 space-y-6 text-xs text-[#4D2A00]/80 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-xs font-bold text-[#CC6F00] uppercase tracking-wider border-b border-[rgba(77,42,0,0.08)] pb-1.5">
              1. What Personal Data We Collect
            </h2>
            <p>
              CampusDesk collects and processes only the minimum personal data necessary to deliver daily hostel and academic operations:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#4D2A00]/70">
              <li><strong className="text-[#4D2A00]">Student Identity:</strong> Full legal name, college roll number, institutional email address, and personal phone number.</li>
              <li><strong className="text-[#4D2A00]">Hostel Residency:</strong> Assigned hostel block, wing, and room number.</li>
              <li><strong className="text-[#4D2A00]">Academic Enrollment:</strong> Academic branch, current study year, and admission batch.</li>
              <li><strong className="text-[#4D2A00]">Service Requests:</strong> Maintenance descriptions, gate pass departure and return destinations, parent contact numbers, and document request reasons.</li>
              <li><strong className="text-[#4D2A00]">Complaint Photos:</strong> User-uploaded photos of physical room defects (compressed and stored securely in PostgreSQL bytea storage).</li>
              <li><strong className="text-[#4D2A00]">Academic Records:</strong> Course attendance figures and fee payment status imported from accounts records.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-bold text-[#CC6F00] uppercase tracking-wider border-b border-[rgba(77,42,0,0.08)] pb-1.5">
              2. Why We Collect Your Data (Purpose of Processing)
            </h2>
            <p>
              Your personal data is used solely for the following lawful institutional purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#4D2A00]/70">
              <li>To auto-route, assign, and resolve maintenance tickets in your hostel room.</li>
              <li>To allow wardens and security personnel to verify and log authorized campus exits and entries.</li>
              <li>To deliver targeted academic circulars, timetable notices, and class cancellation alerts.</li>
              <li>To issue verified Bonafide certificates and document endorsements requested by you.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-bold text-[#CC6F00] uppercase tracking-wider border-b border-[rgba(77,42,0,0.08)] pb-1.5">
              3. Who Can See Your Information (Access Control)
            </h2>
            <p>
              Access to personal records is strictly role-restricted on the server:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#4D2A00]/70">
              <li><strong className="text-[#4D2A00]">The Student:</strong> Can view their own complaints, attendance, fee status, and gate passes.</li>
              <li><strong className="text-[#4D2A00]">Assigned Department Staff:</strong> Can view only the room number, issue details, and student name relevant to their assigned maintenance ticket.</li>
              <li><strong className="text-[#4D2A00]">Hostel Warden:</strong> Can review gate pass requests, hostel complaint ageing, and residency logs for their designated hostel.</li>
              <li><strong className="text-[#4D2A00]">Central Administrators:</strong> Can view aggregated institutional oversight metrics and verify certificates.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-bold text-[#CC6F00] uppercase tracking-wider border-b border-[rgba(77,42,0,0.08)] pb-1.5">
              4. Data Retention Period
            </h2>
            <p className="text-[#4D2A00]/70">
              Active service records (tickets, passes, and notices) are retained for the duration of the student&apos;s active enrollment plus 12 months after graduation for audit and accreditation compliance, after which personal contact details and uploaded photos are permanently purged.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-bold text-[#CC6F00] uppercase tracking-wider border-b border-[rgba(77,42,0,0.08)] pb-1.5">
              5. Security Measures & Technical Safeguards
            </h2>
            <p className="text-[#4D2A00]/70">
              All account passwords are encrypted using modern Argon2 password hashing. Web sessions use secure httpOnly cookies. Uploaded photos are sanitized and stored internally in PostgreSQL bytea storage without third-party cloud sharing.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-bold text-[#CC6F00] uppercase tracking-wider border-b border-[rgba(77,42,0,0.08)] pb-1.5">
              6. Your Rights & Grievance Contact
            </h2>
            <p>
              Under the Digital Personal Data Protection Act, 2023, you have the right to request access to, correction of, or deletion of inaccurate personal records. For data protection inquiries or grievances, contact:
            </p>
            <div className="bg-white/50 p-4 border border-[rgba(77,42,0,0.08)] rounded-2xl text-[#4D2A00] space-y-1.5 font-mono text-[11px]">
              <div><strong className="text-[#4D2A00] font-sans">Grievance Officer:</strong> Dean of Student Affairs / IT Nodal Officer</div>
              <div><strong className="text-[#4D2A00] font-sans">Email:</strong> privacy@campusdesk.edu</div>
              <div><strong className="text-[#4D2A00] font-sans">Office:</strong> Administration Block Room 101, College Campus</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
