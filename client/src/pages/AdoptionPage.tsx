import React from "react";
import { Layers, FileSpreadsheet, Users, AlertTriangle, CheckCircle2 } from "lucide-react";

export const AdoptionPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-panel border border-[rgba(77,42,0,0.1)] p-6 sm:p-8 rounded-3xl shadow-glass">
        <div className="flex items-center space-x-3 text-[#CC6F00] mb-2">
          <div className="w-11 h-11 rounded-2xl bg-[#FDB773]/40 border border-[#CC6F00]/25 flex items-center justify-center">
            <Layers className="w-5 h-5 text-[#4D2A00]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#4D2A00]">Institutional Adoption & Migration Blueprint</h1>
            <p className="text-xs text-[#4D2A00]/70 font-mono">
              Phased implementation methodology, CSV data migration, staff training schedule, and coexistence with WhatsApp
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-8 text-xs text-[#4D2A00]/80 leading-relaxed">
          {/* Phase Rollout */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-[#CC6F00] uppercase tracking-wider border-b border-[rgba(77,42,0,0.08)] pb-2 flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#FDB773] text-[#4D2A00] font-bold flex items-center justify-center text-[10px] rounded-md shadow-sm">1</span>
              <span>Phased Rollout Schedule</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/50 border border-[rgba(77,42,0,0.08)] rounded-2xl space-y-2">
                <div className="font-mono text-[#CC6F00] text-xs font-bold">Phase 1: Weeks 1 to 2</div>
                <div className="font-semibold text-[#4D2A00]">Notices & Complaints Ticketing</div>
                <p className="text-[#4D2A00]/70 text-[11px] leading-relaxed">
                  Deploy targeted circulars and hostel maintenance ticketing. Familiarizes students with complaint filing and trains department staff on assignment queues.
                </p>
              </div>

              <div className="p-4 bg-white/50 border border-[rgba(77,42,0,0.08)] rounded-2xl space-y-2">
                <div className="font-mono text-[#CC6F00] text-xs font-bold">Phase 2: Weeks 3 to 4</div>
                <div className="font-semibold text-[#4D2A00]">Gate Pass & Leave System</div>
                <p className="text-[#4D2A00]/70 text-[11px] leading-relaxed">
                  Activate warden digital approvals and main gate security scanner terminals. Transition away from paper outing registers.
                </p>
              </div>

              <div className="p-4 bg-white/50 border border-[rgba(77,42,0,0.08)] rounded-2xl space-y-2">
                <div className="font-mono text-[#CC6F00] text-xs font-bold">Phase 3: Weeks 5 to 6</div>
                <div className="font-semibold text-[#4D2A00]">Academics, Mess & Documents</div>
                <p className="text-[#4D2A00]/70 text-[11px] leading-relaxed">
                  Enable attendance tracking, cancellation alerts, mess menus, fee dues status, and PDF Bonafide certificate downloads.
                </p>
              </div>
            </div>
          </section>

          {/* Data Migration & CSV Templates */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-[#CC6F00] uppercase tracking-wider border-b border-[rgba(77,42,0,0.08)] pb-2 flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#FDB773] text-[#4D2A00] font-bold flex items-center justify-center text-[10px] rounded-md shadow-sm">2</span>
              <span>Data Migration & Required CSV Schemas</span>
            </h2>
            <p className="text-[#4D2A00]/70">
              Existing college registers are imported using the built-in Data Migration module. All templates are validated row by row with line-by-line error reports:
            </p>

            <div className="space-y-2.5 font-mono text-[11px]">
              <div className="p-3.5 bg-white/50 border border-[rgba(77,42,0,0.08)] rounded-2xl">
                <strong className="text-[#4D2A00] font-sans block mb-1">Students & Hostels (students.csv):</strong>
                <code className="text-[#CC6F00] block bg-white/70 p-2 rounded-xl border border-[rgba(77,42,0,0.08)]">rollNumber, fullName, email, phone, hostelBlock, roomNumber, branch, year, batch</code>
              </div>
              <div className="p-3.5 bg-white/50 border border-[rgba(77,42,0,0.08)] rounded-2xl">
                <strong className="text-[#4D2A00] font-sans block mb-1">Timetable (timetable.csv):</strong>
                <code className="text-[#CC6F00] block bg-white/70 p-2 rounded-xl border border-[rgba(77,42,0,0.08)]">branch, year, subjectCode, subjectName, facultyName, dayOfWeek, startTime, endTime, room</code>
              </div>
              <div className="p-3.5 bg-white/50 border border-[rgba(77,42,0,0.08)] rounded-2xl">
                <strong className="text-[#4D2A00] font-sans block mb-1">Fee Dues Register (fees.csv):</strong>
                <code className="text-[#CC6F00] block bg-white/70 p-2 rounded-xl border border-[rgba(77,42,0,0.08)]">rollNumber, studentName, totalFee, paidFee, dueFee, dueDate, semester, academicYear, status</code>
              </div>
              <div className="p-3.5 bg-white/50 border border-[rgba(77,42,0,0.08)] rounded-2xl">
                <strong className="text-[#4D2A00] font-sans block mb-1">Mess Weekly Menu (mess_menu.csv):</strong>
                <code className="text-[#CC6F00] block bg-white/70 p-2 rounded-xl border border-[rgba(77,42,0,0.08)]">hostelBlock, dayOfWeek, breakfast, lunch, snacks, dinner</code>
              </div>
            </div>
          </section>

          {/* Training Plan & Coexistence with WhatsApp */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-[#CC6F00] uppercase tracking-wider border-b border-[rgba(77,42,0,0.08)] pb-2 flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#FDB773] text-[#4D2A00] font-bold flex items-center justify-center text-[10px] rounded-md shadow-sm">3</span>
              <span>Staff Training & Coexistence with WhatsApp Groups</span>
            </h2>
            <p className="text-[#4D2A00]/70">
              To ensure zero operational disruption during migration from existing informal WhatsApp groups:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[#4D2A00]/80">
              <li><strong className="text-[#4D2A00]">Dual-Broadcast Window:</strong> For the first 3 weeks, official notices published on CampusDesk will generate a one-line summary link shared to existing class WhatsApp groups.</li>
              <li><strong className="text-[#4D2A00]">Hostel Office Kiosk:</strong> Hostel caretakers use the Command Console (<code className="text-[#CC6F00] font-mono font-bold">COMPLAIN ...</code>) to file requests on behalf of walk-in students, printing immediate physical slips.</li>
              <li><strong className="text-[#4D2A00]">Hands-on Staff Workshop:</strong> A 90-minute training session for wardens and maintenance supervisors covering queue filtering, category correction, and resolution logging.</li>
            </ul>
          </section>

          {/* Risk Mitigation */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold text-[#CC6F00] uppercase tracking-wider border-b border-[rgba(77,42,0,0.08)] pb-2 flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#FDB773] text-[#4D2A00] font-bold flex items-center justify-center text-[10px] rounded-md shadow-sm">4</span>
              <span>Risks & Technical Mitigation Strategies</span>
            </h2>

            <div className="space-y-2.5">
              <div className="p-4 bg-white/50 border border-[rgba(77,42,0,0.08)] rounded-2xl">
                <strong className="text-[#4D2A00] block mb-1 font-semibold text-xs">Patchy Hostel Wi-Fi & Offline Submissions:</strong>
                <span className="text-[#4D2A00]/70 leading-relaxed">
                  Mitigated via Workbox PWA service worker and IndexedDB offline queue with visual &quot;Waiting to send&quot; indicators and auto-replay on reconnect.
                </span>
              </div>

              <div className="p-4 bg-white/50 border border-[rgba(77,42,0,0.08)] rounded-2xl">
                <strong className="text-[#4D2A00] block mb-1 font-semibold text-xs">Students Without Smartphones:</strong>
                <span className="text-[#4D2A00]/70 leading-relaxed">
                  Mitigated via the in-app Text Command Console and printable physical ticket receipts at the hostel office.
                </span>
              </div>

              <div className="p-4 bg-white/50 border border-[rgba(77,42,0,0.08)] rounded-2xl">
                <strong className="text-[#4D2A00] block mb-1 font-semibold text-xs">Category Misclassification:</strong>
                <span className="text-[#4D2A00]/70 leading-relaxed">
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
