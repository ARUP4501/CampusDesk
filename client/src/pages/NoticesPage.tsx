import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  Edit3,
  Trash2,
  Search,
  X,
  Megaphone,
  ChevronRight,
  FileText
} from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  category: "GENERAL" | "ACADEMIC" | "HOSTEL" | "MESS" | "EMERGENCY" | "MAINTENANCE" | "HOLIDAY";
  priority: string;
  targetType: string;
  targetValue?: string;
  requiresAction: boolean;
  actionType: string;
  actionDeadline?: string;
  actionLink?: string;
  expiresAt?: string;
  createdAt: string;
  publishedBy?: { id: string; fullName: string; role: string; department?: string };
  isRead?: boolean;
  isActionDone?: boolean;
  stats?: {
    totalRecipients: number;
    readCount: number;
    readRate: number;
    actionDoneCount: number;
    actionRate: number;
  };
}

export const NoticesPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Notice Creation & Editing Modals (Strictly ADMIN & WARDEN)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "GENERAL",
    priority: "NORMAL",
    targetType: "ALL",
    targetValue: "",
    requiresAction: false,
    actionType: "NONE",
    actionDeadline: "",
    actionLink: "",
    expiresAt: ""
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const canManageNotices = user && (user.role === "ADMIN" || user.role === "WARDEN");

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const categoryParam = selectedCategory !== "ALL" ? `?category=${selectedCategory}` : "";
      const data = await apiRequest<{ notices: NoticeItem[] }>(`/api/notices${categoryParam}`);
      setNotices(data.notices || []);
    } catch (err) {
      console.error("Failed to load notices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [selectedCategory]);

  const handleOpenCreateModal = () => {
    setEditingNoticeId(null);
    setFormData({
      title: "",
      content: "",
      category: "GENERAL",
      priority: "NORMAL",
      targetType: "ALL",
      targetValue: "",
      requiresAction: false,
      actionType: "NONE",
      actionDeadline: "",
      actionLink: "",
      expiresAt: ""
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (notice: NoticeItem) => {
    setEditingNoticeId(notice.id);
    setFormData({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      targetType: notice.targetType,
      targetValue: notice.targetValue || "",
      requiresAction: notice.requiresAction,
      actionType: notice.actionType,
      actionDeadline: notice.actionDeadline ? notice.actionDeadline.slice(0, 16) : "",
      actionLink: notice.actionLink || "",
      expiresAt: notice.expiresAt ? notice.expiresAt.slice(0, 10) : ""
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageNotices) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        ...formData,
        targetValue: formData.targetValue || undefined,
        actionDeadline: formData.actionDeadline ? new Date(formData.actionDeadline).toISOString() : undefined,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined
      };

      if (editingNoticeId) {
        await apiRequest(`/api/notices/${editingNoticeId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        setActionSuccess("Notice updated successfully.");
      } else {
        await apiRequest("/api/notices", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setActionSuccess("Notice published successfully to targeted audience.");
      }

      setShowCreateModal(false);
      fetchNotices();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setFormError(err.message || "Failed to save notice.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: string, title: string) => {
    if (!canManageNotices) return;
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await apiRequest(`/api/notices/${id}`, { method: "DELETE" });
      setActionSuccess("Notice removed.");
      fetchNotices();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: any) {
      alert("Failed to delete notice: " + err.message);
    }
  };

  const categories = [
    { key: "ALL", label: "All Circulars" },
    { key: "ACADEMIC", label: "Academic" },
    { key: "HOSTEL", label: "Hostel" },
    { key: "MESS", label: "Mess Dining" },
    { key: "EMERGENCY", label: "Emergency Alerts" },
    { key: "MAINTENANCE", label: "Maintenance" },
    { key: "HOLIDAY", label: "Official Holidays" },
    { key: "GENERAL", label: "General" }
  ];

  const filteredNotices = notices.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 pb-16 font-mono">
      {/* Editorial Newsroom Masthead (Section 27) */}
      <section className="border-b border-[var(--border-subtle)] pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="editorial-eyebrow text-[#FF6D1F] block mb-2">
            01 // OFFICIAL DISPATCH & GAZETTE
          </span>
          <h1 className="editorial-title text-xl sm:text-2xl text-[var(--text-primary)]">
            OFFICIAL CAMPUS GAZETTE
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-2">
            Institutional announcements, academic circulars, curfew advisories, and campus notices.
          </p>
        </div>

        {canManageNotices && (
          <button
            onClick={handleOpenCreateModal}
            className="btn-primary px-4 py-2.5 text-xs font-bold flex items-center space-x-2 shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>PUBLISH CIRCULAR</span>
          </button>
        )}
      </section>

      {actionSuccess && (
        <div className="p-3.5 text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                selectedCategory === cat.key
                  ? "bg-[#FF6D1F] text-black font-bold border-[#FF6D1F] shadow-sm"
                  : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 pointer-events-none text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search circulars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-input)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#FF6D1F] outline-none"
          />
        </div>
      </div>

      {/* Notice List (Section 27: Editorial Newsroom Format) */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-[var(--text-muted)]">
            Querying official circular registry...
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--text-muted)] campus-block p-12">
            No official notices found under the selected category.
          </div>
        ) : (
          filteredNotices.map((n) => (
            <article
              key={n.id}
              className={`campus-block p-6 transition-colors border ${
                n.priority === "CRITICAL"
                  ? "border-rose-500/50 bg-rose-500/10"
                  : n.priority === "URGENT"
                  ? "border-[#FF6D1F]/50 bg-[#FF6D1F]/05"
                  : "border-[var(--border-subtle)]"
              } space-y-3`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[var(--border-subtle)] pb-2.5">
                <div className="flex items-center space-x-2.5 flex-wrap gap-y-1 text-xs">
                  <span className="font-bold text-[#FF6D1F]">
                    [{n.category}]
                  </span>
                  {n.priority === "CRITICAL" && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                      CRITICAL
                    </span>
                  )}
                  {n.priority === "URGENT" && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      URGENT
                    </span>
                  )}
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {new Date(n.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    })}
                  </span>
                </div>

                {canManageNotices && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(n)}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      title="Edit Notice"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNotice(n.id, n.title)}
                      className="p-1 text-[var(--text-muted)] hover:text-rose-400 transition-colors"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Title & Body */}
              <div>
                <h2 className="editorial-title text-xl text-[var(--text-primary)] hover:text-[#FF6D1F] transition-colors">
                  <Link to={`/notices/${n.id}`}>{n.title}</Link>
                </h2>

                <p className="mt-2 text-xs font-sans text-[var(--text-secondary)] leading-relaxed whitespace-pre-line line-clamp-3">
                  {n.content}
                </p>
              </div>

              {/* Notice Metadata Footer */}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[var(--text-muted)]">
                <div className="flex items-center space-x-3">
                  <span>
                    Authority: <strong className="text-[var(--text-primary)]">{n.publishedBy?.fullName || "Campus Administration"}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Audience: <strong className="text-[#FF6D1F]">{n.targetType} {n.targetValue ? `(${n.targetValue})` : ""}</strong>
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  {canManageNotices && n.stats && (
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {n.stats.readCount}/{n.stats.totalRecipients} read ({n.stats.readRate}%)
                    </span>
                  )}

                  <Link
                    to={`/notices/${n.id}`}
                    className="text-xs font-bold text-[#FF6D1F] hover:underline flex items-center space-x-1"
                  >
                    <span>READ OFFICIAL CIRCULAR</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Creation & Editing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="campus-block max-w-lg w-full p-6 space-y-4 text-xs font-mono border border-[var(--border-subtle)] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase">
                {editingNoticeId ? "EDIT OFFICIAL CIRCULAR" : "PUBLISH OFFICIAL CIRCULAR"}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-[var(--text-secondary)]">Subject / Headline *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Schedule Revision for Semester IV Midterm Examinations"
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#FF6D1F] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-[var(--text-secondary)]">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:border-[#FF6D1F] outline-none"
                  >
                    <option value="GENERAL">General Notice</option>
                    <option value="ACADEMIC">Academic Instruction</option>
                    <option value="HOSTEL">Hostel Operations</option>
                    <option value="MESS">Mess / Dining</option>
                    <option value="EMERGENCY">Emergency Advisory</option>
                    <option value="MAINTENANCE">Maintenance Outage</option>
                    <option value="HOLIDAY">Official Holiday</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-[var(--text-secondary)]">Priority Level *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:border-[#FF6D1F] outline-none"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent Advisory</option>
                    <option value="CRITICAL">Critical Broadcast</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase text-[var(--text-secondary)]">Official Text *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Detail the instructions, reason, target audience, or requirements..."
                  className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#FF6D1F] outline-none resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-[var(--text-secondary)]">Target Scope</label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] focus:border-[#FF6D1F] outline-none"
                  >
                    <option value="ALL">Entire Campus</option>
                    <option value="HOSTEL">Specific Hostel</option>
                    <option value="COURSE">Specific Course</option>
                    <option value="YEAR">Specific Year</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase text-[var(--text-secondary)]">Target Value</label>
                  <input
                    type="text"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                    placeholder="e.g. Hostel-A or CSE"
                    className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#FF6D1F] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-5 py-2 text-xs font-bold"
                >
                  {submitting ? "PUBLISHING..." : "PUBLISH CIRCULAR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoticesPage;
