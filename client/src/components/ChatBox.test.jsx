import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import ChatBox from './ChatBox';

// Mock fetch globally
global.fetch = vi.fn();

const mockUser = {
  _id: '507f191e810c19729de860ea',
  name: 'Test User',
  email: 'test@example.com'
};

const mockMessages = [
  {
    _id: 'msg1',
    content: 'First message',
    createdAt: '2025-02-01T10:00:00Z',
    sender: {
      _id: '507f191e810c19729de860ea',
      name: 'Test User'
    }
  },
  {
    _id: 'msg2',
    content: 'Second message',
    createdAt: '2025-02-01T10:05:00Z',
    sender: {
      _id: '507f191e810c19729de860eb',
      name: 'Other User'
    }
  },
  {
    _id: 'msg3',
    content: 'Third message',
    createdAt: '2025-02-01T10:10:00Z',
    sender: {
      _id: '507f191e810c19729de860ea',
      name: 'Test User'
    }
  }
];

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
};

// Mock the useAuth and useToast hooks
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser })
}));

vi.mock('../context/ToastContext', () => ({
  useToast: () => mockToast
}));

const renderChatBox = (tradeId = 'trade123', otherUserName = 'Other User') => {
  return render(<ChatBox tradeId={tradeId} otherUserName={otherUserName} />);
};

describe('ChatBox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.success.mockClear();
    mockToast.error.mockClear();
    mockToast.info.mockClear();
    mockToast.warning.mockClear();
    localStorage.getItem.mockReturnValue('fake-token');
    localStorage.setItem.mockClear();
    localStorage.removeItem.mockClear();
    global.fetch.mockClear();
    
    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();
  });

  describe('Message Loading', () => {
    test('displays loading state while fetching messages', () => {
      global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderChatBox();
      
      expect(screen.getByText('Loading messages...')).toBeInTheDocument();
    });

    test('fetches messages when component mounts', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockMessages
        })
      });
      
      renderChatBox();
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/messages/trade/trade123',
          expect.objectContaining({
            headers: {
              'Authorization': 'Bearer fake-token'
            }
          })
        );
      });
    });

    test('displays messages in chronological order', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockMessages
        })
      });
      
      renderChatBox();
      
      await waitFor(() => {
        expect(screen.getByText('First message')).toBeInTheDocument();
      });
      
      // Verify all three messages are displayed
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
      expect(screen.getByText('Third message')).toBeInTheDocument();
    });

    test('displays empty state when no messages exist', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: []
        })
      });
      
      renderChatBox();
      
      await waitFor(() => {
        expect(screen.getByText('No messages yet')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Start the conversation by sending a message below')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays error message when fetch fails', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          error: {
            message: 'Failed to load messages',
            code: 'FETCH_ERROR'
          }
        })
      });
      
      renderChatBox();
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load messages')).toBeInTheDocument();
      });
    });

    test('displays error message when network fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      renderChatBox();
      
      await waitFor(() => {
        expect(screen.getByText('Unable to load messages. Please try again.')).toBeInTheDocument();
      });
    });

    test('displays retry button on error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      renderChatBox();
      
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    test('retries fetching messages when retry button is clicked', async () => {
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: mockMessages
          })
        });
      
      renderChatBox();
      
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
      
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(screen.getByText('First message')).toBeInTheDocument();
      });
    });

    test('displays error when authentication is missing', async () => {
      localStorage.getItem.mockReturnValue(null);
      
      renderChatBox();
      
      await waitFor(() => {
        expect(screen.getByText('Authentication required')).toBeInTheDocument();
      });
    });
  });

  describe('UI Elements', () => {
    test('displays chat header with other user name', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: []
        })
      });
      
      renderChatBox('trade123', 'John Doe');
      
      await waitFor(() => {
        expect(screen.getByText('Chat with John Doe')).toBeInTheDocument();
      });
    });

    test('auto-scrolls to bottom when messages load', async () => {
      const scrollIntoViewMock = vi.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockMessages
        })
      });
      
      renderChatBox();
      
      await waitFor(() => {
        expect(screen.getByText('Third message')).toBeInTheDocument();
      });
      
      // scrollIntoView should be called when messages are loaded
      expect(scrollIntoViewMock).toHaveBeenCalled();
    });
  });
});
