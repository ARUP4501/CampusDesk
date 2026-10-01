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
    setRemindSuccess(null);
    try {
      const res = await apiRequest<{ message: string; count: number }>(`/api/notices/${id}/remind`, {
        method: "POST"
      });
      setRemindSuccess(`Notification alerts dispatched to ${res.count} pending students.`);
      fetchNoticeDetail();
    } catch (err: any) {
      alert(err.message || "Failed to send reminders.");
    } finally {
      setRemindLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-xs text-[#4D2A00]/70 flex flex-col items-center justify-center space-y-2">
        <div className="w-7 h-7 border-2 border-[#CC6F00] border-t-transparent rounded-full animate-spin"></div>
        <span className="font-medium text-[#4D2A00]/70">Loading circular details...</span>
      </div>
    );
  }

  if (!notice) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/notices")}
          className="btn-secondary p-2.5 rounded-xl flex items-center space-x-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Circulars</span>
        </button>

        {notice.userStatus && !notice.userStatus.isRead && (
          <button
            onClick={handleMarkRead}
            className="btn-primary px-4 py-2 text-xs font-bold shadow-sm"
          >
            Mark as Read & Acknowledged
          </button>
        )}
      </div>

      {remindSuccess && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-xs text-emerald-950 font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{remindSuccess}</span>
        </div>
      )}

      {/* Main Notice Body Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 border border-[rgba(77,42,0,0.1)] shadow-glass">
        <div className="space-y-2 border-b border-[rgba(77,42,0,0.08)] pb-4">
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#FDB773]/30 text-[#4D2A00] border border-[#CC6F00]/25">
              {notice.category}
            </span>
            <span className="text-xs text-[#4D2A00]/60 font-mono flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-[#CC6F00]" />
              <span>Published {new Date(notice.createdAt).toLocaleString()}</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold text-[#4D2A00]">{notice.title}</h1>

          <div className="text-xs text-[#4D2A00]/60 flex items-center space-x-3 pt-1">
            <span>By: <strong className="text-[#4D2A00]">{notice.publishedBy?.fullName}</strong></span>
            <span>•</span>
            <span>Target: <strong className="text-[#CC6F00] font-mono">{notice.targetType} {notice.targetValue ? `(${notice.targetValue})` : ""}</strong></span>
          </div>
        </div>

        {/* Content Body */}
        <div className="text-sm text-[#4D2A00] leading-relaxed whitespace-pre-line bg-white/50 p-5 rounded-2xl border border-[rgba(77,42,0,0.08)]">
          {notice.content}
        </div>

        {/* Action Required Box */}
        {notice.requiresAction && (
          <div className="p-5 bg-[#FDB773]/20 border border-[#CC6F00]/30 rounded-2xl space-y-3 text-xs text-[#4D2A00]">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-[#CC6F00] shrink-0" />
              <span className="font-bold text-[#4D2A00]">Student Action Required: {notice.actionType}</span>
            </div>

            {notice.actionDeadline && (
              <p className="font-mono text-xs text-[#4D2A00]/80">
                Deadline: {new Date(notice.actionDeadline).toLocaleString()}
              </p>
            )}

            {user?.role === "STUDENT" && (
              <div className="pt-2 border-t border-[rgba(77,42,0,0.08)] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {notice.userStatus?.isActionDone ? (
                  <div className="flex items-center space-x-2 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>You completed this action on {new Date(notice.userStatus.actionCompletedAt!).toLocaleDateString()}</span>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={actionNotesInput}
                      onChange={(e) => setActionNotesInput(e.target.value)}
                      placeholder="Optional confirmation note or reference code..."
                      className="flex-1 px-3.5 py-2 bg-white/60 border border-[rgba(77,42,0,0.12)] rounded-xl text-[#4D2A00] text-xs placeholder-[#4D2A00]/40 focus:outline-none focus:border-[#CC6F00]"
                    />
                    <button
                      onClick={handleCompleteAction}
                      className="btn-primary px-5 py-2 text-xs font-bold shadow-sm shrink-0"
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
          <div className="pt-4 border-t border-[rgba(77,42,0,0.08)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#4D2A00]">Audience Delivery & Read Tracking</h3>
                <p className="text-xs text-[#4D2A00]/60">Live recipient statistics and automated push reminders</p>
              </div>

              <button
                onClick={handleSendReminder}
                disabled={remindLoading}
                className="btn-secondary inline-flex items-center space-x-1.5 px-4 py-2 text-[#CC6F00] text-xs font-bold disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{remindLoading ? "Dispatching..." : "Send Reminder to Unread"}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white/50 rounded-2xl border border-[rgba(77,42,0,0.08)]">
                <span className="text-[10px] font-mono uppercase text-[#4D2A00]/60">Total Audience</span>
                <span className="text-lg font-bold text-[#4D2A00] font-mono block mt-1">{stats.totalRecipients}</span>
              </div>
              <div className="p-3 bg-white/50 rounded-2xl border border-[rgba(77,42,0,0.08)]">
                <span className="text-[10px] font-mono uppercase text-[#4D2A00]/60">Read Count</span>
                <span className="text-lg font-bold text-[#CC6F00] font-mono block mt-1">{stats.readCount} ({stats.readRate}%)</span>
              </div>
              <div className="p-3 bg-white/50 rounded-2xl border border-[rgba(77,42,0,0.08)]">
                <span className="text-[10px] font-mono uppercase text-[#4D2A00]/60">Actions Done</span>
                <span className="text-lg font-bold text-emerald-800 font-mono block mt-1">{stats.actionDoneCount} ({stats.actionRate}%)</span>
              </div>
              <div className="p-3 bg-white/50 rounded-2xl border border-[rgba(77,42,0,0.08)]">
                <span className="text-[10px] font-mono uppercase text-[#4D2A00]/60">Pending Delivery</span>
                <span className="text-lg font-bold text-[#4D2A00]/70 font-mono block mt-1">{stats.totalRecipients - stats.readCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoticeDetailPage;
