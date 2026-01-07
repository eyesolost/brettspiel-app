// src/services/gamesService.js
// Hybrid Games Service - Supabase Backend mit allen Features vom alten Service
import { supabase } from '../lib/supabaseClient'

/**
 * Games Service - CRUD mit Duplikatserkennung, Export/Import, etc.
 */

// ============================================
// CREATE
// ============================================

/**
 * Create a new game with duplicate detection
 * @param {Object} gameData - Game data
 * @param {boolean} forceCreate - Skip duplicate check
 * @returns {Promise<Object>} Created game
 */
export const createGame = async (gameData, forceCreate = false) => {
  try {
    const { erweiterungenInBesitz, erweiterungenZurAnschaffung, categories, ...gameFields } = gameData
    
    console.log('gameService - createGame - gameFields vor Insert:', {
      min_spieler: gameFields.min_spieler,
      max_spieler: gameFields.max_spieler,
      min_spielzeit: gameFields.min_spielzeit,
      max_spielzeit: gameFields.max_spielzeit,
      komplexitaet: gameFields.komplexitaet,
      bgg_rating: gameFields.bgg_rating,
      altersempfehlung: gameFields.altersempfehlung,
      awards: gameFields.awards,
      alle_keys: Object.keys(gameFields)
    });
    
    // 🔍 Duplikatserkennung (nur wenn nicht forceCreate)
    if (!forceCreate) {
      const duplicateCheck = await checkForDuplicates(gameData)
      
      if (duplicateCheck.found) {
        const error = new Error('DUPLICATE_FOUND')
        error.duplicate = true
        error.reason = duplicateCheck.reason
        error.existingGame = duplicateCheck.existingGame
        error.gameData = gameData
        throw error
      }
    }

    // Insert game
    const insertResponse = await supabase
      .from('games')
      .insert([gameFields])
      .select()

    const { data: insertedGames, error: gameError } = insertResponse

    if (gameError) throw gameError
    
    if (!insertedGames || insertedGames.length === 0) {
      throw new Error('Insert erfolgreich aber kein Datensatz zurückgegeben');
    }
    
    const game = insertedGames[0];
    
    console.log('gameService - createGame - game nach Insert:', {
      min_spieler: game.min_spieler,
      max_spieler: game.max_spieler,
      min_spielzeit: game.min_spielzeit,
      max_spielzeit: game.max_spielzeit,
      komplexitaet: game.komplexitaet,
      bgg_rating: game.bgg_rating,
      altersempfehlung: game.altersempfehlung,
      awards: game.awards
    });

    // Insert extensions
    if (erweiterungenInBesitz?.length > 0) {
      await createExtensions(game.id, erweiterungenInBesitz, 'in_besitz')
    }

    if (erweiterungenZurAnschaffung?.length > 0) {
      await createExtensions(game.id, erweiterungenZurAnschaffung, 'zur_anschaffung')
    }

    // Insert categories
    if (categories?.length > 0) {
      await createCategories(game.id, categories)
    }

    return await getGameById(game.id)
  } catch (error) {
    console.error('Error creating game:', error)
    throw error
  }
}

/**
 * Check for duplicate games
 * @param {Object} gameData - Game to check
 * @returns {Promise<Object>} { found: boolean, reason: string, existingGame: Object }
 */
