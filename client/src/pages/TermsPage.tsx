import React from "react";
import { FileText, AlertCircle } from "lucide-react";

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-stone-300 p-6 rounded-[6px] shadow-sm">
        <div className="flex items-center space-x-2 text-[#0f4c3a] mb-2">
          <FileText className="w-6 h-6" />
          <h1 className="text-2xl font-bold text-stone-900">CampusDesk Terms and Conditions</h1>
        </div>
        <p className="text-xs text-stone-500">
          Acceptable Use Policy & Institutional User Agreement
        </p>

        {/* Legal Review Note */}
        <div className="mt-4 p-3.5 bg-amber-50 border border-amber-300 rounded-[4px] text-xs text-amber-950 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-800 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Legal Review Note:</strong> This document outlines campus operational responsibilities and must be approved by the college academic and hostel disciplinary council before formal adoption.
          </div>
        </div>

        <div className="mt-6 space-y-6 text-xs text-stone-800 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              1. Acceptable Use Policy
            </h2>
            <p>
              CampusDesk is provided solely for bona fide academic, hostel residency, and administrative interactions within the college. Users shall not submit fraudulent maintenance complaints, impersonate other students, or misuse gate passes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              2. Account Security & Responsibility
            </h2>
            <p>
              Students and staff members are responsible for maintaining the confidentiality of their login credentials. Any request or gate pass submission made through an authenticated account will be deemed to have originated from the account holder.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              3. Accuracy of Submitted Information
            </h2>
            <p>
              All information provided during registration, gate pass applications, and certificate requests must be true and accurate. Falsification of parent contact numbers or emergency destinations constitutes a disciplinary violation subject to college regulations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              4. Staff Service Commitments & Audit Logs
            </h2>
            <p>
              Department maintenance staff are required to log accurate status changes and resolution notes. All updates are recorded in an immutable audit trail that cannot be deleted or altered once created.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              5. Service Availability & Offline Operations
            </h2>
            <p>
              CampusDesk provides offline queuing and a hostel office command console to maintain operations during network interruptions. The institution strives for continuous availability but is not liable for scheduled maintenance downtime.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              6. Disciplinary Consequences of Misuse
            </h2>
            <p>
              Intentional spamming, abusive language in complaint tickets, or fraudulent pass forging will result in immediate account suspension and referral to the College Proctorial Committee.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
