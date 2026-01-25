import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import TradeCard from './TradeCard';

// Mock useAuth hook
vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: {
        _id: 'user123',
        name: 'Test User'
      }
    })
  };
});

const mockTrade = {
  _id: 'trade123',
  proposer: {
    _id: 'user123',
    name: 'Test User',
    city: 'New York',
    privacySettings: { showCity: true }
  },
  receiver: {
    _id: 'user456',
    name: 'Other User',
    city: 'Los Angeles',
    privacySettings: { showCity: true }
  },
  requestedBook: {
    _id: 'book123',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    condition: 'Good',
    imageUrl: 'https://example.com/gatsby.jpg'
  },
  offeredBook: {
    _id: 'book456',
    title: '1984',
    author: 'George Orwell',
    condition: 'Like New',
    imageUrl: 'https://example.com/1984.jpg'
  },
  status: 'proposed',
  createdAt: '2025-01-20T10:00:00Z'
};

describe('TradeCard', () => {
  it('renders trade card with trade information', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TradeCard trade={mockTrade} />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Outgoing Trade')).toBeInTheDocument();
    expect(screen.getByText('Other User')).toBeInTheDocument();
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    expect(screen.getByText('1984')).toBeInTheDocument();
  });

  it('displays correct status badge', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TradeCard trade={mockTrade} />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows book conditions', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TradeCard trade={mockTrade} />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Like New')).toBeInTheDocument();
  });

  it('returns null when trade is not provided', () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <TradeCard trade={null} />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(container.firstChild).toBeNull();
  });
});
