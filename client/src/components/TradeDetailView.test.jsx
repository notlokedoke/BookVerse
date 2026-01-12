import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TradeDetailView from './TradeDetailView';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

// Mock the useParams hook
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'trade123' }),
    useNavigate: () => vi.fn()
  };
});

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    defaults: {
      headers: {
        common: {}
      }
    }
  }
}));

// Mock ChatBox component
vi.mock('./ChatBox', () => ({
  default: ({ tradeId, otherUserName }) => (
    <div data-testid="chat-box">
      <div>Trade ID: {tradeId}</div>
      <div>Other User: {otherUserName}</div>
    </div>
  )
}));

const mockUser = {
  _id: 'user123',
  name: 'Test User',
  email: 'test@example.com'
};

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          {component}
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('TradeDetailView - Chat Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
    global.fetch = vi.fn();
  });

  it('should show ChatBox for accepted trades', async () => {
    const acceptedTrade = {
      _id: 'trade123',
      status: 'accepted',
      proposer: { _id: 'user456', name: 'Other User', city: 'New York' },
      receiver: { _id: 'user123', name: 'Test User', city: 'Boston' },
      requestedBook: {
        _id: 'book1',
        title: 'Book 1',
        author: 'Author 1',
        condition: 'Good',
        genre: 'Fiction',
        imageUrl: 'http://example.com/book1.jpg'
      },
      offeredBook: {
        _id: 'book2',
        title: 'Book 2',
        author: 'Author 2',
        condition: 'Like New',
        genre: 'Mystery',
        imageUrl: 'http://example.com/book2.jpg'
      },
      proposedAt: new Date().toISOString()
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [acceptedTrade]
      })
    });

    renderWithProviders(<TradeDetailView />);

    await waitFor(() => {
      expect(screen.getByTestId('chat-box')).toBeInTheDocument();
    });

    expect(screen.getByText('Trade ID: trade123')).toBeInTheDocument();
    expect(screen.getByText('Other User: Other User')).toBeInTheDocument();
  });

  it('should NOT show ChatBox for proposed trades', async () => {
    const proposedTrade = {
      _id: 'trade123',
      status: 'proposed',
      proposer: { _id: 'user123', name: 'Test User', city: 'Boston' },
      receiver: { _id: 'user456', name: 'Other User', city: 'New York' },
      requestedBook: {
        _id: 'book1',
        title: 'Book 1',
        author: 'Author 1',
        condition: 'Good',
        genre: 'Fiction',
        imageUrl: 'http://example.com/book1.jpg'
      },
      offeredBook: {
        _id: 'book2',
        title: 'Book 2',
        author: 'Author 2',
        condition: 'Like New',
        genre: 'Mystery',
        imageUrl: 'http://example.com/book2.jpg'
      },
      proposedAt: new Date().toISOString()
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [proposedTrade]
      })
    });

    renderWithProviders(<TradeDetailView />);

    await waitFor(() => {
      expect(screen.getByText('Waiting for Response')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('chat-box')).not.toBeInTheDocument();
  });

  it('should NOT show ChatBox for declined trades', async () => {
    const declinedTrade = {
      _id: 'trade123',
      status: 'declined',
      proposer: { _id: 'user123', name: 'Test User', city: 'Boston' },
      receiver: { _id: 'user456', name: 'Other User', city: 'New York' },
      requestedBook: {
        _id: 'book1',
        title: 'Book 1',
        author: 'Author 1',
        condition: 'Good',
        genre: 'Fiction',
        imageUrl: 'http://example.com/book1.jpg'
      },
      offeredBook: {
        _id: 'book2',
        title: 'Book 2',
        author: 'Author 2',
        condition: 'Like New',
        genre: 'Mystery',
        imageUrl: 'http://example.com/book2.jpg'
      },
      proposedAt: new Date().toISOString(),
      respondedAt: new Date().toISOString()
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [declinedTrade]
      })
    });

    renderWithProviders(<TradeDetailView />);

    await waitFor(() => {
      expect(screen.getByText('Trade Declined')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('chat-box')).not.toBeInTheDocument();
  });

  it('should NOT show ChatBox for completed trades', async () => {
    const completedTrade = {
      _id: 'trade123',
      status: 'completed',
      proposer: { _id: 'user123', name: 'Test User', city: 'Boston' },
      receiver: { _id: 'user456', name: 'Other User', city: 'New York' },
      requestedBook: {
        _id: 'book1',
        title: 'Book 1',
        author: 'Author 1',
        condition: 'Good',
        genre: 'Fiction',
        imageUrl: 'http://example.com/book1.jpg'
      },
      offeredBook: {
        _id: 'book2',
        title: 'Book 2',
        author: 'Author 2',
        condition: 'Like New',
        genre: 'Mystery',
        imageUrl: 'http://example.com/book2.jpg'
      },
      proposedAt: new Date().toISOString(),
      respondedAt: new Date().toISOString(),
      completedAt: new Date().toISOString()
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [completedTrade]
      })
    });

    renderWithProviders(<TradeDetailView />);

    await waitFor(() => {
      expect(screen.getByText('Trade Completed!')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('chat-box')).not.toBeInTheDocument();
  });

  it('should pass correct props to ChatBox', async () => {
    const acceptedTrade = {
      _id: 'trade123',
      status: 'accepted',
      proposer: { _id: 'user456', name: 'Alice Smith', city: 'New York' },
      receiver: { _id: 'user123', name: 'Test User', city: 'Boston' },
      requestedBook: {
        _id: 'book1',
        title: 'Book 1',
        author: 'Author 1',
        condition: 'Good',
        genre: 'Fiction',
        imageUrl: 'http://example.com/book1.jpg'
      },
      offeredBook: {
        _id: 'book2',
        title: 'Book 2',
        author: 'Author 2',
        condition: 'Like New',
        genre: 'Mystery',
        imageUrl: 'http://example.com/book2.jpg'
      },
      proposedAt: new Date().toISOString()
    };

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [acceptedTrade]
      })
    });

    renderWithProviders(<TradeDetailView />);

    await waitFor(() => {
      expect(screen.getByTestId('chat-box')).toBeInTheDocument();
    });

    // Verify the correct trade ID is passed
    expect(screen.getByText('Trade ID: trade123')).toBeInTheDocument();
    
    // Verify the correct other user name is passed
    expect(screen.getByText('Other User: Alice Smith')).toBeInTheDocument();
  });
});
