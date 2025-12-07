import React from 'react'
import { useAuth } from '../context/AuthContext'

const HomePage = () => {
  const { user, logout } = useAuth()

  return (
    <div>
      <h1>Welcome to BookVerse</h1>
      {user && (
        <div>
          <p>Hello, {user.name}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      )}
    </div>
  )
}

export default HomePage
