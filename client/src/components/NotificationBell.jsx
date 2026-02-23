import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import './NotificationBell.css';

const NotificationBell = ({ unreadCount = 0, notifications = [], onMarkAsRead, onOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleClick = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    if (!isOpen && onOpen) {
      onOpen();
    }
  };

  return (
    <div className="notification-bell-container" ref={bellRef}>
      <button
        className="notification-bell-button"
        onClick={handleClick}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-bell-badge" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {isOpen && (
        <NotificationDropdown 
          notifications={notifications} 
          onMarkAsRead={onMarkAsRead}
        />
      )}
    </div>
  );
};

export default NotificationBell;
