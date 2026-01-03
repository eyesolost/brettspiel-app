// src/utils/migrateJsonToSupabase.js
/**
 * Einmalige Migration von JSON-Daten (localStorage oder File) zu Supabase
 */

import { importGames, exportToFile } from '../services/gameService'
import initialGamesData from '../data/gamesData.json'

/**
 * Migrate initial JSON data to Supabase
 * @param {boolean} skipDuplicates - Skip games that already exist
 * @returns {Promise<Object>} Migration result
 */
export const migrateInitialData = async (skipDuplicates = true) => {
  console.log('🚀 Starting migration from JSON to Supabase...')
  console.log(`📦 Found ${initialGamesData.length} games in gamesData.json`)
  
  try {
    // Import all games from JSON
    const result = await importGames(initialGamesData, skipDuplicates)
    
    console.log('✅ Migration completed!')
    console.log(`  ✅ Imported: ${result.imported}`)
    console.log(`  ⏭️  Skipped: ${result.skippedCount}`)
    console.log(`  ❌ Failed: ${result.failedCount}`)
    
    // Show details
    if (result.skipped.length > 0) {
      console.log('\n⏭️  Skipped games (duplicates):')
      result.skipped.forEach(item => {
        console.log(`  - ${item.game} (${item.reason})`)
      })
    }
    
    if (result.failed.length > 0) {
      console.log('\n❌ Failed games:')
      result.failed.forEach(item => {
        console.log(`  - ${item.game}: ${item.error}`)
      })
    }
    
    return result
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

/**
 * Migrate from localStorage to Supabase
 * @param {boolean} skipDuplicates - Skip games that already exist
 * @returns {Promise<Object>} Migration result
 */
export const migrateFromLocalStorage = async (skipDuplicates = true) => {
  console.log('🚀 Starting migration from localStorage to Supabase...')
  
  try {
    // Get games from localStorage
    const STORAGE_KEY = 'brettspiel_sammlung'
    const localData = localStorage.getItem(STORAGE_KEY)
    
    if (!localData) {
      console.log('ℹ️  No games found in localStorage')
      return {
        success: [],
        failed: [],
        skipped: [],
        total: 0,
        imported: 0,
        failedCount: 0,
        skippedCount: 0
      }
    }
    
    const games = JSON.parse(localData)
    console.log(`📦 Found ${games.length} games in localStorage`)
    
    // Create backup before migration
    const backup = {
      timestamp: new Date().toISOString(),
      games: games
    }
    localStorage.setItem('brettspiel_sammlung_backup', JSON.stringify(backup))
    console.log('💾 Backup created in localStorage')
    
    // Import to Supabase
    const result = await importGames(games, skipDuplicates)
    
    console.log('✅ Migration completed!')
    console.log(`  ✅ Imported: ${result.imported}`)
    console.log(`  ⏭️  Skipped: ${result.skippedCount}`)
    console.log(`  ❌ Failed: ${result.failedCount}`)
    
    return result
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

/**
 * Migrate from uploaded file to Supabase
 * @param {File} file - JSON file with games data
 * @param {boolean} skipDuplicates - Skip games that already exist
 * @returns {Promise<Object>} Migration result
 */
export const migrateFromFile = async (file, skipDuplicates = true) => {
  console.log('🚀 Starting migration from file to Supabase...')
  console.log(`📁 File: ${file.name}`)
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const games = JSON.parse(e.target.result)
        
        if (!Array.isArray(games)) {
          throw new Error('File does not contain a valid games array')
        }
        
        console.log(`📦 Found ${games.length} games in file`)
        
        // Import to Supabase
        const result = await importGames(games, skipDuplicates)
        
        console.log('✅ Migration completed!')
        console.log(`  ✅ Imported: ${result.imported}`)
        console.log(`  ⏭️  Skipped: ${result.skippedCount}`)
        console.log(`  ❌ Failed: ${result.failedCount}`)
        
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Error reading file'))
    }
    
    reader.readAsText(file)
  })
}

/**
 * Clear localStorage after successful migration
 * WARNING: Only call after verifying migration was successful!
 */
export const clearLocalStorageAfterMigration = () => {
  const confirmation = window.confirm(
    '⚠️ WARNUNG: Dies löscht alle Spiele aus dem localStorage.\n\n' +
    'Stelle sicher, dass die Migration erfolgreich war!\n\n' +
    'Ein Backup wurde unter "brettspiel_sammlung_backup" gespeichert.\n\n' +
    'Fortfahren?'
  )

  if (confirmation) {
    localStorage.removeItem('brettspiel_sammlung')
    console.log('🗑️ localStorage cleared')
    alert('✅ localStorage wurde gelöscht. Backup bleibt erhalten!')
    return true
  }
  
  return false
}

/**
 * Restore from backup
 */
export const restoreFromBackup = () => {
  try {
    const backup = localStorage.getItem('brettspiel_sammlung_backup')
    
    if (!backup) {
      console.error('No backup found')
      alert('❌ Kein Backup gefunden!')
      return false
    }

    const { games } = JSON.parse(backup)
    localStorage.setItem('brettspiel_sammlung', JSON.stringify(games))
    
    console.log('✅ Restored from backup')
    alert('✅ Daten aus Backup wiederhergestellt!')
    return true
  } catch (error) {
    console.error('Error restoring from backup:', error)
    alert('❌ Fehler beim Wiederherstellen!')
    return false
  }
}

/**
 * Download backup before migration
 */
export const downloadBackupBeforeMigration = async () => {
  try {
    // Get from localStorage
    const STORAGE_KEY = 'brettspiel_sammlung'
    const localData = localStorage.getItem(STORAGE_KEY)
    
    if (!localData) {
      alert('ℹ️ Keine Daten in localStorage gefunden')
      return
    }
    
    const games = JSON.parse(localData)
    
    // Create backup file
    const backup = {
      created: new Date().toISOString(),
      source: 'localStorage',
      count: games.length,
      games: games
    }
    
    const dataStr = JSON.stringify(backup, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    // Download
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    
    const today = new Date().toISOString().split('T')[0]
    link.download = `brettspiele_backup_pre-migration_${today}.json`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('✅ Backup downloaded:', link.download)
    alert(`✅ Backup erstellt: ${link.download}`)
  } catch (error) {
    console.error('Error downloading backup:', error)
    alert('❌ Fehler beim Erstellen des Backups!')
  }
}

/**
 * Check migration status
 */
export const checkMigrationStatus = async () => {
  const hasLocalStorage = !!localStorage.getItem('brettspiel_sammlung')
  const hasBackup = !!localStorage.getItem('brettspiel_sammlung_backup')
  
  // Try to get Supabase count
  let supabaseCount = 0
  try {
    const { importGames, getAllGames } = await import('../services/gameService')
    const games = await getAllGames()
    supabaseCount = games.length
  } catch (error) {
    console.error('Could not fetch Supabase count:', error)
  }
  
  return {
    hasLocalStorage,
    hasBackup,
    supabaseCount,
    recommendMigration: hasLocalStorage && supabaseCount === 0
  }
}
