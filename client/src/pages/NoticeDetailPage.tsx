import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Users, Send, AlertCircle, Megaphone } from "lucide-react";
import { apiRequest, UserProfile } from "../api/client.js";

interface NoticeDetail {
  id: string;
  title: string;
  content: string;
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
      const data = await apiRequest<{ message: string; sentCount: number }>(`/api/notices/${id}/remind`, {
        method: "POST"
      });
      setRemindSuccess(data.message);
      fetchNoticeDetail();
    } catch (err: any) {
      alert("Failed to send reminders: " + err.message);
    } finally {
      setRemindLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#A7ADB5] font-mono flex flex-col items-center justify-center space-y-2">
        <div className="w-6 h-6 border-2 border-[#D6A84F] border-t-transparent rounded-full animate-spin"></div>
        <span>Loading circular details...</span>
      </div>
    );
  }

  if (!notice) {
    return <div className="p-6 text-xs text-red-200 bg-red-500/10 border border-red-500/30 rounded-[4px]">Notice not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#14181C] border border-[#252B31] p-4 rounded-[6px] shadow-subtle">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/notices")}
            className="p-1.5 bg-[#101316] border border-[#252B31] rounded-[4px] text-[#A7ADB5] hover:text-[#F3F4F6] hover:bg-[#181D22] transition-colors"
            aria-label="Back to notices"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#181D22] text-[#D6A84F] font-semibold border border-[#252B31] rounded-[3px]">
                {notice.priority}
              </span>
              <span className="text-xs text-[#A7ADB5] font-mono">
                Scope: {notice.targetType} {notice.targetValue ? `(${notice.targetValue})` : ""}
              </span>
            </div>
            <h1 className="text-lg font-bold text-[#F3F4F6] mt-1">{notice.title}</h1>
          </div>
        </div>

        <div className="text-right text-xs text-[#6F7781] font-mono">
          <div>Published: {new Date(notice.createdAt).toLocaleDateString()}</div>
          <div className="text-[#A7ADB5]">By: {notice.publishedBy?.fullName || "Administration"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Notice Body */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#14181C] border border-[#252B31] rounded-[6px] p-6 space-y-4 shadow-subtle">
            <h2 className="text-xs font-mono font-bold text-[#D6A84F] uppercase tracking-wider border-b border-[#252B31] pb-2">
              Official Announcement Content
            </h2>

            <div className="text-xs text-[#F3F4F6] leading-relaxed whitespace-pre-wrap">
              {notice.content}
            </div>

            {notice.requiresAction && (
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-[4px] text-xs text-blue-200 space-y-1">
                <div className="font-bold flex items-center space-x-1.5 text-blue-300">
                  <AlertCircle className="w-4 h-4" />
                  <span>Student Action Required: {notice.actionType}</span>
                </div>
                {notice.actionDeadline && (
                  <div className="font-mono text-[11px] text-[#A7ADB5]">
                    Compliance Deadline: <strong className="text-[#F3F4F6]">{new Date(notice.actionDeadline).toLocaleString()}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Student Action Box */}
          {user?.role === "STUDENT" && (
            <div className="bg-[#14181C] border border-[#252B31] rounded-[6px] p-5 space-y-4 shadow-subtle">
              <h3 className="text-xs font-mono font-bold text-[#D6A84F] uppercase tracking-wider border-b border-[#252B31] pb-2">
                Your Response & Compliance Tracking
              </h3>

              <div className="flex items-center space-x-4 text-xs">
                <div>
                  <span className="text-[#6F7781] block font-mono text-[11px]">Read Receipt:</span>
                  {notice.userStatus?.isRead ? (
                    <span className="text-emerald-300 font-bold flex items-center space-x-1 mt-0.5 font-mono text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>Read on {new Date(notice.userStatus.readAt!).toLocaleString()}</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleMarkRead}
                      className="mt-1 px-3 py-1 bg-[#101316] hover:bg-[#181D22] border border-[#252B31] font-semibold text-[#F3F4F6] rounded-[3px] transition-colors"
                    >
                      Acknowledge & Mark Read
                    </button>
                  )}
                </div>

                {notice.requiresAction && (
                  <div>
                    <span className="text-[#6F7781] block font-mono text-[11px]">Action Status:</span>
                    {notice.userStatus?.isActionDone ? (
                      <span className="text-emerald-300 font-bold flex items-center space-x-1 mt-0.5 font-mono text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>Completed on {new Date(notice.userStatus.actionCompletedAt!).toLocaleString()}</span>
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold block mt-0.5 font-mono text-[11px]">Pending Action</span>
                    )}
                  </div>
                )}
              </div>

              {notice.requiresAction && !notice.userStatus?.isActionDone && (
                <div className="pt-3 border-t border-[#252B31] space-y-2">
                  <label className="block text-xs font-semibold text-[#A7ADB5]">
                    Submit Action Confirmation / Reference Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={actionNotesInput}
                    onChange={(e) => setActionNotesInput(e.target.value)}
                    placeholder="e.g. Paid fees via bank transfer ref #TRX9023, or form submitted at desk"
                    className="w-full text-xs p-2.5 border border-[#252B31] rounded-[4px] bg-[#101316] text-[#F3F4F6] focus:outline-none focus:border-[#D6A84F]"
                  />
                  <button
                    onClick={handleCompleteAction}
                    className="px-4 py-2 bg-[#D6A84F] hover:bg-[#F0C86A] text-[#090B0D] text-xs font-bold rounded-[4px] transition-colors shadow-xs"
                  >
                    Confirm Action Completed
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin/Warden Stats and Reminder Panel */}
        {isAdminOrWarden && (
          <div className="space-y-6">
            <div className="bg-[#14181C] border border-[#252B31] rounded-[6px] p-5 text-xs space-y-4 shadow-subtle">
              <div className="flex items-center justify-between border-b border-[#252B31] pb-2">
                <h3 className="font-mono font-bold text-[#D6A84F] uppercase tracking-wider">
                  Audience Reach & Analytics
                </h3>
              </div>

              {stats && (
                <div className="grid grid-cols-2 gap-3 bg-[#101316] p-3.5 border border-[#252B31] rounded-[4px]">
                  <div>
                    <span className="text-[#6F7781] block font-mono text-[11px]">Total Recipients</span>
                    <span className="text-base font-bold text-[#F3F4F6] font-mono">{stats.totalRecipients}</span>
                  </div>
                  <div>
                    <span className="text-[#6F7781] block font-mono text-[11px]">Read Rate</span>
                    <span className="text-base font-bold text-emerald-400 font-mono">{stats.readRate}%</span>
                    <span className="text-[10px] text-[#6F7781] font-mono">({stats.readCount} read)</span>
                  </div>
                  {notice.requiresAction && (
                    <div className="col-span-2 pt-2 border-t border-[#252B31]">
                      <span className="text-[#6F7781] block font-mono text-[11px]">Action Completed Rate</span>
                      <span className="text-base font-bold text-[#60A5FA] font-mono">{stats.actionRate}%</span>
                      <span className="text-[10px] text-[#6F7781] font-mono">({stats.actionDoneCount} completed)</span>
                    </div>
                  )}
                </div>
              )}

              {remindSuccess && (
                <div className="p-2.5 bg-emerald-500/10 text-emerald-200 border border-emerald-500/30 rounded-[4px] font-medium">
                  {remindSuccess}
                </div>
              )}

              {notice.requiresAction && pendingActionStudents.length > 0 && (
                <div>
                  <button
                    onClick={handleSendReminder}
                    disabled={remindLoading}
                    className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold rounded-[4px] flex items-center justify-center space-x-1.5 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {remindLoading ? "Dispatching Reminders..." : `Send Reminder (${pendingActionStudents.length} Pending)`}
                    </span>
                  </button>
                  <p className="text-[10px] text-[#6F7781] mt-1.5 font-mono">
                    Dispatches instant in-app inbox alerts and Web Push notifications to pending students.
                  </p>
                </div>
              )}

              {/* Pending Action Students List */}
              {pendingActionStudents.length > 0 && (
                <div className="pt-2 border-t border-[#252B31]">
                  <div className="font-mono font-bold text-[#F3F4F6] text-[11px] mb-2">
                    Pending Action Roster ({pendingActionStudents.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-[#252B31] bg-[#101316] p-2 border border-[#252B31] rounded-[4px]">
                    {pendingActionStudents.map((s) => (
                      <div key={s.id} className="pt-1.5 pb-1 text-[11px] flex justify-between">
                        <span className="font-medium text-[#F3F4F6]">{s.fullName}</span>
                        <span className="text-[#6F7781] font-mono">{s.rollNumber}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
