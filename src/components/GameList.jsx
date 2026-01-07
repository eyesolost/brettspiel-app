import React, { useState, useMemo } from 'react';
import { useGames } from '../context/GameContext';
import GameItem from './GameItem';
import FilterBar from './FilterBar';
import { FaSortUp, FaSortDown, FaSort, FaChevronDown, FaChevronUp, FaFilter } from 'react-icons/fa';
import '../styles/GameList.css';
import { istInIntervall, intervallZuArray } from '../utils/helpers';

const GameList = () => {
  const { games, loading, deleteGame } = useGames();
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });  
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <FaSort className="sort-icon" />;
    }
    return sortConfig.direction === 'asc' ? (
      <FaSortUp className="sort-icon active" />
    ) : (
      <FaSortDown className="sort-icon active" />
    );
  };

  const filteredAndSortedGames = useMemo(() => {
    let result = [...games];

    // Filterung
    Object.keys(filters).forEach((key) => {
      const filterValue = filters[key];
      if (!filterValue) return;

      result = result.filter((game) => {
        switch (key) {
          case 'titel':
            return game.titel?.toLowerCase().includes(filterValue.toLowerCase());
          case 'verlag':
            return game.verlag?.toLowerCase().includes(filterValue.toLowerCase());
          case 'autor':
            return game.autor?.toLowerCase().includes(filterValue.toLowerCase());
          case 'standort':
            return game.standort?.toLowerCase().includes(filterValue.toLowerCase());
          case 'status':
            return game.status === filterValue;
          case 'eile':
            return game.eile === (filterValue === 'true');
          case 'minStrategie':
            return game.strategie >= parseInt(filterValue);
          case 'minSpass':
            return game.spass >= parseInt(filterValue);
          case 'maxKomplexitaet':
            return game.komplexitaet <= parseInt(filterValue);
          case 'spieleranzahl':
            return istInIntervall(game.minMaxSpieler, filterValue);
          case'fehlteile':
            return game.fehlteile;
          default:
            return true;
        }
      });
    });

    // Sortierung
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Spezielle Behandlung für Spieler und Spieldauer (min-Wert verwenden)
        if (sortConfig.key === 'min_spieler' || sortConfig.key === 'min_spielzeit') {
          aValue = a[sortConfig.key] || 0;
          bValue = b[sortConfig.key] || 0;
        }
        // Normale Behandlung für andere Felder
        else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue?.toLowerCase() || '';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [games, filters, sortConfig]);

  const handleClearFilters = () => {
    setFilters({});
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Lade Spiele...</p>
      </div>
    );
  }


  return (
    <div className="game-list-container">
      <div className="page-header">
        <h1>Meine Brettspiel-Sammlung</h1>
        <p className="game-count">
          {filteredAndSortedGames.length} von {games.length} Spielen angezeigt
        </p>
      </div>

       <div className='filter-section'>
    <button 
    className='filter-toggle-btn'
    onClick={() => setIsFilterOpen(!isFilterOpen)}>  <FaFilter />
      <span>Filter</span>
      {isFilterOpen ? <FaChevronUp/> : <FaChevronDown/>}
    </button>
    
    {isFilterOpen && (
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={handleClearFilters}
      />
    )}
  </div>
     

      {filteredAndSortedGames.length === 0 ? (
        <div className="no-games">
          <p>Keine Spiele gefunden. Versuche andere Filter oder füge ein neues Spiel hinzu!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="games-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('titel')}>
                  Titel {getSortIcon('titel')}
                </th>
                <th onClick={() => handleSort('min_spieler')}>
                  Spieler {getSortIcon('min_spieler')}
                </th>
                <th onClick={() => handleSort('min_spielzeit')}>
                  Spieldauer {getSortIcon('min_spielzeit')}
                </th>
                <th onClick={() => handleSort('status')}>
                  Status {getSortIcon('status')}
                </th>
                <th onClick={() => handleSort('strategie')}>
                  Strategie {getSortIcon('strategie')}
                </th>
                <th onClick={() => handleSort('spass')}>
                  Spaß {getSortIcon('spass')}
                </th>
                <th onClick={() => handleSort('glueck')}>
                  Glück {getSortIcon('glueck')}
                </th>
                <th onClick={() => handleSort('komplexitaet')}>
                  Komplexität {getSortIcon('komplexitaet')}
                </th>
                <th onClick={() => handleSort('verlag')}>
                  Verlag {getSortIcon('verlag')}
                </th>
                <th onClick={() => handleSort('autor')}>
                  Autor {getSortIcon('autor')}
                </th>
                <th onClick={() => handleSort('standort')}>
                  Standort {getSortIcon('standort')}
                </th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedGames.map((game) => (
                <GameItem key={game.id} game={game} onDelete={deleteGame} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GameList;
