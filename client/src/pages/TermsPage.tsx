import React from "react";
import { FileText, AlertCircle } from "lucide-react";

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-panel border border-[var(--border-subtle)] p-6 sm:p-8 rounded-3xl shadow-glass">
        <div className="flex items-center space-x-3 text-[#FF6D1F] mb-2">
          <div className="w-11 h-11 rounded-2xl bg-[#FF6D1F]/40 border border-[#FF6D1F]/25 flex items-center justify-center">
            <FileText className="w-5 h-5 text-[var(--text-primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">CampusDesk Terms & Acceptable Use</h1>
            <p className="text-xs text-[var(--text-secondary)] font-mono">
              Institutional User Agreement & Operational Regulations
            </p>
          </div>
        </div>

        {/* Legal Review Note */}
        <div className="mt-5 p-4 bg-[#FF6D1F]/20 border border-[#FF6D1F]/30 rounded-2xl text-xs text-[var(--text-primary)] flex items-start space-x-2.5">
          <AlertCircle className="w-4 h-4 text-[#FF6D1F] flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-[var(--text-primary)]">Governance Notice:</strong> This agreement establishes binding operational guidelines for hostel operations, gate tracking, and administrative ticketing.
          </div>
        </div>

        <div className="mt-6 space-y-6 text-xs text-[var(--text-primary)] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-xs font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-1.5">
              1. Acceptable Use Policy
            </h2>
            <p className="text-[var(--text-secondary)]">
              CampusDesk is provided solely for bona fide academic, hostel residency, and administrative interactions within the college. Users shall not submit fraudulent maintenance complaints, impersonate other students, or misuse gate passes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-1.5">
              2. Account Security & Responsibility
            </h2>
            <p className="text-[var(--text-secondary)]">
              Students and staff members are responsible for maintaining the confidentiality of their login credentials. Any request or gate pass submission made through an authenticated account will be deemed to have originated from the account holder.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-1.5">
              3. Accuracy of Submitted Information
            </h2>
            <p className="text-[var(--text-secondary)]">
              All information provided during registration, gate pass applications, and certificate requests must be true and accurate. Falsification of parent contact numbers or emergency destinations constitutes a disciplinary violation subject to college regulations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-1.5">
              4. Staff Service Commitments & Audit Logs
            </h2>
            <p className="text-[var(--text-secondary)]">
              Department maintenance staff are required to log accurate status changes and resolution notes. All updates are recorded in an immutable audit trail that cannot be deleted or altered once created.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-1.5">
              5. Service Availability & Offline Operations
            </h2>
            <p className="text-[var(--text-secondary)]">
              CampusDesk provides offline queuing and a hostel office command console to maintain operations during network interruptions. The institution strives for continuous availability but is not liable for scheduled maintenance downtime.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-1.5">
              6. Disciplinary Consequences of Misuse
            </h2>
            <p className="text-[var(--text-secondary)]">
              Intentional spamming, abusive language in complaint tickets, or fraudulent pass forging will result in immediate account suspension and referral to the College Proctorial Committee.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
