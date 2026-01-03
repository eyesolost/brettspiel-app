// src/components/Migration/MigrationTool.jsx
import React, { useState, useEffect } from 'react'
import {
  migrateInitialData,
  migrateFromLocalStorage,
  migrateFromFile,
  clearLocalStorageAfterMigration,
  downloadBackupBeforeMigration,
  checkMigrationStatus
} from '../../utils/migrateJsonToSupabase'

const MigrationTool = ({ onComplete }) => {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [skipDuplicates, setSkipDuplicates] = useState(true)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    const statusInfo = await checkMigrationStatus()
    setStatus(statusInfo)
  }

  const handleMigrateInitialData = async () => {
    if (!window.confirm('Migration von gamesData.json starten?')) return
    
    setLoading(true)
    setResult(null)
    
    try {
      const migrationResult = await migrateInitialData(skipDuplicates)
      setResult(migrationResult)
      await checkStatus()
    } catch (error) {
      alert('❌ Migration fehlgeschlagen: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMigrateFromLocalStorage = async () => {
    if (!window.confirm('Migration von localStorage starten?\n\nEin Backup wird automatisch erstellt.')) return
    
    setLoading(true)
    setResult(null)
    
    try {
      const migrationResult = await migrateFromLocalStorage(skipDuplicates)
      setResult(migrationResult)
      await checkStatus()
    } catch (error) {
      alert('❌ Migration fehlgeschlagen: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleMigrateFromFile = async () => {
    if (!selectedFile) {
      alert('Bitte wähle eine Datei aus!')
      return
    }
    
    if (!window.confirm(`Migration von ${selectedFile.name} starten?`)) return
    
    setLoading(true)
    setResult(null)
    
    try {
      const migrationResult = await migrateFromFile(selectedFile, skipDuplicates)
      setResult(migrationResult)
      await checkStatus()
    } catch (error) {
      alert('❌ Migration fehlgeschlagen: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0])
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📦 Daten-Migration zu Supabase</h1>

        {/* Status */}
        {status && (
          <div style={styles.status}>
            <h3>Status:</h3>
            <p>📊 Spiele in Supabase: <strong>{status.supabaseCount}</strong></p>
            <p>💾 LocalStorage vorhanden: {status.hasLocalStorage ? '✅ Ja' : '❌ Nein'}</p>
            <p>🔄 Backup vorhanden: {status.hasBackup ? '✅ Ja' : '❌ Nein'}</p>
            
            {status.recommendMigration && (
              <div style={styles.recommendation}>
                💡 <strong>Empfehlung:</strong> Migration durchführen!
              </div>
            )}
          </div>
        )}

        {/* Options */}
        <div style={styles.options}>
          <h3>Migrations-Optionen:</h3>
          
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
            />
            <span>Duplikate überspringen (empfohlen)</span>
          </label>
        </div>

        {/* Migration Buttons */}
        <div style={styles.actions}>
          
          {/* Option 1: Initial Data */}
          <div style={styles.actionCard}>
            <h4>📄 Option 1: Initiale JSON-Daten</h4>
            <p>Importiere die Spiele aus <code>gamesData.json</code></p>
            <button
              onClick={handleMigrateInitialData}
              disabled={loading}
              style={styles.button}
            >
              {loading ? 'Migration läuft...' : 'JSON-Daten importieren'}
            </button>
          </div>

          {/* Option 2: LocalStorage */}
          {status?.hasLocalStorage && (
            <div style={styles.actionCard}>
              <h4>💾 Option 2: Aus LocalStorage</h4>
              <p>Importiere gespeicherte Spiele aus dem Browser</p>
              <button
                onClick={downloadBackupBeforeMigration}
                style={styles.buttonSecondary}
              >
                📥 Erst Backup herunterladen
              </button>
              <button
                onClick={handleMigrateFromLocalStorage}
                disabled={loading}
                style={styles.button}
              >
                {loading ? 'Migration läuft...' : 'LocalStorage importieren'}
              </button>
            </div>
          )}

          {/* Option 3: File Upload */}
          <div style={styles.actionCard}>
            <h4>📁 Option 3: Aus Datei</h4>
            <p>Importiere Spiele aus einer JSON-Datei</p>
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              style={styles.fileInput}
            />
            {selectedFile && (
              <p style={styles.fileInfo}>
                Ausgewählt: <strong>{selectedFile.name}</strong>
              </p>
            )}
            <button
              onClick={handleMigrateFromFile}
              disabled={loading || !selectedFile}
              style={styles.button}
            >
              {loading ? 'Migration läuft...' : 'Datei importieren'}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div style={styles.result}>
            <h3>Migrations-Ergebnis:</h3>
            
            <div style={styles.resultStats}>
              <div style={styles.statItem}>
                <strong>Gesamt:</strong> {result.total}
              </div>
              <div style={{...styles.statItem, ...styles.statSuccess}}>
                <strong>✅ Importiert:</strong> {result.imported}
              </div>
              <div style={{...styles.statItem, ...styles.statWarning}}>
                <strong>⏭️ Übersprungen:</strong> {result.skippedCount}
              </div>
              <div style={{...styles.statItem, ...styles.statError}}>
                <strong>❌ Fehlgeschlagen:</strong> {result.failedCount}
              </div>
            </div>

            {/* Skipped Games */}
            {result.skipped.length > 0 && (
              <details style={styles.details}>
                <summary>⏭️ Übersprungene Spiele ({result.skipped.length})</summary>
                <ul style={styles.list}>
                  {result.skipped.map((item, i) => (
                    <li key={i}>
                      <strong>{item.game}</strong>
                      <br />
                      <small>Grund: {item.reason}</small>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {/* Failed Games */}
            {result.failed.length > 0 && (
              <details style={styles.details}>
                <summary>❌ Fehlgeschlagene Spiele ({result.failed.length})</summary>
                <ul style={styles.list}>
                  {result.failed.map((item, i) => (
                    <li key={i}>
                      <strong>{item.game}</strong>
                      <br />
                      <small>Fehler: {item.error}</small>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {/* Success Actions */}
            {result.imported > 0 && (
              <div style={styles.successActions}>
                <h4>✅ Migration erfolgreich!</h4>
                <p>{result.imported} Spiele wurden importiert.</p>
                
                {status?.hasLocalStorage && (
                  <button
                    onClick={clearLocalStorageAfterMigration}
                    style={styles.buttonDanger}
                  >
                    🗑️ LocalStorage jetzt löschen
                  </button>
                )}
                
                {onComplete && (
                  <button
                    onClick={onComplete}
                    style={styles.button}
                  >
                    ✅ Fertig - Zur App
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Help */}
        <div style={styles.help}>
          <h4>💡 Hilfe:</h4>
          <ul>
            <li><strong>Duplikate überspringen:</strong> Spiele mit gleicher BGG-ID oder Titel werden nicht doppelt importiert</li>
            <li><strong>Backup:</strong> Vor der Migration wird automatisch ein Backup erstellt</li>
            <li><strong>LocalStorage löschen:</strong> Erst nach erfolgreicher Migration und Verifizierung!</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '20px',
    maxWidth: '900px',
    margin: '0 auto',
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 2px 20px rgba(0,0,0,0.1)'
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px'
  },
  status: {
    background: '#f0f8ff',
    border: '1px solid #b3d9ff',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px'
  },
  recommendation: {
    marginTop: '15px',
    padding: '10px',
    background: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '6px'
  },
  options: {
    marginBottom: '30px'
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    cursor: 'pointer'
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '30px'
  },
  actionCard: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    background: '#fafafa'
  },
  button: {
    width: '100%',
    padding: '12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background 0.3s'
  },
  buttonSecondary: {
    width: '100%',
    padding: '12px',
    background: '#f0f0f0',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  },
  buttonDanger: {
    width: '100%',
    padding: '12px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  },
  fileInput: {
    width: '100%',
    padding: '10px',
    marginTop: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px'
  },
  fileInfo: {
    marginTop: '10px',
    color: '#666'
  },
  result: {
    background: '#f0fff0',
    border: '1px solid #90ee90',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px'
  },
  resultStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  statItem: {
    padding: '15px',
    borderRadius: '6px',
    background: '#f8f8f8',
    textAlign: 'center'
  },
  statSuccess: {
    background: '#d4edda',
    borderLeft: '4px solid #28a745'
  },
  statWarning: {
    background: '#fff3cd',
    borderLeft: '4px solid #ffc107'
  },
  statError: {
    background: '#f8d7da',
    borderLeft: '4px solid #dc3545'
  },
  details: {
    marginTop: '15px',
    padding: '10px',
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '6px'
  },
  list: {
    marginTop: '10px',
    paddingLeft: '20px'
  },
  successActions: {
    marginTop: '20px',
    padding: '15px',
    background: 'white',
    border: '1px solid #90ee90',
    borderRadius: '6px'
  },
  help: {
    background: '#fffbf0',
    border: '1px solid #ffeaa7',
    borderRadius: '8px',
    padding: '15px',
    fontSize: '14px'
  }
}

export default MigrationTool
