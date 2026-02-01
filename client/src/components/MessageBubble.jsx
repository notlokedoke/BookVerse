import React from 'react';
import './MessageBubble.css';

const MessageBubble = ({ message, isOwnMessage, senderName }) => {
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
      <div className={`message-bubble ${isOwnMessage ? 'own' : 'other'}`}>
        {!isOwnMessage && (
          <div className="message-sender">{senderName}</div>
        )}
        <div className="message-content">{message.content}</div>
        <div className="message-time">{formatTime(message.createdAt)}</div>
      </div>
    </div>
  );
};

export default MessageBubble;
