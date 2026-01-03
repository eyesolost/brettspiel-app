import initialGamesData from "../data/gamesData.json";

const STORAGE_KEY = "brettspiel_sammlung";

class GameService {
  constructor() {
    this.initializeStorage();
  }

  initializeStorage() {
    const existingData = localStorage.getItem(STORAGE_KEY);
    if (!existingData) {
      // Erste Initialisierung mit Beispieldaten
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialGamesData));
    }
  }

  getAllGames() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = localStorage.getItem(STORAGE_KEY);
        const games = data ? JSON.parse(data) : [];
        resolve(games);
      }, 100); // Simuliert asynchronen Aufruf
    });
  }

  getGameById(id) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const data = localStorage.getItem(STORAGE_KEY);
        const games = data ? JSON.parse(data) : [];
        const game = games.find((g) => g.id === parseInt(id));

        if (game) {
          resolve(game);
        } else {
          reject(new Error("Spiel nicht gefunden"));
        }
      }, 50);
    });
  }

  createGame(gameData, forceCreate = false) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const data = localStorage.getItem(STORAGE_KEY);
        const games = data ? JSON.parse(data) : [];

        let duplicateReason = null;
        let existingGame = null;

        // 🔍 Nur prüfen wenn NICHT forceCreate
        if (!forceCreate) {
          // 1. BGG-ID identisch (eindeutig!)
          if (gameData.bggId) {
            const bggDuplicate = games.find((g) => g.bggId === gameData.bggId);
            if (bggDuplicate) {
              existingGame = bggDuplicate;
              duplicateReason = "BGG_ID_MATCH";
            }
          }

          // 2. Exakte Übereinstimmung (Titel + Autor + Verlag)
          if (!existingGame) {
            existingGame = games.find(
              (g) =>
                g.titel.toLowerCase() === gameData.titel.toLowerCase() &&
                g.autor?.toLowerCase() === gameData.autor?.toLowerCase() &&
                g.verlag?.toLowerCase() === gameData.verlag?.toLowerCase()
            );
            if (existingGame) duplicateReason = "EXACT_MATCH";
          }

          // 3. Gleicher Titel + Autor (verschiedener Verlag/Edition)
          if (!existingGame) {
            existingGame = games.find(
              (g) =>
                g.titel.toLowerCase() === gameData.titel.toLowerCase() &&
                g.autor?.toLowerCase() === gameData.autor?.toLowerCase()
            );
            if (existingGame) duplicateReason = "DIFFERENT_EDITION";
          }

          // 4. Nur gleicher Titel (könnte anderes Spiel sein)
          if (!existingGame) {
            existingGame = games.find(
              (g) => g.titel.toLowerCase() === gameData.titel.toLowerCase()
            );
            if (existingGame) duplicateReason = "SAME_TITLE";
          }
        }

        // Duplikat gefunden → Error werfen
        if (existingGame && !forceCreate) {
          const error = new Error("DUPLICATE_FOUND");
          error.duplicate = true;
          error.reason = duplicateReason;
          error.existingGame = existingGame;
          error.gameData = gameData;
          reject(error);
          return;
        }

        // Generiere neue ID
        const maxId =
          games.length > 0 ? Math.max(...games.map((g) => g.id)) : 0;
        const newGame = {
          ...gameData,
          id: maxId + 1,
        };

        games.push(newGame);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
        resolve(newGame);
      }, 100);
    });
  }

  updateGame(id, gameData) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const data = localStorage.getItem(STORAGE_KEY);
        const games = data ? JSON.parse(data) : [];

        const index = games.findIndex((g) => g.id === parseInt(id));

        if (index !== -1) {
          games[index] = { ...gameData, id: parseInt(id) };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
          resolve(games[index]);
        } else {
          reject(new Error("Spiel nicht gefunden"));
        }
      }, 100);
    });
  }

  deleteGame(id) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = localStorage.getItem(STORAGE_KEY);
        const games = data ? JSON.parse(data) : [];

        const filteredGames = games.filter((g) => g.id !== parseInt(id));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredGames));
        resolve();
      }, 100);
    });
  }

  // Zusätzliche Hilfsfunktionen
  exportGames() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  importGames(gamesArray) {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gamesArray));
        resolve(gamesArray);
      }, 100);
    });
  }

 /**
 * Exportiert alle Spiele als JSON-Download
 */
exportToFile() {
  const games = this.exportGames();
  const dataStr = JSON.stringify(games, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  // Erstelle Download-Link
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  
  // Dateiname mit aktuellem Datum
  const today = new Date().toISOString().split('T')[0];
  link.download = `brettspiele_backup_${today}.json`;
  
  // Trigger Download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Importiert Spiele aus JSON-Datei
 */
importFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const games = JSON.parse(e.target.result);
        
        // Validierung
        if (!Array.isArray(games)) {
          throw new Error('Datei enthält kein gültiges Spiele-Array');
        }
        
        // Prüfe ob Spiele das richtige Format haben
        if (games.length > 0 && !games[0].titel) {
          throw new Error('Ungültiges Spiele-Format');
        }
        
        // Speichere importierte Daten
        localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
        resolve(games);
      } catch (error) {
        reject(new Error('Fehler beim Lesen der Datei: ' + error.message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Fehler beim Lesen der Datei'));
    };
    
    reader.readAsText(file);
  });
}

  resetToDefault() {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialGamesData));
        resolve(initialGamesData);
      }, 100);
    });
  }
}

export const gameService = new GameService();
