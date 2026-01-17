import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          BookVerse
        </Link>
        
        <div className="navbar-menu">
          {isAuthenticated ? (
            // Authenticated user menu
            <div className="navbar-auth">
              <span className="navbar-user">Hello, {user?.name}!</span>
              <Link to="/dashboard" className="navbar-link">Dashboard</Link>
              <Link to="/browse" className="navbar-link">Browse</Link>
              <Link to="/my-books" className="navbar-link">My Books</Link>
              <Link to="/wishlist/create" className="navbar-link">Add to Wishlist</Link>
              <Link to="/profile" className="navbar-link">Profile</Link>
              <button 
                onClick={handleLogout}
                className="navbar-logout-btn"
              >
                Logout
              </button>
            </div>
          ) : (
            // Non-authenticated user menu
            <div className="navbar-guest">
              <Link to="/browse" className="navbar-link">Browse</Link>
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/register" className="navbar-link">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar