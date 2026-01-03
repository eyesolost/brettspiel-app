import React from 'react';
import { FaSearch, FaTimes, FaFilter } from 'react-icons/fa';
import '../styles/FilterBar.css';

const FilterBar = ({ filters, onFilterChange, onClearFilters }) => {
  const handleChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="filter-bar">
      <div className="filter-header">
        <h3>
          <FaFilter className="filter-icon" />
          Filter & Suche
        </h3>
        {hasActiveFilters && (
          <button onClick={onClearFilters} className="clear-filters-btn">
            <FaTimes /> Filter zurücksetzen
          </button>
        )}
      </div>

      <div className="filter-grid">
        <div className="filter-item">
          <label>
            <FaSearch className="input-icon" />
            Titel
          </label>
          <input
            type="text"
            placeholder="Spieltitel suchen..."
            value={filters.titel || ''}
            onChange={(e) => handleChange('titel', e.target.value)}
          />
        </div>

        <div className="filter-item">
          <label>Verlag</label>
          <input
            type="text"
            placeholder="z.B. KOSMOS"
            value={filters.verlag || ''}
            onChange={(e) => handleChange('verlag', e.target.value)}
          />
        </div>

        <div className="filter-item">
          <label>Autor</label>
          <input
            type="text"
            placeholder="z.B. Klaus Teuber"
            value={filters.autor || ''}
            onChange={(e) => handleChange('autor', e.target.value)}
          />
        </div>

        <div className="filter-item">
          <label>Standort</label>
          <input
            type="text"
            placeholder="z.B. Regal A"
            value={filters.standort || ''}
            onChange={(e) => handleChange('standort', e.target.value)}
          />
        </div>

        <div className="filter-item">
          <label>Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
          >
            <option value="">Alle Status</option>
            <option value="Im Besitz">Im Besitz</option>
            <option value="Verkauft">Verkauft</option>
            <option value="Verliehen">Verliehen</option>
            <option value="Bestellt">Bestellt</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Fehlteile</label>
          <select
            value={filters.fehlteile || ''}
            onChange={(e) => handleChange('fehlteile', e.target.value)}
          >
            <option value="">Alle</option>
            <option value="true">Ja</option>
            <option value="false">Nein</option>
          </select>
        </div>

        <div className="filter-item">
          <label>Min. Strategie-Rating</label>
          <input
            type="number"
            min="1"
            max="10"
            placeholder="1-10"
            value={filters.minStrategie || ''}
            onChange={(e) => handleChange('minStrategie', e.target.value)}
          />
        </div>

        <div className="filter-item">
          <label>Min. Spaß-Rating</label>
          <input
            type="number"
            min="1"
            max="10"
            placeholder="1-10"
            value={filters.minSpass || ''}
            onChange={(e) => handleChange('minSpass', e.target.value)}
          />
        </div>

        <div className="filter-item">
          <label>Spieleranzahl</label>
          <input
            type="text"
            placeholder="z.B. 2-4"
            value={filters.spieleranzahl || ''}
            onChange={(e) => handleChange('spieleranzahl', e.target.value)}
          />
        </div>

        <div className="filter-item">
          <label>Max. Komplexität</label>
          <select
            value={filters.maxKomplexitaet || ''}
            onChange={(e) => handleChange('maxKomplexitaet', e.target.value)}
          >
            <option value="">Alle</option>
            <option value="1">1 - Sehr leicht</option>
            <option value="2">2 - Leicht</option>
            <option value="3">3 - Mittel</option>
            <option value="4">4 - Schwer</option>
            <option value="5">5 - Sehr schwer</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
