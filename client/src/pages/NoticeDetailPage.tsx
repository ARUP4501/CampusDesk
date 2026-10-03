import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Users, Send, AlertCircle, Megaphone, ChevronRight } from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface NoticeDetail {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: string;
  targetType: string;
  targetValue?: string;
  requiresAction: boolean;
  actionType: string;
  actionDeadline?: string;
  actionLink?: string;
  createdAt: string;
  publishedBy?: { fullName: string; role: string; department?: string };
  userStatus?: {
    isRead: boolean;
    readAt?: string;
    isActionDone: boolean;
    actionCompletedAt?: string;
    actionNotes?: string;
  };
}

interface StudentRecipient {
  id: string;
  fullName: string;
  rollNumber: string;
  phone: string;
  hostelBlock: string;
  roomNumber: string;
}

export const NoticeDetailPage: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [notice, setNotice] = useState<NoticeDetail | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [unreadStudents, setUnreadStudents] = useState<StudentRecipient[]>([]);
  const [pendingActionStudents, setPendingActionStudents] = useState<StudentRecipient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionNotesInput, setActionNotesInput] = useState<string>("");
  const [remindLoading, setRemindLoading] = useState<boolean>(false);
  const [remindSuccess, setRemindSuccess] = useState<string | null>(null);

  const isAdminOrWarden = user && (user.role === "ADMIN" || user.role === "WARDEN");

  const fetchNoticeDetail = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{
        notice: NoticeDetail;
        stats?: any;
        unreadStudents?: StudentRecipient[];
        pendingActionStudents?: StudentRecipient[];
      }>(`/api/notices/${id}`);

      setNotice(data.notice);
      if (data.stats) setStats(data.stats);
      if (data.unreadStudents) setUnreadStudents(data.unreadStudents);
      if (data.pendingActionStudents) setPendingActionStudents(data.pendingActionStudents);
    } catch (err: any) {
      alert("Failed to load notice: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNoticeDetail();
  }, [id]);

  const handleMarkRead = async () => {
    try {
      await apiRequest(`/api/notices/${id}/read`, { method: "POST" });
      fetchNoticeDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCompleteAction = async () => {
    try {
      await apiRequest(`/api/notices/${id}/action`, {
        method: "POST",
        body: JSON.stringify({ notes: actionNotesInput })
      });
      fetchNoticeDetail();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendReminder = async () => {
    setRemindLoading(true);
    try {
      await apiRequest(`/api/notices/${id}/remind`, { method: "POST" });
      setRemindSuccess("Automated notification dispatched to unread audience!");
      setTimeout(() => setRemindSuccess(null), 4000);
    } catch (err: any) {
      alert("Reminder failed: " + err.message);
    } finally {
      setRemindLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center space-y-2 font-mono">
        <div className="w-7 h-7 border-2 border-[#FF6D1F] border-t-transparent rounded-full animate-spin"></div>
        <span>Retrieving official gazette bulletin...</span>
      </div>
    );
  }

  if (!notice) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/notices")}
          className="btn-secondary px-3.5 py-2 rounded-xl flex items-center space-x-2 text-xs font-mono font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Official Bulletins</span>
        </button>

        {notice.userStatus && !notice.userStatus.isRead && (
          <button
            onClick={handleMarkRead}
            className="btn-primary px-4 py-2 text-xs font-bold rounded-xl"
          >
            Acknowledge & Mark Read
          </button>
        )}
      </div>

      {remindSuccess && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-mono flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{remindSuccess}</span>
        </div>
      )}

      {/* Main Notice Body Card */}
      <div className="campus-panel rounded-2xl p-6 sm:p-8 space-y-6 border border-[var(--border-subtle)]">
        <div className="space-y-3 border-b border-[var(--border-subtle)] pb-5">
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--bg-input)] text-[#FF6D1F] border border-[var(--border-subtle)]">
              {notice.category}
            </span>
            <span className="text-xs text-[var(--text-muted)] font-mono flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Published {new Date(notice.createdAt).toLocaleString()}</span>
            </span>
          </div>

          <h1 className="editorial-title text-2xl sm:text-3xl text-[var(--text-primary)] font-bold font-display">{notice.title}</h1>

          <div className="text-xs text-[var(--text-secondary)] font-mono flex items-center space-x-3 pt-1">
            <span>ISSUED BY: <strong className="text-[var(--text-primary)]">{notice.publishedBy?.fullName}</strong></span>
            <span>•</span>
            <span>TARGET: <strong className="text-[#FF6D1F]">{notice.targetType} {notice.targetValue ? `(${notice.targetValue})` : ""}</strong></span>
          </div>
        </div>

        {/* Content Body */}
        <div className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line bg-[var(--bg-input)] p-6 rounded-xl border border-[var(--border-subtle)] font-sans">
          {notice.content}
        </div>

        {/* Action Required Box */}
        {notice.requiresAction && (
          <div className="p-5 bg-[var(--bg-elevated)] border border-[#FF6D1F]/30 rounded-xl space-y-3 text-xs">
            <div className="flex items-center space-x-2 font-mono">
              <AlertCircle className="w-4 h-4 text-[#FF6D1F] shrink-0" />
              <span className="font-bold text-[var(--text-primary)] uppercase">Action Required: {notice.actionType}</span>
            </div>

            {notice.actionDeadline && (
              <p className="font-mono text-xs text-[var(--text-secondary)]">
                Deadline: {new Date(notice.actionDeadline).toLocaleString()}
              </p>
            )}

            {user?.role === "STUDENT" && (
              <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {notice.userStatus?.isActionDone ? (
                  <div className="flex items-center space-x-2 text-emerald-400 font-mono font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Completed on {new Date(notice.userStatus.actionCompletedAt!).toLocaleDateString()}</span>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={actionNotesInput}
                      onChange={(e) => setActionNotesInput(e.target.value)}
                      placeholder="Optional confirmation note or reference code..."
                      className="flex-1 px-3.5 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-xl text-[var(--text-primary)] text-xs placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#FF6D1F]"
                    />
                    <button
                      onClick={handleCompleteAction}
                      className="btn-primary px-5 py-2 text-xs font-bold rounded-xl shrink-0"
                    >
                      Confirm Action Completed
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Admin/Warden Recipient Read Rate & Reminder Dispatch */}
        {isAdminOrWarden && stats && (
          <div className="pt-4 border-t border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">Audience Telemetry & Delivery</h3>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">Live recipient read rates and automated reminder dispatches</p>
              </div>

              <button
                onClick={handleSendReminder}
                disabled={remindLoading}
                className="btn-secondary inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-[#FF6D1F] text-xs font-mono font-bold disabled:opacity-50 rounded-xl"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{remindLoading ? "Dispatching..." : "Remind Unread"}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
              <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">Audience</span>
                <span className="text-xl font-bold text-[var(--text-primary)] block mt-1">{stats.totalRecipients}</span>
              </div>
              <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">Read Count</span>
                <span className="text-xl font-bold text-[#FF6D1F] block mt-1">{stats.readCount} ({stats.readRate}%)</span>
              </div>
              <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">Actions Done</span>
                <span className="text-xl font-bold text-emerald-400 block mt-1">{stats.actionDoneCount} ({stats.actionRate}%)</span>
              </div>
              <div className="p-3 bg-[var(--bg-input)] rounded-xl border border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)] uppercase block">Pending</span>
                <span className="text-xl font-bold text-[var(--text-secondary)] block mt-1">{stats.totalRecipients - stats.readCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeDetailPage;
