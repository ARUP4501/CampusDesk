import React, { useState, useEffect } from "react";
import { Utensils, Edit3, CheckCircle2, BarChart3, X, Save, AlertCircle, Star, Sparkles } from "lucide-react";
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
      await apiRequest(
        "/api/mess/feedback",
        {
          method: "POST",
          body: JSON.stringify({
            hostelBlock,
            mealType: feedbackMeal,
            rating: feedbackRating,
            comments: feedbackComments || undefined
          })
        },
        {
          label: `Mess Rating: ${feedbackMeal}`,
          data: { hostelBlock, mealType: feedbackMeal, rating: feedbackRating }
        }
      );

      setFeedbackSuccess("Your meal feedback and rating have been recorded.");
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

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-panel p-6 rounded-3xl border border-[rgba(77,42,0,0.1)] shadow-glass">
        <div>
          <div className="flex items-center space-x-2 text-[#CC6F00] text-[11px] font-bold uppercase mb-1">
            <Utensils className="w-3.5 h-3.5" />
            <span>Hostel Dining & Catering</span>
          </div>
          <h1 className="text-2xl font-bold text-[#4D2A00]">Hostel Mess Menu & Ratings</h1>
          <p className="text-xs text-[#4D2A00]/70 mt-1">
            4-meal daily menu schedules, dietary inspection records, and student meal ratings
          </p>
        </div>

        {/* Hostel Block Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#4D2A00]/80">Select Block:</span>
          <select
            value={hostelBlock}
            onChange={(e) => setHostelBlock(e.target.value)}
            className="px-3.5 py-2 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] text-xs focus:outline-none focus:border-[#CC6F00]"
          >
            <option value="Hostel-A">Hostel-A (Boys Senior)</option>
            <option value="Hostel-B">Hostel-B (Boys Junior)</option>
            <option value="Hostel-C">Hostel-C (Girls Campus)</option>
          </select>
        </div>
      </div>

      {editSuccess && (
        <div className="p-4 bg-emerald-500/20 text-emerald-950 border border-emerald-500/30 rounded-2xl text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{editSuccess}</span>
        </div>
      )}

      {/* 7-Day Menu Schedule Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#CC6F00]">
            Weekly 4-Meal Menu ({hostelBlock})
          </h2>
          {isAdminOrWarden && (
            <span className="text-xs text-[#4D2A00]/60">Click edit icon to modify recipes</span>
          )}
        </div>

        {loading ? (
          <div className="p-14 text-center text-xs text-[#4D2A00]/60 glass-panel rounded-3xl border border-[rgba(77,42,0,0.1)]">
            Loading mess menu schedule...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
              const dayItem = menu.find((m) => m.dayOfWeek === dayNum);
              const isToday = currentDayNum === dayNum;

              return (
                <div
                  key={dayNum}
                  className={`p-5 rounded-3xl border transition-all ${
                    isToday
                      ? "bg-[#FDB773]/30 border-[#CC6F00]/50 shadow-glass"
                      : "glass-card border-[rgba(77,42,0,0.08)]"
                  } flex flex-col justify-between space-y-4`}
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-[rgba(77,42,0,0.08)]">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-[#4D2A00]">{dayNames[dayNum]}</span>
                        {isToday && (
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-[#FDB773] text-[#4D2A00] border border-[#CC6F00]/30 rounded-md">
                            TODAY
                          </span>
                        )}
                      </div>
                      {isAdminOrWarden && (
                        <button
                          onClick={() => handleOpenEditForDay(dayNum)}
                          className="p-1.5 rounded-lg text-[#4D2A00]/60 hover:text-[#CC6F00] hover:bg-white/60 transition-colors"
                          title="Edit Menu"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-3 text-xs">
                      <div>
                        <span className="text-[10px] text-[#CC6F00] uppercase font-bold block">
                          Breakfast (07:30 - 09:30)
                        </span>
                        <p className="text-[#4D2A00] mt-0.5 leading-snug">
                          {dayItem?.breakfast || "Standard Continental / Indian Breakfast"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#CC6F00] uppercase font-bold block">
                          Lunch (12:30 - 14:30)
                        </span>
                        <p className="text-[#4D2A00] mt-0.5 leading-snug">
                          {dayItem?.lunch || "Full Meal Rice, Dal, Veg & Curd"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#CC6F00] uppercase font-bold block">
                          Snacks (17:00 - 18:00)
                        </span>
                        <p className="text-[#4D2A00] mt-0.5 leading-snug">
                          {dayItem?.snacks || "Tea / Coffee with Evening Snack"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-[#CC6F00] uppercase font-bold block">
                          Dinner (20:00 - 22:00)
                        </span>
                        <p className="text-[#4D2A00] mt-0.5 leading-snug">
                          {dayItem?.dinner || "Roti, Sabzi, Rice & Sweet/Dessert"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Student Meal Feedback & Rating Box */}
      {user?.role === "STUDENT" && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 max-w-2xl border border-[rgba(77,42,0,0.1)] shadow-glass">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#CC6F00]">
              Today&apos;s Meal Rating & Feedback
            </h2>
            <p className="text-xs text-[#4D2A00]/70 mt-0.5">
              Your feedback is aggregated and directly reviewed by hostel wardens and catering contractors.
            </p>
          </div>

          {feedbackSuccess && (
            <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-xs text-emerald-950 font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{feedbackSuccess}</span>
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#4D2A00] mb-1">Meal Period *</label>
                <select
                  value={feedbackMeal}
                  onChange={(e) => setFeedbackMeal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                >
                  <option value="BREAKFAST">Breakfast</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="SNACKS">Evening Snacks</option>
                  <option value="DINNER">Dinner</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#4D2A00] mb-1">Star Rating (1 - 5) *</label>
                <div className="flex items-center space-x-2 pt-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 text-[#CC6F00] hover:scale-125 transition-transform"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= feedbackRating ? "fill-[#CC6F00] text-[#CC6F00]" : "text-[#4D2A00]/30"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-mono text-[#CC6F00] font-bold ml-2 text-sm">{feedbackRating}/5</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#4D2A00] mb-1">Optional Comments / Taste Feedback</label>
              <input
                type="text"
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                placeholder="Mention taste, hygiene, food temperature, or portion quality..."
                className="w-full px-3.5 py-2.5 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] placeholder-[#4D2A00]/40 focus:outline-none focus:border-[#CC6F00]"
              />
            </div>

            <button
              type="submit"
              disabled={feedbackSubmitting}
              className="btn-primary px-6 py-2.5 text-xs font-bold disabled:opacity-50 shadow-sm"
            >
              {feedbackSubmitting ? "Submitting..." : "Submit Meal Rating"}
            </button>
          </form>
        </div>
      )}

      {/* Admin / Warden Feedback Analytics */}
      {isStaffOrManagement && summary && (
        <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-[rgba(77,42,0,0.1)] shadow-glass">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#CC6F00]">
              Catering Satisfaction Telemetry ({hostelBlock})
            </h2>
            <p className="text-xs text-[#4D2A00]/70 mt-0.5">
              Total responses recorded: {summary.totalResponses}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summary.summary.map((s) => (
              <div key={s.mealType} className="p-4 bg-white/50 border border-[rgba(77,42,0,0.08)] rounded-2xl text-center">
                <span className="text-[10px] font-mono uppercase text-[#4D2A00]/60 block">{s.mealType}</span>
                <span className="text-2xl font-extrabold text-[#CC6F00] font-mono block mt-1">
                  ★ {s.averageRating.toFixed(1)}
                </span>
                <span className="text-[10px] text-[#4D2A00]/70 block mt-0.5">{s.responseCount} reviews</span>
              </div>
            ))}
          </div>

          {summary.recentFeedbacks && summary.recentFeedbacks.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[rgba(77,42,0,0.08)]">
              <h3 className="text-xs font-semibold text-[#4D2A00]">Recent Student Feedback Comments</h3>
              <div className="space-y-2">
                {summary.recentFeedbacks.map((fb) => (
                  <div key={fb.id} className="p-3 bg-white/50 rounded-2xl border border-[rgba(77,42,0,0.08)] text-xs flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#4D2A00]">{fb.student.fullName}</span>
                        <span className="text-[10px] font-mono font-bold text-[#CC6F00]">★ {fb.rating}/5 ({fb.mealType})</span>
                      </div>
                      <p className="text-[#4D2A00]/80">{fb.comments || "No written remarks."}</p>
                    </div>
                    <span className="text-[10px] font-mono text-[#4D2A00]/60 shrink-0">
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Menu Modal */}
      {isAdminOrWarden && isEditingMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-fadeIn">
          <div className="glass-modal max-w-lg w-full p-6 space-y-4 text-xs rounded-3xl border border-[rgba(77,42,0,0.15)] shadow-glass">
            <div className="flex items-center justify-between border-b border-[rgba(77,42,0,0.1)] pb-3">
              <h3 className="text-base font-bold text-[#4D2A00]">
                Edit {dayNames[editDayOfWeek]} Menu — {hostelBlock}
              </h3>
              <button onClick={() => setIsEditingMenu(false)} className="text-[#4D2A00]/60 hover:text-[#4D2A00]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-900 font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveMenu} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-[#4D2A00] mb-1">Breakfast Menu</label>
                <input
                  type="text"
                  required
                  value={editBreakfast}
                  onChange={(e) => setEditBreakfast(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4D2A00] mb-1">Lunch Menu</label>
                <input
                  type="text"
                  required
                  value={editLunch}
                  onChange={(e) => setEditLunch(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4D2A00] mb-1">Evening Snacks</label>
                <input
                  type="text"
                  required
                  value={editSnacks}
                  onChange={(e) => setEditSnacks(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4D2A00] mb-1">Dinner Menu</label>
                <input
                  type="text"
                  required
                  value={editDinner}
                  onChange={(e) => setEditDinner(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] focus:outline-none focus:border-[#CC6F00]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-[rgba(77,42,0,0.1)]">
                <button
                  type="button"
                  onClick={() => setIsEditingMenu(false)}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="btn-primary px-6 py-2 text-xs font-bold disabled:opacity-50 shadow-sm"
                >
                  {editSubmitting ? "Saving..." : "Save Menu Changes"}
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
