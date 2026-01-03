import React, { createContext, useState, useEffect, useContext } from 'react';
import { gameService } from '../services/gameService';

const GameContext = createContext();

export const useGames = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGames must be used within a GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      setLoading(true);
      const loadedGames = await gameService.getAllGames();
      setGames(loadedGames);
    } catch (error) {
      console.error('Fehler beim Laden der Spiele:', error);
    } finally {
      setLoading(false);
    }
  };

  const addGame = async (game) => {
    try {
      const newGame = await gameService.createGame(game);
      setGames([...games, newGame]);
      return newGame;
    } catch (error) {
      // 🔍 Prüfe ob es ein Duplikat-Error ist
      if (error.duplicate) {
        let message = '';
        
        // Erstelle passende Message basierend auf Duplikat-Grund
        switch(error.reason) {
          case 'EXACT_MATCH':
            message = `⚠️ "${error.existingGame.titel}" ist bereits vorhanden (gleicher Titel, Autor UND Verlag).\n\n` +
                      `Möchtest du es trotzdem nochmal hinzufügen?\n` +
                      `(z.B. für eine zweite Ausgabe)`;
            break;
            
          case 'BGG_ID_MATCH':
            message = `⚠️ "${error.existingGame.titel}" wurde bereits von BGG importiert.\n\n` +
                      `BGG-ID stimmt überein → Es ist definitiv dasselbe Spiel.\n\n` +
                      `Trotzdem nochmal hinzufügen?`;
            break;
            
          case 'DIFFERENT_EDITION':
            message = `⚠️ "${error.existingGame.titel}" von ${error.existingGame.autor} existiert bereits.\n\n` +
                      `Möglicherweise eine andere Edition/Verlag?\n` +
                      `Vorhandener Verlag: ${error.existingGame.verlag}\n` +
                      `Neuer Verlag: ${error.gameData.verlag}\n\n` +
                      `Trotzdem hinzufügen?`;
            break;
            
          case 'SAME_TITLE':
            message = `⚠️ Ein Spiel mit dem Titel "${error.existingGame.titel}" existiert bereits.\n\n` +
                      `⚠️ ACHTUNG: Autor unterscheidet sich!\n` +
                      `Vorhandener Autor: ${error.existingGame.autor}\n` +
                      `Neuer Autor: ${error.gameData.autor}\n\n` +
                      `Trotzdem hinzufügen?`;
            break;
            
          default:
            // Fallback-Message
            message = `⚠️ "${error.existingGame.titel}" existiert bereits in deiner Sammlung!\n\n` +
                      `Vorhandenes Spiel:\n` +
                      `• Standort: ${error.existingGame.standort || 'Nicht angegeben'}\n` +
                      `• Status: ${error.existingGame.status}\n\n` +
                      `Möchtest du es trotzdem nochmal hinzufügen?\n` +
                      `(z.B. wenn du das Spiel doppelt besitzt)`;
        }
        
        // 🔔 Zeige Confirm-Dialog
        const userWillDoppelt = window.confirm(message);
        
        if (userWillDoppelt) {
          // User will trotzdem hinzufügen → Mit forceCreate nochmal versuchen
          try {
            const newGame = await gameService.createGame(error.gameData, true);
            setGames([...games, newGame]);
            return newGame;
          } catch (err) {
            console.error('Fehler beim erzwungenen Hinzufügen:', err);
            throw err;
          }
        } else {
          // User will nicht → Error weiterwerfen
          throw new Error('Erstellung durch User abgebrochen');
        }
      }
      
      // Anderer Fehler → Weiterwerfen
      console.error('Fehler beim Hinzufügen des Spiels:', error);
      throw error;
    }
  };

  const updateGame = async (id, updatedGame) => {
    try {
      const updated = await gameService.updateGame(id, updatedGame);
      setGames(games.map(game => game.id === id ? updated : game));
      return updated;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Spiels:', error);
      throw error;
    }
  };

  const deleteGame = async (id) => {
    try {
      await gameService.deleteGame(id);
      setGames(games.filter(game => game.id !== id));
    } catch (error) {
      console.error('Fehler beim Löschen des Spiels:', error);
      throw error;
    }
  };

  const getGameById = (id) => {
    return games.find(game => game.id === parseInt(id));
  };

  const value = {
    games,
    loading,
    addGame,
    updateGame,
    deleteGame,
    getGameById,
    refreshGames: loadGames
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};