// src/components/Auth/SignUp.jsx
import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const SignUp = ({ onSuccess, onToggleMode }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const { signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password, {
      display_name: displayName
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <h2 style={styles.heading}>✅ Registrierung erfolgreich!</h2>
          <p style={styles.text}>Bitte überprüfe deine E-Mails ({email}) und bestätige deine Registrierung.</p>
          <p style={styles.text}>Danach kannst du dich anmelden.</p>
          <button 
            onClick={onToggleMode}
            style={styles.btnPrimary}
          >
            Zum Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.authContainer}>
      <div style={styles.authCard}>
        <h2 style={styles.heading}>🎲 Brettspiel-App Registrierung</h2>
        
        {error && (
          <div style={styles.errorMessage}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="displayName" style={styles.label}>Name (optional)</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Dein Name"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>E-Mail *</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>Passwort *</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={styles.input}
            />
            <small style={styles.small}>Mindestens 6 Zeichen</small>
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>Passwort bestätigen *</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              style={styles.input}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              ...styles.button,
              ...styles.btnPrimary,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Wird erstellt...' : 'Account erstellen'}
          </button>
        </form>

        <div style={styles.authFooter}>
          <p style={styles.text}>
            Bereits einen Account?{' '}
            <button 
              onClick={onToggleMode}
              style={styles.linkButton}
            >
              Jetzt anmelden
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  authContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  authCard: {
    background: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
    width: '100%'
  },
  heading: {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#333'
  },
  text: {
    color: '#666',
    marginBottom: '10px'
  },
  errorMessage: {
    background: '#fee',
    border: '1px solid #fcc',
    color: '#c33',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#555'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  small: {
    display: 'block',
    marginTop: '4px',
    color: '#999',
    fontSize: '12px'
  },
  button: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  btnPrimary: {
    background: '#667eea',
    color: 'white'
  },
  authFooter: {
    textAlign: 'center',
    marginTop: '20px'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    padding: 0,
    fontSize: '14px',
    textDecoration: 'underline',
    cursor: 'pointer'
  }
}

export default SignUp
