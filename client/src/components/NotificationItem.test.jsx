import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotificationItem from './NotificationItem';
import { vi } from 'vitest';

const mockNotification = {
  _id: '507f1f77bcf86cd799439011',
  type: 'trade_request',
  message: 'John Doe sent you a trade request',
  isRead: false,
  createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
  relatedTrade: '507f191e810c19729de860ea'
};

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('NotificationItem', () => {
  test('renders notification message correctly', () => {
    renderWithRouter(<NotificationItem notification={mockNotification} />);
    
    expect(screen.getByText('John Doe sent you a trade request')).toBeInTheDocument();
  });

  test('displays correct icon for trade_request type', () => {
    const { container } = renderWithRouter(<NotificationItem notification={mockNotification} />);
    
    const icon = container.querySelector('.notification-icon svg');
    expect(icon).toBeInTheDocument();
  });

  test('displays relative time correctly', () => {
    renderWithRouter(<NotificationItem notification={mockNotification} />);
    
    expect(screen.getByText('2m ago')).toBeInTheDocument();
  });

  test('highlights unread notifications', () => {
    const { container } = renderWithRouter(<NotificationItem notification={mockNotification} />);
    
    const item = container.querySelector('.notification-item');
    expect(item).toHaveClass('unread');
  });

  test('does not highlight read notifications', () => {
    const readNotification = { ...mockNotification, isRead: true };
    const { container } = renderWithRouter(<NotificationItem notification={readNotification} />);
    
    const item = container.querySelector('.notification-item');
    expect(item).not.toHaveClass('unread');
  });

  test('shows badge for unread notifications', () => {
    const { container } = renderWithRouter(<NotificationItem notification={mockNotification} />);
    
    const badge = container.querySelector('.notification-badge');
    expect(badge).toBeInTheDocument();
  });

  test('does not show badge for read notifications', () => {
    const readNotification = { ...mockNotification, isRead: true };
    const { container } = renderWithRouter(<NotificationItem notification={readNotification} />);
    
    const badge = container.querySelector('.notification-badge');
    expect(badge).not.toBeInTheDocument();
  });

  test('calls onMarkAsRead when unread notification is clicked', () => {
    const onMarkAsRead = vi.fn();
    renderWithRouter(
      <NotificationItem notification={mockNotification} onMarkAsRead={onMarkAsRead} />
    );
    
    const item = screen.getByText('John Doe sent you a trade request').closest('a');
    fireEvent.click(item);
    
    expect(onMarkAsRead).toHaveBeenCalledWith(mockNotification._id);
  });

  test('does not call onMarkAsRead when read notification is clicked', () => {
    const onMarkAsRead = vi.fn();
    const readNotification = { ...mockNotification, isRead: true };
    renderWithRouter(
      <NotificationItem notification={readNotification} onMarkAsRead={onMarkAsRead} />
    );
    
    const item = screen.getByText('John Doe sent you a trade request').closest('a');
    fireEvent.click(item);
    
    expect(onMarkAsRead).not.toHaveBeenCalled();
  });

  test('links to trade detail page when relatedTrade exists', () => {
    renderWithRouter(<NotificationItem notification={mockNotification} />);
    
    const link = screen.getByText('John Doe sent you a trade request').closest('a');
    expect(link).toHaveAttribute('href', '/trades/507f191e810c19729de860ea');
  });

  test('displays "just now" for very recent notifications', () => {
    const recentNotification = {
      ...mockNotification,
      createdAt: new Date(Date.now() - 30 * 1000).toISOString() // 30 seconds ago
    };
    renderWithRouter(<NotificationItem notification={recentNotification} />);
    
    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  test('displays hours for notifications from hours ago', () => {
    const hoursAgoNotification = {
      ...mockNotification,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
    };
    renderWithRouter(<NotificationItem notification={hoursAgoNotification} />);
    
    expect(screen.getByText('3h ago')).toBeInTheDocument();
  });

  test('displays days for notifications from days ago', () => {
    const daysAgoNotification = {
      ...mockNotification,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    };
    renderWithRouter(<NotificationItem notification={daysAgoNotification} />);
    
    expect(screen.getByText('2d ago')).toBeInTheDocument();
  });

  test('renders correct icon for different notification types', () => {
    const types = ['trade_request', 'trade_accepted', 'trade_declined', 'trade_completed', 'new_message'];
    
    types.forEach((type) => {
      const notification = { ...mockNotification, type };
      const { container, unmount } = renderWithRouter(<NotificationItem notification={notification} />);
      
      const icon = container.querySelector('.notification-icon svg');
      expect(icon).toBeInTheDocument();
      
      unmount();
    });
  });
});
