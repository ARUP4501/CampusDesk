import React, { useState, useEffect } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { apiRequest } from "../api/client.js";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  linkUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationInbox: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchNotifications = async () => {
    try {
      const data = await apiRequest<{ notifications: NotificationItem[]; unreadCount: number }>("/api/notifications");
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // Ignore if not logged in
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

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
        className="relative p-1.5 text-[#A7ADB5] hover:text-[#F3F4F6] border border-[#252B31] rounded-[4px] bg-[#101316] hover:bg-[#14181C] hover:border-[#363E48] transition-colors focus:outline-none"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full min-w-[15px] text-center shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#14181C] border border-[#252B31] shadow-elevated rounded-[6px] z-50 overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-[#252B31] bg-[#101316] flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold text-[#F3F4F6] uppercase tracking-wider">
              System Inbox ({unreadCount} unread)
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#D6A84F] hover:text-[#F0C86A] flex items-center space-x-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-[#252B31]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#6F7781]">
                No pending notifications in your inbox.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 text-xs transition-colors ${
                    !n.isRead ? "bg-[#181D22] text-[#F3F4F6]" : "bg-[#14181C] text-[#A7ADB5]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-[#F3F4F6]">{n.title}</span>
                    <span className="text-[10px] font-mono text-[#6F7781] shrink-0">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="mt-1 text-[#A7ADB5] leading-relaxed">{n.message}</p>
                  {n.linkUrl && (
                    <Link
                      to={n.linkUrl}
                      onClick={() => setIsOpen(false)}
                      className="inline-block mt-1.5 text-[#D6A84F] hover:text-[#F0C86A] font-medium transition-colors"
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
