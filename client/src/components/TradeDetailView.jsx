import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button, Spinner } from './ui';
import './TradeDetailView.css';

const TradeDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  
  const [trade, setTrade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTradeDetails();
  }, [id]);

  const fetchTradeDetails = async () => {
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

      const response = await fetch(`${apiUrl}/api/trades`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Find the specific trade by ID
        const foundTrade = data.data.find(t => t._id === id);
        if (foundTrade) {
          setTrade(foundTrade);
        } else {
          setError('Trade not found');
        }
      } else {
        setError(data.error?.message || 'Failed to fetch trade details');
      }
    } catch (err) {
      console.error('Error fetching trade details:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTrade = async () => {
    if (!trade || actionLoading) return;

    try {
      setActionLoading(true);

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/api/trades/${trade._id}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'Trade accepted successfully!');
        setTrade(data.data);
      } else {
        toast.error(data.error?.message || 'Failed to accept trade');
      }
    } catch (err) {
      console.error('Error accepting trade:', err);
      toast.error('Unable to accept trade. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineTrade = async () => {
    if (!trade || actionLoading) return;

    // Confirm before declining
    if (!window.confirm('Are you sure you want to decline this trade proposal?')) {
      return;
    }

    try {
      setActionLoading(true);

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/api/trades/${trade._id}/decline`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || 'Trade declined');
        setTrade(data.data);
      } else {
        toast.error(data.error?.message || 'Failed to decline trade');
      }
    } catch (err) {
      console.error('Error declining trade:', err);
      toast.error('Unable to decline trade. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      proposed: { text: 'Pending', color: 'bg-warning-100 text-warning-700' },
      accepted: { text: 'Accepted', color: 'bg-success-100 text-success-700' },
      declined: { text: 'Declined', color: 'bg-error-100 text-error-700' },
      completed: { text: 'Completed', color: 'bg-primary-100 text-primary-700' }
    };
    return badges[status] || { text: status, color: 'bg-neutral-100 text-neutral-700' };
  };

  if (loading) {
    return (
      <div className="trade-detail-page">
        <div className="container">
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="trade-detail-page">
        <div className="container">
          <div className="max-w-2xl mx-auto py-12">
            <div className="bg-error-50 border border-error-200 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-error-700 mb-2">
                {error || 'Trade Not Found'}
              </h2>
              <p className="text-error-600 mb-4">
                {error || 'The trade you\'re looking for doesn\'t exist or you don\'t have access to it.'}
              </p>
              <Button variant="primary" onClick={() => navigate('/trades')}>
                Back to Trades
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isProposer = user?._id === trade.proposer?._id;
  const isReceiver = user?._id === trade.receiver?._id;
  const otherUser = isProposer ? trade.receiver : trade.proposer;
  const statusBadge = getStatusBadge(trade.status);

  return (
    <div className="trade-detail-page">
      <div className="container max-w-5xl mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/trades')}
          className="flex items-center gap-2 text-neutral-600 hover:text-primary-500 mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Trades
        </button>

        {/* Trade Header */}
        <div className="bg-white rounded-xl shadow-card p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Trade Details
              </h1>
              <p className="text-neutral-600">
                {isProposer ? 'You proposed this trade' : 'Trade proposed by'} {isProposer ? '' : otherUser?.name}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-lg font-semibold ${statusBadge.color}`}>
              {statusBadge.text}
            </div>
          </div>

          {/* Timeline */}
          <div className="border-t border-neutral-200 pt-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-neutral-500">Proposed</span>
                <p className="font-medium text-neutral-900">{formatDate(trade.proposedAt)}</p>
              </div>
              {trade.respondedAt && (
                <div>
                  <span className="text-neutral-500">Responded</span>
                  <p className="font-medium text-neutral-900">{formatDate(trade.respondedAt)}</p>
                </div>
              )}
              {trade.completedAt && (
                <div>
                  <span className="text-neutral-500">Completed</span>
                  <p className="font-medium text-neutral-900">{formatDate(trade.completedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Books Exchange */}
        <div className="bg-white rounded-xl shadow-card p-6 mb-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-6">Books Exchange</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Offered Book */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-semibold text-neutral-700">
                  {isProposer ? 'You Offer' : `${otherUser?.name} Offers`}
                </span>
              </div>
              <div className="border border-neutral-200 rounded-lg p-4">
                <img
                  src={trade.offeredBook?.imageUrl}
                  alt={trade.offeredBook?.title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    e.target.src = '/placeholder-book.png';
                  }}
                />
                <h3 className="text-lg font-bold text-neutral-900 mb-1">
                  {trade.offeredBook?.title}
                </h3>
                <p className="text-neutral-600 mb-2">by {trade.offeredBook?.author}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                    {trade.offeredBook?.condition}
                  </span>
                  <span className="px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-sm font-medium">
                    {trade.offeredBook?.genre}
                  </span>
                </div>
                {trade.offeredBook?.description && (
                  <p className="text-sm text-neutral-600 line-clamp-3">
                    {trade.offeredBook.description}
                  </p>
                )}
              </div>
            </div>

            {/* Exchange Arrow */}
            <div className="hidden md:flex items-center justify-center">
              <div className="text-5xl text-primary-500">⇄</div>
            </div>
            <div className="md:hidden flex items-center justify-center py-4">
              <div className="text-4xl text-primary-500 rotate-90">⇄</div>
            </div>

            {/* Requested Book */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-semibold text-neutral-700">
                  {isProposer ? 'You Want' : `${otherUser?.name} Wants`}
                </span>
              </div>
              <div className="border border-neutral-200 rounded-lg p-4">
                <img
                  src={trade.requestedBook?.imageUrl}
                  alt={trade.requestedBook?.title}
                  className="w-full h-64 object-cover rounded-lg mb-4"
                  onError={(e) => {
                    e.target.src = '/placeholder-book.png';
                  }}
                />
                <h3 className="text-lg font-bold text-neutral-900 mb-1">
                  {trade.requestedBook?.title}
                </h3>
                <p className="text-neutral-600 mb-2">by {trade.requestedBook?.author}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                    {trade.requestedBook?.condition}
                  </span>
                  <span className="px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-sm font-medium">
                    {trade.requestedBook?.genre}
                  </span>
                </div>
                {trade.requestedBook?.description && (
                  <p className="text-sm text-neutral-600 line-clamp-3">
                    {trade.requestedBook.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trading Partner Info */}
        <div className="bg-white rounded-xl shadow-card p-6 mb-6">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Trading Partner</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {otherUser?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">{otherUser?.name}</h3>
              {otherUser?.city && otherUser?.privacySettings?.showCity !== false && (
                <p className="text-neutral-600 flex items-center gap-1">
                  <span>📍</span>
                  {otherUser.city}
                </p>
              )}
              {otherUser?.averageRating > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-warning-500">⭐</span>
                  <span className="font-medium text-neutral-700">
                    {otherUser.averageRating.toFixed(1)}
                  </span>
                  <span className="text-neutral-500 text-sm">
                    ({otherUser.ratingCount} {otherUser.ratingCount === 1 ? 'rating' : 'ratings'})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isReceiver && trade.status === 'proposed' && (
          <div className="bg-white rounded-xl shadow-card p-6">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">Respond to Trade</h2>
            <p className="text-neutral-600 mb-6">
              Review the trade details above and decide whether to accept or decline this proposal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAcceptTrade}
                disabled={actionLoading}
                className="flex-1"
              >
                {actionLoading ? <Spinner size="sm" /> : '✓ Accept Trade'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleDeclineTrade}
                disabled={actionLoading}
                className="flex-1 border-error-500 text-error-600 hover:bg-error-50"
              >
                {actionLoading ? <Spinner size="sm" /> : '✗ Decline Trade'}
              </Button>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {trade.status === 'accepted' && (
          <div className="bg-success-50 border border-success-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">✓</div>
              <div>
                <h3 className="text-lg font-semibold text-success-800 mb-2">
                  Trade Accepted!
                </h3>
                <p className="text-success-700">
                  This trade has been accepted. You can now communicate with {otherUser?.name} to arrange the exchange.
                  Once the trade is complete, you can mark it as completed.
                </p>
              </div>
            </div>
          </div>
        )}

        {trade.status === 'declined' && (
          <div className="bg-error-50 border border-error-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">✗</div>
              <div>
                <h3 className="text-lg font-semibold text-error-800 mb-2">
                  Trade Declined
                </h3>
                <p className="text-error-700">
                  This trade proposal was declined. You can browse for other books or propose different trades.
                </p>
              </div>
            </div>
          </div>
        )}

        {trade.status === 'completed' && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🎉</div>
              <div>
                <h3 className="text-lg font-semibold text-primary-800 mb-2">
                  Trade Completed!
                </h3>
                <p className="text-primary-700">
                  This trade has been successfully completed. Don't forget to rate your trading partner!
                </p>
              </div>
            </div>
          </div>
        )}

        {isProposer && trade.status === 'proposed' && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">⏳</div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                  Waiting for Response
                </h3>
                <p className="text-neutral-700">
                  Your trade proposal is pending. {otherUser?.name} will review it and respond soon.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeDetailView;
