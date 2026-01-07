import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaStar, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const GameItem = ({ game, onDelete }) => {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/edit/${game.id}`);
  };

  const handleDelete = () => {
    if (window.confirm(`Möchtest du "${game.titel}" wirklich löschen?`)) {
      onDelete(game.id);
    }
  };

  const renderRating = (rating, max = 10) => {
    let value = typeof rating === 'number'
      ? rating
      : rating != null
        ? parseFloat(rating)
        : 0;
    if (isNaN(value)) value = 0;
    value = Math.max(0, Math.min(value, max));
    const percentage = (value / max) * 100;
    let colorClass = 'rating-low';
    if (percentage >= 70) colorClass = 'rating-high';
    else if (percentage >= 40) colorClass = 'rating-medium';

    return (
      <div className="rating-container">
        <div className={`rating-bar ${colorClass}`} style={{ width: `${percentage}%` }}>
          <span className="rating-text">{value}/{max}</span>
        </div>
      </div>
    );
  };

  const renderComplexity = (level) => {
    let value = typeof level === 'number' ? level : parseInt(level, 10);
    if (isNaN(value)) value = 0;
    value = Math.max(0, Math.min(value, 5));
    return (
      <div className="complexity-display">
        {[...Array(5)].map((_, index) => (
          <FaStar
            key={index}
            className={index < value ? 'star-filled' : 'star-empty'}
          />
        ))}
      </div>
    );
  };

  const formatSpieler = () => {
    const range = (game.min_spieler && game.max_spieler)
      ? `${game.min_spieler} - ${game.max_spieler}`
      : (game.min_spieler || game.max_spieler || '-');
    const optimal = game.optimale_spieleranzahl ? ` (optimal: ${game.optimale_spieleranzahl})` : '';
    return `${range}${optimal}`;
  };

  const formatSpieldauer = () => {
    if (game.min_spielzeit && game.max_spielzeit) {
      return `${game.min_spielzeit} - ${game.max_spielzeit}`;
    }
    return game.min_spielzeit || game.max_spielzeit || '-';
  };

  return (
    <tr className="game-item">
      <td className="game-title">
        <strong>{game.titel}</strong>
        {game.fehlteile && (
          <span className="badge badge-warning" title="Fehlteile vorhanden">
            ⚠️
          </span>
        )}
      </td>
      <td>{formatSpieler()}</td>
      <td>{formatSpieldauer()} min</td>
      <td>
        <span className={`status-badge status-${game.status?.toLowerCase().replace(/\s/g, '-')}`}>
          {game.status}
        </span>
      </td>
      <td>{renderRating(game.strategie)}</td>
      <td>{renderRating(game.spass)}</td>
      <td>{renderRating(game.glueck)}</td>
      <td>{renderComplexity(game.komplexitaet)}</td>
      <td>{game.verlag}</td>
      <td>{game.autor}</td>
      <td className="game-location">{game.standort}</td>
      <td className="game-actions">
        <button
          onClick={handleEdit}
          className="btn-icon btn-edit"
          title="Bearbeiten"
        >
          <FaEdit />
        </button>
        <button
          onClick={handleDelete}
          className="btn-icon btn-delete"
          title="Löschen"
        >
          <FaTrash />
        </button>
      </td>
    </tr>
  );
};

export default GameItem;
