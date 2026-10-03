import React from "react";
import { Layers, FileSpreadsheet, Users, AlertTriangle, CheckCircle2 } from "lucide-react";

export const AdoptionPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-panel border border-[var(--border-subtle)] p-6 sm:p-8 rounded-3xl shadow-glass">
        <div className="flex items-center space-x-3 text-[#FF6D1F] mb-2">
          <div className="w-11 h-11 rounded-2xl bg-[#FF6D1F]/40 border border-[#FF6D1F]/25 flex items-center justify-center">
            <Layers className="w-5 h-5 text-[var(--text-primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Institutional Adoption & Migration Blueprint</h1>
            <p className="text-xs text-[var(--text-secondary)] font-mono">
              Phased implementation methodology, CSV data migration, staff training schedule, and coexistence with WhatsApp
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-8 text-xs text-[var(--text-primary)] leading-relaxed">
          {/* Phase Rollout */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-2 flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#FF6D1F] text-[var(--text-primary)] font-bold flex items-center justify-center text-[10px] rounded-md shadow-sm">1</span>
              <span>Phased Rollout Schedule</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl space-y-2">
                <div className="font-mono text-[#FF6D1F] text-xs font-bold">Phase 1: Weeks 1 to 2</div>
                <div className="font-semibold text-[var(--text-primary)]">Notices & Complaints Ticketing</div>
                <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                  Deploy targeted circulars and hostel maintenance ticketing. Familiarizes students with complaint filing and trains department staff on assignment queues.
                </p>
              </div>

              <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl space-y-2">
                <div className="font-mono text-[#FF6D1F] text-xs font-bold">Phase 2: Weeks 3 to 4</div>
                <div className="font-semibold text-[var(--text-primary)]">Gate Pass & Leave System</div>
                <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                  Activate warden digital approvals and main gate security scanner terminals. Transition away from paper outing registers.
                </p>
              </div>

              <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl space-y-2">
                <div className="font-mono text-[#FF6D1F] text-xs font-bold">Phase 3: Weeks 5 to 6</div>
                <div className="font-semibold text-[var(--text-primary)]">Academics, Mess & Documents</div>
                <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                  Enable attendance tracking, cancellation alerts, mess menus, fee dues status, and PDF Bonafide certificate downloads.
                </p>
              </div>
            </div>
          </section>

          {/* Data Migration & CSV Templates */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-2 flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#FF6D1F] text-[var(--text-primary)] font-bold flex items-center justify-center text-[10px] rounded-md shadow-sm">2</span>
              <span>Data Migration & Required CSV Schemas</span>
            </h2>
            <p className="text-[var(--text-secondary)]">
              Existing college registers are imported using the built-in Data Migration module. All templates are validated row by row with line-by-line error reports:
            </p>

            <div className="space-y-2.5 font-mono text-[11px]">
              <div className="p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl">
                <strong className="text-[var(--text-primary)] font-sans block mb-1">Students & Hostels (students.csv):</strong>
                <code className="text-[#FF6D1F] block bg-[var(--bg-input)] p-2 rounded-xl border border-[var(--border-subtle)]">rollNumber, fullName, email, phone, hostelBlock, roomNumber, branch, year, batch</code>
              </div>
              <div className="p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl">
                <strong className="text-[var(--text-primary)] font-sans block mb-1">Timetable (timetable.csv):</strong>
                <code className="text-[#FF6D1F] block bg-[var(--bg-input)] p-2 rounded-xl border border-[var(--border-subtle)]">branch, year, subjectCode, subjectName, facultyName, dayOfWeek, startTime, endTime, room</code>
              </div>
              <div className="p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl">
                <strong className="text-[var(--text-primary)] font-sans block mb-1">Fee Dues Register (fees.csv):</strong>
                <code className="text-[#FF6D1F] block bg-[var(--bg-input)] p-2 rounded-xl border border-[var(--border-subtle)]">rollNumber, studentName, totalFee, paidFee, dueFee, dueDate, semester, academicYear, status</code>
              </div>
              <div className="p-3.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl">
                <strong className="text-[var(--text-primary)] font-sans block mb-1">Mess Weekly Menu (mess_menu.csv):</strong>
                <code className="text-[#FF6D1F] block bg-[var(--bg-input)] p-2 rounded-xl border border-[var(--border-subtle)]">hostelBlock, dayOfWeek, breakfast, lunch, snacks, dinner</code>
              </div>
            </div>
          </section>

          {/* Training Plan & Coexistence with WhatsApp */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-2 flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#FF6D1F] text-[var(--text-primary)] font-bold flex items-center justify-center text-[10px] rounded-md shadow-sm">3</span>
              <span>Staff Training & Coexistence with WhatsApp Groups</span>
            </h2>
            <p className="text-[var(--text-secondary)]">
              To ensure zero operational disruption during migration from existing informal WhatsApp groups:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[var(--text-primary)]">
              <li><strong className="text-[var(--text-primary)]">Dual-Broadcast Window:</strong> For the first 3 weeks, official notices published on CampusDesk will generate a one-line summary link shared to existing class WhatsApp groups.</li>
              <li><strong className="text-[var(--text-primary)]">Hostel Office Kiosk:</strong> Hostel caretakers use the Command Console (<code className="text-[#FF6D1F] font-mono font-bold">COMPLAIN ...</code>) to file requests on behalf of walk-in students, printing immediate physical slips.</li>
              <li><strong className="text-[var(--text-primary)]">Hands-on Staff Workshop:</strong> A 90-minute training session for wardens and maintenance supervisors covering queue filtering, category correction, and resolution logging.</li>
            </ul>
          </section>

          {/* Risk Mitigation */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-[#FF6D1F] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-2 flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#FF6D1F] text-[var(--text-primary)] font-bold flex items-center justify-center text-[10px] rounded-md shadow-sm">4</span>
              <span>Risks & Technical Mitigation Strategies</span>
            </h2>

            <div className="space-y-2.5">
              <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl">
                <strong className="text-[var(--text-primary)] block mb-1 font-semibold text-xs">Patchy Hostel Wi-Fi & Offline Submissions:</strong>
                <span className="text-[var(--text-secondary)] leading-relaxed">
                  Mitigated via Workbox PWA service worker and IndexedDB offline queue with visual &quot;Waiting to send&quot; indicators and auto-replay on reconnect.
                </span>
              </div>

              <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl">
                <strong className="text-[var(--text-primary)] block mb-1 font-semibold text-xs">Students Without Smartphones:</strong>
                <span className="text-[var(--text-secondary)] leading-relaxed">
                  Mitigated via the in-app Text Command Console and printable physical ticket receipts at the hostel office.
                </span>
              </div>

              <div className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl">
                <strong className="text-[var(--text-primary)] block mb-1 font-semibold text-xs">Category Misclassification:</strong>
                <span className="text-[var(--text-secondary)] leading-relaxed">
                  Mitigated via TF-IDF + domain keyword classifier with continuous server-side ML learning whenever staff correct a department assignment.
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdoptionPage;