const checkForDuplicates = async (gameData) => {
  try {
    const { data: allGames, error } = await supabase
      .from('games')
      .select('*')

    if (error) throw error

    let existingGame = null
    let duplicateReason = null

    // 1. BGG-ID identisch (eindeutig!)
    if (gameData.bgg_id) {
      existingGame = allGames.find(g => g.bgg_id === gameData.bgg_id)
      if (existingGame) {
        duplicateReason = 'BGG_ID_MATCH'
        return { found: true, reason: duplicateReason, existingGame }
      }
    }

    // 2. Exakte Übereinstimmung (Titel + Autor + Verlag)
    existingGame = allGames.find(g =>
      g.titel?.toLowerCase() === gameData.titel?.toLowerCase() &&
      g.autor?.toLowerCase() === gameData.autor?.toLowerCase() &&
      g.verlag?.toLowerCase() === gameData.verlag?.toLowerCase()
    )
    if (existingGame) {
      duplicateReason = 'EXACT_MATCH'
      return { found: true, reason: duplicateReason, existingGame }
    }

    // 3. Gleicher Titel + Autor (verschiedener Verlag/Edition)
    existingGame = allGames.find(g =>
      g.titel?.toLowerCase() === gameData.titel?.toLowerCase() &&
      g.autor?.toLowerCase() === gameData.autor?.toLowerCase()
    )
    if (existingGame) {
      duplicateReason = 'DIFFERENT_EDITION'
      return { found: true, reason: duplicateReason, existingGame }
    }

    // 4. Nur gleicher Titel (könnte anderes Spiel sein)
    existingGame = allGames.find(g =>
      g.titel?.toLowerCase() === gameData.titel?.toLowerCase()
    )
    if (existingGame) {
      duplicateReason = 'SAME_TITLE'
      return { found: true, reason: duplicateReason, existingGame }
    }

    return { found: false, reason: null, existingGame: null }
  } catch (error) {
    console.error('Error checking duplicates:', error)
    // Bei Fehler: Keine Duplikatsprüfung → durchlassen
    return { found: false, reason: null, existingGame: null }
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

const createCategories = async (gameId, categoriesData) => {
  // categoriesData ist ein Array von Kategorien:
  // - Aus BGGImport: {id: <BGG_ID (Integer)>, name: "...", name_de: "..."}
  // - Aus GameForm Edit (bestehend): {id: <UUID>, name: "...", name_de: "...", bgg_id: <Integer>}

  for (const cat of categoriesData) {
    let categoryId;
    
    // Neue Kategorie oder aus BGG Import
    let bgg_id = cat.id || cat.bgg_id || null;
    
    // Stelle sicher, dass bgg_id als Integer gespeichert wird
    if (typeof bgg_id === 'string') {
      const parsed = parseInt(bgg_id, 10);
      bgg_id = isNaN(parsed) ? null : parsed;
    } else if (typeof bgg_id === 'number') {
      bgg_id = parseInt(bgg_id, 10);
    }
    
    let name_de = cat.name_de || null;
    let original_name = cat.original_name || null;
    let display_name = cat.name || '';

    // 1. Wenn bgg_id vorhanden: Prüfe nach bgg_id in der Tabelle
    if (bgg_id) {
      const { data: existingList } = await supabase
        .from('categories')
        .select('id, name_de, original_name')
        .eq('bgg_id', bgg_id)
        .limit(1);

      const existing = Array.isArray(existingList) && existingList.length > 0 ? existingList[0] : null;
      
      if (existing) {
        // Kategorie existiert bereits
        categoryId = existing.id;
        // Update name_de falls vorhanden und unterschiedlich
        if (name_de && existing.name_de !== name_de) {
          await supabase
            .from('categories')
            .update({ name_de })
            .eq('id', categoryId);
        }
        console.log(`Using existing category by bgg_id (${bgg_id}): ${categoryId}`);
      } else {
        // Kategorie mit dieser bgg_id existiert nicht → erstelle sie
        // Falls kein name_de, verwende englischen Namen als Fallback (kann später übersetzt werden)
        try {
          const { data: newCatArr, error: catError } = await supabase
            .from('categories')
            .insert([{
              name: name_de || display_name,
              name_de: name_de || display_name,  // Fallback auf englischen Namen
              original_name: original_name || display_name,
              bgg_id
            }])
            .select('id');

          if (catError) throw catError;
          const newCat = Array.isArray(newCatArr) ? newCatArr[0] : newCatArr;
          categoryId = newCat.id;
          console.log(`Created new category with bgg_id (${bgg_id}): ${categoryId}`);
        } catch (insertError) {
          // Unique constraint violation - Kategorie existiert bereits mit diesem Namen
          if (insertError.code === '23505') {
            // Suche nach existierender Kategorie mit diesem Namen
            const { data: existingByName } = await supabase
              .from('categories')
              .select('id')
              .eq('name', name_de || display_name)
              .limit(1);
            
            if (existingByName && existingByName.length > 0) {
              categoryId = existingByName[0].id;
              console.log(`Using existing category by name after duplicate: ${categoryId}`);
            } else {
              throw insertError;
            }
          } else {
            throw insertError;
          }
        }
      }
    } else {
      // 2. Keine bgg_id: Prüfe nach Namen in der Tabelle
      const { data: existingList } = await supabase
        .from('categories')
        .select('id')
        .eq('name', display_name)
        .limit(1);

      const existing = Array.isArray(existingList) && existingList.length > 0 ? existingList[0] : null;

      if (existing) {
        categoryId = existing.id;
        console.log(`Using existing category by name ("${display_name}"): ${categoryId}`);
      } else {
        // Kategorie existiert nicht → erstelle sie
        try {
          const { data: newCatArr, error: catError } = await supabase
            .from('categories')
            .insert([{
              name: display_name,
              name_de
            }])
            .select('id');

          if (catError) throw catError;
          const newCat = Array.isArray(newCatArr) ? newCatArr[0] : newCatArr;
          categoryId = newCat.id;
          console.log(`Created new category by name ("${display_name}"): ${categoryId}`);
        } catch (insertError) {
          // Unique constraint violation - Kategorie existiert bereits
          if (insertError.code === '23505') {
            const { data: existingByName } = await supabase
              .from('categories')
              .select('id')
              .eq('name', display_name)
              .limit(1);
            
            if (existingByName && existingByName.length > 0) {
              categoryId = existingByName[0].id;
              console.log(`Using existing category by name after duplicate: ${categoryId}`);
            } else {
              throw insertError;
            }
          } else {
            throw insertError;
          }
        }
      }
    }

    // Verknüpfung erstellen (game_categories)
    const { error: linkError } = await supabase
      .from('game_categories')
      .insert([{ game_id: gameId, category_id: categoryId }]);

    if (linkError && linkError.code !== '23505') { // 23505 = unique constraint (ignore)
      throw linkError;
    }
  }
};

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

    // Categories separat laden (Supabase unterstützt nested many-to-many nicht direkt)
    const gamesWithCategories = await Promise.all(
      games.map(async (game) => {
        const { data: gameCats } = await supabase
          .from('game_categories')
          .select(`
            category_id,
            categories (
              id,
              name,
              name_de,
              original_name,
              bgg_id
            )
          `)
          .eq('game_id', game.id)
        
        return {
          ...game,
          categories: gameCats?.map(gc => gc.categories) || []
        }
      })
    )

    return gamesWithCategories.map(game => transformGameFromDB(game))
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

    // Categories laden
    const { data: gameCats } = await supabase
      .from('game_categories')
      .select(`
        category_id,
        categories (
          id,
          name,
          name_de,
          original_name,
          bgg_id
        )
      `)
      .eq('game_id', game.id)
    
    const gameWithCategories = {
      ...game,
      categories: gameCats?.map(gc => gc.categories) || []
    }

    return transformGameFromDB(gameWithCategories)
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
    const { erweiterungenInBesitz, erweiterungenZurAnschaffung, categories, ...gameUpdates } = updates

    // Update game (only if there are fields to update)
    if (Object.keys(gameUpdates).length > 0) {
      const { error: gameError } = await supabase
        .from('games')
        .update(gameUpdates)
        .eq('id', id)

      if (gameError) throw gameError
    }

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

    // Update categories if provided
    if (categories !== undefined) {
      // Delete existing links
      await supabase
        .from('game_categories')
        .delete()
        .eq('game_id', id)

      if (categories?.length > 0) {
        await createCategories(id, categories)
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
// IMPORT / EXPORT
// ============================================

/**
 * Import games from array (z.B. aus JSON)
 * @param {Array<Object>} gamesArray - Array of games to import
 * @param {boolean} skipDuplicates - Skip duplicates instead of failing
 * @returns {Promise<Object>} { success: Array, failed: Array, skipped: Array }
 */
export const importGames = async (gamesArray, skipDuplicates = true) => {
  try {
    const results = []
    const errors = []
    const skipped = []

    for (const gameData of gamesArray) {
      try {
        // Transform old format to new format
        const transformedGame = transformGameToSupabase(gameData)
        
        // Try to create
        const game = await createGame(transformedGame, !skipDuplicates)
        results.push(game)
        
        console.log(`✅ Imported: ${gameData.titel}`)
      } catch (error) {
        if (error.duplicate && skipDuplicates) {
          // Skip duplicate
          skipped.push({
            game: gameData.titel,
            reason: error.reason,
            existingGame: error.existingGame
          })
          console.log(`⏭️  Skipped (duplicate): ${gameData.titel}`)
        } else {
          // Real error
          errors.push({
            game: gameData.titel,
            error: error.message
          })
          console.error(`❌ Failed: ${gameData.titel}`, error)
        }
      }
    }

    const summary = {
      success: results,
      failed: errors,
      skipped: skipped,
      total: gamesArray.length,
      imported: results.length,
      failedCount: errors.length,
      skippedCount: skipped.length
    }

    console.log('📊 Import Summary:', summary)
    
    return summary
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

/**
 * Export games as file download
 */
export const exportToFile = async () => {
  try {
    const games = await exportGames()
    const dataStr = JSON.stringify(games, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    // Create download link
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    
    // Filename with current date
    const today = new Date().toISOString().split('T')[0]
    link.download = `brettspiele_backup_${today}.json`
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    console.log('✅ Export successful:', link.download)
  } catch (error) {
    console.error('Error exporting to file:', error)
    throw error
  }
}

/**
 * Import games from file
 */
export const importFromFile = async (file, skipDuplicates = true) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const games = JSON.parse(e.target.result)
        
        // Validation
        if (!Array.isArray(games)) {
          throw new Error('Datei enthält kein gültiges Spiele-Array')
        }
        
        if (games.length > 0 && !games[0].titel) {
          throw new Error('Ungültiges Spiele-Format')
        }
        
        // Import to Supabase
        const result = await importGames(games, skipDuplicates)
        resolve(result)
      } catch (error) {
        reject(new Error('Fehler beim Lesen der Datei: ' + error.message))
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Fehler beim Lesen der Datei'))
    }
    
    reader.readAsText(file)
  })
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

/**
 * Transform game from DB to app format
 */
const transformGameFromDB = (game) => {
  const { extensions, categories, ...gameData } = game

  return {
    ...gameData,
    erweiterungenInBesitz: extensions
      ?.filter(ext => ext.type === 'in_besitz')
      .map(ext => ext.name) || [],
    erweiterungenZurAnschaffung: extensions
      ?.filter(ext => ext.type === 'zur_anschaffung')
      .map(ext => ext.name) || [],
    categories: categories || []
  }
}

/**
 * Transform game from old localStorage format to Supabase format
 */
const transformGameToSupabase = (oldGame) => {
  return {
    // Basic info - map old keys to new keys
    titel: oldGame.titel,
    verlag: oldGame.verlag,
    autor: oldGame.autor,
    bgg_id: oldGame.bggId || oldGame.bgg_id,
    
    // Player info
    min_spieler: oldGame.minSpieler || oldGame.min_spieler,
    max_spieler: oldGame.maxSpieler || oldGame.max_spieler,
    optimale_spieleranzahl: oldGame.optimaleSpieleranzahl || oldGame.optimale_spieleranzahl,
    
    // Time info
    min_spielzeit: oldGame.minSpielzeit || oldGame.min_spielzeit,
    max_spielzeit: oldGame.maxSpielzeit || oldGame.max_spielzeit,
    
    // Ratings
    spass: oldGame.spass,
    strategie: oldGame.strategie,
    glueck: oldGame.glueck,
    komplexitaet: oldGame.komplexitaet,
        
    // Age & Awards
    altersempfehlung: oldGame.altersempfehlung,
    awards: oldGame.awards,
    
    // Status & Location
    fehlteile: oldGame.fehlteile || false,
            
    // Extensions
    erweiterungenInBesitz: oldGame.erweiterungenInBesitz || [],
    erweiterungenZurAnschaffung: oldGame.erweiterungenZurAnschaffung || []
  }
}