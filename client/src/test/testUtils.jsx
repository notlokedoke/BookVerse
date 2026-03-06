import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { MockAuthProvider, createMockAuthContext } from './mockAuthContext';

/**
 * Custom render function that includes common providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @param {Object} options.authValue - Mock auth context value
 * @param {boolean} options.withRouter - Whether to wrap with BrowserRouter
 * @param {Object} options.renderOptions - Additional render options
 * @returns {Object} Render result with utilities
 */
export const renderWithProviders = (
  ui,
  {
    authValue = createMockAuthContext(),
    withRouter = true,
    ...renderOptions
  } = {}
) => {
  const Wrapper = ({ children }) => {
    let wrapped = <MockAuthProvider value={authValue}>{children}</MockAuthProvider>;
    
    if (withRouter) {
      wrapped = <BrowserRouter>{wrapped}</BrowserRouter>;
    }
    
    return wrapped;
  };

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    authValue,
  };
};

/**
 * Create mock book data
 * @param {Object} overrides - Override default properties
 * @returns {Object} Mock book object
 */
export const createMockBook = (overrides = {}) => ({
  _id: '456',
  title: 'Test Book',
  author: 'Test Author',
  genre: 'Fiction',
  condition: 'Good',
  description: 'A test book description',
  imageUrl: 'https://example.com/book.jpg',
  isbn: '1234567890',
  owner: {
    _id: '123',
    name: 'Book Owner',
    city: 'Test City',
  },
  isAvailable: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock trade data
 * @param {Object} overrides - Override default properties
 * @returns {Object} Mock trade object
 */
export const createMockTrade = (overrides = {}) => ({
  _id: '789',
  proposer: {
    _id: '123',
    name: 'Proposer',
    email: 'proposer@example.com',
  },
  receiver: {
    _id: '456',
    name: 'Receiver',
    email: 'receiver@example.com',
  },
  requestedBook: createMockBook({ _id: 'book1', title: 'Requested Book' }),
  offeredBook: createMockBook({ _id: 'book2', title: 'Offered Book' }),
  status: 'proposed',
  proposedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock wishlist item
 * @param {Object} overrides - Override default properties
 * @returns {Object} Mock wishlist item
 */
export const createMockWishlistItem = (overrides = {}) => ({
  _id: '101',
  user: '123',
  title: 'Wishlist Book',
  author: 'Wishlist Author',
  isbn: '9876543210',
  notes: 'Looking for this book',
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock rating data
 * @param {Object} overrides - Override default properties
 * @returns {Object} Mock rating object
 */
export const createMockRating = (overrides = {}) => ({
  _id: '202',
  trade: '789',
  rater: {
    _id: '123',
    name: 'Rater',
  },
  ratedUser: '456',
  stars: 5,
  comment: 'Great trade!',
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock notification data
 * @param {Object} overrides - Override default properties
 * @returns {Object} Mock notification object
 */
export const createMockNotification = (overrides = {}) => ({
  _id: '303',
  recipient: '123',
  type: 'trade_request',
  message: 'You have a new trade request',
  isRead: false,
  relatedTrade: '789',
  relatedUser: {
    _id: '456',
    name: 'Other User',
  },
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Wait for async updates
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
export const waitFor = (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock window.matchMedia for responsive tests
 */
export const mockMatchMedia = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

/**
 * Mock IntersectionObserver for lazy loading tests
 */
export const mockIntersectionObserver = () => {
  global.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  };
};

/**
 * Create a mock file for file upload tests
 * @param {string} name - File name
 * @param {string} type - MIME type
 * @param {number} size - File size in bytes
 * @returns {File} Mock file object
 */
export const createMockFile = (
  name = 'test.jpg',
  type = 'image/jpeg',
  size = 1024
) => {
  const file = new File(['test'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

export default {
  renderWithProviders,
  createMockBook,
  createMockTrade,
  createMockWishlistItem,
  createMockRating,
  createMockNotification,
  waitFor,
  mockMatchMedia,
  mockIntersectionObserver,
  createMockFile,
};
