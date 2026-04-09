import { useState, useEffect, useRef } from "react";
import {
  NotificationData,
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  acknowledgeNotification,
} from "./apiClient";
import { useAuth } from "./AuthContext";
import "./NotificationBell.css";

export function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  async function loadUnreadCount() {
    try {
      const count = await fetchUnreadCount();
      setUnreadCount(count);
    } catch {
      // silent
    }
  }

  async function loadNotifications() {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle() {
    if (!open) {
      await loadNotifications();
    }
    setOpen(!open);
  }

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  }

  async function handleAcknowledge(id: string) {
    try {
      await acknowledgeNotification(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, acknowledgedBy: [...n.acknowledgedBy, user!.id] } : n
        )
      );
    } catch {
      // silent
    }
  }

  if (!user) return null;

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button className="notification-bell__btn" onClick={handleToggle} aria-label="Notifications">
        <span className="notification-bell__icon">&#128276;</span>
        {unreadCount > 0 && (
          <span className="notification-bell__badge">{unreadCount}</span>
        )}
      </button>
      {open && (
        <div className="notification-bell__dropdown">
          <h4 className="notification-bell__dropdown-title">Notifications</h4>
          {loading ? (
            <p className="notification-bell__loading">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="notification-bell__empty">No notifications</p>
          ) : (
            <ul className="notification-bell__list">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`notification-bell__item${n.isRead ? "" : " notification-bell__item--unread"}`}
                >
                  <span className="notification-bell__message">{n.message}</span>
                  <div className="notification-bell__actions">
                    {!n.isRead && (
                      <button
                        className="notification-bell__action"
                        onClick={() => handleMarkRead(n.id)}
                      >
                        Mark read
                      </button>
                    )}
                    {n.type === "feed_failure" && user.isAdmin && (
                      <button
                        className="notification-bell__action"
                        onClick={() => handleAcknowledge(n.id)}
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
