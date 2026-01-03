// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Lädt...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    gap: '20px'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  }
}

// Add keyframe animation for spinner
const styleSheet = document.styleSheets[0]
const keyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`
styleSheet.insertRule(keyframes, styleSheet.cssRules.length)

export default ProtectedRoute
