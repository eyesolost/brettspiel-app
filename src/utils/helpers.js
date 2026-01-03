/**
 * Prüft ob eine Zahl in einem String-Intervall liegt
 * @param {string} intervall - Format: "min-max" z.B. "2-4"
 * @param {number} zahl - Die zu prüfende Zahl
 * @returns {boolean}
 */
export const istInIntervall = (intervall, zahl) => {
  if (!intervall || typeof intervall !== 'string') return false;
  if (!intervall.includes('-')) return parseInt.intervall == parseInt.zahl;
  
  const [min, max] = intervall.split('-').map(Number);
  if (isNaN(min) || isNaN(max)) return false;
  
  return zahl >= min && zahl <= max;
};

/**
 * Erstellt Array aus Intervall-String
 * @param {string} intervall - Format: "min-max"
 * @returns {number[]}
 */
export const intervallZuArray = (intervall) => {
  if (!intervall || !intervall.includes('-')) return [];
  
  const [min, max] = intervall.split('-').map(Number);
  if (isNaN(min) || isNaN(max) || min > max) return [];
  
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
};

/**
 * Formatiert Intervall schöner
 * @param {string} intervall - "2-4"
 * @returns {string} "2-4 Spieler"
 */
export const formatiereIntervall = (intervall, einheit = 'Spieler') => {
  if (!intervall) return '';
  return `${intervall} ${einheit}`;
};