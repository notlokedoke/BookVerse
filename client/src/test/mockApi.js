import { vi } from 'vitest';
import axios from 'axios';

// Mock axios module
vi.mock('axios');

/**
 * Create a mock axios response
 * @param {*} data - Response data
 * @param {number} status - HTTP status code
 * @returns {Object} Mock axios response
 */
export const createMockResponse = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});

/**
 * Create a mock axios error
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {*} data - Error response data
 * @returns {Object} Mock axios error
 */
export const createMockError = (message, status = 400, data = null) => {
  const error = new Error(message);
  error.response = {
    data: data || {
      success: false,
      error: {
        message,
        code: 'ERROR',
      },
    },
    status,
    statusText: 'Error',
    headers: {},
    config: {},
  };
  return error;
};

/**
 * Mock successful API responses
 */
export const mockApiSuccess = {
  // Auth endpoints
  register: (userData) => {
    axios.post.mockResolvedValueOnce(
      createMockResponse({
        success: true,
        data: {
          user: {
            _id: '123',
            name: userData.name,
            email: userData.email,
            city: userData.city,
          },
        },
      })
    );
  },

  login: (token = 'mock-jwt-token', user = null) => {
    axios.post.mockResolvedValueOnce(
      createMockResponse({
        success: true,
        data: {
          token,
          user: user || {
            _id: '123',
            name: 'Test User',
            email: 'test@example.com',
            city: 'Test City',
          },
        },
      })
    );
  },

  getCurrentUser: (user = null) => {
    axios.get.mockResolvedValueOnce(
      createMockResponse({
        success: true,
        data: user || {
          _id: '123',
          name: 'Test User',
          email: 'test@example.com',
          city: 'Test City',
        },
      })
    );
  },

  // Book endpoints
  getBooks: (books = []) => {
    axios.get.mockResolvedValueOnce(
      createMockResponse({
        success: true,
        data: books,
        pagination: {
          total: books.length,
          page: 1,
          pages: 1,
        },
      })
    );
  },

  createBook: (bookData) => {
    axios.post.mockResolvedValueOnce(
      createMockResponse({
        success: true,
        data: {
          _id: '456',
          ...bookData,
          owner: '123',
          createdAt: new Date().toISOString(),
        },
      })
    );
  },

  updateBook: (bookData) => {
    axios.put.mockResolvedValueOnce(
      createMockResponse({
        success: true,
        data: bookData,
      })
    );
  },

  deleteBook: () => {
    axios.delete.mockResolvedValueOnce(
      createMockResponse({
        success: true,
        message: 'Book deleted successfully',
      })
    );
  },

  // Trade endpoints
  getTrades: (trades = []) => {
    axios.get.mockResolvedValueOnce(
      createMockResponse({
        success: true,
        data: trades,
      })
    );
  },

  proposeTrade: (tradeData) => {
    axios.post.mockResolvedValueOnce(
      createMockResponse({
        success: true,
        data: {
          _id: '789',
          ...tradeData,
          status: 'proposed',
          createdAt: new Date().toISOString(),
        },
      })
    );
  },

  acceptTrade: (tradeId) => {
    axios.put.mockResolvedValueOnce(
      createMockResponse({
        success: true,
        data: {
          _id: tradeId,
          status: 'accepted',
        },
      })
    );
  },

  // Wishlist endpoints
  getWishlist: (items = []) => {
    axios.get.mockResolvedValueOnce(
      createMockResponse({
        success: true,
        data: items,
      })
    );
  },

  addToWishlist: (itemData) => {
    axios.post.mockResolvedValueOnce(
      createMockResponse({
        success: true,
        data: {
          _id: '101',
          ...itemData,
          user: '123',
          createdAt: new Date().toISOString(),
        },
      })
    );
  },

  // Rating endpoints
  submitRating: (ratingData) => {
    axios.post.mockResolvedValueOnce(
      createMockResponse({
        success: true,
        data: {
          _id: '202',
          ...ratingData,
          createdAt: new Date().toISOString(),
        },
      })
    );
  },

  // Notification endpoints
  getNotifications: (notifications = []) => {
    axios.get.mockResolvedValueOnce(
      createMockResponse({
        success: true,
        data: notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
      })
    );
  },
};

/**
 * Mock API errors
 */
export const mockApiError = {
  // Auth errors
  invalidCredentials: () => {
    axios.post.mockRejectedValueOnce(
      createMockError('Invalid credentials', 401)
    );
  },

  duplicateEmail: () => {
    axios.post.mockRejectedValueOnce(
      createMockError('Email already exists', 409)
    );
  },

  unauthorized: () => {
    axios.get.mockRejectedValueOnce(
      createMockError('Unauthorized', 401)
    );
  },

  // General errors
  notFound: () => {
    axios.get.mockRejectedValueOnce(
      createMockError('Resource not found', 404)
    );
  },

  forbidden: () => {
    axios.put.mockRejectedValueOnce(
      createMockError('Forbidden', 403)
    );
  },

  validationError: (message = 'Validation failed') => {
    axios.post.mockRejectedValueOnce(
      createMockError(message, 400)
    );
  },

  networkError: () => {
    const error = new Error('Network Error');
    error.isAxiosError = true;
    axios.post.mockRejectedValueOnce(error);
  },
};

/**
 * Reset all axios mocks
 */
export const resetApiMocks = () => {
  vi.clearAllMocks();
};

export default {
  mockApiSuccess,
  mockApiError,
  createMockResponse,
  createMockError,
  resetApiMocks,
};
