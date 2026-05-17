import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
// Critical path — loaded eagerly
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/SignUpPage'
import BrowsePage from './pages/BrowsePage'
import NotFoundPage from './pages/NotFoundPage'

// Non-critical — loaded lazily
const BookDetailView = lazy(() => import('./components/BookDetailView'))
const TradeDetailView = lazy(() => import('./components/TradeDetailView'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ActivityPage = lazy(() => import('./pages/ActivityPage'))
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'))
const CompleteProfilePage = lazy(() => import('./pages/CompleteProfilePage'))
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'))
const ProfileSettingsPage = lazy(() => import('./pages/ProfileSettingsPage'))
const CreateBookPage = lazy(() => import('./pages/CreateBookPage'))
const CreateWishlistPage = lazy(() => import('./pages/CreateWishlistPage'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const WishlistMatchesPage = lazy(() => import('./pages/WishlistMatchesPage'))
const MyBooksPage = lazy(() => import('./pages/MyBooksPage'))
const TradesPage = lazy(() => import('./pages/TradesPage'))
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const SafetyGuidelinesPage = lazy(() => import('./pages/SafetyGuidelinesPage'))
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'))
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const NearbyBooks = lazy(() => import('./components/NearbyBooks'))
import './App.css'

// Component to conditionally render navbar and footer
const AppContent = () => {
  const location = useLocation()
  const { user } = useAuth()
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
        <Suspense fallback={<div className="page-loading" aria-live="polite" aria-label="Loading page" />}>
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
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/help" element={<HelpCenterPage />} />
            <Route path="/faq" element={<FAQPage />} />

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
              path="/activity"
              element={
                <ProtectedRoute>
                  <ActivityPage />
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
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <WishlistPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist/matches"
              element={
                <ProtectedRoute>
                  <WishlistMatchesPage />
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
              path="/nearby"
              element={
                <ProtectedRoute>
                  <NearbyBooks />
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
        </Suspense>
      </div>
      {!isAuthPage && !user && <Footer />}
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}

export default App
