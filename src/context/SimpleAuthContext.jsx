// src/contexts/SimpleAuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Check if user is already logged in
  useEffect(() => {
    const authToken = localStorage.getItem('isAuthenticated')
    if (authToken === 'true') {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const login = (password) => {
    // Get password from environment variable
    const correctPassword = import.meta.env.VITE_APP_PASSWORD

    if (!correctPassword) {
      console.error('⚠️ VITE_APP_PASSWORD not set in .env.local!')
      return { success: false, error: 'App nicht konfiguriert' }
    }

    if (password === correctPassword) {
      setIsAuthenticated(true)
      localStorage.setItem('isAuthenticated', 'true')
      return { success: true }
    } else {
      return { success: false, error: 'Falsches Passwort' }
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('isAuthenticated')
  }

  const value = {
    isAuthenticated,
    loading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
