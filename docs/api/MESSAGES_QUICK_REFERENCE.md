# Messages API - Quick Reference

## 💬 Quick Start

The Messages API enables trade-specific communication between users. Messages are only available for accepted trades.

### Base URL

```
http://localhost:5000/api/messages
```

### Authentication

All endpoints require JWT authentication:

```javascript
headers: {
  'Authorization': 'Bearer <your_jwt_token>'
}
```

---

## 🚀 Common Use Cases

### 1. Send a Message

```javascript
// POST /api/messages
const response = await axios.post('/api/messages', {
  trade: '507f1f77bcf86cd799439013',
  content: 'Hi! When would be a good time to meet?'
}, {
  headers: { 'Authorization': `Bearer ${token}` }
});

console.log(response.data.data); // Message object
```

### 2. Get All Messages for a Trade

```javascript
// GET /api/messages/trade/:tradeId
const response = await axios.get('/api/messages/trade/507f1f77bcf86cd799439013', {
  headers: { 'Authorization': `Bearer ${token}` }
});

console.log(response.data.data); // Array of messages (chronological order)
```

### 3. Get Unread Count

```javascript
// GET /api/messages/trade/:tradeId/unread-count
const response = await axios.get('/api/messages/trade/507f1f77bcf86cd799439013/unread-count', {
  headers: { 'Authorization': `Bearer ${token}` }
});

console.log(response.data.data.unreadCount); // Number of unread messages
```

### 4. Mark Message as Read

```javascript
// PATCH /api/messages/:id/read
const response = await axios.patch('/api/messages/507f1f77bcf86cd799439020/read', {}, {
  headers: { 'Authorization': `Bearer ${token}` }
});

console.log(response.data.message); // "Message marked as read"
```

### 5. Delete a Message

```javascript
// DELETE /api/messages/:id
const response = await axios.delete('/api/messages/507f1f77bcf86cd799439020', {
  headers: { 'Authorization': `Bearer ${token}` }
});

console.log(response.data.message); // "Message deleted successfully"
```

---

## 📊 Response Examples

### Message Object

```json
{
  "_id": "507f1f77bcf86cd799439020",
  "trade": "507f1f77bcf86cd799439013",
  "sender": {
    "_id": "507f191e810c19729de860ea",
    "name": "John Doe",
    "city": "New York",
    "averageRating": 4.5
  },
  "content": "Hi! When would be a good time to meet?",
  "read": false,
  "readAt": null,
  "createdAt": "2025-01-16T10:30:00.000Z"
}
```

