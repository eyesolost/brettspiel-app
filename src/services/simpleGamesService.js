// src/services/simpleGamesService.js
// Games Service OHNE Supabase Auth - für Single User App
import { supabase } from '../lib/supabaseClient'

/**
 * Games Service - CRUD operations ohne User Authentication
 */

// ============================================
// CREATE
// ============================================

/**
 * Create a new game
 */
export const createGame = async (gameData) => {
  try {
    const { erweiterungenInBesitz, erweiterungenZurAnschaffung, ...gameFields } = gameData

    // Insert game (OHNE user_id!)
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert([gameFields])
      .select()
      .single()

    if (gameError) throw gameError

    // Insert extensions if any
    if (erweiterungenInBesitz?.length > 0) {
      await createExtensions(game.id, erweiterungenInBesitz, 'in_besitz')
    }

    if (erweiterungenZurAnschaffung?.length > 0) {
      await createExtensions(game.id, erweiterungenZurAnschaffung, 'zur_anschaffung')
    }

    return await getGameById(game.id)
  } catch (error) {
    console.error('Error creating game:', error)
    throw error
  }
}

const createExtensions = async (gameId, extensionNames, type) => {
  const extensions = extensionNames.map(name => ({
    game_id: gameId,
    name,
    type
  }))

  const { error } = await supabase
    .from('extensions')
    .insert(extensions)

  if (error) throw error
}

// ============================================
// READ
// ============================================

/**
 * Get all games
 */
export const getAllGames = async () => {
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        extensions (
          id,
          name,
          type
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return games.map(game => transformGameFromDB(game))
  } catch (error) {
    console.error('Error fetching games:', error)
    throw error
  }
}

/**
 * Get a single game by ID
 */
export const getGameById = async (id) => {
  try {
    const { data: game, error } = await supabase
      .from('games')
      .select(`
        *,
        extensions (
          id,
          name,
          type
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    return transformGameFromDB(game)
  } catch (error) {
    console.error('Error fetching game:', error)
    throw error
  }
}

/**
 * Search games by title
 */
export const searchGames = async (searchTerm) => {
  try {
    const { data: games, error } = await supabase
      .from('games')
      .select(`
        *,
        extensions (
          id,
          name,
          type
        )
      `)
      .ilike('titel', `%${searchTerm}%`)
      .order('titel')

    if (error) throw error

    return games.map(game => transformGameFromDB(game))
  } catch (error) {
    console.error('Error searching games:', error)
    throw error
  }
}

/**
 * Filter games by criteria
 */
export const filterGames = async (filters) => {
  try {
    let query = supabase
      .from('games')
      .select(`
        *,
        extensions (
          id,
          name,
          type
        )
      `)

    // Apply filters
    if (filters.minSpieler) {
      query = query.gte('min_spieler', filters.minSpieler)
    }
    if (filters.maxSpieler) {
      query = query.lte('max_spieler', filters.maxSpieler)
    }
    if (filters.minRating) {
      query = query.gte('spass', filters.minRating)
    }
    if (filters.verlag) {
      query = query.eq('verlag', filters.verlag)
    }
    if (filters.fehlteile !== undefined) {
      query = query.eq('fehlteile', filters.fehlteile)
    }

    const { data: games, error } = await query.order('titel')

    if (error) throw error

    return games.map(game => transformGameFromDB(game))
  } catch (error) {
    console.error('Error filtering games:', error)
    throw error
  }
}

// ============================================
// UPDATE
// ============================================

/**
 * Update a game
 */
export const updateGame = async (id, updates) => {
  try {
    const { erweiterungenInBesitz, erweiterungenZurAnschaffung, ...gameUpdates } = updates

    // Update game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .update(gameUpdates)
      .eq('id', id)
      .select()
      .single()

    if (gameError) throw gameError

    // Update extensions if provided
    if (erweiterungenInBesitz !== undefined || erweiterungenZurAnschaffung !== undefined) {
      // Delete existing extensions
      await supabase
        .from('extensions')
        .delete()
        .eq('game_id', id)

      // Insert new extensions
      if (erweiterungenInBesitz?.length > 0) {
        await createExtensions(id, erweiterungenInBesitz, 'in_besitz')
      }
      if (erweiterungenZurAnschaffung?.length > 0) {
        await createExtensions(id, erweiterungenZurAnschaffung, 'zur_anschaffung')
      }
    }

    return await getGameById(id)
  } catch (error) {
    console.error('Error updating game:', error)
    throw error
  }
}

// ============================================
// DELETE
// ============================================

/**
 * Delete a game
 */
export const deleteGame = async (id) => {
  try {
    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting game:', error)
    throw error
  }
}

/**
 * Delete multiple games
 */
export const deleteMultipleGames = async (ids) => {
  try {
    const { error } = await supabase
      .from('games')
      .delete()
      .in('id', ids)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting games:', error)
    throw error
  }
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Import games from JSON
 */
export const importGames = async (games) => {
  try {
    const results = []
    const errors = []

    for (const gameData of games) {
      try {
        const game = await createGame(gameData)
        results.push(game)
      } catch (error) {
        errors.push({
          game: gameData.titel,
          error: error.message
        })
      }
    }

    if (errors.length > 0) {
      console.warn('Some games failed to import:', errors)
    }

    return {
      success: results,
      failed: errors
    }
  } catch (error) {
    console.error('Error importing games:', error)
    throw error
  }
}

/**
 * Export all games to JSON
 */
export const exportGames = async () => {
  try {
    const games = await getAllGames()
    return games
  } catch (error) {
    console.error('Error exporting games:', error)
    throw error
  }
}

// ============================================
// STATISTICS
// ============================================

/**
 * Get statistics about the game collection
 */
export const getStatistics = async () => {
  try {
    const { data: stats, error } = await supabase
      .from('games')
      .select('spass, strategie, glueck, fehlteile')

    if (error) throw error

    const totalGames = stats.length
    const gamesWithMissingParts = stats.filter(g => g.fehlteile).length
    const avgSpass = stats.reduce((sum, g) => sum + (g.spass || 0), 0) / totalGames
    const avgStrategie = stats.reduce((sum, g) => sum + (g.strategie || 0), 0) / totalGames
    const avgGlueck = stats.reduce((sum, g) => sum + (g.glueck || 0), 0) / totalGames

    return {
      totalGames,
      gamesWithMissingParts,
      avgSpass: avgSpass.toFixed(1),
      avgStrategie: avgStrategie.toFixed(1),
      avgGlueck: avgGlueck.toFixed(1)
    }
  } catch (error) {
    console.error('Error fetching statistics:', error)
    throw error
  }
}

// ============================================
// HELPERS
// ============================================

const transformGameFromDB = (game) => {
  const { extensions, ...gameData } = game

  return {
    ...gameData,
    erweiterungenInBesitz: extensions
      ?.filter(ext => ext.type === 'in_besitz')
      .map(ext => ext.name) || [],
    erweiterungenZurAnschaffung: extensions
      ?.filter(ext => ext.type === 'zur_anschaffung')
      .map(ext => ext.name) || []
  }
}
