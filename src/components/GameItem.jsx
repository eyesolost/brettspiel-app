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
    const percentage = (rating / max) * 100;
    let colorClass = 'rating-low';
    if (percentage >= 70) colorClass = 'rating-high';
    else if (percentage >= 40) colorClass = 'rating-medium';

    return (
      <div className="rating-container">
        <div className={`rating-bar ${colorClass}`} style={{ width: `${percentage}%` }}>
          <span className="rating-text">{rating}/{max}</span>
        </div>
      </div>
    );
  };

  const renderComplexity = (level) => {
    return (
      <div className="complexity-display">
        {[...Array(5)].map((_, index) => (
          <FaStar
            key={index}
            className={index < level ? 'star-filled' : 'star-empty'}
          />
        ))}
      </div>
    );
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
      <td>{game.minMaxSpieler}</td>
      <td>{game.minMaxSpielzeit} min</td>
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
