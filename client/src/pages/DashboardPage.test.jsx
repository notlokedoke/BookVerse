import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import DashboardPage from './DashboardPage';

const mockUseAuth = vi.fn();
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  showToast: vi.fn()
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => mockToast
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn()
  }
}));

const renderDashboard = () => {
  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <DashboardPage />
    </BrowserRouter>
  );
};

const mockSuccessfulDashboardRequests = () => {
  axios.get
    .mockResolvedValueOnce({ data: { data: [] } })
    .mockResolvedValueOnce({ data: { data: { books: [] } } })
    .mockResolvedValueOnce({ data: { data: { books: [] } } });
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'test-token');
    mockUseAuth.mockReturnValue({
      user: {
        _id: 'user-1',
        userId: 'user-1',
        name: 'John Doe',
        email: 'john@example.com'
      },
      isAuthenticated: true
    });
  });

  test('renders greeting and browse action after dashboard data loads', async () => {
    mockSuccessfulDashboardRequests();

    renderDashboard();

    expect(await screen.findByRole('heading', { name: /john!/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /browse books/i })).toHaveAttribute('href', '/browse');
  });

  test('renders stats cards and analytics labels', async () => {
    mockSuccessfulDashboardRequests();

    renderDashboard();

    expect(await screen.findByText('Trading Analytics')).toBeInTheDocument();
    expect(screen.getByText('Books Listed')).toBeInTheDocument();
    expect(screen.getByText('Active Trades')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  test('renders new user empty state when there are no books or trades', async () => {
    mockSuccessfulDashboardRequests();

    renderDashboard();

    expect(await screen.findByRole('heading', { name: 'Welcome to BookVerse!' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add your first book/i })).toHaveAttribute('href', '/books/create');
  });

  test('shows toast error when dashboard data request fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network error'));

    renderDashboard();

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to load dashboard data');
    });
  });
});
