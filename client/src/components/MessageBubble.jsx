import React from 'react';
import './MessageBubble.css';

const MessageBubble = ({ message, isOwnMessage, senderName, showAvatar = true }) => {
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
    <div className={`message-bubble-wrapper ${isOwnMessage ? 'own-message' : 'other-message'}`}>
      {!isOwnMessage && showAvatar && (
        <div className="message-avatar">
          {senderName.charAt(0).toUpperCase()}
        </div>
      )}
      {!isOwnMessage && !showAvatar && (
        <div className="message-avatar-spacer"></div>
      )}
      
      <div className={`message-bubble ${isOwnMessage ? 'own' : 'other'}`}>
        {!isOwnMessage && showAvatar && (
          <div className="message-sender">{senderName}</div>
        )}
        <div className="message-content">{message.content}</div>
        <div className="message-footer">
          <span className="message-time">{formatTime(message.createdAt)}</span>
          {isOwnMessage && (
            <span className="message-status">
              {message.read ? (
                <span className="read-receipt" title={`Read ${formatTime(message.readAt)}`}>✓✓</span>
              ) : (
                <span className="sent-receipt" title="Sent">✓</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
