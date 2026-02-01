import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, RefreshCw, CheckCircle, XCircle, Flag } from 'lucide-react';
import './NotificationItem.css';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'trade_request':
        return <RefreshCw size={18} />;
      case 'trade_accepted':
        return <CheckCircle size={18} />;
      case 'trade_declined':
        return <XCircle size={18} />;
      case 'trade_completed':
        return <Flag size={18} />;
      case 'new_message':
        return <MessageSquare size={18} />;
      default:
        return <RefreshCw size={18} />;
    }
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}w ago`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }
  };

  const notificationLink = notification.relatedTrade
    ? `/trades/${notification.relatedTrade}`
    : '#';

  return (
    <Link
      to={notificationLink}
      className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
      onClick={handleClick}
    >
      <div className="notification-icon">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="notification-content">
        <p className="notification-message">{notification.message}</p>
        <span className="notification-time">{getRelativeTime(notification.createdAt)}</span>
      </div>
      {!notification.isRead && <div className="notification-badge"></div>}
    </Link>
  );
};

export default NotificationItem;
