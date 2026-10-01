import React, { useState, useEffect } from "react";
import { Calendar, AlertTriangle, Clock, MapPin, Plus, X, Save, BookOpen, UserCheck, CheckCircle2 } from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface ScheduleItem {
  id: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
}

interface ClassCancellationItem {
  id: string;
  subjectName: string;
  facultyName: string;
  date: string;
  branch: string;
  year: number;
  reason: string;
  postedBy: { fullName: string; department?: string };
}

export const TimetableAttendancePage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [cancellations, setCancellations] = useState<ClassCancellationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1); // 1 = Mon

  // Cancellation post modal (Faculty/Staff/Admin)
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelForm, setCancelForm] = useState({
    subjectName: "",
    facultyName: user?.fullName || "",
    date: new Date().toISOString().slice(0, 10),
    branch: user?.branch || "CSE",
    year: user?.year || 2,
    reason: ""
  });

  const isStaffOrAdmin = user && (user.role === "STAFF" || user.role === "ADMIN");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schedRes, cancelRes] = await Promise.all([
        apiRequest<{ schedule: ScheduleItem[] }>("/api/academic/timetable"),
        apiRequest<{ cancellations: ClassCancellationItem[] }>("/api/academic/cancellations")
      ]);

      setSchedule(schedRes.schedule || []);
      setCancellations(cancelRes.cancellations || []);
    } catch (err) {
      console.error("Failed to load academic schedule data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePostCancellation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/api/academic/cancellations", {
        method: "POST",
        body: JSON.stringify(cancelForm)
      });
      setShowCancelModal(false);
      setCancelForm({
        subjectName: "",
        facultyName: user?.fullName || "",
        date: new Date().toISOString().slice(0, 10),
        branch: user?.branch || "CSE",
        year: user?.year || 2,
        reason: ""
      });
      fetchData();
    } catch (err: any) {
      alert("Failed to post cancellation: " + err.message);
    }
  };

  const days = [
    { num: 1, name: "Monday" },
    { num: 2, name: "Tuesday" },
    { num: 3, name: "Wednesday" },
    { num: 4, name: "Thursday" },
    { num: 5, name: "Friday" },
    { num: 6, name: "Saturday" }
  ];

  const currentDayClasses = schedule.filter((s) => s.dayOfWeek === selectedDay);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-panel p-6 rounded-3xl border border-[rgba(77,42,0,0.1)] shadow-glass">
        <div>
          <div className="flex items-center space-x-2 text-[#CC6F00] text-[11px] font-bold uppercase mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Academic Schedule & Timetable</span>
          </div>
          <h1 className="text-2xl font-bold text-[#4D2A00]">Lecture Timetable & Alerts</h1>
          <p className="text-xs text-[#4D2A00]/70 mt-1">
            Weekly class timetable, room numbers, faculty details, and real-time class cancellations
          </p>
        </div>

        {isStaffOrAdmin && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="btn-primary inline-flex items-center space-x-2 text-xs font-bold px-5 py-2.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Post Class Cancellation</span>
          </button>
        )}
      </div>

      {/* Real-time Class Cancellation Alerts */}
      {cancellations.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#CC6F00] flex items-center space-x-1.5">
            <AlertTriangle className="w-4 h-4 text-[#CC6F00]" />
            <span>Live Class Cancellation Notices ({cancellations.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cancellations.map((c) => (
              <div key={c.id} className="p-4 bg-[#FDB773]/20 border border-[#CC6F00]/30 rounded-2xl space-y-1 text-xs text-[#4D2A00]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#4D2A00]">{c.subjectName}</span>
                  <span className="font-mono text-[11px] text-[#4D2A00]/60">{new Date(c.date).toLocaleDateString()}</span>
                </div>
                <p className="text-[#4D2A00]/80">Faculty: <strong className="text-[#4D2A00]">{c.facultyName}</strong> • {c.branch} Year {c.year}</p>
                <p className="text-[#4D2A00]/70 font-mono pt-1 text-[11px]">Reason: {c.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day Selector Pills */}
      <div className="flex flex-wrap gap-2 p-1.5 glass-panel rounded-2xl border border-[rgba(77,42,0,0.08)]">
        {days.map((d) => (
          <button
            key={d.num}
            onClick={() => setSelectedDay(d.num)}
            className={`flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl transition-all duration-200 ${
              selectedDay === d.num
                ? "bg-[#FDB773] text-[#4D2A00] font-bold shadow-sm"
                : "text-[#4D2A00]/70 hover:text-[#4D2A00] hover:bg-white/60"
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* Classes for Selected Day */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-14 text-center text-xs text-[#4D2A00]/60 glass-panel rounded-3xl border border-[rgba(77,42,0,0.1)]">
            Loading timetable records...
          </div>
        ) : currentDayClasses.length === 0 ? (
          <div className="p-14 text-center text-xs text-[#4D2A00]/60 glass-panel rounded-3xl border border-[rgba(77,42,0,0.1)]">
            No scheduled lectures or labs for {days.find((d) => d.num === selectedDay)?.name}.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentDayClasses.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl glass-card space-y-3 border border-[rgba(77,42,0,0.08)]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-[#FDB773]/30 text-[#4D2A00] border border-[#CC6F00]/25">
                      {item.subjectCode}
                    </span>
                    <h3 className="font-bold text-sm text-[#4D2A00] mt-2">{item.subjectName}</h3>
                  </div>
                  <div className="p-2 rounded-xl bg-white/60 text-[#CC6F00] border border-[rgba(77,42,0,0.08)]">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-1.5 text-xs pt-2 border-t border-[rgba(77,42,0,0.08)]">
                  <div className="flex items-center space-x-2 text-[#4D2A00]/80">
                    <Clock className="w-3.5 h-3.5 text-[#CC6F00]" />
                    <span className="font-mono">{item.startTime} - {item.endTime}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#4D2A00]/80">
                    <MapPin className="w-3.5 h-3.5 text-[#CC6F00]" />
                    <span>Room / Lab: <strong className="text-[#4D2A00] font-mono">{item.room}</strong></span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#4D2A00]/80">
                    <UserCheck className="w-3.5 h-3.5 text-[#CC6F00]" />
                    <span>Faculty: <strong className="text-[#4D2A00]">{item.facultyName}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal max-w-md w-full p-6 space-y-4 text-xs rounded-3xl border border-[rgba(77,42,0,0.15)] shadow-glass">
            <div className="flex items-center justify-between border-b border-[rgba(77,42,0,0.1)] pb-3">
              <h3 className="text-base font-bold text-[#4D2A00]">Post Class Cancellation Notice</h3>
              <button onClick={() => setShowCancelModal(false)} className="text-[#4D2A00]/60 hover:text-[#4D2A00]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostCancellation} className="space-y-4">
              <div>
                <label className="block font-semibold text-[#4D2A00] mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={cancelForm.subjectName}
                  onChange={(e) => setCancelForm({ ...cancelForm, subjectName: e.target.value })}
                  placeholder="e.g. Design & Analysis of Algorithms"
                  className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:border-[#CC6F00]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4D2A00] mb-1">Target Branch *</label>
                  <input
                    type="text"
                    required
                    value={cancelForm.branch}
                    onChange={(e) => setCancelForm({ ...cancelForm, branch: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#4D2A00] mb-1">Target Year *</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    required
                    value={cancelForm.year}
                    onChange={(e) => setCancelForm({ ...cancelForm, year: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4D2A00] mb-1">Cancellation Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })}
                  placeholder="e.g. Faculty attending university curriculum council meeting"
                  className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:border-[#CC6F00] resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[rgba(77,42,0,0.1)]">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2 text-xs font-bold shadow-sm"
                >
                  Broadcast Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableAttendancePage;
