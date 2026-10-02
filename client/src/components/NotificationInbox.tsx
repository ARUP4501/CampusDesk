import React, { useState, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { apiRequest, UserProfile } from "../api/client.js";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationInboxProps {
  user?: UserProfile | null;
}

export const NotificationInbox: React.FC<NotificationInboxProps> = ({ user }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const data = await apiRequest<{ notifications: NotificationItem[]; unreadCount: number }>("/api/notifications");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Ignore if not logged in
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const markAllRead = async () => {
    try {
      await apiRequest("/api/notifications/mark-read", {
        method: "POST",
        body: JSON.stringify({})
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-campus-secondary hover:text-campus-accent border border-campus-border rounded-xl bg-white/40 hover:bg-white/70 transition-all focus:outline-none shadow-sm"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-campus-accent text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full min-w-[15px] text-center shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 glass-dropdown rounded-2xl p-2 shadow-elevated z-50 overflow-hidden animate-fadeIn border border-white/60">
          <div className="px-3.5 py-2.5 border-b border-campus-border flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-campus-text uppercase tracking-wider">
              System Inbox ({unreadCount} unread)
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-campus-accent hover:text-campus-text flex items-center space-x-1 font-semibold transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-campus-border/40">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-campus-muted">
                No pending notifications in your inbox.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 text-xs transition-colors rounded-xl mx-0.5 my-0.5 ${
                    !n.isRead ? "bg-white/60 text-campus-text font-medium" : "text-campus-secondary"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-campus-text">{n.title}</span>
                    <span className="text-[10px] font-mono text-campus-muted shrink-0">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="mt-1 text-campus-secondary leading-relaxed">{n.message}</p>
                  {n.linkUrl && (
                    <Link
                      to={n.linkUrl}
                      onClick={() => setIsOpen(false)}
                      className="inline-block mt-1.5 text-campus-accent hover:text-campus-text font-semibold transition-colors"
                    >
                      View Details &rarr;
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
