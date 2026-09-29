import React from "react";
import { Layers, FileSpreadsheet, Users, AlertTriangle, CheckCircle2 } from "lucide-react";

export const AdoptionPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white border border-stone-300 p-6 rounded-[6px] shadow-sm">
        <div className="flex items-center space-x-2 text-[#0f4c3a] mb-2">
          <Layers className="w-6 h-6" />
          <h1 className="text-2xl font-bold text-stone-900">CampusDesk Institutional Adoption Plan</h1>
        </div>
        <p className="text-xs text-stone-500">
          Phased implementation methodology, CSV data migration, staff training schedule, and coexistence with WhatsApp
        </p>

        <div className="mt-6 space-y-8 text-xs text-stone-800 leading-relaxed">
          {/* Phase Rollout */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide border-b border-stone-200 pb-1.5 flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#0f4c3a] text-white flex items-center justify-center text-xs rounded-[3px]">1</span>
              <span>Phased Rollout Schedule</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-[4px] space-y-2">
                <div className="font-bold text-stone-900 text-sm">Phase 1: Weeks 1 to 2</div>
                <div className="font-semibold text-emerald-950">Notices & Complaints Ticketing</div>
                <p className="text-stone-600">
                  Deploy targeted circulars and hostel maintenance ticketing. Familiarizes students with complaint filing and trains department staff on assignment queues.
                </p>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-[4px] space-y-2">
                <div className="font-bold text-stone-900 text-sm">Phase 2: Weeks 3 to 4</div>
                <div className="font-semibold text-emerald-950">Gate Pass & Leave System</div>
                <p className="text-stone-600">
                  Activate warden digital approvals and main gate security scanner terminals. Transition away from paper outing registers.
                </p>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-[4px] space-y-2">
                <div className="font-bold text-stone-900 text-sm">Phase 3: Weeks 5 to 6</div>
                <div className="font-semibold text-emerald-950">Academics, Mess & Documents</div>
                <p className="text-stone-600">
                  Enable attendance tracking, cancellation alerts, mess menus, fee dues status, and PDF Bonafide certificate downloads.
                </p>
              </div>
            </div>
          </section>

          {/* Data Migration & CSV Templates */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide border-b border-stone-200 pb-1.5 flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#0f4c3a] text-white flex items-center justify-center text-xs rounded-[3px]">2</span>
              <span>Data Migration & Required CSV Schemas</span>
            </h2>
            <p>
              Existing college registers are imported using the built-in Data Migration module. All templates are validated row by row with line-by-line error reports:
            </p>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-[4px]">
                <strong className="text-stone-900 font-sans block mb-0.5">Students & Hostels (students.csv):</strong>
                <code>rollNumber, fullName, email, phone, hostelBlock, roomNumber, branch, year, batch</code>
              </div>
              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-[4px]">
                <strong className="text-stone-900 font-sans block mb-0.5">Timetable (timetable.csv):</strong>
                <code>branch, year, subjectCode, subjectName, facultyName, dayOfWeek, startTime, endTime, room</code>
              </div>
              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-[4px]">
                <strong className="text-stone-900 font-sans block mb-0.5">Fee Dues Register (fees.csv):</strong>
                <code>rollNumber, studentName, totalFee, paidFee, dueFee, dueDate, semester, academicYear, status</code>
              </div>
              <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-[4px]">
                <strong className="text-stone-900 font-sans block mb-0.5">Mess Weekly Menu (mess_menu.csv):</strong>
                <code>hostelBlock, dayOfWeek, breakfast, lunch, snacks, dinner</code>
              </div>
            </div>
          </section>

          {/* Training Plan & Coexistence with WhatsApp */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide border-b border-stone-200 pb-1.5 flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#0f4c3a] text-white flex items-center justify-center text-xs rounded-[3px]">3</span>
              <span>Staff Training & Coexistence with WhatsApp Groups</span>
            </h2>
            <p>
              To ensure zero operational disruption during migration from existing informal WhatsApp groups:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-stone-700">
              <li><strong>Dual-Broadcast Window:</strong> For the first 3 weeks, official notices published on CampusDesk will generate a one-line summary link shared to existing class WhatsApp groups.</li>
              <li><strong>Hostel Office Kiosk:</strong> Hostel caretakers use the Command Console (<code>COMPLAIN ...</code>) to file requests on behalf of walk-in students, printing immediate physical slips.</li>
              <li><strong>Hands-on Staff Workshop:</strong> A 90-minute training session for wardens and maintenance supervisors covering queue filtering, category correction, and resolution logging.</li>
            </ul>
          </section>

          {/* Risk Mitigation */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wide border-b border-stone-200 pb-1.5 flex items-center space-x-2">
              <span className="w-5 h-5 bg-[#0f4c3a] text-white flex items-center justify-center text-xs rounded-[3px]">4</span>
              <span>Risks & Technical Mitigation Strategies</span>
            </h2>

            <div className="space-y-2">
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-[4px]">
                <strong className="text-stone-900 block mb-1">Patchy Hostel Wi-Fi & Offline Submissions:</strong>
                <span className="text-stone-600">
                  Mitigated via Workbox PWA service worker and IndexedDB offline queue with visual &quot;Waiting to send&quot; indicators and auto-replay on reconnect.
                </span>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-[4px]">
                <strong className="text-stone-900 block mb-1">Students Without Smartphones:</strong>
                <span className="text-stone-600">
                  Mitigated via the in-app Text Command Console and printable physical ticket receipts at the hostel office.
                </span>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-[4px]">
                <strong className="text-stone-900 block mb-1">Category Misclassification:</strong>
                <span className="text-stone-600">
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
