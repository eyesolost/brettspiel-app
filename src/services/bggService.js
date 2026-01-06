/**
 * BGG (BoardGameGeek) API Service
 * 
 * Dieses Modul stellt Funktionen bereit, um Daten von der BoardGameGeek XML API 2 abzurufen.
 * Offizielle Dokumentation: https://boardgamegeek.com/wiki/page/BGG_XML_API2
 * 
 * WICHTIG: BGG hat ein Rate Limit - max. 1 Request alle 5 Sekunden empfohlen
 */

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';
const REQUEST_DELAY = 5000; // 5 Sekunden zwischen Requests
const BGGToken = import.meta.env.VITE_BGG_TOKEN || '';

// Simple Queue für Rate Limiting
class RequestQueue {
  constructor(delay) {
    this.queue = [];
    this.delay = delay;
    this.lastRequestTime = 0;
  }

  async add(requestFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ requestFn, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.queue.length === 0) return;

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.delay) {
      setTimeout(() => this.processQueue(), this.delay - timeSinceLastRequest);
      return;
    }

    const { requestFn, resolve, reject } = this.queue.shift();
    this.lastRequestTime = Date.now();

    try {
      const result = await requestFn();
      resolve(result);
    } catch (error) {
      reject(error);
    }

    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), this.delay);
    }
  }
}

const requestQueue = new RequestQueue(REQUEST_DELAY);

// XML zu JSON Parser
const parseXML = (xmlString) => {
  const parser = new DOMParser();
  return parser.parseFromString(xmlString, 'text/xml');
};

// Hilfsfunktion zum Extrahieren von Text aus XML-Nodes
const getTextContent = (element, selector) => {
  const node = element.querySelector(selector);
  return node ? node.textContent : '';
};

// Hilfsfunktion zum Extrahieren von Attributen
const getAttribute = (element, selector, attribute) => {
  const node = element.querySelector(selector);
  return node ? node.getAttribute(attribute) : '';
};

class BGGService {
  /**
   * Erstelle Fetch-Optionen mit Authorization Header
   */
  getRequestOptions() {
    const options = {};
    if (BGGToken) {
      options.headers = {
        'Authorization': `Bearer ${BGGToken}`
      };
      console.log('BGG Token wird gesendet:', BGGToken.substring(0, 10) + '...');
    } else {
      console.warn('⚠️ Kein BGG Token gefunden! Bitte VITE_BGG_TOKEN in .env.local setzen.');
    }
    return options;
  }

