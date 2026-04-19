import React from 'react';
import './MessageBubbleModern.css';

const MessageBubbleModern = ({ message, isOwnMessage, senderName, showAvatar = true }) => {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`msg-modern-wrapper ${isOwnMessage ? 'own' : 'other'}`}>
      {!isOwnMessage && showAvatar && (
        <div className="msg-avatar">
          {senderName.charAt(0).toUpperCase()}
        </div>
      )}
      {!isOwnMessage && !showAvatar && (
        <div className="msg-avatar-spacer"></div>
      )}
      
      <div className={`msg-bubble-modern ${isOwnMessage ? 'own' : 'other'}`}>
        <div className="msg-content">{message.content}</div>
        <div className="msg-meta">
          <span className="msg-time">{formatTime(message.createdAt)}</span>
          {isOwnMessage && (
            <span className="msg-status">
              {message.read ? (
                <svg className="checkmark double" viewBox="0 0 16 15" width="16" height="15">
                  <path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                </svg>
              ) : (
                <svg className="checkmark single" viewBox="0 0 12 11" width="12" height="11">
                  <path fill="currentColor" d="M11.1 2.3L10.7 1.9 4.5 8.1 1.4 5 1 5.4 4.5 9z"/>
                </svg>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubbleModern;