### Messages Array

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "sender": { "name": "John Doe", ... },
      "content": "Hi! When would be a good time to meet?",
      "read": true,
      "readAt": "2025-01-16T10:35:00.000Z",
      "createdAt": "2025-01-16T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439021",
      "sender": { "name": "Jane Smith", ... },
      "content": "How about tomorrow at 3pm?",
      "read": true,
      "readAt": "2025-01-16T10:40:00.000Z",
      "createdAt": "2025-01-16T10:35:00.000Z"
    }
  ]
}
```

---

## ⚡ React Component Example

### Chat Component

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TradeChat({ tradeId, token }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await axios.get(
        `/api/messages/trade/${tradeId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setMessages(response.data.data);
      setUnreadCount(0); // Auto-marked as read
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(
        `/api/messages/trade/${tradeId}/unread-count`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setUnreadCount(response.data.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(
        '/api/messages',
        { trade: tradeId, content: newMessage },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setMessages([...messages, response.data.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.response?.data?.error?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;

    try {
      await axios.delete(
        `/api/messages/${messageId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setMessages(messages.filter(msg => msg._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert(error.response?.data?.error?.message || 'Failed to delete message');
    }
  };

  // Poll for new messages every 5 seconds
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [tradeId]);

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [tradeId]);

  return (
    <div className="trade-chat">
      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="unread-badge">
          {unreadCount} new message{unreadCount > 1 ? 's' : ''}
        </div>
      )}

      {/* Messages list */}
      <div className="messages-list">
        {messages.length === 0 ? (
          <p className="empty-state">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className={`message ${msg.sender._id === userId ? 'own' : 'other'}`}>
              <div className="message-header">
                <strong>{msg.sender.name}</strong>
                <span className="timestamp">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="message-content">{msg.content}</div>
              {msg.sender._id === userId && (
                <button onClick={() => deleteMessage(msg._id)} className="delete-btn">
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Message input */}
      <form onSubmit={sendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          maxLength={1000}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !newMessage.trim()}>
          {loading ? 'Sending...' : 'Send'}
        </button>
        <div className="char-count">
          {newMessage.length}/1000
        </div>
      </form>
    </div>
  );
}

export default TradeChat;
```

---

## 🎯 Key Features

### Auto-Mark as Read

When you fetch messages, unread messages from the other party are **automatically marked as read**:

```javascript
// Before fetch: message.read = false
const response = await axios.get('/api/messages/trade/123');
// After fetch: message.read = true, message.readAt = current timestamp
```

### Access Control

- ✅ Only trade participants can send/view messages
- ✅ Trade must have status "accepted"
- ✅ Only sender can delete their own messages
- ✅ Cannot mark own messages as read

### Automatic Notifications

When you send a message, the recipient automatically receives a notification:

```javascript
// Send message
await axios.post('/api/messages', { trade: tradeId, content: 'Hello!' });

// Recipient gets notification with type: 'new_message'
```

---

## ⚠️ Common Errors

### 1. Trade Not Accepted

```json
{
  "error": {
    "message": "Messages can only be sent for accepted trades",
    "code": "INVALID_TRADE_STATUS"
  }
}
```

**Solution**: Ensure trade status is "accepted" before enabling messaging.

### 2. Not Authorized

```json
{
  "error": {
    "message": "You are not authorized to send messages in this trade",
    "code": "NOT_AUTHORIZED"
  }
}
```

**Solution**: Verify user is either proposer or receiver of the trade.

### 3. Message Too Long

```json
{
  "error": {
    "message": "Message content must be between 1 and 1000 characters",
    "code": "VALIDATION_ERROR"
  }
}
```

**Solution**: Limit message input to 1000 characters.

### 4. Cannot Delete Other's Message

```json
{
  "error": {
    "message": "You can only delete your own messages",
    "code": "NOT_AUTHORIZED"
  }
}
```

**Solution**: Only allow delete button for user's own messages.

---

## 🔧 Best Practices

### 1. Polling Strategy

```javascript
// Poll every 5 seconds for new messages
useEffect(() => {
  const interval = setInterval(fetchMessages, 5000);
  return () => clearInterval(interval);
}, [tradeId]);
```

### 2. Optimistic UI Updates

```javascript
// Add message to UI immediately
const optimisticMessage = {
  _id: 'temp-' + Date.now(),
  content: newMessage,
  sender: currentUser,
  createdAt: new Date(),
  read: false
};
setMessages([...messages, optimisticMessage]);

// Then send to server
try {
  const response = await axios.post('/api/messages', { ... });
  // Replace optimistic message with real one
  setMessages(prev => prev.map(msg => 
    msg._id === optimisticMessage._id ? response.data.data : msg
  ));
} catch (error) {
  // Remove optimistic message on error
  setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
}
```

### 3. Character Counter

```jsx
<div className="char-count">
  {newMessage.length}/1000
  {newMessage.length > 900 && (
    <span className="warning"> (approaching limit)</span>
  )}
</div>
```

### 4. Auto-Scroll to Bottom

```javascript
const messagesEndRef = useRef(null);

const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
};

useEffect(() => {
  scrollToBottom();
}, [messages]);

// In JSX
<div ref={messagesEndRef} />
```

### 5. Relative Timestamps

```javascript
function getRelativeTime(timestamp) {
  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffMs = now - messageTime;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return messageTime.toLocaleDateString();
}
```

---

## 📱 UI/UX Tips

### 1. Empty State

```jsx
{messages.length === 0 && (
  <div className="empty-state">
    <p>No messages yet</p>
    <p>Start the conversation to coordinate your book exchange!</p>
  </div>
)}
```

### 2. Unread Badge

```jsx
{unreadCount > 0 && (
  <span className="badge">{unreadCount}</span>
)}
```

### 3. Message Grouping

```jsx
// Group messages by sender
const groupedMessages = messages.reduce((groups, msg, index) => {
  const prevMsg = messages[index - 1];
  const isSameSender = prevMsg && prevMsg.sender._id === msg.sender._id;
  
  if (!isSameSender) {
    groups.push([msg]);
  } else {
    groups[groups.length - 1].push(msg);
  }
  
  return groups;
}, []);
```

### 4. Loading States

```jsx
{loading && <div className="loading-spinner">Sending...</div>}
```

### 5. Error Handling

```jsx
const [error, setError] = useState(null);

// Show error message
{error && (
  <div className="error-message">
    {error}
    <button onClick={() => setError(null)}>Dismiss</button>
  </div>
)}
```

---

## 🔗 Related Documentation

- **[Messages API](./MESSAGES_API.md)** - Complete API documentation
- **[Trades API](./TRADES_API.md)** - Trade management (messages require accepted trades)
- **[Authentication API](./AUTHENTICATION_API.md)** - JWT authentication
- **[Notifications API](./NOTIFICATIONS_API.md)** - Automatic message notifications

---

## 📞 Quick Help

### How do I enable messaging?

Messages are only available for trades with status "accepted". Accept a trade first:

```javascript
await axios.put(`/api/trades/${tradeId}/accept`);
// Now messaging is enabled
```

### How do I know if there are new messages?

Poll the unread count endpoint:

```javascript
const { data } = await axios.get(`/api/messages/trade/${tradeId}/unread-count`);
console.log(data.data.unreadCount); // Number of unread messages
```

### Do I need to manually mark messages as read?

No! Messages are automatically marked as read when you fetch them. The manual endpoint is rarely needed.

### Can I edit messages?

Not currently. You can only delete your own messages. Message editing is a planned future enhancement.

### What's the message length limit?

1000 characters. Show a character counter in your UI to help users stay within the limit.

---

**Last Updated**: January 2025  
**API Version**: 1.0  
**Status**: Production Ready
