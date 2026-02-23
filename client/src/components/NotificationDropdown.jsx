import React from 'react';
import NotificationItem from './NotificationItem';
import { Bell } from 'lucide-react';
import './NotificationDropdown.css';

const NotificationDropdown = ({ notifications, onMarkAsRead }) => {
  return (
    <div className="notification-dropdown">
      <div className="notification-header">
        <h3 className="notification-title">Notifications</h3>
        {notifications.length > 0 && (
          <span className="notification-count">{notifications.length}</span>
        )}
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
