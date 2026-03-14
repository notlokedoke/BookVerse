import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import BookDetailView from './components/BookDetailView'
import TradeDetailView from './components/TradeDetailView'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import BrowsePage from './pages/BrowsePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/SignUpPage'
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
import SafetyGuidelinesPage from './pages/SafetyGuidelinesPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import HelpCenterPage from './pages/HelpCenterPage'
import NotFoundPage from './pages/NotFoundPage'
import './App.css'

// Component to conditionally render navbar and footer
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
      <div className="app-content">
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
            <Route path="/safety" element={<SafetyGuidelinesPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/help" element={<HelpCenterPage />} />
            
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
            
            {/* 404 Not Found - catch all unknown routes */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
