import React, { useState, useEffect } from "react";
import "../styles/notifications-page.css";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const query = filter === "all" ? "" : `?isRead=${filter === "unread"}`;
      const response = await fetch(`/api/notifications${query}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      booking_request: "📅",
      booking_confirmed: "✅",
      booking_cancelled: "❌",
      booking_reminder: "⏰",
      new_message: "💬",
      review_received: "⭐",
      profile_verified: "✓",
      emergency_alert: "🚨",
      system_notification: "ℹ️",
    };
    return icons[type] || "🔔";
  };

  if (loading) return <div className="notifications-loading">Loading notifications...</div>;

  return (
    <div className="notifications-page-container">
      <div className="notifications-header">
        <h1>🔔 Notifications</h1>
        {unreadCount > 0 && (
          <div className="unread-badge">{unreadCount} unread</div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="notification-filters">
        <button
          className={`filter-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`filter-tab ${filter === "unread" ? "active" : ""}`}
          onClick={() => setFilter("unread")}
        >
          Unread
        </button>
        {unreadCount > 0 && (
          <button className="mark-all-read-btn" onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div
              key={notification._id}
              className={`notification-item ${notification.isRead ? "read" : "unread"}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>

              <div className="notification-content">
                <h3 className="notification-title">{notification.title}</h3>
                <p className="notification-message">{notification.message}</p>
                <span className="notification-time">
                  {new Date(notification.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="notification-actions">
                {!notification.isRead && (
                  <button
                    className="notification-mark-read-btn"
                    onClick={() => markAsRead(notification._id)}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button
                  className="notification-delete-btn"
                  onClick={() => deleteNotification(notification._id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
