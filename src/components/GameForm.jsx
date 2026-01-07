import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGames } from '../context/GameContext';
import { FaSave, FaTimes, FaPlus } from 'react-icons/fa';
import CategoryDialog from './CategoryDialog';
import '../styles/GameForm.css';

const GameForm = ({ mode = 'add' }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addGame, updateGame, getGameById } = useGames();

  const [formData, setFormData] = useState({
    titel: '',
    fehlteile: false,
    minMaxSpieler: '',
    minMaxSpielzeit: '',
    spieler: '',
    erweiterungenInBesitz: [],
    erweiterungenZurAnschaffung: [],
    categories: [],
    strategie: 5,
    spass: 5,
    glueck: 5,
    altersempfehlung: 10,
    awards: '',
    verlag: '',
    autor: '',
    standort: '',
    anschaffungsdatum: new Date().toISOString().split('T')[0],
    status: 'Im Besitz',
    info: '',
    komplexitaet: 3,
    rohrstrat: '',
    bgg_rating: 7.0,
    optimaleSpieleranzahl: ''
  });

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [draggedExtension, setDraggedExtension] = useState(null);

  const reverseTransformFormData = (data) => {
    // Transform database schema back to form data
    const transformed = { ...data };
    
    // Combine min_spieler and max_spieler into minMaxSpieler
    if (data.min_spieler || data.max_spieler) {
      transformed.minMaxSpieler = `${data.min_spieler || ''}-${data.max_spieler || ''}`;
    }
    delete transformed.min_spieler;
    delete transformed.max_spieler;
    
    // Combine min_spielzeit and max_spielzeit into minMaxSpielzeit
    if (data.min_spielzeit || data.max_spielzeit) {
      transformed.minMaxSpielzeit = `${data.min_spielzeit || ''}-${data.max_spielzeit || ''}`;
    }
    delete transformed.min_spielzeit;
    delete transformed.max_spielzeit;
    
    // Rename optimale_spieleranzahl to optimaleSpieleranzahl
    if (data.optimale_spieleranzahl) {
      transformed.optimaleSpieleranzahl = data.optimale_spieleranzahl;
    }
    delete transformed.optimale_spieleranzahl;
    
    return transformed;
  };

  useEffect(() => {
    if (mode === 'edit' && id) {
      const game = getGameById(id);
      if (game) {
        const formattedGame = reverseTransformFormData(game);
        setFormData({
          ...formattedGame,
          erweiterungenInBesitz: game.erweiterungenInBesitz || [],
          erweiterungenZurAnschaffung: game.erweiterungenZurAnschaffung || [],
          categories: game.categories || []
        });
      }
    }
    
    // Load all available categories from context or database
    // For now, we'll assume they come from the game context
    // This would need to be enhanced to fetch all categories from the database
  }, [mode, id, getGameById]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleDragStart = (e, extensionName, sourceType) => {
    setDraggedExtension({ name: extensionName, source: sourceType });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetType) => {
    e.preventDefault();
    
    if (!draggedExtension || draggedExtension.source === targetType) {
      setDraggedExtension(null);
      return;
    }

    // Verschiebe Extension bidirektional
    let newInBesitz = [...formData.erweiterungenInBesitz];
    let newZurAnschaffung = [...formData.erweiterungenZurAnschaffung];

    if (draggedExtension.source === 'besitz' && targetType === 'anschaffung') {
      // Von "im Besitz" nach "zur Anschaffung"
      newInBesitz = newInBesitz.filter(ext => ext !== draggedExtension.name);
      newZurAnschaffung = [...newZurAnschaffung, draggedExtension.name];
    } else if (draggedExtension.source === 'anschaffung' && targetType === 'besitz') {
      // Von "zur Anschaffung" nach "im Besitz"
      newZurAnschaffung = newZurAnschaffung.filter(ext => ext !== draggedExtension.name);
      newInBesitz = [...newInBesitz, draggedExtension.name];
    }

    setFormData({
      ...formData,
      erweiterungenInBesitz: newInBesitz,
      erweiterungenZurAnschaffung: newZurAnschaffung
    });

    // Wenn im Edit-Modus, direkt DB updaten
    if (mode === 'edit' && id) {
      try {
        await updateGame(id, {
          erweiterungenInBesitz: newInBesitz,
          erweiterungenZurAnschaffung: newZurAnschaffung
        });
      } catch (error) {
        console.error('Fehler beim Aktualisieren der Extensions:', error);
        alert('Fehler beim Verschieben der Erweiterung.');
      }
    }

    setDraggedExtension(null);
  };

  const handleRemoveErweiterung = (type, index) => {
    const field = type === 'besitz' ? 'erweiterungenInBesitz' : 'erweiterungenZurAnschaffung';
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index)
    });
  };

  const handleOpenCategoryDialog = () => {
    setCategoryDialogOpen(true);
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialogOpen(false);
  };

  const handleSaveNewCategory = (newCategory) => {
    // Check if category already exists
    const exists = formData.categories.some(
      cat => cat.name?.toLowerCase() === newCategory.name.toLowerCase()
    );
    
    if (exists) {
      alert('Diese Kategorie existiert bereits.');
      return;
    }

    setFormData({
      ...formData,
      categories: [...formData.categories, newCategory]
    });
    setCategoryDialogOpen(false);
  };

  const handleSelectExistingCategory = (category) => {
    // Check if already selected
    const exists = formData.categories.some(
      cat => cat.id === category.id || cat.name === category.name
    );
    
    if (exists) {
      alert('Diese Kategorie ist bereits ausgewählt.');
      return;
    }

    setFormData({
      ...formData,
      categories: [...formData.categories, category]
    });
  };

  const handleRemoveCategory = (index) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((_, i) => i !== index)
    });
  };

  const transformFormData = (data) => {
    const transformed = {};
    
    // List of numeric fields that should not be empty strings
    const numericFields = [
      'min_spieler', 'max_spieler', 'optimale_spieleranzahl',
      'min_spielzeit', 'max_spielzeit',
      'spass', 'strategie', 'glueck', 'komplexitaet',
      'altersempfehlung', 'rohrstrat'
    ];
    
    // Float fields (not to be treated as integers)
    const floatFields = ['bgg_rating'];
    
    // Copy all fields from data
    Object.keys(data).forEach(key => {
      transformed[key] = data[key];
    });
    
    // Split minMaxSpieler into min_spieler and max_spieler
    if (data.minMaxSpieler && data.minMaxSpieler.trim()) {
      const parts = data.minMaxSpieler.split('-').map(v => {
        const num = parseInt(v.trim());
        return isNaN(num) ? null : num;
      });
      transformed.min_spieler = parts[0];
      transformed.max_spieler = parts[1];
      console.log('GameForm - transformFormData: Spieler zerlegt', {
        input: data.minMaxSpieler,
        min_spieler: transformed.min_spieler,
        max_spieler: transformed.max_spieler
      });
    } else {
      delete transformed.min_spieler;
      delete transformed.max_spieler;
    }
    delete transformed.minMaxSpieler;
    
    // Split minMaxSpielzeit into min_spielzeit and max_spielzeit
    if (data.minMaxSpielzeit && data.minMaxSpielzeit.trim()) {
      const parts = data.minMaxSpielzeit.split('-').map(v => {
        const num = parseInt(v.trim());
        return isNaN(num) ? null : num;
      });
      transformed.min_spielzeit = parts[0];
      transformed.max_spielzeit = parts[1];
      console.log('GameForm - transformFormData: Spieldauer zerlegt', {
        input: data.minMaxSpielzeit,
        min_spielzeit: transformed.min_spielzeit,
        max_spielzeit: transformed.max_spielzeit
      });
    } else {
      delete transformed.min_spielzeit;
      delete transformed.max_spielzeit;
    }
    delete transformed.minMaxSpielzeit;
    
    // Rename optimaleSpieleranzahl to optimale_spieleranzahl
    if (data.optimaleSpieleranzahl) {
      const value = data.optimaleSpieleranzahl;
      const num = typeof value === 'string' ? parseInt(value.trim()) : parseInt(value);
      transformed.optimale_spieleranzahl = isNaN(num) ? null : num;
    } else {
      delete transformed.optimale_spieleranzahl;
    }
    delete transformed.optimaleSpieleranzahl;
    
    // Ensure all numeric fields are valid numbers, not empty strings
    // If a field is empty/null, remove it completely so the database uses its default
    numericFields.forEach(field => {
      const value = transformed[field];
      if (value === '' || value === null || value === undefined) {
        delete transformed[field];
      } else if (typeof value === 'string') {
        const num = parseInt(value);
        if (isNaN(num)) {
          delete transformed[field];
        } else {
          transformed[field] = num;
        }
      }
    });
    
    // Handle float fields separately
    floatFields.forEach(field => {
      const value = transformed[field];
      if (value === '' || value === null || value === undefined) {
        delete transformed[field];
      } else if (typeof value === 'string') {
        const num = parseFloat(value);
        if (isNaN(num)) {
          delete transformed[field];
        } else {
          transformed[field] = parseFloat(num.toFixed(1));
        }
      } else if (typeof value === 'number') {
        transformed[field] = parseFloat(value.toFixed(1));
      }
    });
    
    // Remove fields that don't exist in the database
    delete transformed.spieler;
    
    return transformed;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const transformedData = transformFormData(formData);
      console.log('GameForm - Finales Objekt für DB:', {
        min_spieler: transformedData.min_spieler,
        max_spieler: transformedData.max_spieler,
        min_spielzeit: transformedData.min_spielzeit,
        max_spielzeit: transformedData.max_spielzeit,
        komplexitaet: transformedData.komplexitaet,
        strategie: transformedData.strategie,
        spass: transformedData.spass,
        glueck: transformedData.glueck,
        bgg_rating: transformedData.bgg_rating,
        type_bgg_rating: typeof transformedData.bgg_rating
      });
      
      if (mode === 'edit') {
        await updateGame(id, transformedData);
      } else {
        await addGame(transformedData);
      }
      navigate('/');
    } catch (error) {
      alert('Fehler beim Speichern: ' + error.message);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="game-form-container">
      <div className="form-header">
        <h1>{mode === 'edit' ? 'Spiel bearbeiten' : 'Neues Spiel hinzufügen'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="game-form">
        <div className="form-section">
          <h2>Basis-Informationen</h2>
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="titel">
                Titel <span className="required">*</span>
              </label>
              <input
                type="text"
                id="titel"
                name="titel"
                value={formData.titel ?? ''}
                onChange={handleChange}
                required
                placeholder="z.B. Catan"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="verlag">Verlag</label>
              <input
                type="text"
                id="verlag"
                name="verlag"
                value={formData.verlag ?? ''}
                onChange={handleChange}
                placeholder="z.B. KOSMOS"
              />
            </div>

            <div className="form-group">
              <label htmlFor="autor">Autor</label>
              <input
                type="text"
                id="autor"
                name="autor"
                value={formData.autor ?? ''}
                onChange={handleChange}
                placeholder="z.B. Klaus Teuber"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="minMaxSpieler">Spieleranzahl</label>
              <input
                type="text"
                id="minMaxSpieler"
                name="minMaxSpieler"
                value={formData.minMaxSpieler ?? ''}
                onChange={handleChange}
                placeholder="z.B. 2-4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="optimaleSpieleranzahl">Optimale Spielerzahl</label>
              <input
                type="text"
                id="optimaleSpieleranzahl"
                name="optimaleSpieleranzahl"
                value={formData.optimaleSpieleranzahl ?? ''}
                onChange={handleChange}
                placeholder="z.B. 3-4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="minMaxSpielzeit">Spieldauer (min)</label>
              <input
                type="text"
                id="minMaxSpielzeit"
                name="minMaxSpielzeit"
                value={formData.minMaxSpielzeit ?? ''}
                onChange={handleChange}
                placeholder="z.B. 60-120"
              />
            </div>

            <div className="form-group">
              <label htmlFor="altersempfehlung">Altersempfehlung</label>
              <input
                type="number"
                id="altersempfehlung"
                name="altersempfehlung"
                value={formData.altersempfehlung ?? ''}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Bewertungen</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="strategie">
                Strategie (1-10): {formData.strategie}
              </label>
              <input
                type="range"
                id="strategie"
                name="strategie"
                value={formData.strategie ?? 5}
                onChange={handleChange}
                min="1"
                max="10"
                className="range-slider"
              />
            </div>

            <div className="form-group">
              <label htmlFor="spass">
                Spaß (1-10): {formData.spass}
              </label>
              <input
                type="range"
                id="spass"
                name="spass"
                value={formData.spass ?? 5}
                onChange={handleChange}
                min="1"
                max="10"
                className="range-slider"
              />
            </div>

            <div className="form-group">
              <label htmlFor="glueck">
                Glück (1-10): {formData.glueck}
              </label>
              <input
                type="range"
                id="glueck"
                name="glueck"
                value={formData.glueck ?? 5}
                onChange={handleChange}
                min="1"
                max="10"
                className="range-slider"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="komplexitaet">
                Komplexität (1-5): {formData.komplexitaet}
              </label>
              <input
                type="range"
                id="komplexitaet"
                name="komplexitaet"
                value={formData.komplexitaet ?? 3}
                onChange={handleChange}
                min="1"
                max="5"
                className="range-slider"
              />
            </div>

            <div className="form-group">
              <label htmlFor="bgg_rating">BGG-Rating (1-10)</label>
              <input
                type="number"
                id="bgg_rating"
                name="bgg_rating"
                value={formData.bgg_rating ?? ''}
                onChange={handleChange}
                min="1"
                max="10"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="rohrstrat">Rohrstrat</label>
              <select
                id="rohrstrat"
                name="rohrstrat"
                value={formData.rohrstrat ?? ''}
                onChange={handleChange}
              >
                <option value="">Bitte wählen</option>
                <option value="Sehr Niedrig">Sehr Niedrig</option>
                <option value="Niedrig">Niedrig</option>
                <option value="Mittel">Mittel</option>
                <option value="Mittel-Hoch">Mittel-Hoch</option>
                <option value="Hoch">Hoch</option>
                <option value="Sehr Hoch">Sehr Hoch</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Verwaltung</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status ?? 'Im Besitz'}
                onChange={handleChange}
              >
                <option value="Im Besitz">Im Besitz</option>
                <option value="Verkauft">Verkauft</option>
                <option value="Verliehen">Verliehen</option>
                <option value="Bestellt">Bestellt</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="standort">Standort</label>
              <input
                type="text"
                id="standort"
                name="standort"
                value={formData.standort ?? ''}
                onChange={handleChange}
                placeholder="z.B. Regal A - Ebene 2"
              />
            </div>

            <div className="form-group">
              <label htmlFor="anschaffungsdatum">Anschaffungsdatum</label>
              <input
                type="date"
                id="anschaffungsdatum"
                name="anschaffungsdatum"
                value={formData.anschaffungsdatum ?? ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="fehlteile"
                  checked={formData.fehlteile}
                  onChange={handleChange}
                />
                <span>Fehlteile</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Kategorien</h2>
          
          <div className="form-group">
            <label>Spieltyp / Kategorien</label>
            <div className="categories-section">
              <div className="tags-list">
                {formData.categories.length === 0 ? (
                  <p className="empty-state">Keine Kategorien ausgewählt</p>
                ) : (
                  formData.categories.map((cat, index) => (
                    <span key={index} className="tag tag-category">
                      <span className="tag-content">
                        <span className="tag-de">{cat.name_de || cat.name}</span>
                        {cat.name_de && cat.name !== cat.name_de && (
                          <span className="tag-en">{cat.name}</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(index)}
                        className="tag-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={handleOpenCategoryDialog}
                className="btn-add-category"
              >
                <FaPlus /> Kategorie hinzufügen
              </button>
            </div>
          </div>
        </div>

        <CategoryDialog
          isOpen={categoryDialogOpen}
          onClose={handleCloseCategoryDialog}
          onSave={handleSaveNewCategory}
          existingCategories={formData.categories}
        />

        <div className="form-section">
          <h2>Erweiterungen</h2>
          <p className="section-hint">Ziehe Erweiterungen zwischen den Bereichen, um den Status zu ändern.</p>
          
          <div className="form-group">
            <label>Erweiterungen im Besitz</label>
            <div 
              className="categories-section drop-zone"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'besitz')}
            >
              <div className="tags-list">
                {formData.erweiterungenInBesitz.length === 0 ? (
                  <p className="empty-state">Keine Erweiterungen im Besitz</p>
                ) : (
                  formData.erweiterungenInBesitz.map((erw, index) => (
                    <span 
                      key={index} 
                      className="tag tag-extension draggable"
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, erw, 'besitz')}
                    >
                      {erw}
                      <button
                        type="button"
                        onClick={() => handleRemoveErweiterung('besitz', index)}
                        className="tag-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Erweiterungen zur Anschaffung</label>
            <div 
              className="categories-section drop-zone"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'anschaffung')}
            >
              <div className="tags-list">
                {formData.erweiterungenZurAnschaffung.length === 0 ? (
                  <p className="empty-state">Keine Erweiterungen geplant</p>
                ) : (
                  formData.erweiterungenZurAnschaffung.map((erw, index) => (
                    <span 
                      key={index} 
                      className="tag tag-extension-planned draggable"
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, erw, 'anschaffung')}
                    >
                      {erw}
                      <button
                        type="button"
                        onClick={() => handleRemoveErweiterung('anschaffung', index)}
                        className="tag-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Zusätzliche Informationen</h2>
          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="awards">Auszeichnungen</label>
              <input
                type="text"
                id="awards"
                name="awards"
                value={formData.awards ?? ''}
                onChange={handleChange}
                placeholder="z.B. Spiel des Jahres 2019"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="spieler">Spieltyp</label>
              <input
                type="text"
                id="spieler"
                name="spieler"
                value={formData.spieler ?? ''}
                onChange={handleChange}
                placeholder="z.B. Strategy, Dice, Card Game"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label htmlFor="info">Notizen</label>
              <textarea
                id="info"
                name="info"
                value={formData.info ?? ''}
                onChange={handleChange}
                rows="4"
                placeholder="Zusätzliche Informationen..."
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            <FaSave /> {mode === 'edit' ? 'Änderungen speichern' : 'Spiel hinzufügen'}
          </button>
          <button type="button" onClick={handleCancel} className="btn btn-secondary">
            <FaTimes /> Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
};

export default GameForm;
