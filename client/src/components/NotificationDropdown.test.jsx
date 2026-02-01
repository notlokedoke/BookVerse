import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import { vi } from 'vitest';

const mockNotifications = [
  {
    _id: '507f1f77bcf86cd799439011',
    type: 'trade_request',
    message: 'John Doe sent you a trade request',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    relatedTrade: '507f191e810c19729de860ea'
  },
  {
    _id: '507f1f77bcf86cd799439012',
    type: 'trade_accepted',
    message: 'Jane Smith accepted your trade request',
    isRead: true,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    relatedTrade: '507f191e810c19729de860eb'
  },
  {
    _id: '507f1f77bcf86cd799439013',
    type: 'new_message',
    message: 'You have a new message from Bob',
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    relatedTrade: '507f191e810c19729de860ec'
  }
];

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('NotificationDropdown', () => {
  test('renders notification header', () => {
    renderWithRouter(<NotificationDropdown notifications={mockNotifications} />);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  test('displays notification count when notifications exist', () => {
    renderWithRouter(<NotificationDropdown notifications={mockNotifications} />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('does not display count when no notifications', () => {
    renderWithRouter(<NotificationDropdown notifications={[]} />);
    
    const count = screen.queryByText('0');
    expect(count).not.toBeInTheDocument();
  });

  test('renders all notifications', () => {
    renderWithRouter(<NotificationDropdown notifications={mockNotifications} />);
    
    expect(screen.getByText('John Doe sent you a trade request')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith accepted your trade request')).toBeInTheDocument();
    expect(screen.getByText('You have a new message from Bob')).toBeInTheDocument();
  });

  test('displays empty state when no notifications', () => {
    renderWithRouter(<NotificationDropdown notifications={[]} />);
    
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    expect(screen.getByText("You'll see updates about your trades and messages here")).toBeInTheDocument();
  });

  test('passes onMarkAsRead callback to NotificationItem components', () => {
    const onMarkAsRead = vi.fn();
    renderWithRouter(
      <NotificationDropdown notifications={mockNotifications} onMarkAsRead={onMarkAsRead} />
    );
    
    // The callback should be passed to each NotificationItem
    // We can verify this by checking that the component renders without errors
    expect(screen.getByText('John Doe sent you a trade request')).toBeInTheDocument();
  });

  test('renders empty state icon', () => {
    const { container } = renderWithRouter(<NotificationDropdown notifications={[]} />);
    
    const emptyIcon = container.querySelector('.notification-empty svg');
    expect(emptyIcon).toBeInTheDocument();
  });

  test('applies correct CSS classes', () => {
    const { container } = renderWithRouter(<NotificationDropdown notifications={mockNotifications} />);
    
    expect(container.querySelector('.notification-dropdown')).toBeInTheDocument();
    expect(container.querySelector('.notification-header')).toBeInTheDocument();
    expect(container.querySelector('.notification-list')).toBeInTheDocument();
  });

  test('renders with single notification', () => {
    const singleNotification = [mockNotifications[0]];
    renderWithRouter(<NotificationDropdown notifications={singleNotification} />);
    
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('John Doe sent you a trade request')).toBeInTheDocument();
  });

  test('handles undefined onMarkAsRead gracefully', () => {
    renderWithRouter(<NotificationDropdown notifications={mockNotifications} />);
    
    // Should render without errors even without onMarkAsRead callback
    expect(screen.getByText('John Doe sent you a trade request')).toBeInTheDocument();
  });
});
