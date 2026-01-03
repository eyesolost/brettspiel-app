import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bggService } from '../services/bggService';
import { useGames } from '../context/GameContext';
import { FaSearch, FaDownload, FaStar, FaSpinner } from 'react-icons/fa';
import '../styles/BGGImport.css';

const BGGImport = () => {
  const navigate = useNavigate();
  const { addGame } = useGames();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const results = await bggService.searchGames(searchQuery);
      setSearchResults(results);
      
      if (results.length === 0) {
        setError('Keine Spiele gefunden. Versuche einen anderen Suchbegriff.');
      }
    } catch (err) {
      setError('Fehler bei der Suche. Bitte versuche es erneut.');
      console.error('BGG Search Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (gameId) => {
    setImporting(gameId);
    setError('');

    try {
      // Hole detaillierte Informationen von BGG
      const importedGame = await bggService.importGame(gameId);
      
      // Speichere in lokaler Datenbank
      await addGame(importedGame);
      
      // Zeige Erfolgsmeldung
      alert(`"${importedGame.titel}" wurde erfolgreich importiert!`);
      
      // Navigiere zur Übersicht
      navigate('/');
    } catch (err) {
      setError('Fehler beim Importieren. Bitte versuche es erneut.');
      console.error('BGG Import Error:', err);
    } finally {
      setImporting(null);
    }
  };

  const handleQuickImport = async () => {
    // Hole die aktuell trending Spiele
    setLoading(true);
    setError('');

    try {
      const hotGames = await bggService.getHotGames();
      setSearchResults(hotGames.slice(0, 10)); // Top 10
    } catch (err) {
      setError('Fehler beim Laden der Hot Games.');
      console.error('BGG Hot Games Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bgg-import-container">
      <div className="page-header">
        <h1>🎲 BGG Import</h1>
        <p>Importiere Spiele direkt von BoardGameGeek</p>
      </div>

      <div className="bgg-import-content">
        {/* Suchformular */}
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-group">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Spielname eingeben (z.B. Catan, Wingspan)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <FaSpinner className="spinner-icon" /> : 'Suchen'}
              </button>
            </div>
          </form>

          <div className="quick-actions">
            <button
              onClick={handleQuickImport}
              className="btn btn-secondary"
              disabled={loading}
            >
              <FaStar /> Top 10 Trending anzeigen
            </button>
          </div>
        </div>

        {/* Fehleranzeige */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        {/* Suchergebnisse */}
        {searchResults.length > 0 && (
          <div className="results-section">
            <h2>Suchergebnisse ({searchResults.length})</h2>
            <div className="results-grid">
              {searchResults.map((game) => (
                <div key={game.id} className="game-card">
                  <div className="game-card-header">
                    <h3>{game.name}</h3>
                    {game.yearPublished && (
                      <span className="year-badge">{game.yearPublished}</span>
                    )}
                  </div>
                  
                  <div className="game-card-meta">
                    <span className="game-id">BGG ID: {game.id}</span>
                    {game.rank && (
                      <span className="game-rank">
                        <FaStar className="rank-icon" />
                        #{game.rank}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleImport(game.id)}
                    className="btn-import"
                    disabled={importing === game.id}
                  >
                    {importing === game.id ? (
                      <>
                        <FaSpinner className="spinner-icon" />
                        Importiere...
                      </>
                    ) : (
                      <>
                        <FaDownload />
                        Importieren
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info-Box */}
        <div className="info-box">
          <h3>ℹ️ Hinweise zur BGG-Integration</h3>
          <ul>
            <li>
              <strong>Rate Limit:</strong> BGG erlaubt nur 1 Anfrage alle 5 Sekunden. 
              Bitte habe etwas Geduld beim Importieren.
            </li>
            <li>
              <strong>Automatisch gefüllt:</strong> Titel, Autor, Verlag, Spieleranzahl, 
              Spieldauer, BGG-Rating, Komplexität, Altersempfehlung
            </li>
            <li>
              <strong>Manuell ergänzen:</strong> Standort, Erweiterungen, Fehlteile, 
              Awards, persönliche Bewertungen
            </li>
            <li>
              <strong>Bearbeitung:</strong> Nach dem Import kannst du alle Felder 
              in der Spieleübersicht bearbeiten
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BGGImport;
