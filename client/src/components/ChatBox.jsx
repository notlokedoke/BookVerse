import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { Spinner } from './ui';
import './ChatBox.css';

const ChatBox = ({ tradeId, otherUserName }) => {
  const { user } = useAuth();
  const toast = useToast();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages when component mounts
  useEffect(() => {
    if (tradeId) {
      fetchMessages();
    }
  }, [tradeId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiUrl}/api/messages/trade/${tradeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessages(data.data || []);
      } else {
        setError(data.error?.message || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Unable to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch(`${apiUrl}/api/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trade: tradeId,
          content
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Add the new message to the list
        setMessages(prevMessages => [...prevMessages, data.data]);
      } else {
        toast.error(data.error?.message || 'Failed to send message');
        throw new Error(data.error?.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Unable to send message. Please try again.');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="chat-box">
        <div className="chat-header">
          <h3 className="chat-title">Chat with {otherUserName}</h3>
        </div>
        <div className="chat-messages loading">
          <Spinner size="lg" />
          <p className="loading-text">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-box">
        <div className="chat-header">
          <h3 className="chat-title">Chat with {otherUserName}</h3>
        </div>
        <div className="chat-messages error">
          <div className="error-icon">⚠️</div>
          <p className="error-text">{error}</p>
          <button 
            onClick={fetchMessages}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-box">
      <div className="chat-header">
        <h3 className="chat-title">Chat with {otherUserName}</h3>
        <p className="chat-subtitle">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </p>
      </div>

      <div className="chat-messages" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="empty-messages">
            <div className="empty-icon">💬</div>
            <p className="empty-text">No messages yet</p>
            <p className="empty-subtext">Start the conversation by sending a message below</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwnMessage={message.sender._id === user?._id || message.sender === user?._id}
                senderName={message.sender?.name || otherUserName}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatBox;
