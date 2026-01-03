// src/hooks/useSimpleGames.js
// React Hook für Games OHNE Auth
import { useState, useEffect, useCallback } from 'react'
import {
  getAllGames,
  getGameById,
  createGame,
  updateGame,
  deleteGame,
  deleteMultipleGames,
  searchGames,
  filterGames,
  getStatistics
} from '../services/simpleGamesService'

/**
 * Hook for managing games (Simple Version - ohne Auth)
 */
export const useGames = () => {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all games
  const fetchGames = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllGames()
      setGames(data)
    } catch (err) {
      console.error('Error fetching games:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  // Add game
  const addGame = async (gameData) => {
    try {
      setError(null)
      const newGame = await createGame(gameData)
      setGames(prev => [newGame, ...prev])
      return { success: true, data: newGame }
    } catch (err) {
      console.error('Error adding game:', err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Update game
  const editGame = async (id, updates) => {
    try {
      setError(null)
      const updatedGame = await updateGame(id, updates)
      setGames(prev => prev.map(game => 
        game.id === id ? updatedGame : game
      ))
      return { success: true, data: updatedGame }
    } catch (err) {
      console.error('Error updating game:', err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Delete game
  const removeGame = async (id) => {
    try {
      setError(null)
      await deleteGame(id)
      setGames(prev => prev.filter(game => game.id !== id))
      return { success: true }
    } catch (err) {
      console.error('Error deleting game:', err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Delete multiple games
  const removeMultipleGames = async (ids) => {
    try {
      setError(null)
      await deleteMultipleGames(ids)
      setGames(prev => prev.filter(game => !ids.includes(game.id)))
      return { success: true }
    } catch (err) {
      console.error('Error deleting games:', err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Search games
  const search = async (searchTerm) => {
    try {
      setLoading(true)
      setError(null)
      const results = await searchGames(searchTerm)
      setGames(results)
      return { success: true, data: results }
    } catch (err) {
      console.error('Error searching games:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Filter games
  const filter = async (filters) => {
    try {
      setLoading(true)
      setError(null)
      const results = await filterGames(filters)
      setGames(results)
      return { success: true, data: results }
    } catch (err) {
      console.error('Error filtering games:', err)
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  // Reset to all games
  const reset = async () => {
    await fetchGames()
  }

  return {
    games,
    loading,
    error,
    addGame,
    editGame,
    removeGame,
    removeMultipleGames,
    search,
    filter,
    reset,
    refresh: fetchGames
  }
}

/**
 * Hook for a single game
 */
export const useGame = (id) => {
  const [game, setGame] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchGame = async () => {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await getGameById(id)
        setGame(data)
      } catch (err) {
        console.error('Error fetching game:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchGame()
  }, [id])

  return { game, loading, error }
}

/**
 * Hook for game statistics
 */
export const useGameStats = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getStatistics()
      setStats(data)
    } catch (err) {
      console.error('Error fetching statistics:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refresh: fetchStats }
}
