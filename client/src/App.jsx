import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UserProfilePage from './pages/UserProfilePage'
import ProfileSettingsPage from './pages/ProfileSettingsPage'
import './App.css'

// Component to conditionally render navbar
const AppContent = () => {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className="App">
      {!isAuthPage && <Navbar />}
      <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Protected routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <HomePage />
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
