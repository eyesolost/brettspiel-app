import React, { useState } from "react";
import { useGames } from "../context/GameContext";
import { gameService } from "../services/gameService";
import { FaDownload, FaUpload, FaInfoCircle } from "react-icons/fa";
import "../styles/DataManager.css";

const DataManager = () => {
  const { games, refreshGames } = useGames();
  const [importing, setImporting] = useState(false);

  // 📥 EXPORT - Download als JSON
  const handleExport = () => {
    try {
      gameService.exportToFile();
      alert(
        `✅ Backup erfolgreich erstellt!\n\n` +
          `${games.length} Spiele wurden exportiert.\n\n` +
          `Die Datei wurde heruntergeladen und kann später wieder importiert werden.`
      );
    } catch (error) {
      alert("❌ Fehler beim Export: " + error.message);
    }
  };

  // 📤 IMPORT - Wähle JSON-Datei
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return; 

    // Sicherheitsabfrage
    const confirm = window.confirm(
      `⚠️ ACHTUNG: Import überschreibt ALLE aktuellen Daten!\n\n` +
        `Aktuell: ${games.length} Spiele\n` +
        `Datei: ${file.name}\n\n` +
        `Möchtest du fortfahren?`
    );

    if (!confirm) {
      event.target.value = null;
      return;
    }

    setImporting(true);
    try {
      const importedGames = await gameService.importFromFile(file);
      await refreshGames();

      alert(
        `✅ Import erfolgreich!\n\n` +
          `${importedGames.length} Spiele wurden importiert.\n\n` +
          `Deine Sammlung wurde wiederhergestellt.`
      );
    } catch (error) {
      alert("❌ Fehler beim Import: " + error.message);
    } finally {
      setImporting(false);
      event.target.value = null;
    }
  };

  // 🗑️ RESET - Zurück zu Beispieldaten
  const handleReset = async () => {
    const confirm = window.confirm(
      `⚠️ ACHTUNG: Alle Daten werden gelöscht!\n\n` +
        `Aktuell: ${games.length} Spiele\n\n` +
        `Die App wird auf die 3 Beispielspiele zurückgesetzt.\n\n` +
        `Fortfahren?`
    );

    if (!confirm) return;

    try {
      await gameService.resetToDefault();
      await refreshGames();
      alert("✅ App wurde zurückgesetzt!");
    } catch (error) {
      alert("❌ Fehler beim Reset: " + error.message);
    }
  };

  return (
    <div className="data-manager-container">
      <div className="page-header">
        <h1>💾 Daten-Verwaltung</h1>
        <p>Sichere deine Spielesammlung und stelle sie wieder her</p>
      </div>

      <div className="data-manager-grid">
        {/* EXPORT */}
        <div className="manager-card export-card">
          <div className="card-icon export">
            <FaDownload />
          </div>
          <h3>Backup erstellen</h3>
          <p>Exportiere deine komplette Spielesammlung als JSON-Datei</p>
          <div className="manager-stats">
            <span className="stat-badge">{games.length} Spiele</span>
          </div>
          <p className="hint-text">
            💡 Die Datei wird heruntergeladen und kann später wieder importiert
            werden
          </p>
          <button onClick={handleExport} className="btn btn-primary btn-large">
            <FaDownload /> Jetzt Backup erstellen
          </button>
        </div>

        {/* IMPORT */}
        <div className="manager-card import-card">
          <div className="card-icon import">
            <FaUpload />
          </div>
          <h3>Backup wiederherstellen</h3>
          <p>Importiere eine gesicherte Spielesammlung</p>
          <p className="warning-text">⚠️ Überschreibt alle aktuellen Daten!</p>
          <p className="hint-text">
            💡 Wähle eine zuvor exportierte JSON-Datei
          </p>
          <label className="btn btn-secondary btn-large">
            <FaUpload /> {importing ? "Importiere..." : "Backup-Datei wählen"}
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={importing}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {/* RESET */}
        <div className="manager-card reset-card">
          <div className="card-icon reset">🔄</div>
          <h3>Zurücksetzen</h3>
          <p>Setze die App auf die 3 Beispielspiele zurück</p>
          <p className="warning-text">⚠️ Löscht alle deine Spiele!</p>
          <p className="hint-text">💡 Nützlich zum Neustart oder Testen</p>
          <button onClick={handleReset} className="btn btn-danger btn-large">
            🗑️ Auf Beispieldaten zurücksetzen
          </button>
        </div>
      </div>

      {/* WORKFLOW-INFO */}
      <div className="workflow-box">
        <h3>📋 So funktioniert's:</h3>
        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Backup erstellen</h4>
              <p>
                Klicke auf "Backup erstellen" → JSON-Datei wird heruntergeladen
              </p>
            </div>
          </div>
          <div className="workflow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Datei sichern</h4>
              <p>
                Speichere die Datei an einem sicheren Ort (z.B. Cloud,
                USB-Stick)
              </p>
            </div>
          </div>
          <div className="workflow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Wiederherstellen</h4>
              <p>
                Bei Bedarf: "Backup-Datei wählen" → Datei auswählen → Fertig!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* INFO-BOX */}
      <div className="info-box">
        <h3>
          <FaInfoCircle /> Wichtige Informationen:
        </h3>
        <ul>
          <li>
            <strong>Regelmäßige Backups:</strong> Erstelle Backups bevor du
            größere Änderungen machst
          </li>
          <li>
            <strong>Dateiname:</strong> Die Backup-Datei heißt z.B.
            "brettspiele_backup_2025-01-01.json"
          </li>
          <li>
            <strong>Import überschreibt:</strong> Beim Import werden ALLE
            aktuellen Spiele ersetzt
          </li>
          <li>
            <strong>Mehrere Backups:</strong> Du kannst mehrere Backup-Dateien
            haben (verschiedene Stände)
          </li>
          <li>
            <strong>Browser-Cache:</strong> Wenn du den Browser-Cache löschst,
            sind die Daten weg! → Backup!
          </li>
        </ul>
      </div>

      {/* TIPPS */}
      <div className="tips-box">
        <h3>💡 Profi-Tipps:</h3>
        <div className="tips-grid">
          <div className="tip">
            <strong>Wöchentlich sichern</strong>
            <p>Erstelle jeden Sonntag ein Backup</p>
          </div>
          <div className="tip">
            <strong>Cloud-Speicher</strong>
            <p>Speichere Backups in Dropbox/Google Drive</p>
          </div>
          <div className="tip">
            <strong>Versionierung</strong>
            <p>Behalte mehrere Backup-Versionen</p>
          </div>
          <div className="tip">
            <strong>Vor Updates</strong>
            <p>Backup vor größeren Änderungen!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManager;
