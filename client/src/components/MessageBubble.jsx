import React, { useState } from 'react';
import './MessageBubble.css';

const MessageBubble = ({ message, isOwnMessage, senderName, showAvatar = true, onDelete }) => {
  const [showDeleteBtn, setShowDeleteBtn] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(message._id);
    } catch (error) {
      console.error('Failed to delete message:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className={`message-bubble-wrapper ${isOwnMessage ? 'own-message' : 'other-message'}`}
      onMouseEnter={() => isOwnMessage && setShowDeleteBtn(true)}
      onMouseLeave={() => setShowDeleteBtn(false)}
    >
      {!isOwnMessage && showAvatar && (
        <div className="message-avatar">
          {senderName.charAt(0).toUpperCase()}
        </div>
      )}
      {!isOwnMessage && !showAvatar && (
        <div className="message-avatar-spacer"></div>
      )}
      
      <div className={`message-bubble ${isOwnMessage ? 'own' : 'other'} ${isDeleting ? 'deleting' : ''}`}>
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
        {isOwnMessage && showDeleteBtn && !isDeleting && (
          <button 
            className="delete-message-btn" 
            onClick={handleDelete}
            title="Delete message"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