  /**
   * Suche nach Spielen
   * @param {string} query - Suchbegriff
   * @param {boolean} exact - Exakte Suche (optional)
   * @returns {Promise<Array>} Liste von gefundenen Spielen
   */
  async searchGames(query, exact = false) {
    return requestQueue.add(async () => {
      const url = `${BGG_API_BASE}/search?query=${encodeURIComponent(query)}&type=boardgame,boardgameexpansion,boardgameaccessory,rpgitem,videogame`;
      const response = await fetch(url, this.getRequestOptions());
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('BGG API Error:', response.status, response.statusText);
        console.error('Response:', errorText);
        throw new Error(`BGG API returned ${response.status}: ${response.statusText}`);
      }
      
      const xmlText = await response.text();
      const xml = parseXML(xmlText);

      const items = Array.from(xml.querySelectorAll('item'));
      return items.map(item => ({
        id: item.getAttribute('id'),
        name: getAttribute(item, 'name', 'value'),
        yearPublished: getAttribute(item, 'yearpublished', 'value'),
        type: item.getAttribute('type')
      }));
    });
  }

  /**
   * Hole detaillierte Informationen zu einem Spiel
   * @param {number|string} gameId - BGG ID des Spiels
   * @returns {Promise<Object>} Detaillierte Spielinformationen
   */
  async getGameDetails(gameId) {
    return requestQueue.add(async () => {
      const url = `${BGG_API_BASE}/thing?id=${gameId}&stats=1&videos=0`;
      const response = await fetch(url, this.getRequestOptions());
      const xmlText = await response.text();
      const xml = parseXML(xmlText);

      const item = xml.querySelector('item');
      if (!item) throw new Error('Spiel nicht gefunden');

      // Basis-Informationen
      const primaryName = getAttribute(item, 'name[type="primary"]', 'value');
      const yearPublished = getTextContent(item, 'yearpublished');
      const minPlayers = getTextContent(item, 'minplayers');
      const maxPlayers = getTextContent(item, 'maxplayers');
      const playingTime = getTextContent(item, 'playingtime');
      const minPlaytime = getTextContent(item, 'minplaytime');
      const maxPlaytime = getTextContent(item, 'maxplaytime');
      const minAge = getTextContent(item, 'minage');
      const description = getTextContent(item, 'description');

      // Publisher und Designer
      const publishers = Array.from(item.querySelectorAll('link[type="boardgamepublisher"]'))
        .map(link => link.getAttribute('value'));
      const designers = Array.from(item.querySelectorAll('link[type="boardgamedesigner"]'))
        .map(link => link.getAttribute('value'));

      // Statistiken
      const stats = item.querySelector('statistics ratings');
      const averageRating = stats ? getTextContent(stats, 'average') : '0';
      const usersRated = stats ? getTextContent(stats, 'usersrated') : '0';
      const averageWeight = stats ? getTextContent(stats, 'averageweight') : '0';
      
      // Ranking
      const ranks = Array.from(item.querySelectorAll('rank'));
      const boardGameRank = ranks.find(r => r.getAttribute('name') === 'boardgame');
      const rank = boardGameRank ? boardGameRank.getAttribute('value') : 'N/A';

      // Empfohlene Spielerzahl (Poll-Daten)
      const playerPoll = item.querySelector('poll[name="suggested_numplayers"]');
      const bestPlayers = this._parseBestPlayerCount(playerPoll);

      return {
        id: item.getAttribute('id'),
        name: primaryName,
        yearPublished: parseInt(yearPublished) || null,
        description: description,
        
        // Spieleranzahl & Zeit
        minPlayers: parseInt(minPlayers) || null,
        maxPlayers: parseInt(maxPlayers) || null,
        minPlaytime: parseInt(minPlaytime) || null,
        maxPlaytime: parseInt(maxPlaytime) || null,
        playingTime: parseInt(playingTime) || null,
        minAge: parseInt(minAge) || null,
        
        // Autoren & Verlage
        designers: designers.join(', '),
        publishers: publishers.join(', '),
        
        // Bewertungen
        bgg_rating: parseFloat(averageRating) || 0,
        usersRated: parseInt(usersRated) || 0,
        complexity: parseFloat(averageWeight) || 0,
        rank: rank !== 'Not Ranked' ? parseInt(rank) : null,
        
        // Empfehlungen
        bestPlayerCount: bestPlayers
      };
    });
  }

  /**
   * Hole die "Hot Items" Liste von BGG
   * @returns {Promise<Array>} Liste der trending Spiele
   */
  async getHotGames() {
    return requestQueue.add(async () => {
      const url = `${BGG_API_BASE}/hot?type=boardgame`;
      const response = await fetch(url, this.getRequestOptions());
      const xmlText = await response.text();
      const xml = parseXML(xmlText);

      const items = Array.from(xml.querySelectorAll('item'));
      return items.map(item => ({
        id: item.getAttribute('id'),
        rank: item.getAttribute('rank'),
        name: getAttribute(item, 'name', 'value'),
        yearPublished: getAttribute(item, 'yearpublished', 'value'),
        thumbnail: getTextContent(item, 'thumbnail')
      }));
    });
  }

  /**
   * Importiere ein Spiel aus BGG in dein lokales Format
   * @param {number|string} gameId - BGG ID
   * @returns {Promise<Object>} Spiel im Datenbank-Format
   */
  async importGame(gameId) {
    const bggGame = await this.getGameDetails(gameId);
    
    // Konvertiere BGG-Daten direkt ins Datenbank-Schema-Format
    return {
      titel: bggGame.name,
      verlag: bggGame.publishers,
      autor: bggGame.designers,
      bgg_id: parseInt(bggGame.id),
      min_spieler: bggGame.minPlayers,
      max_spieler: bggGame.maxPlayers,
      optimale_spieleranzahl: bggGame.bestPlayerCount || null,
      min_spielzeit: bggGame.minPlaytime,
      max_spielzeit: bggGame.maxPlaytime,
      spass: Math.round(bggGame.bgg_rating), // 0-10
      strategie: Math.round(bggGame.complexity * 2), // 0-5 → 0-10
      glueck: 5, // Default, manuell anpassen
      komplexitaet: Math.round(bggGame.complexity),
      bgg_rating: parseFloat(bggGame.bgg_rating.toFixed(1)),
      altersempfehlung: bggGame.minAge,
      awards: '', // Manuell ergänzen
      status: 'Im Besitz',
      standort: '', // Manuell ergänzen
      fehlteile: false,
      anschaffungsdatum: new Date().toISOString().split('T')[0],
      info: bggGame.description ? bggGame.description.substring(0, 200) + '...' : '',
      rohrstrat: Math.round(bggGame.complexity), // Als Integer
      erweiterungenInBesitz: [],
      erweiterungenZurAnschaffung: []
    };
  }

  /**
   * Privat: Parse beste Spieleranzahl aus Poll-Daten
   */
  _parseBestPlayerCount(pollElement) {
    if (!pollElement) return null;

    const results = Array.from(pollElement.querySelectorAll('results'));
    let bestCount = null;
    let bestScore = 0;

    results.forEach(result => {
      const numPlayers = result.getAttribute('numplayers');
      const best = parseInt(getAttribute(result, 'result[value="Best"]', 'numvotes')) || 0;
      const recommended = parseInt(getAttribute(result, 'result[value="Recommended"]', 'numvotes')) || 0;
      const score = best * 2 + recommended;

      if (score > bestScore) {
        bestScore = score;
        bestCount = numPlayers;
      }
    });

    return bestCount;
  }

  /**
   * Privat: Konvertiere BGG Complexity (0-5) zu Rohrstrat-Level
   */
  _complexityToRohrstrat(complexity) {
    if (complexity < 1.5) return 'Sehr Niedrig';
    if (complexity < 2.5) return 'Niedrig';
    if (complexity < 3.5) return 'Mittel';
    if (complexity < 4.0) return 'Mittel-Hoch';
    if (complexity < 4.5) return 'Hoch';
    return 'Sehr Hoch';
  }
}

// Export Singleton-Instanz
export const bggService = new BGGService();

// Beispiel-Verwendung:
/*
// 1. Spiel suchen
const results = await bggService.searchGames('Catan');
console.log(results);

// 2. Details abrufen
const game = await bggService.getGameDetails(13);
console.log(game);

// 3. Spiel importieren
const importedGame = await bggService.importGame(13);
// Dann mit gameService.createGame(importedGame) speichern

// 4. Hot Games abrufen
const hotGames = await bggService.getHotGames();
console.log(hotGames);
*/
