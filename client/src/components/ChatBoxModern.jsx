import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import MessageBubbleModern from './MessageBubbleModern';
import MessageInputModern from './MessageInputModern';
import { Spinner } from './ui';
import './ChatBoxModern.css';

/**
 * Modern Chat UI - Option 1: WhatsApp/Telegram Style
 * Features:
 * - Full-width chat interface
 * - Collapsible trade details panel
 * - Modern message bubbles with reactions
 * - Typing indicators
 * - Message timestamps with date separators
 */
const ChatBoxModern = ({ tradeId, otherUserName }) => {
  const { user } = useAuth();
  const toast = useToast();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const lastMessageCountRef = useRef(0);
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tradeDetails, setTradeDetails] = useState(null);
  const [loadingTrade, setLoadingTrade] = useState(true);
  const [showTradePanel, setShowTradePanel] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check if user is at the bottom of the scroll
  const isAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  // Handle scroll events to detect manual scrolling
  const handleScroll = () => {
    isUserScrollingRef.current = !isAtBottom();
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    if (messages.length > lastMessageCountRef.current && !isUserScrollingRef.current) {
      scrollToBottom();
    }
    lastMessageCountRef.current = messages.length;
  }, [messages]);

  // Fetch trade details
  const fetchTradeDetails = async () => {
    try {
      setLoadingTrade(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');

      if (!token) return;

      const response = await fetch(`${apiUrl}/api/trades`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const trade = data.data.find(t => t._id === tradeId);
        setTradeDetails(trade);
      }
    } catch (err) {
      console.error('Error fetching trade details:', err);
    } finally {
      setLoadingTrade(false);
    }
  };

  // Fetch messages when component mounts and set up polling
  useEffect(() => {
    if (tradeId) {
      fetchTradeDetails();
      fetchMessages();
      
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(true);
      }, 3000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [tradeId]);

  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');

      if (!token) {
        if (!silent) {
          setError('Authentication required');
          setLoading(false);
        }
        return;
      }

      const response = await fetch(`${apiUrl}/api/messages/trade/${tradeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newMessages = data.data || [];
        
        if (silent && messages.length > 0 && newMessages.length > messages.length) {
          const newMessageCount = newMessages.length - messages.length;
          const newMessagesFromOther = newMessages
            .slice(-newMessageCount)
            .filter(msg => msg.sender._id !== user?._id && msg.sender !== user?._id);
          
          if (newMessagesFromOther.length > 0) {
            toast.success(`${newMessagesFromOther.length} new message${newMessagesFromOther.length > 1 ? 's' : ''}`);
          }
        }
        
        setMessages(newMessages);
        
        const unread = newMessages.filter(
          msg => msg.sender._id !== user?._id && !msg.read
        ).length;
        setUnreadCount(unread);
      } else {
        if (!silent) {
          setError(data.error?.message || 'Failed to load messages');
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (!silent) {
        setError('Unable to load messages. Please try again.');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
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

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt).toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  };

  const formatDateSeparator = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
      });
    }
  };

  const getTradeContext = () => {
    if (!tradeDetails || !user) return null;

    const isProposer = tradeDetails.proposer._id === user._id;
    
    return {
      offeredBook: isProposer ? tradeDetails.offeredBook : tradeDetails.requestedBook,
      receivedBook: isProposer ? tradeDetails.requestedBook : tradeDetails.offeredBook,
      otherUser: isProposer ? tradeDetails.receiver : tradeDetails.proposer,
      status: tradeDetails.status
    };
  };

  const tradeContext = getTradeContext();
  const messageGroups = groupMessagesByDate(messages);

  if (loading || loadingTrade) {
    return (
      <div className="chat-modern-container">
        <div className="chat-modern-loading">
          <Spinner size="lg" />
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-modern-container">
        <div className="chat-modern-error">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={fetchMessages} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-modern-container">
      {/* Header */}
      <div className="chat-modern-header">
        <div className="header-left">
          <div className="user-avatar-large">
            {otherUserName.charAt(0).toUpperCase()}
          </div>
          <div className="header-info">
            <h3 className="user-name">{otherUserName}</h3>
            <p className="user-status">
              {isTyping ? (
                <span className="typing-indicator">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  typing...
                </span>
              ) : (
                <span>Active now</span>
              )}
            </p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className={`trade-info-btn ${showTradePanel ? 'active' : ''}`}
            onClick={() => setShowTradePanel(!showTradePanel)}
            title="Trade Details"
          >
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="chat-modern-content">
        {/* Messages Area */}
        <div className="messages-area" ref={messagesContainerRef}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💬</div>
              <h4>Start the conversation</h4>
              <p>Send a message to begin trading with {otherUserName}</p>
            </div>
          ) : (
            <>
              {messageGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="message-group">
                  <div className="date-separator">
                    <span>{formatDateSeparator(group.date)}</span>
                  </div>
                  {group.messages.map((message, index) => {
                    const prevMessage = index > 0 ? group.messages[index - 1] : null;
                    const showAvatar = !prevMessage || prevMessage.sender._id !== message.sender._id;
                    
                    return (
                      <MessageBubbleModern
                        key={message._id}
                        message={message}
                        isOwnMessage={message.sender._id === user?._id || message.sender === user?._id}
                        senderName={message.sender?.name || otherUserName}
                        showAvatar={showAvatar}
                      />
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Trade Details Panel (Slide-in) */}
        <div className={`trade-panel ${showTradePanel ? 'open' : ''}`}>
          <div className="trade-panel-header">
            <h3>Trade Details</h3>
            <button 
              className="close-panel-btn"
              onClick={() => setShowTradePanel(false)}
            >
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {tradeContext && (
            <div className="trade-panel-content">
              <div className={`status-badge status-${tradeContext.status}`}>
                {tradeContext.status === 'accepted' && '✓ Accepted'}
                {tradeContext.status === 'proposed' && '⏳ Pending'}
                {tradeContext.status === 'completed' && '✓✓ Completed'}
                {tradeContext.status === 'declined' && '✗ Declined'}
              </div>

              <div className="trade-books">
                <div className="trade-book-item">
                  <span className="book-label">You're offering</span>
                  <div className="book-card-mini">
                    {tradeContext.offeredBook.coverImage && (
                      <img src={tradeContext.offeredBook.coverImage} alt="" />
                    )}
                    <div className="book-info-mini">
                      <p className="book-title-mini">{tradeContext.offeredBook.title}</p>
                      <p className="book-author-mini">{tradeContext.offeredBook.author}</p>
                    </div>
                  </div>
                </div>

                <div className="exchange-arrow">⇄</div>

                <div className="trade-book-item">
                  <span className="book-label">You're receiving</span>
                  <div className="book-card-mini">
                    {tradeContext.receivedBook.coverImage && (
                      <img src={tradeContext.receivedBook.coverImage} alt="" />
                    )}
                    <div className="book-info-mini">
                      <p className="book-title-mini">{tradeContext.receivedBook.title}</p>
                      <p className="book-author-mini">{tradeContext.receivedBook.author}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="trade-partner-info">
                <div className="partner-avatar">
                  {tradeContext.otherUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="partner-name">{tradeContext.otherUser.name}</p>
                  {tradeContext.otherUser.city && (
                    <p className="partner-location">📍 {tradeContext.otherUser.city}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message Input */}
      <MessageInputModern onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatBoxModern;
