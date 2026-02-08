import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import BookDetailView from './components/BookDetailView'
import TradeDetailView from './components/TradeDetailView'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import BrowsePage from './pages/BrowsePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import CompleteProfilePage from './pages/CompleteProfilePage'
import UserProfilePage from './pages/UserProfilePage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'
import CreateBookPage from './pages/CreateBookPage'
import CreateWishlistPage from './pages/CreateWishlistPage'
import MyBooksPage from './pages/MyBooksPage'
import TradesPage from './pages/TradesPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import './App.css'

// Component to conditionally render navbar
const AppContent = () => {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || 
                     location.pathname === '/register' || 
                     location.pathname === '/auth/callback' ||
                     location.pathname === '/complete-profile' ||
                     location.pathname === '/verify-email' ||
                     location.pathname === '/forgot-password' ||
                     location.pathname === '/reset-password'
  const isLandingPage = location.pathname === '/'

  return (
    <div className="App">
      {!isAuthPage && !isLandingPage && <Navbar />}
      <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/complete-profile" element={<CompleteProfilePage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/browse" element={<BrowsePage />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/:userId" 
              element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/settings" 
              element={
                <ProtectedRoute>
                  <ProfileSettingsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/books/create" 
              element={
                <ProtectedRoute>
                  <CreateBookPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/wishlist/create" 
              element={
                <ProtectedRoute>
                  <CreateWishlistPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-books" 
              element={
                <ProtectedRoute>
                  <MyBooksPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/trades" 
              element={
                <ProtectedRoute>
                  <TradesPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/trades/:id" 
              element={
                <ProtectedRoute>
                  <TradeDetailView />
                </ProtectedRoute>
              } 
            />
            <Route path="/books/:bookId" element={<BookDetailView />} />
            
            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  )
}

export default App
