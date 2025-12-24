import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';

// Mock the useAuth hook
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      name: 'John Doe',
      email: 'john@example.com'
    },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn()
  })
}));

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <DashboardPage />
    </BrowserRouter>
  );
};

describe('DashboardPage', () => {
  test('renders welcome message with user name', () => {
    renderDashboard();
    expect(screen.getByText('Welcome back, John Doe')).toBeInTheDocument();
  });

  test('renders main navigation links', () => {
    renderDashboard();
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(screen.getByText('Browse')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  test('renders BookVerse logo that links to home', () => {
    renderDashboard();
    const logoLink = screen.getByRole('link', { name: /bookverse/i });
    expect(logoLink).toHaveAttribute('href', '/');
  });

  test('renders quick action cards', () => {
    renderDashboard();
    // Check for the quick actions section specifically
    expect(screen.getByText('Discover books in your area')).toBeInTheDocument();
    expect(screen.getByText('Manage your collection')).toBeInTheDocument();
    expect(screen.getByText('Active Trades')).toBeInTheDocument();
  });

  test('renders stats section', () => {
    renderDashboard();
    expect(screen.getByText('Your BookVerse')).toBeInTheDocument();
    expect(screen.getByText('Books Listed')).toBeInTheDocument();
    expect(screen.getByText('Completed Trades')).toBeInTheDocument();
    expect(screen.getByText('Pending Requests')).toBeInTheDocument();
  });

  test('renders recent activity section', () => {
    renderDashboard();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText(/New trade request for 'Harry Potter'/)).toBeInTheDocument();
  });

  test('renders call to action section', () => {
    renderDashboard();
    expect(screen.getByText('Ready to trade?')).toBeInTheDocument();
    expect(screen.getByText('Find your next favorite book or share one with the community')).toBeInTheDocument();
  });
});