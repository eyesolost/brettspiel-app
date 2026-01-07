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
   * @returns {Promise<Object>} Detaillierte Spielinformationen mit allen verfügbaren Daten
   */
  async getGameDetails(gameId) {
    return requestQueue.add(async () => {
      const url = `${BGG_API_BASE}/thing?id=${gameId}&stats=1&videos=0`;
      const response = await fetch(url, this.getRequestOptions());
      const xmlText = await response.text();
      const xml = parseXML(xmlText);

      const item = xml.querySelector('item');
      if (!item) throw new Error('Spiel nicht gefunden');

      // ALLE Namen extrahieren (primary + alternate)
      const allNames = Array.from(item.querySelectorAll('name')).map(nameEl => ({
        value: nameEl.getAttribute('value'),
        type: nameEl.getAttribute('type'),
        sortindex: nameEl.getAttribute('sortindex')
      }));
      const primaryName = allNames.find(n => n.type === 'primary')?.value || allNames[0]?.value;
      
      // Basis-Informationen - WICHTIG: Diese Felder haben "value" Attribute, nicht Text-Content!
      const yearPublished = getAttribute(item, 'yearpublished', 'value');
      const minPlayers = getAttribute(item, 'minplayers', 'value');
      const maxPlayers = getAttribute(item, 'maxplayers', 'value');
      const playingTime = getAttribute(item, 'playingtime', 'value');
      const minPlaytime = getAttribute(item, 'minplaytime', 'value');
      const maxPlaytime = getAttribute(item, 'maxplaytime', 'value');
      const minAge = getAttribute(item, 'minage', 'value');
      const description = getTextContent(item, 'description');
      
      // Bilder
      const thumbnail = getTextContent(item, 'thumbnail');
      const image = getTextContent(item, 'image');

      // Publisher und Designer
      const publishers = Array.from(item.querySelectorAll('link[type="boardgamepublisher"]'))
        .map(link => ({ id: link.getAttribute('id'), name: link.getAttribute('value') }));
      const designers = Array.from(item.querySelectorAll('link[type="boardgamedesigner"]'))
        .map(link => ({ id: link.getAttribute('id'), name: link.getAttribute('value') }));
      
      // Categories, Mechanics, Families
      const categories = Array.from(item.querySelectorAll('link[type="boardgamecategory"]'))
        .map(link => ({ id: link.getAttribute('id'), name: link.getAttribute('value') }));
      const mechanics = Array.from(item.querySelectorAll('link[type="boardgamemechanic"]'))
        .map(link => ({ id: link.getAttribute('id'), name: link.getAttribute('value') }));
      const families = Array.from(item.querySelectorAll('link[type="boardgamefamily"]'))
        .map(link => ({ id: link.getAttribute('id'), name: link.getAttribute('value') }));
      // Expansions (Erweiterungen)
      const expansions = Array.from(item.querySelectorAll('link[type="boardgameexpansion"]'))
        .map(link => ({ id: link.getAttribute('id'), name: link.getAttribute('value'), inbound: link.getAttribute('inbound') === 'true' }));

      // Statistiken
      const stats = item.querySelector('statistics ratings');
      const averageRating = stats ? getAttribute(stats, 'average', 'value') : '0';
      const bayesAverage = stats ? getAttribute(stats, 'bayesaverage', 'value') : '0';
      const usersRated = stats ? getAttribute(stats, 'usersrated', 'value') : '0';
      const averageWeight = stats ? getAttribute(stats, 'averageweight', 'value') : '0';
      const stdDev = stats ? getAttribute(stats, 'stddev', 'value') : '0';
      const median = stats ? getAttribute(stats, 'median', 'value') : '0';
      const owned = stats ? getAttribute(stats, 'owned', 'value') : '0';
      const trading = stats ? getAttribute(stats, 'trading', 'value') : '0';
      const wanting = stats ? getAttribute(stats, 'wanting', 'value') : '0';
      const wishing = stats ? getAttribute(stats, 'wishing', 'value') : '0';
      const numComments = stats ? getAttribute(stats, 'numcomments', 'value') : '0';
      const numWeights = stats ? getAttribute(stats, 'numweights', 'value') : '0';
      
      // Ranking
      const ranks = Array.from(item.querySelectorAll('rank'));
      const boardGameRank = ranks.find(r => r.getAttribute('name') === 'boardgame');
      const rank = boardGameRank ? boardGameRank.getAttribute('value') : 'N/A';

      // Empfohlene Spielerzahl (Poll-Daten)
      const playerPoll = item.querySelector('poll[name="suggested_numplayers"]');
      const bestPlayers = this._parseBestPlayerCount(playerPoll);
      
      // Language Dependence Poll
      const langPoll = item.querySelector('poll[name="language_dependence"]');
      const langDependence = this._parseLanguageDependence(langPoll);

      return {
        id: item.getAttribute('id'),
        
        // Alle Namen für Auswahl
        names: allNames,
        primaryName: primaryName,
        
        // Basis-Daten
        yearPublished: parseInt(yearPublished) || null,
        description: description,
        thumbnail: thumbnail,
        image: image,
        
        // Spieleranzahl & Zeit
        minPlayers: parseInt(minPlayers) || null,
        maxPlayers: parseInt(maxPlayers) || null,
        minPlaytime: parseInt(minPlaytime) || null,
        maxPlaytime: parseInt(maxPlaytime) || null,
        playingTime: parseInt(playingTime) || null,
        minAge: parseInt(minAge) || null,
        
        // Autoren & Verlage (mit IDs für Auswahl)
        designers: designers,
        publishers: publishers,
        
        // Kategorien, Mechaniken, Familien (für Multiselect)
        categories: categories,
        mechanics: mechanics,
        families: families,
        expansions: expansions,
        
        // Bewertungen & Statistiken
        bgg_rating: parseFloat(averageRating) || 0,
        bayesAverage: parseFloat(bayesAverage) || 0,
        usersRated: parseInt(usersRated) || 0,
        complexity: parseFloat(averageWeight) || 0,
        stdDev: parseFloat(stdDev) || 0,
        median: parseFloat(median) || 0,
        rank: rank !== 'Not Ranked' ? parseInt(rank) : null,
        
        // Ownership Stats
        owned: parseInt(owned) || 0,
        trading: parseInt(trading) || 0,
        wanting: parseInt(wanting) || 0,
        wishing: parseInt(wishing) || 0,
        
        // Community Daten
        numComments: parseInt(numComments) || 0,
        numWeights: parseInt(numWeights) || 0,
        
        // Empfehlungen & Polls
        bestPlayerCount: bestPlayers,
        languageDependence: langDependence
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
   * @returns {Promise<Object>} Spiel mit allen Daten für Benutzerauswahl
   */
  async importGame(gameId) {
    const bggGame = await this.getGameDetails(gameId);
    
    // Konvertiere BGG-Daten direkt ins Datenbank-Schema-Format
    // Gibt Objekt mit allen Optionen zurück, damit User auswählen kann
    return {
      // Original BGG-Daten für Auswahl
      bggData: {
        names: bggGame.names, // Alle Namen zur Auswahl (inkl. deutscher Namen)
        categories: bggGame.categories,
        mechanics: bggGame.mechanics,
        families: bggGame.families,
        expansions: bggGame.expansions,
        designers: bggGame.designers,
        publishers: bggGame.publishers,
        thumbnail: bggGame.thumbnail,
        image: bggGame.image
      },
      
      // Vorgeschlagene Datenbank-Werte (editierbar)
      gameData: {
        titel: bggGame.primaryName, // Default, kann user ändern
        verlag: bggGame.publishers.map(p => p.name).join(', '),
        autor: bggGame.designers.map(d => d.name).join(', '),
        bgg_id: parseInt(bggGame.id),
        min_spieler: bggGame.minPlayers,
        max_spieler: bggGame.maxPlayers,
        optimale_spieleranzahl: bggGame.bestPlayerCount || null,
        min_spielzeit: bggGame.minPlaytime,
        max_spielzeit: bggGame.maxPlaytime,
        spass: Math.round(bggGame.bgg_rating), // 0-10
        strategie: Math.round(bggGame.complexity * 2), // 0-5 → 0-10
        glueck: 5, // Default, manuell anpassen
        komplexitaet: parseFloat(bggGame.complexity.toFixed(1)), // numeric, nicht integer
        bgg_rating: parseFloat(bggGame.bgg_rating.toFixed(1)),
        altersempfehlung: bggGame.minAge,
        awards: null, // Wird später manuell ergänzt
        status: 'Im Besitz',
        standort: '', // Manuell ergänzen
        fehlteile: false,
        anschaffungsdatum: new Date().toISOString().split('T')[0],
        info: bggGame.description ? bggGame.description.substring(0, 200) + '...' : '',
        rohrstrat: Math.round(bggGame.complexity), // Als Integer
        erweiterungenInBesitz: [],
        erweiterungenZurAnschaffung: []
      }
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
   * Privat: Parse Language Dependence aus Poll-Daten
   */
  _parseLanguageDependence(pollElement) {
    if (!pollElement) return null;

    const results = Array.from(pollElement.querySelectorAll('result'));
    let maxVotes = 0;
    let dependence = 'Unknown';

    results.forEach(result => {
      const votes = parseInt(result.getAttribute('numvotes')) || 0;
      if (votes > maxVotes) {
        maxVotes = votes;
        dependence = result.getAttribute('value');
      }
    });

    return dependence;
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

  /**
   * Hole alle Kategorien von BGG (cached)
   * Diese Funktion sollte sparsam aufgerufen werden wegen Rate Limiting
   * @returns {Promise<Array>} Array mit {id, name}
   */
  async getBGGCategories() {
    return requestQueue.add(async () => {
      // BGG API hat keinen direkten Endpoint für Kategorien
      // Wir bauen eine kleine Liste mit den häufigsten Kategorien manuell
      // In Zukunft könnte man diese aus einer anderen Quelle laden
      const commonCategories = [
        { id: 1001, name: 'Abstract' },
        { id: 1002, name: 'Action / Dexterity' },
        { id: 1003, name: 'Adventure' },
        { id: 1004, name: 'Age of Exploration' },
        { id: 1005, name: 'American Civil War' },
        { id: 1006, name: 'American West' },
        { id: 1007, name: 'Ancient' },
        { id: 1008, name: 'Animals' },
        { id: 1009, name: 'Aviation / Flight' },
        { id: 1010, name: 'Card Game' },
        { id: 1011, name: 'City Building' },
        { id: 1012, name: 'Civil War' },
        { id: 1013, name: 'Deduction' },
        { id: 1014, name: 'Dice' },
        { id: 1015, name: 'Economic' },
        { id: 1016, name: 'Educational' },
        { id: 1017, name: 'Electronic' },
        { id: 1018, name: 'Exploration' },
        { id: 1019, name: 'Fantasy' },
        { id: 1020, name: 'Fighting' },
        { id: 1021, name: 'Medieval' },
        { id: 1022, name: 'Memory' },
        { id: 1023, name: 'Military' },
        { id: 1024, name: 'Modern Warfare' },
        { id: 1025, name: 'Movies / TV / Radio theme' },
        { id: 1026, name: 'Murder / Mystery' },
        { id: 1027, name: 'Mythology' },
        { id: 1028, name: 'Negotiation' },
        { id: 1029, name: 'Party Game' },
        { id: 1030, name: 'Puzzle' },
        { id: 1031, name: 'Racing' },
        { id: 1032, name: 'Real-time' },
        { id: 1033, name: 'Religious' },
        { id: 1034, name: 'Renaissance' },
        { id: 1035, name: 'Science Fiction' },
        { id: 1036, name: 'Spies / Secret Agents' },
        { id: 1037, name: 'Sports' },
        { id: 1038, name: 'Strategy' },
        { id: 1039, name: 'Territory Building' },
        { id: 1040, name: 'Train' },
        { id: 1041, name: 'Travel' },
        { id: 1042, name: 'Trivia' },
        { id: 1043, name: 'Video Game Theme' },
        { id: 1044, name: 'Wargame' },
        { id: 1045, name: 'Word Game' },
        { id: 1046, name: 'World War I' },
        { id: 1047, name: 'World War II' }
      ];
      return commonCategories;
    });
  }

  /**
   * Finde beste BGG-Kategorie-Übereinstimmung für einen Namen (fuzzy match)
   * @param {string} categoryName - Name der Kategorie
   * @returns {Promise<Object>} {id, name, similarity} oder null
   */
  async findBGGCategory(categoryName) {
    const bggCategories = await this.getBGGCategories();
    const lower = categoryName.toLowerCase();
    
    // Exact match first
    const exact = bggCategories.find(c => c.name.toLowerCase() === lower);
    if (exact) return { ...exact, similarity: 1 };
    
    // Partial/fuzzy match
    let best = null;
    let bestScore = 0;
    
    bggCategories.forEach(cat => {
      const catLower = cat.name.toLowerCase();
      
      // Substring match
      if (catLower.includes(lower) || lower.includes(catLower)) {
        const score = 0.8;
        if (score > bestScore) {
          best = cat;
          bestScore = score;
        }
      }
      
      // Levenshtein-ähnlicher Score (vereinfacht)
      const similarity = this._calculateSimilarity(lower, catLower);
      if (similarity > bestScore) {
        best = cat;
        bestScore = similarity;
      }
    });
    
    return best && bestScore > 0.5 ? { ...best, similarity: bestScore } : null;
  }

  /**
   * Vereinfachte Ähnlichkeitsberechnung
   */
  _calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this._levenshtein(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein-Distanz
   */
  _levenshtein(s1, s2) {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }
}

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

// 5. Kategorie abgleichen
const match = await bggService.findBGGCategory('Strategy');
console.log(match); // {id: 1038, name: 'Strategy', similarity: 1}
*/

export const bggService = new BGGService();
