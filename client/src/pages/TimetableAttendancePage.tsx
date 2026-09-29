import React, { useState, useEffect } from "react";
import { Calendar, AlertTriangle, Clock, MapPin, Plus, X, Save } from "lucide-react";
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

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-stone-300 p-4 rounded-[6px]">
        <div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-[#0f4c3a]" />
            <h1 className="text-xl font-bold text-stone-900">Academic Timetable & Schedule</h1>
          </div>
          <p className="text-xs text-stone-600 mt-0.5">
            Weekly subject schedule, lecture timings, classroom allocations and real-time class cancellations
          </p>
        </div>

        {isStaffOrAdmin && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="inline-flex items-center space-x-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold px-4 py-2 rounded-[4px]"
          >
            <Plus className="w-4 h-4" />
            <span>Post Class Cancellation</span>
          </button>
        )}
      </div>

      {/* Class Cancellations Alert Board */}
      {cancellations.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-[6px] p-4 shadow-sm">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>Active Class Cancellations & Makeup Announcements</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cancellations.map((c) => (
              <div key={c.id} className="bg-white border border-amber-200 p-3 rounded-[4px] text-xs">
                <div className="flex items-center justify-between font-bold text-stone-900">
                  <span>{c.subjectName} ({c.branch} Year {c.year})</span>
                  <span className="text-[11px] text-amber-900 font-medium">
                    {new Date(c.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-stone-600 mt-1">Faculty: {c.facultyName}</div>
                <div className="text-stone-800 mt-1 bg-amber-50/50 p-1.5 rounded-[2px] font-medium">
                  Reason: {c.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      <div className="bg-white border border-stone-300 rounded-[6px] p-5 shadow-sm">
        <h2 className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-200 pb-2 mb-4">
          Weekly Lecture Schedule ({user?.branch || "CSE"} Year {user?.year || 2})
        </h2>

        {loading ? (
          <div className="p-6 text-center text-xs text-stone-500">Loading schedule...</div>
        ) : schedule.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-500">
            No schedule loaded for this branch and year. Use Data Migration to import timetable CSV.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {days.map((dayName, idx) => {
              const dayNum = idx + 1;
              const dayClasses = schedule.filter((s) => s.dayOfWeek === dayNum);

              return (
                <div key={dayName} className="bg-stone-50 border border-stone-200 rounded-[4px] p-3 text-xs">
                  <div className="font-bold text-stone-800 uppercase tracking-wide border-b border-stone-200 pb-1.5 mb-2">
                    {dayName} ({dayClasses.length} sessions)
                  </div>

                  {dayClasses.length === 0 ? (
                    <div className="text-stone-400 italic py-2">No scheduled lectures</div>
                  ) : (
                    <div className="space-y-2">
                      {dayClasses.map((cls) => (
                        <div key={cls.id} className="bg-white p-2.5 border border-stone-200 rounded-[4px]">
                          <div className="font-bold text-stone-900">{cls.subjectName}</div>
                          <div className="text-[11px] text-stone-500 flex items-center space-x-3 mt-1">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{cls.startTime} - {cls.endTime}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{cls.room}</span>
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-600 mt-1">
                            Faculty: {cls.facultyName}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Class Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-[6px] max-w-md w-full p-5 space-y-4 shadow-xl text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h3 className="font-bold text-stone-900 text-sm">Post Class Cancellation</h3>
              <button onClick={() => setShowCancelModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostCancellation} className="space-y-3">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={cancelForm.subjectName}
                  onChange={(e) => setCancelForm({ ...cancelForm, subjectName: e.target.value })}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full p-2 border border-stone-300 rounded-[4px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Faculty Name</label>
                <input
                  type="text"
                  required
                  value={cancelForm.facultyName}
                  onChange={(e) => setCancelForm({ ...cancelForm, facultyName: e.target.value })}
                  className="w-full p-2 border border-stone-300 rounded-[4px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Branch</label>
                  <input
                    type="text"
                    required
                    value={cancelForm.branch}
                    onChange={(e) => setCancelForm({ ...cancelForm, branch: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded-[4px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Year</label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    required
                    value={cancelForm.year}
                    onChange={(e) => setCancelForm({ ...cancelForm, year: parseInt(e.target.value, 10) })}
                    className="w-full p-2 border border-stone-300 rounded-[4px]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Date of Cancelled Class</label>
                <input
                  type="date"
                  required
                  value={cancelForm.date}
                  onChange={(e) => setCancelForm({ ...cancelForm, date: e.target.value })}
                  className="w-full p-2 border border-stone-300 rounded-[4px]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">Reason for Cancellation</label>
                <textarea
                  rows={3}
                  required
                  value={cancelForm.reason}
                  onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })}
                  placeholder="e.g. Faculty participating in University Evaluation Committee"
                  className="w-full p-2 border border-stone-300 rounded-[4px]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-3 py-1.5 border border-stone-300 rounded-[4px] text-stone-700 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0f4c3a] text-white font-semibold rounded-[4px] hover:bg-[#0b392b] flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Publish Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
