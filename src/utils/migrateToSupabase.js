// src/utils/migrateToSupabase.js
import { importGames } from '../services/gamesService'

/**
 * Migrate games from localStorage to Supabase
 * This should be run once after setting up Supabase
 */

export const migrateFromLocalStorage = async () => {
  try {
    console.log('🔄 Starting migration from localStorage to Supabase...')

    // Get games from localStorage
    const localGames = localStorage.getItem('spiele')
    
    if (!localGames) {
      console.log('ℹ️ No games found in localStorage')
      return {
        success: true,
        message: 'No games to migrate',
        migrated: 0
      }
    }

    const games = JSON.parse(localGames)
    
    if (!Array.isArray(games) || games.length === 0) {
      console.log('ℹ️ No games found in localStorage')
      return {
        success: true,
        message: 'No games to migrate',
        migrated: 0
      }
    }

    console.log(`📦 Found ${games.length} games in localStorage`)

    // Transform games to match Supabase schema
    const transformedGames = games.map(game => ({
      titel: game.titel,
      verlag: game.verlag,
      autor: game.autor,
      bgg_id: game.bggId,
      min_spieler: game.minSpieler,
      max_spieler: game.maxSpieler,
      optimale_spieleranzahl: game.optimaleSpieleranzahl,
      min_spielzeit: game.minSpielzeit,
      max_spielzeit: game.maxSpielzeit,
      spass: game.spass,
      strategie: game.strategie,
      glueck: game.glueck,
      komplexitaet: game.komplexitaet,
      bgg_rating: game.bggRating,
      altersempfehlung: game.altersempfehlung,
      awards: game.awards,
      status: game.status,
      standort: game.standort,
      fehlteile: game.fehlteile,
      anschaffungsdatum: game.anschaffungsdatum,
      info: game.info,
      rohrstrat: game.rohrstrat,
      erweiterungenInBesitz: game.erweiterungenInBesitz || [],
      erweiterungenZurAnschaffung: game.erweiterungenZurAnschaffung || []
    }))

    // Import to Supabase
    console.log('📤 Uploading to Supabase...')
    const result = await importGames(transformedGames)

    const successCount = result.success.length
    const failedCount = result.failed.length

    console.log(`✅ Successfully migrated ${successCount} games`)
    
    if (failedCount > 0) {
      console.warn(`⚠️ Failed to migrate ${failedCount} games:`, result.failed)
    }

    // Create backup before clearing localStorage
    const backup = {
      timestamp: new Date().toISOString(),
      games: games,
      migrationResult: result
    }
    localStorage.setItem('spiele_backup_before_migration', JSON.stringify(backup))

    console.log('💾 Backup created in localStorage (spiele_backup_before_migration)')

    return {
      success: true,
      message: `Successfully migrated ${successCount} of ${games.length} games`,
      migrated: successCount,
      failed: failedCount,
      failedGames: result.failed,
      backup: 'spiele_backup_before_migration'
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return {
      success: false,
      message: error.message,
      error
    }
  }
}

/**
 * Clear localStorage after successful migration
 * WARNING: Only call this after verifying migration was successful!
 */
export const clearLocalStorageAfterMigration = () => {
  const confirmation = window.confirm(
    '⚠️ WARNUNG: Dies löscht alle Spiele aus dem localStorage.\n\n' +
    'Stelle sicher, dass die Migration erfolgreich war!\n\n' +
    'Ein Backup wurde unter "spiele_backup_before_migration" gespeichert.\n\n' +
    'Fortfahren?'
  )

  if (confirmation) {
    localStorage.removeItem('spiele')
    console.log('🗑️ localStorage cleared')
    return true
  }
  
  return false
}

/**
 * Restore from backup (in case migration failed)
 */
export const restoreFromBackup = () => {
  try {
    const backup = localStorage.getItem('spiele_backup_before_migration')
    
    if (!backup) {
      console.error('No backup found')
      return false
    }

    const { games } = JSON.parse(backup)
    localStorage.setItem('spiele', JSON.stringify(games))
    
    console.log('✅ Restored from backup')
    return true
  } catch (error) {
    console.error('Error restoring from backup:', error)
    return false
  }
}

/**
 * Check migration status
 */
export const checkMigrationStatus = async () => {
  const hasLocalGames = !!localStorage.getItem('spiele')
  const hasBackup = !!localStorage.getItem('spiele_backup_before_migration')
  
  return {
    hasLocalGames,
    hasBackup,
    recommendMigration: hasLocalGames && !hasBackup
  }
}
