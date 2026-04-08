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
  const pollingIntervalRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const lastMessageCountRef = useRef(0);
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [tradeDetails, setTradeDetails] = useState(null);
  const [loadingTrade, setLoadingTrade] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check if user is at the bottom of the scroll
  const isAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // Consider "at bottom" if within 100px of the bottom
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
    // Only auto-scroll if:
    // 1. There are new messages (count increased)
    // 2. User is at the bottom (not manually scrolling up)
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
      
      // Set up polling for new messages every 3 seconds
      pollingIntervalRef.current = setInterval(() => {
        fetchMessages(true); // Silent fetch (no loading state)
      }, 3000);
    }

    // Cleanup: clear polling interval when component unmounts
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
        
        // Only show notification if there are genuinely NEW messages (not on initial load or silent refresh)
        if (silent && messages.length > 0 && newMessages.length > messages.length) {
          const newMessageCount = newMessages.length - messages.length;
          // Only show toast if the new messages are from the other user
          const newMessagesFromOther = newMessages
            .slice(-newMessageCount)
            .filter(msg => msg.sender._id !== user?._id && msg.sender !== user?._id);
          
          if (newMessagesFromOther.length > 0) {
            toast.success(`${newMessagesFromOther.length} new message${newMessagesFromOther.length > 1 ? 's' : ''}`);
          }
        }
        
        setMessages(newMessages);
        
        // Count unread messages from other user
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

  // Determine which book user is offering and receiving
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

  if (loading || loadingTrade) {
    return (
      <div className="chat-box-split">
        <div className="chat-loading">
          <Spinner size="lg" />
          <p className="loading-text">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-box-split">
        <div className="chat-error">
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
    <div className="chat-box-split">
      {/* Trade Context Sidebar */}
      <aside className="trade-context-sidebar">
        <div className="trade-context-header">
          <div className="trade-icon">📚</div>
          <h3 className="trade-context-title">Trade Details</h3>
        </div>

        {tradeContext && (
          <div className="trade-context-content">
            {/* Status Badge */}
            <div className={`trade-status-badge status-${tradeContext.status}`}>
              {tradeContext.status === 'accepted' && '✓ Accepted'}
              {tradeContext.status === 'proposed' && '⏳ Proposed'}
              {tradeContext.status === 'completed' && '✓✓ Completed'}
              {tradeContext.status === 'declined' && '✗ Declined'}
            </div>

            {/* You Offer Section */}
            <div className="trade-section">
              <h4 className="trade-section-title">📤 You Offer</h4>
              <div className="trade-book-card">
                {tradeContext.offeredBook.coverImage && (
                  <img 
                    src={tradeContext.offeredBook.coverImage} 
                    alt={tradeContext.offeredBook.title}
                    className="trade-book-cover"
                  />
                )}
                <div className="trade-book-info">
                  <p className="trade-book-title">{tradeContext.offeredBook.title}</p>
                  <p className="trade-book-author">{tradeContext.offeredBook.author}</p>
                  {tradeContext.offeredBook.condition && (
                    <span className="trade-book-condition">
                      {tradeContext.offeredBook.condition}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Exchange Icon */}
            <div className="trade-exchange-icon">⇅</div>

            {/* You Receive Section */}
            <div className="trade-section">
              <h4 className="trade-section-title">📥 You Receive</h4>
              <div className="trade-book-card">
                {tradeContext.receivedBook.coverImage && (
                  <img 
                    src={tradeContext.receivedBook.coverImage} 
                    alt={tradeContext.receivedBook.title}
                    className="trade-book-cover"
                  />
                )}
                <div className="trade-book-info">
                  <p className="trade-book-title">{tradeContext.receivedBook.title}</p>
                  <p className="trade-book-author">{tradeContext.receivedBook.author}</p>
                  {tradeContext.receivedBook.condition && (
                    <span className="trade-book-condition">
                      {tradeContext.receivedBook.condition}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Trading Partner */}
            <div className="trade-section">
              <h4 className="trade-section-title">👤 Trading With</h4>
              <div className="trade-partner">
                <div className="trade-partner-avatar">
                  {tradeContext.otherUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="trade-partner-info">
                  <p className="trade-partner-name">{tradeContext.otherUser.name}</p>
                  {tradeContext.otherUser.city && (
                    <p className="trade-partner-location">📍 {tradeContext.otherUser.city}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="trade-actions">
              <button 
                className="trade-action-btn view-books"
                onClick={() => window.open(`/books/${tradeContext.receivedBook._id}`, '_blank')}
              >
                View Book Details
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Messages Section */}
      <main className="chat-messages-section">
        <div className="chat-header">
          <div className="chat-header-user">
            <div className="chat-user-avatar">
              {otherUserName.charAt(0).toUpperCase()}
            </div>
            <div className="chat-header-info">
              <h3 className="chat-title">{otherUserName}</h3>
              <p className="chat-subtitle">
                {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                {unreadCount > 0 && (
                  <span className="unread-badge">{unreadCount} unread</span>
                )}
              </p>
            </div>
          </div>
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
              {messages.map((message, index) => {
                const prevMessage = messages[index - 1];
                const showAvatar = !prevMessage || prevMessage.sender._id !== message.sender._id;
                
                return (
                  <MessageBubble
                    key={message._id}
                    message={message}
                    isOwnMessage={message.sender._id === user?._id || message.sender === user?._id}
                    senderName={message.sender?.name || otherUserName}
                    showAvatar={showAvatar}
                  />
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <MessageInput onSendMessage={handleSendMessage} />
      </main>
    </div>
  );
};

export default ChatBox;
