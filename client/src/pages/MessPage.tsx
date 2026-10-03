import React, { useState, useEffect } from "react";
import { Utensils, Edit3, CheckCircle2, X, Star } from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface MessMenuItem {
  id: string;
  hostelBlock: string;
  dayOfWeek: number;
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
  updatedAt?: string;
}

interface FeedbackSummary {
  hostelBlock: string;
  totalResponses: number;
  summary: Array<{ mealType: string; responseCount: number; averageRating: number }>;
  recentFeedbacks: Array<{
    id: string;
    mealType: string;
    rating: number;
    comments?: string;
    createdAt: string;
    student: { fullName: string; rollNumber: string };
  }>;
}

export const MessPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [hostelBlock, setHostelBlock] = useState<string>(user?.hostelBlock || "Hostel-A");
  const [menu, setMenu] = useState<MessMenuItem[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Student feedback form
  const [feedbackMeal, setFeedbackMeal] = useState<string>("LUNCH");
  const [feedbackRating, setFeedbackRating] = useState<number>(4);
  const [feedbackComments, setFeedbackComments] = useState<string>("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Menu editing state (Strictly ONLY Warden and Admin)
  const [isEditingMenu, setIsEditingMenu] = useState<boolean>(false);
  const [editDayOfWeek, setEditDayOfWeek] = useState<number>(1);
  const [editBreakfast, setEditBreakfast] = useState<string>("");
  const [editLunch, setEditLunch] = useState<string>("");
  const [editSnacks, setEditSnacks] = useState<string>("");
  const [editDinner, setEditDinner] = useState<string>("");
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const isAdminOrWarden = user && (user.role === "ADMIN" || user.role === "WARDEN");
  const isStaffOrManagement = user && (user.role === "ADMIN" || user.role === "WARDEN" || user.role === "STAFF");

  const fetchData = async () => {
    try {
      setLoading(true);
      const menuData = await apiRequest<{ menu: MessMenuItem[] }>(`/api/mess/menu?hostelBlock=${hostelBlock}`);
      setMenu(menuData.menu || []);

      if (isStaffOrManagement) {
        const summaryData = await apiRequest<FeedbackSummary>(`/api/mess/feedback-summary?hostelBlock=${hostelBlock}`);
        setSummary(summaryData);
      }
    } catch (err) {
      console.error("Failed to load mess data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [hostelBlock]);

  // Pre-fill edit inputs whenever editDayOfWeek changes or menu updates
  useEffect(() => {
    const existing = menu.find((m) => m.dayOfWeek === editDayOfWeek);
    if (existing) {
      setEditBreakfast(existing.breakfast || "");
      setEditLunch(existing.lunch || "");
      setEditSnacks(existing.snacks || "");
      setEditDinner(existing.dinner || "");
    } else {
      setEditBreakfast("");
      setEditLunch("");
      setEditSnacks("");
      setEditDinner("");
    }
  }, [editDayOfWeek, menu, isEditingMenu]);

  const handleOpenEditForDay = (dayNum: number) => {
    if (!isAdminOrWarden) return;
    setEditDayOfWeek(dayNum);
    const existing = menu.find((m) => m.dayOfWeek === dayNum);
    if (existing) {
      setEditBreakfast(existing.breakfast || "");
      setEditLunch(existing.lunch || "");
      setEditSnacks(existing.snacks || "");
      setEditDinner(existing.dinner || "");
    } else {
      setEditBreakfast("");
      setEditLunch("");
      setEditSnacks("");
      setEditDinner("");
    }
    setEditError(null);
    setEditSuccess(null);
    setIsEditingMenu(true);
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminOrWarden) return;

    setEditSubmitting(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      await apiRequest("/api/mess/menu", {
        method: "PUT",
        body: JSON.stringify({
          hostelBlock,
          dayOfWeek: editDayOfWeek,
          breakfast: editBreakfast,
          lunch: editLunch,
          snacks: editSnacks,
          dinner: editDinner
        })
      });

      setEditSuccess("Weekly mess menu schedule updated successfully.");
      setIsEditingMenu(false);
      fetchData();
    } catch (err: any) {
      setEditError(err.message || "Failed to update mess menu.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSubmitting(true);
    setFeedbackSuccess(null);

    try {
      await apiRequest("/api/mess/feedback", {
        method: "POST",
        body: JSON.stringify({
          hostelBlock,
          mealType: feedbackMeal,
          rating: feedbackRating,
          comments: feedbackComments || undefined
        })
      });

      setFeedbackSuccess("Your meal rating and feedback has been recorded.");
      setFeedbackComments("");
      if (isStaffOrManagement) fetchData();
    } catch (err: any) {
      alert("Failed to submit feedback: " + err.message);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayNum = new Date().getDay();
  const todayItem = menu.find((m) => m.dayOfWeek === currentDayNum) || menu[0];

  return (
    <div className="space-y-8 pb-16 font-mono">
      {/* Top Header */}
      <section className="border-b border-[var(--border-subtle)] pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="editorial-eyebrow text-[#FF6D1F] block mb-2">
            01 // CATERING & NUTRITION
          </span>
          <h1 className="editorial-title text-xl sm:text-2xl text-[var(--text-primary)]">
            CAMPUS DINING DISPATCH
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            4-meal daily menu schedules, dietary inspection records, and student meal ratings.
          </p>
        </div>

        {/* Hostel Block Switcher */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[var(--text-secondary)]">HOSTEL:</span>
          <select
            value={hostelBlock}
            onChange={(e) => setHostelBlock(e.target.value)}
            className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs rounded-lg focus:border-[#FF6D1F] outline-none"
          >
            <option value="Hostel-A">Hostel-A (Boys Senior)</option>
            <option value="Hostel-B">Hostel-B (Boys Junior)</option>
            <option value="Hostel-C">Hostel-C (Girls Campus)</option>
            <option value="Hostel-D">Hostel-D (PG & Research)</option>
            <option value="Hostel-E">Hostel-E (International)</option>
          </select>
        </div>
      </section>

      {editSuccess && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{editSuccess}</span>
        </div>
      )}

      {/* Section 25: EDITORIAL RESTAURANT MENU (TODAY'S SPECIAL DISPATCH) */}
      <section className="campus-block p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div>
            <span className="editorial-eyebrow text-[#FF6D1F] block mb-1">
              TODAY'S CURATED MENU // {dayNames[currentDayNum].toUpperCase()}
            </span>
            <h2 className="editorial-title text-2xl text-[var(--text-primary)]">
              DAILY DINING ROSTER
            </h2>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
            DINING HALL A
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#FF6D1F]">BREAKFAST</span>
              <span className="text-[10px] text-[var(--text-muted)]">07:30 – 09:30</span>
            </div>
            <p className="text-xs font-sans text-[var(--text-primary)] leading-relaxed">
              {todayItem?.breakfast || "Poha · Boiled Egg / Banana · Special Chai"}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#FF6D1F]">LUNCH</span>
              <span className="text-[10px] text-[var(--text-muted)]">12:30 – 14:30</span>
            </div>
            <p className="text-xs font-sans text-[var(--text-primary)] leading-relaxed">
              {todayItem?.lunch || "Steamed Rice · Dal Tadka · Shahi Paneer · Kachumber"}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#FF6D1F]">SNACKS</span>
              <span className="text-[10px] text-[var(--text-muted)]">17:00 – 18:00</span>
            </div>
            <p className="text-xs font-sans text-[var(--text-primary)] leading-relaxed">
              {todayItem?.snacks || "Adrak Chai · Masala Cookies / Samosa"}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#FF6D1F]">DINNER</span>
              <span className="text-[10px] text-[var(--text-muted)]">20:00 – 22:00</span>
            </div>
            <p className="text-xs font-sans text-[var(--text-primary)] leading-relaxed">
              {todayItem?.dinner || "Phulka Roti · Seasonal Mixed Sabzi · Dal Fry · Kheer"}
            </p>
          </div>
        </div>
      </section>

      {/* 7-Day Menu Schedule Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <span className="editorial-eyebrow text-[#FF6D1F]">
            WEEKLY 4-MEAL SCHEDULE // {hostelBlock.toUpperCase()}
          </span>
          {isAdminOrWarden && (
            <span className="text-[11px] text-[var(--text-muted)]">Select edit icon to modify daily recipes</span>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-[var(--text-muted)]">
            Synchronizing weekly catering schedule...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
              const dayItem = menu.find((m) => m.dayOfWeek === dayNum);
              const isToday = currentDayNum === dayNum;

              return (
                <div
                  key={dayNum}
                  className={`p-5 rounded-lg border transition-colors ${
                    isToday
                      ? "bg-[var(--bg-hover)] border-[#FF6D1F]/50 shadow-md"
                      : "bg-[var(--bg-elevated)] border-[var(--border-subtle)]"
                  } flex flex-col justify-between space-y-4`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-[var(--text-primary)]">{dayNames[dayNum]}</span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#FF6D1F] text-[#141414] rounded">
                            TODAY
                          </span>
                        )}
                      </div>
                      {isAdminOrWarden && (
                        <button
                          onClick={() => handleOpenEditForDay(dayNum)}
                          className="p-1 rounded text-[var(--text-muted)] hover:text-[#FF6D1F] transition-colors"
                          title="Edit Menu"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-3 text-xs">
                      <div>
                        <span className="text-[10px] text-[#FF6D1F] uppercase font-bold block">
                          Breakfast
                        </span>
                        <p className="text-[var(--text-primary)] font-sans text-xs mt-0.5 leading-snug">
                          {dayItem?.breakfast || "Poha · Banana · Tea"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#FF6D1F] uppercase font-bold block">
                          Lunch
                        </span>
                        <p className="text-[var(--text-primary)] font-sans text-xs mt-0.5 leading-snug">
                          {dayItem?.lunch || "Rice · Dal · Veg · Curd"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#FF6D1F] uppercase font-bold block">
                          Snacks
                        </span>
                        <p className="text-[var(--text-primary)] font-sans text-xs mt-0.5 leading-snug">
                          {dayItem?.snacks || "Tea / Coffee with Biscuits"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#FF6D1F] uppercase font-bold block">
                          Dinner
                        </span>
                        <p className="text-[var(--text-primary)] font-sans text-xs mt-0.5 leading-snug">
                          {dayItem?.dinner || "Roti · Mixed Veg · Dal Fry"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Student Meal Feedback & Rating Box */}
      {user?.role === "STUDENT" && (
        <section className="campus-block p-6 sm:p-8 space-y-4 max-w-xl">
          <div>
            <span className="editorial-eyebrow text-[#FF6D1F] block mb-1">
              STUDENT TELEMETRY
            </span>
            <h2 className="editorial-title text-xl text-[var(--text-primary)]">
              TODAY'S MEAL RATING & FEEDBACK
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Aggregated and reviewed directly by Hostel Warden and Catering Committee.
            </p>
          </div>

          {feedbackSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{feedbackSuccess}</span>
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-[var(--text-secondary)]">Meal Period *</label>
                <select
                  value={feedbackMeal}
                  onChange={(e) => setFeedbackMeal(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:border-[#FF6D1F] outline-none"
                >
                  <option value="BREAKFAST">Breakfast</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="SNACKS">Evening Snacks</option>
                  <option value="DINNER">Dinner</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-[var(--text-secondary)]">Star Rating *</label>
                <div className="flex items-center space-x-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-0.5 text-[#FF6D1F] hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= feedbackRating ? "fill-[#FF6D1F] text-[#FF6D1F]" : "text-[var(--text-muted)]/30"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-[#FF6D1F] ml-2 text-xs">{feedbackRating}/5</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] uppercase text-[var(--text-secondary)]">Taste & Hygiene Remarks</label>
              <input
                type="text"
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                placeholder="Comment on temperature, portion, or salt levels..."
                className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#FF6D1F] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={feedbackSubmitting}
              className="btn-primary px-5 py-2.5 text-xs font-bold disabled:opacity-50"
            >
              {feedbackSubmitting ? "RECORDING..." : "SUBMIT MEAL RATING"}
            </button>
          </form>
        </section>
      )}

      {/* Admin / Warden Feedback Analytics */}
      {isStaffOrManagement && summary && (
        <section className="campus-block p-6 sm:p-8 space-y-6">
          <div>
            <span className="editorial-eyebrow text-[#FF6D1F] block mb-1">
              HOSTEL TELEMETRY
            </span>
            <h2 className="editorial-title text-xl text-[var(--text-primary)]">
              CATERING SATISFACTION TELEMETRY ({hostelBlock})
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Total responses recorded: {summary.totalResponses}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {summary.summary.map((s) => (
              <div key={s.mealType} className="p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-center">
                <span className="text-[10px] uppercase text-[var(--text-muted)] block">{s.mealType}</span>
                <span className="text-2xl font-black text-[#FF6D1F] block mt-1">
                  ★ {s.averageRating.toFixed(1)}
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5">{s.responseCount} reviews</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Edit Menu Modal */}
      {isAdminOrWarden && isEditingMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="campus-block max-w-lg w-full p-6 space-y-4 text-xs font-mono border border-[var(--border-subtle)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase">
                EDIT {dayNames[editDayOfWeek].toUpperCase()} MENU — {hostelBlock}
              </h3>
              <button onClick={() => setIsEditingMenu(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-300 rounded-lg">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveMenu} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block uppercase text-[10px] text-[var(--text-secondary)]">Breakfast Menu</label>
                <input
                  type="text"
                  required
                  value={editBreakfast}
                  onChange={(e) => setEditBreakfast(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#FF6D1F] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block uppercase text-[10px] text-[var(--text-secondary)]">Lunch Menu</label>
                <input
                  type="text"
                  required
                  value={editLunch}
                  onChange={(e) => setEditLunch(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#FF6D1F] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block uppercase text-[10px] text-[var(--text-secondary)]">Evening Snacks</label>
                <input
                  type="text"
                  required
                  value={editSnacks}
                  onChange={(e) => setEditSnacks(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#FF6D1F] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block uppercase text-[10px] text-[var(--text-secondary)]">Dinner Menu</label>
                <input
                  type="text"
                  required
                  value={editDinner}
                  onChange={(e) => setEditDinner(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#FF6D1F] outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsEditingMenu(false)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="btn-primary px-5 py-2 text-xs font-bold"
                >
                  {editSubmitting ? "SAVING..." : "SAVE MENU"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessPage;
