import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import '../styles/CategoryDialog.css';

const ExtensionDialog = ({ isOpen, onClose, onSave, type = 'besitz' }) => {
  const [extensionName, setExtensionName] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    const trimmedName = extensionName.trim();
    
    if (!trimmedName) {
      alert('Bitte geben Sie einen Namen für die Erweiterung ein.');
      return;
    }

    setSaving(true);
    try {
      onSave(trimmedName);
      setExtensionName('');
      onClose();
    } catch (error) {
      console.error('Fehler beim Speichern der Erweiterung:', error);
      alert('Fehler beim Speichern der Erweiterung.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setExtensionName('');
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !saving) {
      handleSave();
    }
  };

  const title = type === 'besitz' 
    ? 'Erweiterung im Besitz hinzufügen' 
    : 'Erweiterung zur Anschaffung hinzufügen';

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={handleClose} disabled={saving}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="extensionName">Name der Erweiterung</label>
            <input
              type="text"
              id="extensionName"
              value={extensionName}
              onChange={(e) => setExtensionName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="z.B. Die Flüsse von Carcassonne"
              autoFocus
              disabled={saving}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={handleClose}
            disabled={saving}
          >
            Abbrechen
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={saving || !extensionName.trim()}
          >
            {saving ? 'Speichern...' : 'Hinzufügen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtensionDialog;
