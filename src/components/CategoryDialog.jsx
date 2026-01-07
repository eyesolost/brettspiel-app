import React, { useState, useEffect } from 'react';
import { FaTimes, FaSearch } from 'react-icons/fa';
import { bggService } from '../services/bggService';
import { supabase } from '../lib/supabaseClient';
import '../styles/CategoryDialog.css';

const CategoryDialog = ({ isOpen, onClose, onSave, existingCategories = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [bggSuggestions, setBggSuggestions] = useState([]);
  const [allBGGCategories, setAllBGGCategories] = useState([]);
  const [selectedBGG, setSelectedBGG] = useState(null);
  const [germanName, setGermanName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load all BGG categories when the dialog opens
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    bggService
      .getBGGCategories()
      .then((bggCategories) => {
        setAllBGGCategories(bggCategories);
        const initial = bggCategories
          .filter(
            (cat) =>
              !existingCategories.some(
                (existing) => existing.name?.toLowerCase() === cat.name.toLowerCase()
              )
          )
          .slice(0, 50);
        setBggSuggestions(initial);
      })
      .catch((err) => {
        console.error('Fehler beim Laden von BGG Kategorien:', err);
      })
      .finally(() => setLoading(false));
  }, [isOpen, existingCategories]);

  useEffect(() => {
    if (!isOpen) return;

    // Wenn kein Suchbegriff: Top 50 anzeigen (bereits geladen)
    if (!searchTerm.trim()) {
      const initial = allBGGCategories
        .filter(
          (cat) =>
            !existingCategories.some(
              (existing) => existing.name?.toLowerCase() === cat.name.toLowerCase()
            )
        )
        .slice(0, 50);
      setBggSuggestions(initial);
      return;
    }

    const filtered = allBGGCategories
      .filter(
        (cat) =>
          cat.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !existingCategories.some(
            (existing) => existing.name?.toLowerCase() === cat.name.toLowerCase()
          )
      )
      .slice(0, 50);
    setBggSuggestions(filtered);
  }, [searchTerm, isOpen, existingCategories, allBGGCategories]);

  const handleSelectBGG = (category) => {
    setSelectedBGG(category);
    setSearchTerm(category.name);
    setBggSuggestions([]);
  };

  const handleSave = async () => {
    if (!selectedBGG || !germanName.trim()) {
      alert('Bitte wähle eine Kategorie und gib eine deutsche Bezeichnung ein.');
      return;
    }

    const bggId = Number(selectedBGG.id) || selectedBGG.id;
    const nameDe = germanName.trim();

    try {
      setSaving(true);

      // 1) Prüfen, ob Kategorie mit dieser bgg_id existiert
      const { data: existingRows, error: existingError } = await supabase
        .from('categories')
        .select('id, name, name_de, original_name, bgg_id')
        .eq('bgg_id', bggId)
        .limit(1);

      if (existingError) throw existingError;

      let categoryRecord = existingRows && existingRows[0];

      if (categoryRecord) {
        // Falls neue deutsche Bezeichnung angegeben, updaten
        if (nameDe && categoryRecord.name_de !== nameDe) {
          const { error: updateError } = await supabase
            .from('categories')
            .update({ name_de: nameDe })
            .eq('id', categoryRecord.id);

          if (updateError) throw updateError;
          categoryRecord = { ...categoryRecord, name_de: nameDe };
        }
      } else {
        // 2) Neue Kategorie anlegen
        const { data: inserted, error: insertError } = await supabase
          .from('categories')
          .insert([{
            name: nameDe || selectedBGG.name,
            name_de: nameDe,
            original_name: selectedBGG.name,
            bgg_id: bggId
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        categoryRecord = inserted;
      }

      // 3) An den übergeordneten State zurückgeben (inkl. id)
      onSave(categoryRecord);

      // Reset
      setSearchTerm('');
      setSelectedBGG(null);
      setGermanName('');
      onClose();
    } catch (err) {
      console.error('Kategorie konnte nicht gespeichert werden:', err);
      alert('Kategorie konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSearchTerm('');
    setSelectedBGG(null);
    setGermanName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Neue Kategorie erstellen</h2>
          <button className="modal-close" onClick={handleCancel}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="bgg-search">BGG Kategorie</label>
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input
                id="bgg-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Kategorie suchen (z.B. Strategy, Dice)..."
                autoFocus
              />
            </div>
            {loading && <div className="loading">Suche...</div>}
            {bggSuggestions.length > 0 && (
              <ul className="suggestions-list">
                {bggSuggestions.map((cat, idx) => (
                  <li
                    key={`bgg-${cat.id}`}
                    className={`suggestion-item ${selectedBGG?.id === cat.id ? 'selected' : ''}`}
                    onClick={() => handleSelectBGG(cat)}
                  >
                    {cat.name}
                  </li>
                ))}
              </ul>
            )}
            {searchTerm && bggSuggestions.length === 0 && !loading && (
              <div className="no-results">Keine Kategorien gefunden</div>
            )}
          </div>

          {selectedBGG && (
            <div className="form-group">
              <label htmlFor="german-name">Deutsche Bezeichnung</label>
              <input
                id="german-name"
                type="text"
                value={germanName}
                onChange={(e) => setGermanName(e.target.value)}
                placeholder="z.B. Strategiespiel"
              />
              <small>Gewählte Kategorie: <strong>{selectedBGG?.name}</strong></small>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleCancel}>
            Abbrechen
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!selectedBGG || !germanName.trim() || saving}
          >
            {saving ? 'Speichern...' : 'Kategorie hinzufügen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryDialog;
