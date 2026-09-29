import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Users, Send, AlertCircle } from "lucide-react";
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
    return <div className="p-8 text-center text-xs text-stone-500">Loading notice details...</div>;
  }

  if (!notice) {
    return <div className="p-6 text-xs text-red-900 bg-red-50 rounded-[4px]">Notice not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border border-stone-300 p-4 rounded-[6px]">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate("/notices")}
            className="p-1.5 bg-white border border-stone-300 rounded-[4px] text-stone-700 hover:bg-stone-100"
            aria-label="Back to notices"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-800 font-semibold border border-stone-300 rounded-[4px]">
                {notice.priority}
              </span>
              <span className="text-xs text-stone-500">
                Target: {notice.targetType} {notice.targetValue ? `(${notice.targetValue})` : ""}
              </span>
            </div>
            <h1 className="text-lg font-bold text-stone-900 mt-1">{notice.title}</h1>
          </div>
        </div>

        <div className="text-right text-xs text-stone-500">
          <div>Published: {new Date(notice.createdAt).toLocaleDateString()}</div>
          <div>By: {notice.publishedBy?.fullName || "Administration"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Notice Body */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-stone-300 rounded-[6px] p-6 space-y-4 shadow-sm">
            <h2 className="text-xs font-bold text-stone-700 uppercase tracking-wider border-b border-stone-200 pb-2">
              Official Notice Announcement
            </h2>

            <div className="text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
              {notice.content}
            </div>

            {notice.requiresAction && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-[4px] text-xs text-blue-900 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-blue-800" />
                  <span>Student Action Required: {notice.actionType}</span>
                </div>
                {notice.actionDeadline && (
                  <div>
                    Deadline: <strong>{new Date(notice.actionDeadline).toLocaleString()}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Student Action Box */}
          {user?.role === "STUDENT" && (
            <div className="bg-white border border-stone-300 rounded-[6px] p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider border-b border-stone-200 pb-2">
                Your Response & Read Status
              </h3>

              <div className="flex items-center space-x-4 text-xs">
                <div>
                  <span className="text-stone-500 block">Read Status:</span>
                  {notice.userStatus?.isRead ? (
                    <span className="text-emerald-800 font-bold flex items-center space-x-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Read on {new Date(notice.userStatus.readAt!).toLocaleString()}</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleMarkRead}
                      className="mt-1 px-3 py-1 bg-stone-100 hover:bg-stone-200 border border-stone-300 font-semibold text-stone-800 rounded-[4px]"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>

                {notice.requiresAction && (
                  <div>
                    <span className="text-stone-500 block">Action Status:</span>
                    {notice.userStatus?.isActionDone ? (
                      <span className="text-emerald-800 font-bold flex items-center space-x-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed on {new Date(notice.userStatus.actionCompletedAt!).toLocaleString()}</span>
                      </span>
                    ) : (
                      <span className="text-red-700 font-bold block mt-0.5">Pending Action</span>
                    )}
                  </div>
                )}
              </div>

              {notice.requiresAction && !notice.userStatus?.isActionDone && (
                <div className="pt-3 border-t border-stone-200 space-y-2">
                  <label className="block text-xs font-semibold text-stone-800">
                    Submit Action Confirmation / Reference Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={actionNotesInput}
                    onChange={(e) => setActionNotesInput(e.target.value)}
                    placeholder="e.g. Paid fees via bank transfer ref #TRX9023, or signed form submitted"
                    className="w-full text-xs p-2 border border-stone-300 rounded-[4px]"
                  />
                  <button
                    onClick={handleCompleteAction}
                    className="px-4 py-2 bg-[#0f4c3a] hover:bg-[#0b392b] text-white text-xs font-semibold rounded-[4px]"
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
            <div className="bg-stone-50 border border-stone-300 rounded-[6px] p-5 text-xs space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-stone-300 pb-2">
                <h3 className="font-bold text-stone-900 uppercase tracking-wider">
                  Audience Reach & Compliance
                </h3>
              </div>

              {stats && (
                <div className="grid grid-cols-2 gap-3 bg-white p-3 border border-stone-200 rounded-[4px]">
                  <div>
                    <span className="text-stone-500 block">Total Recipients</span>
                    <span className="text-base font-bold text-stone-900">{stats.totalRecipients}</span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Read Rate</span>
                    <span className="text-base font-bold text-emerald-800">{stats.readRate}%</span>
                    <span className="text-[10px] text-stone-400">({stats.readCount} read)</span>
                  </div>
                  {notice.requiresAction && (
                    <div className="col-span-2 pt-2 border-t border-stone-100">
                      <span className="text-stone-500 block">Action Done Rate</span>
                      <span className="text-base font-bold text-blue-900">{stats.actionRate}%</span>
                      <span className="text-[10px] text-stone-400">({stats.actionDoneCount} completed)</span>
                    </div>
                  )}
                </div>
              )}

              {remindSuccess && (
                <div className="p-2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-[4px] font-medium">
                  {remindSuccess}
                </div>
              )}

              {notice.requiresAction && pendingActionStudents.length > 0 && (
                <div>
                  <button
                    onClick={handleSendReminder}
                    disabled={remindLoading}
                    className="w-full py-2 bg-amber-800 hover:bg-amber-900 text-white font-semibold rounded-[4px] flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {remindLoading ? "Dispatching Reminders..." : `Send Reminder (${pendingActionStudents.length} Pending)`}
                    </span>
                  </button>
                  <p className="text-[10px] text-stone-500 mt-1">
                    Dispatches instant in-app alerts and Web Push notifications to pending students.
                  </p>
                </div>
              )}

              {/* Pending Action Students List */}
              {pendingActionStudents.length > 0 && (
                <div className="pt-2 border-t border-stone-200">
                  <div className="font-bold text-stone-800 mb-2">
                    Pending Action List ({pendingActionStudents.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-stone-200 bg-white p-2 border border-stone-200 rounded-[4px]">
                    {pendingActionStudents.map((s) => (
                      <div key={s.id} className="pt-1 text-[11px] flex justify-between">
                        <span className="font-semibold text-stone-800">{s.fullName}</span>
                        <span className="text-stone-500 font-mono">{s.rollNumber}</span>
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
