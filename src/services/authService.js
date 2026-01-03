// src/services/authService.js
import { supabase } from '../lib/supabaseClient'

/**
 * Authentication Service
 */

// ============================================
// SIGN UP
// ============================================

/**
 * Sign up with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} metadata - Optional user metadata
 * @returns {Promise<Object>} User data
 */
export const signUp = async (email, password, metadata = {}) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin
      }
    })

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error signing up:', error)
    throw error
  }
}

// ============================================
// SIGN IN
// ============================================

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Session data
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error signing in:', error)
    throw error
  }
}

/**
 * Sign in with OAuth (Google, GitHub, etc.)
 * @param {string} provider - OAuth provider name
 * @returns {Promise<void>}
 */
export const signInWithOAuth = async (provider) => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin
      }
    })

    if (error) throw error
  } catch (error) {
    console.error('Error signing in with OAuth:', error)
    throw error
  }
}

/**
 * Sign in with magic link (passwordless)
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export const signInWithMagicLink = async (email) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    })

    if (error) throw error
  } catch (error) {
    console.error('Error sending magic link:', error)
    throw error
  }
}

// ============================================
// SIGN OUT
// ============================================

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Get current session
 * @returns {Promise<Object|null>} Current session or null
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Get current user
 * @returns {Promise<Object|null>} Current user or null
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Refresh session
 * @returns {Promise<Object>} Refreshed session
 */
export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error refreshing session:', error)
    throw error
  }
}

// ============================================
// PASSWORD MANAGEMENT
// ============================================

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })

    if (error) throw error
  } catch (error) {
    console.error('Error sending reset email:', error)
    throw error
  }
}

/**
 * Update user password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export const updatePassword = async (newPassword) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
  } catch (error) {
    console.error('Error updating password:', error)
    throw error
  }
}

// ============================================
// USER PROFILE
// ============================================

/**
 * Update user metadata
 * @param {Object} metadata - User metadata to update
 * @returns {Promise<Object>} Updated user
 */
export const updateUserMetadata = async (metadata) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: metadata
    })

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error updating user metadata:', error)
    throw error
  }
}

// ============================================
// AUTH LISTENERS
// ============================================

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Callback function
 * @returns {Object} Subscription object
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} True if authenticated
 */
export const isAuthenticated = async () => {
  const session = await getSession()
  return !!session
}
