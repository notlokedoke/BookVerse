import React from 'react'
import { useAuth } from '../context/AuthContext'

const HomePage = () => {
  const { user } = useAuth()

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to BookVerse</h1>
      {user && (
        <div>
          <p>Welcome back, {user.name}! Start exploring books and connecting with other readers.</p>
        </div>
      )}
    </div>
  )
}

export default HomePage
