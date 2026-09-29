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
        className="relative p-1.5 text-stone-700 hover:text-stone-900 border border-stone-300 rounded-[4px] bg-white hover:bg-stone-50 focus:outline-none"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-stone-300 shadow-md rounded-[4px] z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Inbox ({unreadCount} unread)
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-emerald-800 hover:underline flex items-center space-x-1"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-xs text-stone-500">
                No notifications in your inbox.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 text-xs ${!n.isRead ? "bg-stone-50 font-medium" : "bg-white text-stone-700"}`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-semibold text-stone-900">{n.title}</span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="mt-1 text-stone-600">{n.message}</p>
                  {n.linkUrl && (
                    <Link
                      to={n.linkUrl}
                      onClick={() => setIsOpen(false)}
                      className="inline-block mt-1 text-emerald-800 font-semibold hover:underline"
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
