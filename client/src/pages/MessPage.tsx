import React, { useState, useEffect } from "react";
import { Utensils, Edit3, CheckCircle, BarChart3, X, Save, AlertCircle, Trash2, Star } from "lucide-react";
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
    setEditSuccess(null);
    setEditError(null);
    setIsEditingMenu(true);
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminOrWarden) return;

    setEditSubmitting(true);
    setEditSuccess(null);
    setEditError(null);

    try {
      await apiRequest("/api/mess/menu", {
        method: "POST",
        body: JSON.stringify({
          hostelBlock,
          dayOfWeek: editDayOfWeek,
          breakfast: editBreakfast,
          lunch: editLunch,
          snacks: editSnacks,
          dinner: editDinner
        })
      });

      setEditSuccess(`Menu items updated successfully for ${daysMap[editDayOfWeek - 1]}.`);
      await fetchData();
    } catch (err: any) {
      setEditError(err.message || "Failed to update menu items.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteDayMenu = async (dayNum: number) => {
    if (!isAdminOrWarden) return;
    if (!confirm(`Are you sure you want to reset the menu for ${daysMap[dayNum - 1]}?`)) return;

    try {
      await apiRequest(`/api/mess/menu?hostelBlock=${hostelBlock}&dayOfWeek=${dayNum}`, {
        method: "DELETE"
      });
      setEditSuccess(`Menu reset for ${daysMap[dayNum - 1]}.`);
      fetchData();
    } catch (err: any) {
      alert("Failed to reset menu: " + err.message);
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
      setFeedbackSuccess("Your feedback has been recorded. Thank you for rating today's meal.");
      setFeedbackComments("");
      if (isStaffOrManagement) fetchData();
    } catch (err: any) {
      alert("Feedback failed: " + err.message);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const daysMap = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#14181C] border border-[#252B31] p-5 rounded-[6px] shadow-subtle">
        <div>
          <div className="flex items-center space-x-2 text-[#D6A84F] text-[11px] font-mono uppercase mb-1">
            <Utensils className="w-3.5 h-3.5" />
            <span>Hostel Dining Operations</span>
          </div>
          <h1 className="text-xl font-bold text-[#F3F4F6]">Hostel Mess Menu & Feedback</h1>
          <p className="text-xs text-[#A7ADB5] mt-0.5">
            Weekly 7-day dining schedule and student meal satisfaction telemetry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-[#A7ADB5]">Hostel Block:</span>
            <select
              value={hostelBlock}
              onChange={(e) => setHostelBlock(e.target.value)}
              className="border border-[#252B31] rounded-[4px] px-2.5 py-1.5 bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
            >
              <option value="Hostel-A">Hostel-A (Boys Senior)</option>
              <option value="Hostel-B">Hostel-B (Boys Junior)</option>
              <option value="Hostel-C">Hostel-C (Girls Campus)</option>
            </select>
          </div>

          {isAdminOrWarden && (
            <button
              onClick={() => {
                setEditSuccess(null);
                setEditError(null);
                setIsEditingMenu(!isEditingMenu);
              }}
              className="px-3.5 py-1.5 bg-[#D6A84F] hover:bg-[#F0C86A] text-[#090B0D] font-bold rounded-[4px] flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingMenu ? "Close Editor" : "Manage Menu Items"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Menu Editor Panel (Strictly ADMIN and WARDEN) */}
      {isAdminOrWarden && isEditingMenu && (
        <div className="bg-[#14181C] border border-[#D6A84F]/40 rounded-[6px] p-5 shadow-elevated space-y-4">
          <div className="flex items-center justify-between border-b border-[#252B31] pb-3">
            <div className="flex items-center space-x-2">
              <Edit3 className="w-4 h-4 text-[#D6A84F]" />
              <h2 className="text-sm font-bold text-[#F3F4F6] uppercase tracking-wide">
                Manage Mess Menu Items ({hostelBlock})
              </h2>
            </div>
            <button
              onClick={() => setIsEditingMenu(false)}
              className="text-[#6F7781] hover:text-[#F3F4F6]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {editSuccess && (
            <div className="p-3 text-xs bg-emerald-500/10 text-emerald-200 border border-emerald-500/30 rounded-[4px] font-medium flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{editSuccess}</span>
            </div>
          )}

          {editError && (
            <div className="p-3 text-xs bg-red-500/10 text-red-200 border border-red-500/30 rounded-[4px] font-medium flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          <form onSubmit={handleSaveMenu} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#A7ADB5] mb-1.5">Select Day of Week</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {daysMap.map((dayName, idx) => {
                  const dayNum = idx + 1;
                  const isSelected = editDayOfWeek === dayNum;
                  return (
                    <button
                      key={dayName}
                      type="button"
                      onClick={() => setEditDayOfWeek(dayNum)}
                      className={`px-2.5 py-1.5 text-center font-medium rounded-[4px] border transition-colors ${
                        isSelected
                          ? "bg-[#D6A84F] text-[#090B0D] border-[#D6A84F] font-bold"
                          : "bg-[#101316] text-[#A7ADB5] border-[#252B31] hover:bg-[#181D22] hover:text-[#F3F4F6]"
                      }`}
                    >
                      {dayName}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#A7ADB5] mb-1">
                  Breakfast Items ({daysMap[editDayOfWeek - 1]}) *
                </label>
                <textarea
                  rows={2}
                  value={editBreakfast}
                  onChange={(e) => setEditBreakfast(e.target.value)}
                  placeholder="e.g. Masala Dosa, Sambar, Coconut Chutney, Tea, Coffee"
                  required
                  className="w-full p-2.5 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#A7ADB5] mb-1">
                  Lunch Items ({daysMap[editDayOfWeek - 1]}) *
                </label>
                <textarea
                  rows={2}
                  value={editLunch}
                  onChange={(e) => setEditLunch(e.target.value)}
                  placeholder="e.g. Steamed Rice, Dal Tadka, Paneer Butter Masala, Roti, Curd, Salad"
                  required
                  className="w-full p-2.5 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#A7ADB5] mb-1">
                  Evening Snacks ({daysMap[editDayOfWeek - 1]}) *
                </label>
                <textarea
                  rows={2}
                  value={editSnacks}
                  onChange={(e) => setEditSnacks(e.target.value)}
                  placeholder="e.g. Veg Samosa, Green Mint Chutney, Hot Ginger Tea"
                  required
                  className="w-full p-2.5 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#A7ADB5] mb-1">
                  Dinner Items ({daysMap[editDayOfWeek - 1]}) *
                </label>
                <textarea
                  rows={2}
                  value={editDinner}
                  onChange={(e) => setEditDinner(e.target.value)}
                  placeholder="e.g. Chapati, Mixed Veg Curry, Jeera Rice, Dal Fry, Sweet Gulab Jamun"
                  required
                  className="w-full p-2.5 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#252B31]">
              <button
                type="button"
                onClick={() => handleDeleteDayMenu(editDayOfWeek)}
                className="px-3 py-2 border border-red-500/30 bg-red-500/10 text-red-300 font-medium rounded-[4px] hover:bg-red-500/20 flex items-center space-x-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset {daysMap[editDayOfWeek - 1]} Menu</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditingMenu(false)}
                  className="px-4 py-2 border border-[#252B31] bg-[#101316] text-[#A7ADB5] hover:text-[#F3F4F6] font-medium rounded-[4px] hover:bg-[#181D22] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 bg-[#D6A84F] hover:bg-[#F0C86A] text-[#090B0D] font-bold rounded-[4px] disabled:opacity-50 flex items-center space-x-1.5 transition-colors shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{editSubmitting ? "Saving..." : `Save ${daysMap[editDayOfWeek - 1]} Menu`}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Weekly Menu Grid */}
      <div className="bg-[#14181C] border border-[#252B31] rounded-[6px] p-5 shadow-subtle">
        <div className="flex items-center justify-between border-b border-[#252B31] pb-2 mb-4">
          <h2 className="text-xs font-mono font-bold text-[#D6A84F] uppercase tracking-wider flex items-center space-x-2">
            <Utensils className="w-4 h-4" />
            <span>Weekly Dining Schedule ({hostelBlock})</span>
          </h2>
          {isAdminOrWarden && !isEditingMenu && (
            <button
              onClick={() => setIsEditingMenu(true)}
              className="text-xs text-[#D6A84F] hover:text-[#F0C86A] font-semibold flex items-center space-x-1 transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              <span>Update Schedule</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#A7ADB5] font-mono">Querying mess menu schedules...</div>
        ) : menu.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6F7781]">
            No dining schedule published yet for {hostelBlock}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {daysMap.map((dayName, idx) => {
              const dayNum = idx + 1;
              const dayMenu = menu.find((m) => m.dayOfWeek === dayNum);

              return (
                <div key={dayName} className="bg-[#101316] border border-[#252B31] rounded-[4px] p-3.5 text-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#252B31] pb-2 mb-2.5">
                      <span className="font-bold text-[#F3F4F6] uppercase tracking-wider text-[11px] font-mono">
                        {dayName}
                      </span>
                      {isAdminOrWarden && (
                        <button
                          onClick={() => handleOpenEditForDay(dayNum)}
                          title={`Edit ${dayName} Menu`}
                          className="text-[10px] text-[#D6A84F] font-medium hover:underline flex items-center space-x-0.5"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>

                    {dayMenu ? (
                      <div className="space-y-2.5">
                        <div>
                          <span className="font-mono text-[10px] uppercase text-[#D6A84F] block">Breakfast:</span>
                          <span className="text-[#F3F4F6] text-[11px] leading-relaxed">{dayMenu.breakfast}</span>
                        </div>
                        <div>
                          <span className="font-mono text-[10px] uppercase text-[#D6A84F] block">Lunch:</span>
                          <span className="text-[#F3F4F6] text-[11px] leading-relaxed">{dayMenu.lunch}</span>
                        </div>
                        <div>
                          <span className="font-mono text-[10px] uppercase text-[#D6A84F] block">Evening Snacks:</span>
                          <span className="text-[#F3F4F6] text-[11px] leading-relaxed">{dayMenu.snacks}</span>
                        </div>
                        <div>
                          <span className="font-mono text-[10px] uppercase text-[#D6A84F] block">Dinner:</span>
                          <span className="text-[#F3F4F6] text-[11px] leading-relaxed">{dayMenu.dinner}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[#6F7781] italic py-4 text-center">No menu recorded</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Feedback Form */}
        <div className="bg-[#14181C] border border-[#252B31] rounded-[6px] p-5 space-y-4 shadow-subtle">
          <h2 className="text-xs font-mono font-bold text-[#D6A84F] uppercase tracking-wider border-b border-[#252B31] pb-2">
            Submit Daily Meal Feedback
          </h2>

          {feedbackSuccess && (
            <div className="p-3 text-xs bg-emerald-500/10 text-emerald-200 border border-emerald-500/30 rounded-[4px] font-medium flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{feedbackSuccess}</span>
            </div>
          )}

          <form onSubmit={handleFeedbackSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#A7ADB5] mb-1">Meal Service</label>
                <select
                  value={feedbackMeal}
                  onChange={(e) => setFeedbackMeal(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                >
                  <option value="BREAKFAST">Breakfast</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="SNACKS">Evening Snacks</option>
                  <option value="DINNER">Dinner</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#A7ADB5] mb-1">Rating (1 to 5 Stars)</label>
                <select
                  value={feedbackRating}
                  onChange={(e) => setFeedbackRating(parseInt(e.target.value, 10))}
                  className="w-full px-2.5 py-1.5 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                >
                  <option value={5}>5 Stars - Excellent</option>
                  <option value={4}>4 Stars - Good</option>
                  <option value={3}>3 Stars - Average</option>
                  <option value={2}>2 Stars - Substandard</option>
                  <option value={1}>1 Star - Unsatisfactory</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#A7ADB5] mb-1">
                Comments or Suggestions (Optional)
              </label>
              <textarea
                rows={3}
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                placeholder="Mention specific items, taste, cleanliness, or portion feedback..."
                className="w-full p-2.5 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
              />
            </div>

            <button
              type="submit"
              disabled={feedbackSubmitting}
              className="px-4 py-2 bg-[#D6A84F] hover:bg-[#F0C86A] text-[#090B0D] font-bold rounded-[4px] disabled:opacity-50 transition-colors shadow-xs"
            >
              {feedbackSubmitting ? "Submitting..." : "Submit Mess Rating"}
            </button>
          </form>
        </div>

        {/* Staff/Warden/Admin Feedback Summary */}
        {isStaffOrManagement && summary && (
          <div className="bg-[#14181C] border border-[#252B31] rounded-[6px] p-5 space-y-4 shadow-subtle text-xs">
            <h2 className="text-xs font-mono font-bold text-[#D6A84F] uppercase tracking-wider border-b border-[#252B31] pb-2 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-[#D6A84F]" />
              <span>Mess Satisfaction Index ({hostelBlock})</span>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {summary.summary.map((stat) => (
                <div key={stat.mealType} className="bg-[#101316] p-3.5 border border-[#252B31] rounded-[4px]">
                  <div className="font-mono text-[#A7ADB5] text-[11px]">{stat.mealType}</div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-xl font-bold text-[#F0C86A] font-mono flex items-center gap-1">
                      {stat.averageRating} <Star className="w-3.5 h-3.5 fill-[#D6A84F] text-[#D6A84F]" />
                    </span>
                    <span className="text-[10px] font-mono text-[#6F7781]">
                      {stat.responseCount} ratings
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#252B31]">
              <div className="font-mono font-bold text-[#F3F4F6] text-[11px] mb-2">Recent Student Remarks:</div>
              <div className="max-h-40 overflow-y-auto space-y-2 bg-[#101316] p-2.5 border border-[#252B31] rounded-[4px]">
                {summary.recentFeedbacks.length === 0 ? (
                  <div className="text-[#6F7781] text-center py-2">No student remarks recorded yet.</div>
                ) : (
                  summary.recentFeedbacks.map((f) => (
                    <div key={f.id} className="text-[11px] border-b border-[#252B31] pb-2 last:border-none">
                      <div className="flex justify-between font-medium">
                        <span className="text-[#F3F4F6]">{f.student.fullName} ({f.mealType})</span>
                        <span className="text-[#D6A84F] font-mono font-bold">{f.rating}/5</span>
                      </div>
                      {f.comments && <p className="text-[#A7ADB5] mt-0.5 leading-relaxed">&quot;{f.comments}&quot;</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
