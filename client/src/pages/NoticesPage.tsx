import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  ArrowRight,
  Edit3,
  Trash2,
  Filter,
  Search,
  Calendar,
  X,
  Save,
  AlertTriangle,
  Megaphone
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

  // Permission checks: Only ADMIN and WARDEN can create/edit/delete notices
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
      category: notice.category || "GENERAL",
      priority: notice.priority,
      targetType: notice.targetType,
      targetValue: notice.targetValue || "",
      requiresAction: notice.requiresAction,
      actionType: notice.actionType,
      actionDeadline: notice.actionDeadline ? notice.actionDeadline.slice(0, 16) : "",
      actionLink: notice.actionLink || "",
      expiresAt: notice.expiresAt ? notice.expiresAt.slice(0, 16) : ""
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageNotices) return;

    setFormError(null);
    setSubmitting(true);
    setActionSuccess(null);

    try {
      const payload = {
        ...formData,
        targetValue: formData.targetValue ? formData.targetValue : null,
        actionDeadline: formData.actionDeadline ? new Date(formData.actionDeadline).toISOString() : null,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        actionLink: formData.actionLink || null
      };

      if (editingNoticeId) {
        // Update existing notice
        await apiRequest(`/api/notices/${editingNoticeId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        setActionSuccess("Official notice updated successfully.");
      } else {
        // Publish new notice
        await apiRequest("/api/notices", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setActionSuccess("Official notice published and delivered.");
      }

      setShowCreateModal(false);
      fetchNotices();
    } catch (err: any) {
      setFormError(err.message || "Failed to save notice.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: string, title: string) => {
    if (!canManageNotices) return;
    if (!confirm(`Are you sure you want to delete the notice "${title}"?`)) return;

    try {
      await apiRequest(`/api/notices/${id}`, {
        method: "DELETE"
      });
      setActionSuccess("Notice deleted successfully.");
      fetchNotices();
    } catch (err: any) {
      alert("Failed to delete notice: " + err.message);
    }
  };

  const categories = [
    { key: "ALL", label: "All Categories" },
    { key: "GENERAL", label: "General" },
    { key: "ACADEMIC", label: "Academic" },
    { key: "HOSTEL", label: "Hostel" },
    { key: "MESS", label: "Mess" },
    { key: "EMERGENCY", label: "Emergency" },
    { key: "MAINTENANCE", label: "Maintenance" },
    { key: "HOLIDAY", label: "Holiday" }
  ];

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "EMERGENCY":
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-red-100 text-red-900 border border-red-300 rounded-[4px]">Emergency</span>;
      case "ACADEMIC":
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300 rounded-[4px]">Academic</span>;
      case "HOSTEL":
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-[4px]">Hostel</span>;
      case "MESS":
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-[4px]">Mess</span>;
      case "MAINTENANCE":
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-stone-200 text-stone-800 border border-stone-400 rounded-[4px]">Maintenance</span>;
      case "HOLIDAY":
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-teal-100 text-teal-900 border border-teal-300 rounded-[4px]">Holiday</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-300 rounded-[4px]">General</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-red-50 text-red-900 border border-red-300 rounded-[4px]">Critical Priority</span>;
      case "URGENT":
        return <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300 rounded-[4px]">Urgent</span>;
      default:
        return null;
    }
  };

  const filteredNotices = notices.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-stone-300 p-4 rounded-[6px]">
        <div>
          <div className="flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-[#0f4c3a]" />
            <h1 className="text-xl font-bold text-stone-900">Official Notices & Circulars</h1>
          </div>
          <p className="text-xs text-stone-600 mt-0.5">
            Verified campus announcements, hostel instructions, academic circulars and urgent alerts
          </p>
        </div>

        {/* Create Notice Button strictly for ADMIN and WARDEN */}
        {canManageNotices && (
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center space-x-2 bg-[#0f4c3a] text-white hover:bg-[#0b392b] text-xs font-semibold px-4 py-2 rounded-[4px]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Notice</span>
          </button>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3 text-xs bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-[4px] font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-stone-300 rounded-[6px] p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 font-medium rounded-[4px] border transition-colors ${
                  selectedCategory === cat.key
                    ? "bg-[#0f4c3a] text-white border-[#0f4c3a]"
                    : "bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-stone-300 rounded-[4px] bg-white text-stone-800"
            />
          </div>
        </div>
      </div>

      {/* Notice List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-stone-500 bg-white border border-stone-300 rounded-[4px]">
            Loading notices...
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 bg-white border border-stone-300 rounded-[4px]">
            No official notices found under the selected category.
          </div>
        ) : (
          filteredNotices.map((n) => (
            <div
              key={n.id}
              className={`bg-white border p-4 sm:p-5 rounded-[6px] shadow-sm transition-colors ${
                n.priority === "CRITICAL"
                  ? "border-red-300 bg-red-50/20"
                  : n.priority === "URGENT"
                  ? "border-amber-300 bg-amber-50/20"
                  : "border-stone-300"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  {getCategoryBadge(n.category)}
                  {getPriorityBadge(n.priority)}
                  <span className="text-[11px] text-stone-500 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-stone-400" />
                    <span>Published {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </span>
                  {n.expiresAt && (
                    <span className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 border border-amber-200 rounded-[4px]">
                      Expires: {new Date(n.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Edit and Delete Buttons (Strictly for Admin & Warden) */}
                {canManageNotices && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(n)}
                      className="px-2.5 py-1 text-xs border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium rounded-[4px] flex items-center space-x-1"
                      title="Edit Notice"
                    >
                      <Edit3 className="w-3 h-3 text-stone-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteNotice(n.id, n.title)}
                      className="px-2.5 py-1 text-xs border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-[4px] flex items-center space-x-1"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Title & Body */}
              <h2 className="text-base font-bold text-stone-900 hover:text-emerald-900 transition-colors">
                <Link to={`/notices/${n.id}`}>{n.title}</Link>
              </h2>

              <p className="mt-2 text-xs text-stone-700 leading-relaxed whitespace-pre-line line-clamp-3">
                {n.content}
              </p>

              {/* Notice Metadata Footer */}
              <div className="mt-4 pt-3 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-stone-600">
                <div className="flex items-center space-x-3">
                  <span>
                    Authority: <strong className="text-stone-800">{n.publishedBy?.fullName || "College Administration"}</strong> ({n.publishedBy?.role || "ADMIN"})
                  </span>
                  <span className="text-stone-300">•</span>
                  <span>Target: <strong className="text-stone-800">{n.targetType} {n.targetValue ? `(${n.targetValue})` : ""}</strong></span>
                </div>

                <div className="flex items-center space-x-3">
                  {canManageNotices && n.stats && (
                    <div className="flex items-center space-x-2 text-[11px] text-stone-600 bg-stone-100 px-2 py-1 rounded-[4px] border border-stone-200">
                      <Users className="w-3 h-3 text-stone-500" />
                      <span>{n.stats.readCount}/{n.stats.totalRecipients} read ({n.stats.readRate}%)</span>
                    </div>
                  )}

                  <Link
                    to={`/notices/${n.id}`}
                    className="text-[#0f4c3a] font-semibold hover:underline flex items-center space-x-1"
                  >
                    <span>View Notice Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Notice Modal (Strictly Admin and Warden) */}
      {canManageNotices && showCreateModal && (
        <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-[6px] max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center space-x-2">
                <Megaphone className="w-5 h-5 text-[#0f4c3a]" />
                <h2 className="text-base font-bold text-stone-900">
                  {editingNoticeId ? "Edit Official Notice" : "Create Official Campus Notice"}
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 text-xs bg-red-50 text-red-900 border border-red-200 rounded-[4px] font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Hostel-A Water Maintenance Schedule & Interruption"
                  className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-xs focus:outline-none focus:border-stone-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-stone-300 rounded-[4px] bg-white text-stone-800 font-medium"
                  >
                    <option value="GENERAL">General Announcement</option>
                    <option value="ACADEMIC">Academic</option>
                    <option value="HOSTEL">Hostel Operations</option>
                    <option value="MESS">Mess / Dining Menu</option>
                    <option value="EMERGENCY">Emergency Alert</option>
                    <option value="MAINTENANCE">Maintenance Work</option>
                    <option value="HOLIDAY">Holiday / Break</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-stone-300 rounded-[4px] bg-white text-stone-800 font-medium"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                    <option value="CRITICAL">Critical Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Target Audience</label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-stone-300 rounded-[4px] bg-white text-stone-800 font-medium"
                  >
                    <option value="ALL">All Campus Students</option>
                    <option value="HOSTEL">Specific Hostel Block</option>
                    <option value="BRANCH">Specific Branch</option>
                    <option value="YEAR">Specific Year</option>
                    <option value="BATCH">Specific Batch</option>
                  </select>
                </div>
              </div>

              {formData.targetType !== "ALL" && (
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Target Specific Value ({formData.targetType})
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                    placeholder={
                      formData.targetType === "HOSTEL"
                        ? "e.g. Hostel-A"
                        : formData.targetType === "BRANCH"
                        ? "e.g. CSE"
                        : formData.targetType === "YEAR"
                        ? "e.g. 2"
                        : "e.g. 2024"
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Notice Content & Instructions
                </label>
                <textarea
                  rows={6}
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Provide complete details, instructions, affected rooms/hostels, and required student actions..."
                  className="w-full p-3 border border-stone-300 rounded-[4px] text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Optional Expiry Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Action Deadline (If student response needed)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.actionDeadline}
                    onChange={(e) => setFormData({ ...formData, actionDeadline: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-[4px] text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-stone-300 bg-white text-stone-700 font-medium rounded-[4px] hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#0f4c3a] text-white font-semibold rounded-[4px] hover:bg-[#0b392b] disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? "Saving..." : editingNoticeId ? "Update Notice" : "Publish Official Notice"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
