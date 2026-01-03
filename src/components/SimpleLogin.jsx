// src/components/Auth/SimpleLogin.jsx
import React, { useState } from 'react'
import { useAuth } from '../../context/SimpleAuthContext'

const SimpleLogin = () => {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = login(password)

    if (!result.success) {
      setError(result.error)
      setPassword('') // Clear password field
    }

    setLoading(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🎲 Brettspiel-App</h1>
        <p style={styles.subtitle}>Passwort eingeben zum Fortfahren</p>

        {error && (
          <div style={styles.error}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            style={styles.input}
            autoFocus
            disabled={loading}
          />

          <button 
            type="submit" 
            style={{
              ...styles.button,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            disabled={loading}
          >
            {loading ? 'Prüfe...' : 'Anmelden'}
          </button>
        </form>

        <p style={styles.hint}>
          💡 Tipp: Passwort ist in .env.local gespeichert
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px'
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
    maxWidth: '400px',
    width: '100%'
  },
  title: {
    textAlign: 'center',
    margin: '0 0 10px 0',
    color: '#333',
    fontSize: '32px'
  },
  subtitle: {
    textAlign: 'center',
    margin: '0 0 30px 0',
    color: '#666',
    fontSize: '14px'
  },
  error: {
    background: '#fee',
    border: '1px solid #fcc',
    color: '#c33',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  input: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    border: '2px solid #ddd',
    borderRadius: '8px',
    marginBottom: '15px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s'
  },
  button: {
    width: '100%',
    padding: '15px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  hint: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#999'
  }
}

export default SimpleLogin
