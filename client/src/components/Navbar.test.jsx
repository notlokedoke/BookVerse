import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Navbar from './Navbar';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  };
});

// Mock AuthContext
let mockAuthState = {
  user: null,
  isAuthenticated: false,
  logout: vi.fn(),
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

// Mock ToastContext
vi.mock('../context/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

const renderNavbar = (authProps = {}) => {
  mockAuthState = {
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
    ...authProps,
  };

  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>
  );
};

describe('Navbar - Unified Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Common Features', () => {
    it('renders BookVerse logo', () => {
      renderNavbar();
      expect(screen.getByText('BookVerse')).toBeInTheDocument();
    });

    it('logo links to home when not authenticated', () => {
      renderNavbar({ isAuthenticated: false });
      const logo = screen.getByText('BookVerse').closest('a');
      expect(logo).toHaveAttribute('href', '/');
    });

    it('logo links to dashboard when authenticated', () => {
      renderNavbar({ isAuthenticated: true, user: { name: 'John' } });
      const logo = screen.getByText('BookVerse').closest('a');
      expect(logo).toHaveAttribute('href', '/dashboard');
    });

    it('has mobile menu button', () => {
      renderNavbar();
      const menuButton = screen.getByLabelText('Toggle menu');
      expect(menuButton).toBeInTheDocument();
    });

    it('toggles mobile menu when button is clicked', () => {
      renderNavbar();
      const menuButton = screen.getByLabelText('Toggle menu');
      
      // Mobile menu should not be visible initially
      expect(screen.queryByText('Browse Books')).not.toBeVisible();
      
      // Click to open
      fireEvent.click(menuButton);
      
      // Mobile menu should be visible
      expect(screen.getByText('Browse Books')).toBeVisible();
    });
  });

  describe('Public Navigation (Not Authenticated)', () => {
    it('shows public navigation links', () => {
      renderNavbar({ isAuthenticated: false });
      
      expect(screen.getByText('Browse Books')).toBeInTheDocument();
      expect(screen.getByText('About')).toBeInTheDocument();
      expect(screen.getByText('How It Works')).toBeInTheDocument();
    });

    it('shows Sign In and Get Started buttons', () => {
      renderNavbar({ isAuthenticated: false });
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('Sign In button links to login page', () => {
      renderNavbar({ isAuthenticated: false });
      const signInLink = screen.getByText('Sign In').closest('a');
      expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('Get Started button links to register page', () => {
      renderNavbar({ isAuthenticated: false });
      const getStartedLink = screen.getByText('Get Started').closest('a');
      expect(getStartedLink).toHaveAttribute('href', '/register');
    });

    it('does not show authenticated user features', () => {
      renderNavbar({ isAuthenticated: false });
      
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('My Books')).not.toBeInTheDocument();
      expect(screen.queryByText('Trades')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated Navigation', () => {
    const mockUser = { name: 'John Doe', email: 'john@example.com' };

    it('shows authenticated navigation links', () => {
      renderNavbar({ isAuthenticated: true, user: mockUser });
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Browse')).toBeInTheDocument();
      expect(screen.getByText('My Books')).toBeInTheDocument();
      expect(screen.getByText('Trades')).toBeInTheDocument();
    });

    it('displays user name and avatar', () => {
      renderNavbar({ isAuthenticated: true, user: mockUser });
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('J')).toBeInTheDocument(); // Avatar initial
    });

    it('shows notification bell', () => {
      renderNavbar({ isAuthenticated: true, user: mockUser });
      
      const notificationButton = screen.getByRole('button', { name: '' });
      expect(notificationButton).toBeInTheDocument();
    });

    it('opens profile dropdown when clicked', () => {
      renderNavbar({ isAuthenticated: true, user: mockUser });
      
      const profileButton = screen.getByText('John Doe').closest('button');
      fireEvent.click(profileButton);
      
      expect(screen.getByText('My Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Wishlist')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
    });

    it('displays user email in profile dropdown', () => {
      renderNavbar({ isAuthenticated: true, user: mockUser });
      
      const profileButton = screen.getByText('John Doe').closest('button');
      fireEvent.click(profileButton);
      
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('calls logout when Sign Out is clicked', () => {
      const mockLogout = vi.fn();
      renderNavbar({ isAuthenticated: true, user: mockUser, logout: mockLogout });
      
      const profileButton = screen.getByText('John Doe').closest('button');
      fireEvent.click(profileButton);
      
      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);
      
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('does not show public navigation features', () => {
      renderNavbar({ isAuthenticated: true, user: mockUser });
      
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
      expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
      expect(screen.queryByText('How It Works')).not.toBeInTheDocument();
    });

    it('has correct navigation link hrefs', () => {
      renderNavbar({ isAuthenticated: true, user: mockUser });
      
      expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/dashboard');
      expect(screen.getByText('Browse').closest('a')).toHaveAttribute('href', '/browse');
      expect(screen.getByText('My Books').closest('a')).toHaveAttribute('href', '/my-books');
      expect(screen.getByText('Trades').closest('a')).toHaveAttribute('href', '/trades');
    });
  });

  describe('Mobile Menu', () => {
    it('shows public links in mobile menu when not authenticated', () => {
      renderNavbar({ isAuthenticated: false });
      
      const menuButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuButton);
      
      expect(screen.getByText('Browse Books')).toBeVisible();
      expect(screen.getByText('About')).toBeVisible();
      expect(screen.getByText('How It Works')).toBeVisible();
    });

    it('shows authenticated links in mobile menu when authenticated', () => {
      renderNavbar({ isAuthenticated: true, user: { name: 'John', email: 'john@example.com' } });
      
      const menuButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuButton);
      
      expect(screen.getByText('Dashboard')).toBeVisible();
      expect(screen.getByText('My Books')).toBeVisible();
    });

    it('closes mobile menu when a link is clicked', () => {
      renderNavbar({ isAuthenticated: false });
      
      const menuButton = screen.getByLabelText('Toggle menu');
      fireEvent.click(menuButton);
      
      const browseLink = screen.getByText('Browse Books');
      fireEvent.click(browseLink);
      
      // Menu should close (links should not be visible)
      expect(screen.queryByText('About')).not.toBeVisible();
    });
  });

  describe('Responsive Behavior', () => {
    it('hides desktop navigation on mobile', () => {
      renderNavbar({ isAuthenticated: false });
      
      const desktopNav = screen.getByText('Browse Books').closest('div');
      expect(desktopNav).toHaveClass('hidden', 'md:flex');
    });

    it('hides mobile menu button on desktop', () => {
      renderNavbar();
      
      const menuButton = screen.getByLabelText('Toggle menu');
      expect(menuButton).toHaveClass('md:hidden');
    });
  });
});
