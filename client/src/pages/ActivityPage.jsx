import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import axios from 'axios';
import {
  Activity,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  RefreshCw,
  Calendar,
  ArrowLeft,
  Bell,
  BellOff
} from 'lucide-react';
import './ActivityPage.css';

const ActivityPage = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const filters = [
    { id: 'all', label: 'All Activity', icon: Activity },
    { id: 'trade_request', label: 'Trade Proposals', icon: Clock },
    { id: 'trade_accepted', label: 'Accepted', icon: CheckCircle },
    { id: 'trade_completed', label: 'Completed', icon: CheckCircle },
    { id: 'trade_declined', label: 'Declined', icon: XCircle },
    { id: 'new_message', label: 'Messages', icon: MessageSquare }
  ];

  useEffect(() => {
    fetchActivityData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activeFilter, showUnreadOnly, activities, notifications]);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Fetch trades
      const tradesRes = await axios.get('/api/trades', config);
      const trades = tradesRes.data.data || [];

      // Fetch notifications
      const notificationsRes = await axios.get('/api/notifications', config);
      const notifs = notificationsRes.data.data || [];
      const unread = notificationsRes.data.unreadCount || 0;

      setNotifications(notifs);
      setUnreadCount(unread);

      // Convert trades to activity items
      const tradeActivities = trades.map(trade => {
        const isProposer = trade.proposer._id === user._id;
        return {
          id: trade._id,
          type: getTradeActivityType(trade.status),
          status: trade.status,
          title: getTradeTitle(trade, isProposer),
          description: getTradeDescription(trade, isProposer),
          time: new Date(trade.respondedAt || trade.createdAt),
          icon: getTradeIcon(trade.status),
          link: `/trades`,
          isRead: true, // Trades don't have read status
          relatedUser: isProposer ? trade.receiver : trade.proposer,
          relatedTrade: trade
        };
      });

      // Convert notifications to activity items
      const notificationActivities = notifs.map(notif => ({
        id: notif._id,
        type: notif.type,
        status: notif.type,
        title: notif.message,
        description: getNotificationDescription(notif),
        time: new Date(notif.createdAt),
        icon: getNotificationIcon(notif.type),
        link: getNotificationLink(notif),
        isRead: notif.isRead,
        relatedUser: notif.relatedUser,
        relatedTrade: notif.relatedTrade
      }));

      // Combine and sort by time
      const allActivities = [...tradeActivities, ...notificationActivities]
        .sort((a, b) => b.time - a.time);

      setActivities(allActivities);

    } catch (error) {
      console.error('Error fetching activity data:', error);
      toast.error('Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...activities];

    // Apply type filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === activeFilter);
    }

    // Apply unread filter
    if (showUnreadOnly) {
      filtered = filtered.filter(activity => !activity.isRead);
    }

    setFilteredActivities(filtered);
  };

  const getTradeActivityType = (status) => {
    if (status === 'proposed') return 'trade_request';
    if (status === 'accepted') return 'trade_accepted';
    if (status === 'completed') return 'trade_completed';
    if (status === 'declined') return 'trade_declined';
    return 'trade_request';
  };

  const getTradeTitle = (trade, isProposer) => {
    const partner = isProposer ? trade.receiver : trade.proposer;
    if (trade.status === 'proposed') {
      return isProposer
        ? `Trade proposed to ${partner?.name}`
        : `Trade proposal from ${partner?.name}`;
    }
    if (trade.status === 'accepted') {
      return `Trade accepted with ${partner?.name}`;
    }
    if (trade.status === 'completed') {
      return `Trade completed with ${partner?.name}`;
    }
    if (trade.status === 'declined') {
      return `Trade declined with ${partner?.name}`;
    }
    return `Trade with ${partner?.name}`;
  };

  const getTradeDescription = (trade, isProposer) => {
    const myBook = isProposer ? trade.offeredBook : trade.requestedBook;
    const theirBook = isProposer ? trade.requestedBook : trade.offeredBook;
    return `${myBook?.title} ↔ ${theirBook?.title}`;
  };

  const getTradeIcon = (status) => {
    if (status === 'completed') return 'completed';
    if (status === 'accepted') return 'active';
    if (status === 'declined') return 'declined';
    return 'pending';
  };

  const getNotificationDescription = (notif) => {
    if (notif.relatedTrade?.requestedBook) {
      return `"${notif.relatedTrade.requestedBook.title}"`;
    }
    return '';
  };

  const getNotificationIcon = (type) => {
    if (type === 'trade_completed') return 'completed';
    if (type === 'trade_accepted') return 'active';
    if (type === 'trade_declined') return 'declined';
    if (type === 'new_message') return 'message';
    return 'pending';
  };

  const getNotificationLink = (notif) => {
    if (notif.type === 'new_message' && notif.relatedTrade) {
      return `/trades`;
    }
    return `/trades`;
  };

  const handleMarkAsRead = async (activityId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/notifications/${activityId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setActivities(prev => prev.map(activity =>
        activity.id === activityId ? { ...activity, isRead: true } : activity
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('All notifications marked as read');
      
      // Update local state
      setActivities(prev => prev.map(activity => ({ ...activity, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: now.getFullYear() !== new Date(date).getFullYear() ? 'numeric' : undefined
    });
  };

  const formatFullDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="activity-page">
        <div className="activity-container">
          <div className="activity-skeleton">
            <div className="skeleton-header"></div>
            <div className="skeleton-filters"></div>
            <div className="skeleton-list">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="skeleton-item"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-page">
      <div className="activity-container">
        {/* Header */}
        <div className="activity-header">
          <div className="header-left">
            <Link to="/dashboard" className="back-button">
              <ArrowLeft size={20} />
            </Link>
            <div className="header-text">
              <h1>
                <Activity size={28} />
                Activity History
              </h1>
              <p className="header-subtitle">
                {filteredActivities.length} {filteredActivities.length === 1 ? 'item' : 'items'}
                {unreadCount > 0 && (
                  <span className="unread-badge-header">{unreadCount} unread</span>
                )}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">
              <BellOff size={18} />
              Mark All as Read
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="activity-filters">
          <div className="filter-tabs">
            {filters.map(filter => {
              const Icon = filter.icon;
              const count = filter.id === 'all'
                ? activities.length
                : activities.filter(a => a.type === filter.id).length;
              
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`filter-tab ${activeFilter === filter.id ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  {filter.label}
                  {count > 0 && <span className="filter-count">{count}</span>}
                </button>
              );
            })}
          </div>
          
          <div className="filter-actions">
            <button
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
              className={`toggle-unread ${showUnreadOnly ? 'active' : ''}`}
            >
              <Bell size={16} />
              {showUnreadOnly ? 'Show All' : 'Unread Only'}
            </button>
          </div>
        </div>

        {/* Activity List */}
        <div className="activity-list">
          {filteredActivities.length === 0 ? (
            <div className="empty-activity">
              <div className="empty-icon">
                <Activity size={48} />
              </div>
              <h3>No Activity Found</h3>
              <p>
                {showUnreadOnly
                  ? "You're all caught up! No unread notifications."
                  : activeFilter === 'all'
                  ? "You don't have any activity yet. Start trading to see your activity here."
                  : `No ${filters.find(f => f.id === activeFilter)?.label.toLowerCase()} found.`}
              </p>
              {activeFilter !== 'all' && (
                <button onClick={() => setActiveFilter('all')} className="reset-filter-btn">
                  View All Activity
                </button>
              )}
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <Link
                key={activity.id}
                to={activity.link}
                className={`activity-card ${!activity.isRead ? 'unread' : ''}`}
                onClick={() => !activity.isRead && handleMarkAsRead(activity.id)}
              >
                <div className={`activity-icon ${activity.icon}`}>
                  {activity.icon === 'completed' && <CheckCircle size={20} />}
                  {activity.icon === 'active' && <RefreshCw size={20} />}
                  {activity.icon === 'pending' && <Clock size={20} />}
                  {activity.icon === 'declined' && <XCircle size={20} />}
                  {activity.icon === 'message' && <MessageSquare size={20} />}
                </div>
                
                <div className="activity-details">
                  <div className="activity-main">
                    <h3 className="activity-title">
                      {activity.title}
                      {!activity.isRead && <span className="unread-dot"></span>}
                    </h3>
                    {activity.description && (
                      <p className="activity-description">{activity.description}</p>
                    )}
                  </div>
                  
                  <div className="activity-meta">
                    <span className="activity-time" title={formatFullDate(activity.time)}>
                      <Calendar size={14} />
                      {formatTime(activity.time)}
                    </span>
                    {activity.relatedUser && (
                      <span className="activity-user">
                        <div className="user-avatar-tiny">
                          {activity.relatedUser.name?.charAt(0).toUpperCase()}
                        </div>
                        {activity.relatedUser.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="activity-arrow">
                  →
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
