import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import NotificationBell from './NotificationBell';

// Mock NotificationDropdown component
vi.mock('./NotificationDropdown', () => ({
  default: ({ notifications, onMarkAsRead }) => (
    <div data-testid="notification-dropdown">
      <div>Dropdown Content</div>
      {notifications.map(n => (
        <div key={n._id} data-testid={`notification-${n._id}`}>
          {n.message}
        </div>
      ))}
    </div>
  )
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('NotificationBell Component', () => {
  const mockNotifications = [
    {
      _id: '1',
      type: 'trade_request',
      message: 'You received a trade request',
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      type: 'new_message',
      message: 'You have a new message',
      isRead: false,
      createdAt: new Date().toISOString()
    }
  ];

  test('renders bell icon', () => {
    renderWithRouter(<NotificationBell unreadCount={0} notifications={[]} />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    expect(button).toBeInTheDocument();
  });

  test('displays unread count badge when count > 0', () => {
    renderWithRouter(<NotificationBell unreadCount={5} notifications={[]} />);
    
    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('notification-bell-badge');
  });

  test('does not display badge when count is 0', () => {
    renderWithRouter(<NotificationBell unreadCount={0} notifications={[]} />);
    
    const badge = screen.queryByText('0');
    expect(badge).not.toBeInTheDocument();
  });

  test('displays "99+" when count exceeds 99', () => {
    renderWithRouter(<NotificationBell unreadCount={150} notifications={[]} />);
    
    const badge = screen.getByText('99+');
    expect(badge).toBeInTheDocument();
  });

  test('opens dropdown when bell is clicked', () => {
    renderWithRouter(
      <NotificationBell 
        unreadCount={2} 
        notifications={mockNotifications}
      />
    );
    
    const button = screen.getByRole('button', { name: /notifications/i });
    
    // Dropdown should not be visible initially
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
    
    // Click to open
    fireEvent.click(button);
    
    // Dropdown should now be visible
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
  });

  test('closes dropdown when bell is clicked again', () => {
    renderWithRouter(
      <NotificationBell 
        unreadCount={2} 
        notifications={mockNotifications}
      />
    );
    
    const button = screen.getByRole('button', { name: /notifications/i });
    
    // Open dropdown
    fireEvent.click(button);
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    
    // Close dropdown
    fireEvent.click(button);
    expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
  });

  test('calls onOpen callback when dropdown is opened', () => {
    const onOpen = vi.fn();
    
    renderWithRouter(
      <NotificationBell 
        unreadCount={2} 
        notifications={mockNotifications}
        onOpen={onOpen}
      />
    );
    
    const button = screen.getByRole('button', { name: /notifications/i });
    
    fireEvent.click(button);
    
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test('does not call onOpen when closing dropdown', () => {
    const onOpen = vi.fn();
    
    renderWithRouter(
      <NotificationBell 
        unreadCount={2} 
        notifications={mockNotifications}
        onOpen={onOpen}
      />
    );
    
    const button = screen.getByRole('button', { name: /notifications/i });
    
    // Open
    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
    
    // Close
    fireEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1); // Still 1, not called again
  });

  test('closes dropdown when clicking outside', async () => {
    renderWithRouter(
      <NotificationBell 
        unreadCount={2} 
        notifications={mockNotifications}
      />
    );
    
    const button = screen.getByRole('button', { name: /notifications/i });
    
    // Open dropdown
    fireEvent.click(button);
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    await waitFor(() => {
      expect(screen.queryByTestId('notification-dropdown')).not.toBeInTheDocument();
    });
  });

  test('does not close dropdown when clicking inside', () => {
    renderWithRouter(
      <NotificationBell 
        unreadCount={2} 
        notifications={mockNotifications}
      />
    );
    
    const button = screen.getByRole('button', { name: /notifications/i });
    
    // Open dropdown
    fireEvent.click(button);
    const dropdown = screen.getByTestId('notification-dropdown');
    expect(dropdown).toBeInTheDocument();
    
    // Click inside dropdown
    fireEvent.mouseDown(dropdown);
    
    // Dropdown should still be visible
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
  });

  test('passes notifications to dropdown', () => {
    renderWithRouter(
      <NotificationBell 
        unreadCount={2} 
        notifications={mockNotifications}
      />
    );
    
    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);
    
    expect(screen.getByTestId('notification-1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-2')).toBeInTheDocument();
    expect(screen.getByText('You received a trade request')).toBeInTheDocument();
    expect(screen.getByText('You have a new message')).toBeInTheDocument();
  });

  test('passes onMarkAsRead to dropdown', () => {
    const onMarkAsRead = vi.fn();
    
    renderWithRouter(
      <NotificationBell 
        unreadCount={2} 
        notifications={mockNotifications}
        onMarkAsRead={onMarkAsRead}
      />
    );
    
    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);
    
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
  });

  test('has correct aria attributes', () => {
    renderWithRouter(<NotificationBell unreadCount={3} notifications={[]} />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    
    // Initially closed
    expect(button).toHaveAttribute('aria-expanded', 'false');
    
    // Open dropdown
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  test('badge has accessible label', () => {
    renderWithRouter(<NotificationBell unreadCount={5} notifications={[]} />);
    
    const badge = screen.getByLabelText('5 unread notifications');
    expect(badge).toBeInTheDocument();
  });

  test('handles empty notifications array', () => {
    renderWithRouter(<NotificationBell unreadCount={0} notifications={[]} />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);
    
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
  });

  test('stops event propagation on button click', () => {
    const parentClick = vi.fn();
    
    const { container } = renderWithRouter(
      <div onClick={parentClick}>
        <NotificationBell unreadCount={2} notifications={[]} />
      </div>
    );
    
    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);
    
    expect(parentClick).not.toHaveBeenCalled();
  });
});
