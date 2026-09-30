import React from "react";
import { Layers, FileSpreadsheet, Users, AlertTriangle, CheckCircle2 } from "lucide-react";

export const AdoptionPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-campus-card border border-campus-border p-6 sm:p-8 rounded-lg shadow-2xl">
        <div className="flex items-center space-x-3 text-campus-gold mb-2">
          <div className="w-9 h-9 rounded bg-campus-elevated border border-campus-border flex items-center justify-center">
            <Layers className="w-5 h-5 text-campus-gold" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-campus-text">Institutional Adoption & Migration Blueprint</h1>
            <p className="text-xs text-campus-muted font-mono">
              Phased implementation methodology, CSV data migration, staff training schedule, and coexistence with WhatsApp
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-8 text-xs text-campus-secondary leading-relaxed">
          {/* Phase Rollout */}
          <section className="space-y-3">
            <h2 className="text-xs font-mono font-semibold text-campus-text uppercase tracking-wider border-b border-campus-border pb-2 flex items-center space-x-2">
              <span className="w-5 h-5 bg-campus-gold text-campus-bg font-bold flex items-center justify-center text-[10px] rounded">1</span>
              <span>Phased Rollout Schedule</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-campus-elevated/40 border border-campus-border rounded-lg space-y-2">
                <div className="font-mono text-campus-gold text-xs font-bold">Phase 1: Weeks 1 to 2</div>
                <div className="font-semibold text-campus-text">Notices & Complaints Ticketing</div>
                <p className="text-campus-muted text-[11px] leading-relaxed">
                  Deploy targeted circulars and hostel maintenance ticketing. Familiarizes students with complaint filing and trains department staff on assignment queues.
                </p>
              </div>

              <div className="p-4 bg-campus-elevated/40 border border-campus-border rounded-lg space-y-2">
                <div className="font-mono text-campus-gold text-xs font-bold">Phase 2: Weeks 3 to 4</div>
                <div className="font-semibold text-campus-text">Gate Pass & Leave System</div>
                <p className="text-campus-muted text-[11px] leading-relaxed">
                  Activate warden digital approvals and main gate security scanner terminals. Transition away from paper outing registers.
                </p>
              </div>

              <div className="p-4 bg-campus-elevated/40 border border-campus-border rounded-lg space-y-2">
                <div className="font-mono text-campus-gold text-xs font-bold">Phase 3: Weeks 5 to 6</div>
                <div className="font-semibold text-campus-text">Academics, Mess & Documents</div>
                <p className="text-campus-muted text-[11px] leading-relaxed">
                  Enable attendance tracking, cancellation alerts, mess menus, fee dues status, and PDF Bonafide certificate downloads.
                </p>
              </div>
            </div>
          </section>

          {/* Data Migration & CSV Templates */}
          <section className="space-y-3">
            <h2 className="text-xs font-mono font-semibold text-campus-text uppercase tracking-wider border-b border-campus-border pb-2 flex items-center space-x-2">
              <span className="w-5 h-5 bg-campus-gold text-campus-bg font-bold flex items-center justify-center text-[10px] rounded">2</span>
              <span>Data Migration & Required CSV Schemas</span>
            </h2>
            <p className="text-campus-muted">
              Existing college registers are imported using the built-in Data Migration module. All templates are validated row by row with line-by-line error reports:
            </p>

            <div className="space-y-2.5 font-mono text-[11px]">
              <div className="p-3 bg-campus-elevated/40 border border-campus-border rounded">
                <strong className="text-campus-text font-sans block mb-1">Students & Hostels (students.csv):</strong>
                <code className="text-campus-gold block bg-campus-bg p-2 rounded border border-campus-border/60">rollNumber, fullName, email, phone, hostelBlock, roomNumber, branch, year, batch</code>
              </div>
              <div className="p-3 bg-campus-elevated/40 border border-campus-border rounded">
                <strong className="text-campus-text font-sans block mb-1">Timetable (timetable.csv):</strong>
                <code className="text-campus-gold block bg-campus-bg p-2 rounded border border-campus-border/60">branch, year, subjectCode, subjectName, facultyName, dayOfWeek, startTime, endTime, room</code>
              </div>
              <div className="p-3 bg-campus-elevated/40 border border-campus-border rounded">
                <strong className="text-campus-text font-sans block mb-1">Fee Dues Register (fees.csv):</strong>
                <code className="text-campus-gold block bg-campus-bg p-2 rounded border border-campus-border/60">rollNumber, studentName, totalFee, paidFee, dueFee, dueDate, semester, academicYear, status</code>
              </div>
              <div className="p-3 bg-campus-elevated/40 border border-campus-border rounded">
                <strong className="text-campus-text font-sans block mb-1">Mess Weekly Menu (mess_menu.csv):</strong>
                <code className="text-campus-gold block bg-campus-bg p-2 rounded border border-campus-border/60">hostelBlock, dayOfWeek, breakfast, lunch, snacks, dinner</code>
              </div>
            </div>
          </section>

          {/* Training Plan & Coexistence with WhatsApp */}
          <section className="space-y-3">
            <h2 className="text-xs font-mono font-semibold text-campus-text uppercase tracking-wider border-b border-campus-border pb-2 flex items-center space-x-2">
              <span className="w-5 h-5 bg-campus-gold text-campus-bg font-bold flex items-center justify-center text-[10px] rounded">3</span>
              <span>Staff Training & Coexistence with WhatsApp Groups</span>
            </h2>
            <p className="text-campus-muted">
              To ensure zero operational disruption during migration from existing informal WhatsApp groups:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-campus-secondary">
              <li><strong className="text-campus-text">Dual-Broadcast Window:</strong> For the first 3 weeks, official notices published on CampusDesk will generate a one-line summary link shared to existing class WhatsApp groups.</li>
              <li><strong className="text-campus-text">Hostel Office Kiosk:</strong> Hostel caretakers use the Command Console (<code className="text-campus-gold font-mono">COMPLAIN ...</code>) to file requests on behalf of walk-in students, printing immediate physical slips.</li>
              <li><strong className="text-campus-text">Hands-on Staff Workshop:</strong> A 90-minute training session for wardens and maintenance supervisors covering queue filtering, category correction, and resolution logging.</li>
            </ul>
          </section>

          {/* Risk Mitigation */}
          <section className="space-y-3">
            <h2 className="text-xs font-mono font-semibold text-campus-text uppercase tracking-wider border-b border-campus-border pb-2 flex items-center space-x-2">
              <span className="w-5 h-5 bg-campus-gold text-campus-bg font-bold flex items-center justify-center text-[10px] rounded">4</span>
              <span>Risks & Technical Mitigation Strategies</span>
            </h2>

            <div className="space-y-2.5">
              <div className="p-3.5 bg-campus-elevated/40 border border-campus-border rounded">
                <strong className="text-campus-text block mb-1 font-mono text-xs text-campus-gold">Patchy Hostel Wi-Fi & Offline Submissions:</strong>
                <span className="text-campus-muted leading-relaxed">
                  Mitigated via Workbox PWA service worker and IndexedDB offline queue with visual &quot;Waiting to send&quot; indicators and auto-replay on reconnect.
                </span>
              </div>

              <div className="p-3.5 bg-campus-elevated/40 border border-campus-border rounded">
                <strong className="text-campus-text block mb-1 font-mono text-xs text-campus-gold">Students Without Smartphones:</strong>
                <span className="text-campus-muted leading-relaxed">
                  Mitigated via the in-app Text Command Console and printable physical ticket receipts at the hostel office.
                </span>
              </div>

              <div className="p-3.5 bg-campus-elevated/40 border border-campus-border rounded">
                <strong className="text-campus-text block mb-1 font-mono text-xs text-campus-gold">Category Misclassification:</strong>
                <span className="text-campus-muted leading-relaxed">
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
