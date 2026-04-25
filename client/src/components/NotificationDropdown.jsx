import React from 'react';
import NotificationItem from './NotificationItem';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import './NotificationDropdown.css';

const NotificationDropdown = ({ notifications, onMarkAsRead, onMarkAllAsRead, onClearAll }) => {
  const unreadNotifications = notifications.filter(n => !n.isRead);
  const hasUnread = unreadNotifications.length > 0;
  const hasNotifications = notifications.length > 0;

  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <div className="notification-header-left">
          <h3 className="notification-title">Notifications</h3>
          {notifications.length > 0 && (
            <span className="notification-count">{notifications.length}</span>
          )}
        </div>
        <div className="notification-header-actions">
          {hasUnread && (
            <button 
              className="mark-all-read-btn"
              onClick={onMarkAllAsRead}
              title="Mark all as read"
            >
              <CheckCheck size={16} />
              <span>Mark all read</span>
            </button>
          )}
          {hasNotifications && (
            <button 
              className="clear-all-btn"
              onClick={onClearAll}
              title="Clear all notifications"
            >
              <Trash2 size={16} />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-empty">
            <Bell size={32} strokeWidth={1.5} />
            <p className="empty-title">No notifications yet</p>
            <p className="empty-subtitle">
              You'll see updates about your trades and messages here
            </p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
