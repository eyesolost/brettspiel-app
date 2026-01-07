import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bggService } from '../services/bggService';
import { useGames } from '../context/GameContext';
import { FaSearch, FaDownload, FaStar, FaSpinner, FaCheck } from 'react-icons/fa';
import '../styles/BGGImport.css';

const BGGImport = () => {
  const navigate = useNavigate();
  const { addGame, games } = useGames();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(null);
  const [error, setError] = useState('');
  
  // Neuer State für Import-Dialog
  const [importDialog, setImportDialog] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [selectedPublisher, setSelectedPublisher] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedFamilies, setSelectedFamilies] = useState([]);

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
      // Hole detaillierte Informationen von BGG (inkl. aller Namen, Categories etc.)
      const importData = await bggService.importGame(gameId);
      
      // Finde deutschen Namen (falls vorhanden)
      const germanName = importData.bggData.names.find(n => 
        n.value.match(/[äöüßÄÖÜ]/) || // Hat deutsche Umlaute
        n.type === 'alternate' // Oder ist alternativer Name
      )?.value || importData.gameData.titel;
      
      // Öffne Import-Dialog mit Auswahloptionen
      setImportDialog({
        ...importData,
        suggestedTitle: germanName
      });
      setSelectedTitle(germanName);
      setSelectedPublisher(importData.bggData.publishers[0]?.name || '');
      setSelectedCategories([]);
      setSelectedFamilies([]);
    } catch (err) {
      setError('Fehler beim Laden der Spieldetails. Bitte versuche es erneut.');
      console.error('BGG Import Error:', err);
    } finally {
      setImporting(null);
    }
  };
  
  const handleConfirmImport = async () => {
    if (!importDialog) return;
    
    try {
      // Expansions: Bestimme Besitz/Zur Anschaffung anhand vorhandener Spiele
      const expansions = importDialog.bggData.expansions || [];
      const ownedById = expansions.filter(exp => games.some(g => g.bgg_id === parseInt(exp.id))).map(exp => exp.name);
      const ownedByTitle = expansions.filter(exp => games.some(g => (g.titel || '').toLowerCase() === exp.name.toLowerCase())).map(exp => exp.name);
      const ownedSet = new Set([...ownedById, ...ownedByTitle]);
      const allExpNames = expansions.map(exp => exp.name);
      const erweiterungenInBesitz = Array.from(ownedSet);
      const erweiterungenZurAnschaffung = allExpNames.filter(name => !ownedSet.has(name));

      // Erstelle finales Spiel-Objekt mit Benutzerauswahl
      const finalGame = {
        ...importDialog.gameData,
        titel: selectedTitle,
        verlag: selectedPublisher,
        erweiterungenInBesitz,
        erweiterungenZurAnschaffung,
        // Optional: Kategorien & Families in Info-Feld anhängen
        info: [
          importDialog.gameData.info,
          selectedCategories.length > 0 ? `\n\nKategorien: ${selectedCategories.join(', ')}` : '',
          selectedFamilies.length > 0 ? `\nFamilien: ${selectedFamilies.join(', ')}` : ''
        ].filter(Boolean).join('')
      };
      
      console.log('BGGImport - finalGame vor addGame:', {
        min_spieler: finalGame.min_spieler,
        max_spieler: finalGame.max_spieler,
        min_spielzeit: finalGame.min_spielzeit,
        max_spielzeit: finalGame.max_spielzeit,
        komplexitaet: finalGame.komplexitaet,
        bgg_rating: finalGame.bgg_rating,
        altersempfehlung: finalGame.altersempfehlung,
        awards: finalGame.awards,
        all_keys: Object.keys(finalGame)
      });
      
      // Speichere in lokaler Datenbank (Extensions werden im Service eingefügt)
      await addGame(finalGame);
      
      // Zeige Erfolgsmeldung
      alert(`"${finalGame.titel}" wurde erfolgreich importiert!`);
      
      // Schließe Dialog und navigiere zur Übersicht
      setImportDialog(null);
      navigate('/');
    } catch (err) {
      setError('Fehler beim Speichern. Bitte versuche es erneut.');
      console.error('Save Error:', err);
    }
  };

  const toggleCategory = (categoryName) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const toggleFamily = (familyName) => {
    setSelectedFamilies(prev => 
      prev.includes(familyName)
        ? prev.filter(f => f !== familyName)
        : [...prev, familyName]
    );
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
        {searchResults.length > 0 && !importDialog && (
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
                        Lade...
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
        
        {/* Import-Dialog mit Auswahloptionen */}
        {importDialog && (
          <div className="import-dialog-overlay">
            <div className="import-dialog">
              <h2>🎲 Spiel importieren - Optionen wählen</h2>
              
              {/* Titel-Auswahl */}
              <div className="dialog-section">
                <h3>Titel wählen:</h3>
                <select 
                  className="dialog-select"
                  value={selectedTitle}
                  onChange={(e) => setSelectedTitle(e.target.value)}
                >
                  {importDialog.bggData.names.map((name, index) => (
                    <option key={index} value={name.value}>
                      {name.value}
                      {name.type === 'primary' ? ' (Primary)' : ''}
                      {name.value.match(/[äöüßÄÖÜ]/) ? ' 🇩🇪' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Verlag-Auswahl */}
              {importDialog.bggData.publishers.length > 0 && (
                <div className="dialog-section">
                  <h3>Verlag wählen:</h3>
                  <select 
                    className="dialog-select"
                    value={selectedPublisher}
                    onChange={(e) => setSelectedPublisher(e.target.value)}
                  >
                    {importDialog.bggData.publishers.map((pub, idx) => (
                      <option key={`pub-${idx}`} value={pub.name}>
                        {pub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Categories Multiselect */}
              {importDialog.bggData.categories.length > 0 && (
                <div className="dialog-section">
                  <h3>Kategorien wählen (optional):</h3>
                  <div className="multiselect-options">
                    {importDialog.bggData.categories.map((cat) => (
                      <label key={cat.id} className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(cat.name)}
                          onChange={() => toggleCategory(cat.name)}
                        />
                        <span>{cat.name}</span>
                        {selectedCategories.includes(cat.name) && <FaCheck className="check-icon" />}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Families Multiselect */}
              {importDialog.bggData.families.length > 0 && (
                <div className="dialog-section">
                  <h3>Familien wählen (optional):</h3>
                  <div className="multiselect-options">
                    {importDialog.bggData.families.slice(0, 10).map((fam) => (
                      <label key={fam.id} className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={selectedFamilies.includes(fam.name)}
                          onChange={() => toggleFamily(fam.name)}
                        />
                        <span>{fam.name}</span>
                        {selectedFamilies.includes(fam.name) && <FaCheck className="check-icon" />}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Vorschau */}
              <div className="dialog-section preview-section">
                <h3>Vorschau:</h3>
                <div className="preview-info">
                  <p><strong>Titel:</strong> {selectedTitle}</p>
                  <p><strong>Autor:</strong> {importDialog.gameData.autor}</p>
                  <p><strong>Verlag:</strong> {selectedPublisher}</p>
                  <p><strong>Spieler:</strong> {importDialog.gameData.min_spieler} - {importDialog.gameData.max_spieler}</p>
                  <p><strong>Spieldauer:</strong> {importDialog.gameData.min_spielzeit} - {importDialog.gameData.max_spielzeit} Min.</p>
                  <p><strong>BGG Rating:</strong> {importDialog.gameData.bgg_rating}/10</p>
                  <p><strong>Komplexität:</strong> {importDialog.gameData.komplexitaet}/5</p>
                  <p><strong>Strategie:</strong> {importDialog.gameData.strategie}/10</p>
                  <p><strong>Spaß:</strong> {importDialog.gameData.spass}/10</p>
                  <p><strong>Glück:</strong> {importDialog.gameData.glueck}/10</p>
                  {importDialog.bggData.expansions?.length > 0 && (
                    <p><strong>Erweiterungen gefunden:</strong> {importDialog.bggData.expansions.length}</p>
                  )}
                  {selectedCategories.length > 0 && (
                    <p><strong>Kategorien:</strong> {selectedCategories.join(', ')}</p>
                  )}
                  {selectedFamilies.length > 0 && (
                    <p><strong>Familien:</strong> {selectedFamilies.join(', ')}</p>
                  )}
                </div>
              </div>
              
              {/* Buttons */}
              <div className="dialog-actions">
                <button 
                  onClick={() => setImportDialog(null)} 
                  className="btn btn-secondary"
                >
                  Abbrechen
                </button>
                <button 
                  onClick={handleConfirmImport} 
                  className="btn btn-primary"
                >
                  <FaDownload /> Import bestätigen
                </button>
              </div>
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
              <strong>Titelauswahl:</strong> Wähle zwischen verschiedenen Sprachversionen 
              (deutsche Titel werden automatisch hervorgehoben)
            </li>
            <li>
              <strong>Kategorien & Familien:</strong> Wähle relevante Tags aus, 
              um deine Sammlung besser zu organisieren
            </li>
            <li>
              <strong>Automatisch gefüllt:</strong> Titel, Autor, Verlag, Spieleranzahl, 
              Spieldauer, BGG-Rating, Komplexität, Altersempfehlung
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
