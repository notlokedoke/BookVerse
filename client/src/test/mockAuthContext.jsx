import React from 'react';
import { vi } from 'vitest';

/**
 * Create a mock AuthContext value
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock auth context value
 */
export const createMockAuthContext = (overrides = {}) => ({
  user: null,
  token: null,
  loading: false,
  isAuthenticated: false,
  login: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn(),
  setUser: vi.fn(),
  setToken: vi.fn(),
  ...overrides,
});

/**
 * Create a mock authenticated user
 * @param {Object} overrides - Override default user properties
 * @returns {Object} Mock user object
 */
export const createMockUser = (overrides = {}) => ({
  _id: '123',
  name: 'Test User',
  email: 'test@example.com',
  city: 'Test City',
  averageRating: 4.5,
  ratingCount: 10,
  privacySettings: {
    showCity: true,
  },
  ...overrides,
});

/**
 * Create a mock authenticated context
 * @param {Object} userOverrides - Override user properties
 * @param {Object} contextOverrides - Override context properties
 * @returns {Object} Mock authenticated context
 */
export const createAuthenticatedContext = (
  userOverrides = {},
  contextOverrides = {}
) => {
  const user = createMockUser(userOverrides);
  return createMockAuthContext({
    user,
    token: 'mock-jwt-token',
    isAuthenticated: true,
    ...contextOverrides,
  });
};

/**
 * Mock AuthProvider component for testing
 */
export const MockAuthProvider = ({ children, value }) => {
  const mockValue = value || createMockAuthContext();
  
  // Create a mock context
  const MockContext = React.createContext(mockValue);
  
  return <MockContext.Provider value={mockValue}>{children}</MockContext.Provider>;
};

/**
 * Wrapper component with authenticated context
 */
export const AuthenticatedWrapper = ({ children, user, ...contextOverrides }) => {
  const authValue = createAuthenticatedContext(user, contextOverrides);
  return <MockAuthProvider value={authValue}>{children}</MockAuthProvider>;
};

/**
 * Wrapper component with unauthenticated context
 */
export const UnauthenticatedWrapper = ({ children, ...contextOverrides }) => {
  const authValue = createMockAuthContext(contextOverrides);
  return <MockAuthProvider value={authValue}>{children}</MockAuthProvider>;
};

export default {
  createMockAuthContext,
  createMockUser,
  createAuthenticatedContext,
  MockAuthProvider,
  AuthenticatedWrapper,
  UnauthenticatedWrapper,
};
