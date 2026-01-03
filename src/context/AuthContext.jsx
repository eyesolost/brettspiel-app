// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  signIn as authSignIn, 
  signUp as authSignUp,
  signOut as authSignOut,
  signInWithOAuth,
  signInWithMagicLink,
  getCurrentUser,
  getSession
} from '../services/authService'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    getSession().then(session => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signUp = async (email, password, metadata) => {
    try {
      const data = await authSignUp(email, password, metadata)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      const data = await authSignIn(email, password)
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signInWithProvider = async (provider) => {
    try {
      await signInWithOAuth(provider)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const sendMagicLink = async (email) => {
    try {
      await signInWithMagicLink(email)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await authSignOut()
      setUser(null)
      setSession(null)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithProvider,
    sendMagicLink,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
