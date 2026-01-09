/**
 * ScrapedDuck API Integration
 * Fetches Pokemon GO raid boss data from ScrapedDuck API
 * Includes caching to respect GitHub's 5-minute cache duration
 * 
 * Fallback chain:
 * 1. ScrapedDuck API (primary)
 * 2. LeekDuck HTML scraping via CORS proxy (fallback)
 * 3. Hardcoded data (last resort)
 */

// Base URL for ScrapedDuck data - DO NOT CHANGE THIS
const SCRAPED_DUCK_BASE = 'https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data';

// CORS proxy options (try multiple in case one is down)
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest='
];

// LeekDuck raid bosses page
const LEEKDUCK_RAIDS_URL = 'https://leekduck.com/raid-bosses/';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'pogosearch_raids_cache';
const CACHE_KEY_SOURCE = 'pogosearch_raids_source'; // Track data source

// Type image mapping (common Pokemon GO type images)
const TYPE_IMAGES = {
  'Normal': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_NORMAL.png',
  'Fire': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_FIRE.png',
  'Water': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_WATER.png',
  'Electric': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_ELECTRIC.png',
  'Grass': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_GRASS.png',
  'Ice': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_ICE.png',
  'Fighting': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_FIGHTING.png',
  'Poison': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_POISON.png',
  'Ground': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_GROUND.png',
  'Flying': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_FLYING.png',
  'Psychic': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_PSYCHIC.png',
  'Bug': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_BUG.png',
  'Rock': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_ROCK.png',
  'Ghost': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_GHOST.png',
  'Dragon': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_DRAGON.png',
  'Dark': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_DARK.png',
  'Steel': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_STEEL.png',
  'Fairy': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Types/POKEMON_TYPE_FAIRY.png'
};

// Weather image mapping
const WEATHER_IMAGES = {
  'Sunny': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Weather/weather_sunny.png',
  'Rainy': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Weather/weather_rainy.png',
  'Partly Cloudy': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Weather/weather_partly_cloudy.png',
  'Cloudy': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Weather/weather_cloudy.png',
  'Windy': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Weather/weather_windy.png',
  'Snow': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Weather/weather_snow.png',
  'Fog': 'https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Weather/weather_fog.png'
};

/**
 * Hardcoded fallback raid data
 * UPDATE THIS when raids rotate - data may be outdated
 */
const FALLBACK_RAIDS = [
  {
    name: "Corphish",
    tier: "Tier 1",
    canBeShiny: true,
    types: [
      { name: "Water", image: TYPE_IMAGES.Water }
    ],
    combatPower: {
      normal: { min: 653, max: 703 },
      boosted: { min: 816, max: 879 }
    },
    boostedWeather: [
      { name: "Rainy", image: WEATHER_IMAGES.Rainy }
    ],
    image: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_341_00.png"
  },
  {
    name: "Dwebble",
    tier: "Tier 1",
    canBeShiny: true,
    types: [
      { name: "Bug", image: TYPE_IMAGES.Bug },
      { name: "Rock", image: TYPE_IMAGES.Rock }
    ],
    combatPower: {
      normal: { min: 650, max: 699 },
      boosted: { min: 812, max: 874 }
    },
    boostedWeather: [
      { name: "Rainy", image: WEATHER_IMAGES.Rainy },
      { name: "Partly Cloudy", image: WEATHER_IMAGES['Partly Cloudy'] }
    ],
    image: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_557_00.png"
  },
  {
    name: "Clauncher",
    tier: "Tier 1",
    canBeShiny: true,
    types: [
      { name: "Water", image: TYPE_IMAGES.Water }
    ],
    combatPower: {
      normal: { min: 575, max: 621 },
      boosted: { min: 719, max: 776 }
    },
    boostedWeather: [
      { name: "Rainy", image: WEATHER_IMAGES.Rainy }
    ],
    image: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_692_00.png"
  },
  {
    name: "Dhelmise",
    tier: "Tier 3",
    canBeShiny: true,
    types: [
      { name: "Ghost", image: TYPE_IMAGES.Ghost },
      { name: "Grass", image: TYPE_IMAGES.Grass }
    ],
    combatPower: {
      normal: { min: 1608, max: 1685 },
      boosted: { min: 2010, max: 2106 }
    },
    boostedWeather: [
      { name: "Fog", image: WEATHER_IMAGES.Fog },
      { name: "Sunny", image: WEATHER_IMAGES.Sunny }
    ],
    image: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_781_00.png"
  },
  {
    name: "Dondozo",
    tier: "Tier 3",
    canBeShiny: false,
    types: [
      { name: "Water", image: TYPE_IMAGES.Water }
    ],
    combatPower: {
      normal: { min: 1633, max: 1712 },
      boosted: { min: 2041, max: 2140 }
    },
    boostedWeather: [
      { name: "Rainy", image: WEATHER_IMAGES.Rainy }
    ],
    image: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_977_00.png"
  },
  {
    name: "Genesect (Burn)",
    tier: "Tier 5",
    canBeShiny: false,
    types: [
      { name: "Bug", image: TYPE_IMAGES.Bug },
      { name: "Steel", image: TYPE_IMAGES.Steel }
    ],
    combatPower: {
      normal: { min: 1833, max: 1916 },
      boosted: { min: 2291, max: 2395 }
    },
    boostedWeather: [
      { name: "Rainy", image: WEATHER_IMAGES.Rainy },
      { name: "Snow", image: WEATHER_IMAGES.Snow }
    ],
    image: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_649_00.png"
  },
  {
    name: "Genesect (Chill)",
    tier: "Tier 5",
    canBeShiny: false,
    types: [
      { name: "Bug", image: TYPE_IMAGES.Bug },
      { name: "Steel", image: TYPE_IMAGES.Steel }
    ],
    combatPower: {
      normal: { min: 1833, max: 1916 },
      boosted: { min: 2291, max: 2395 }
    },
    boostedWeather: [
      { name: "Rainy", image: WEATHER_IMAGES.Rainy },
      { name: "Snow", image: WEATHER_IMAGES.Snow }
    ],
    image: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_649_00.png"
  },
  {
    name: "Mega Blaziken",
    tier: "Mega",
    canBeShiny: true,
    types: [
      { name: "Fire", image: TYPE_IMAGES.Fire },
      { name: "Fighting", image: TYPE_IMAGES.Fighting }
    ],
    combatPower: {
      normal: { min: 1550, max: 1627 },
      boosted: { min: 1938, max: 2034 }
    },
    boostedWeather: [
      { name: "Sunny", image: WEATHER_IMAGES.Sunny },
      { name: "Cloudy", image: WEATHER_IMAGES.Cloudy }
    ],
    image: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_257_00.png"
  },
  // SHADOW RAIDS
  {
    name: "Shadow Drowzee",
    tier: "Shadow 1",
    canBeShiny: true,
    types: [
      { name: "Psychic", image: TYPE_IMAGES.Psychic }
    ],
    combatPower: {
      normal: { min: 512, max: 594 },
      boosted: { min: 640, max: 743 }
    },
    boostedWeather: [
      { name: "Windy", image: WEATHER_IMAGES.Windy }
    ],
    image: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_096_00.png"
  },
  {
    name: "Shadow Ralts",
    tier: "Shadow 1",
    canBeShiny: true,
    types: [
      { name: "Psychic", image: TYPE_IMAGES.Psychic },
      { name: "Fairy", image: TYPE_IMAGES.Fairy }
    ],
    combatPower: {
      normal: { min: 250, max: 308 },
      boosted: { min: 313, max: 385 }
    },
    boostedWeather: [
      { name: "Windy", image: WEATHER_IMAGES.Windy },
      { name: "Cloudy", image: WEATHER_IMAGES.Cloudy }
    ],
    image: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_280_00.png"
  },
  {
    name: "Shadow Bagon",
    tier: "Shadow 1",
    canBeShiny: true,
    types: [
      { name: "Dragon", image: TYPE_IMAGES.Dragon }
    ],
    combatPower: {
      normal: { min: 575, max: 660 },
      boosted: { min: 719, max: 826 }
    },
    boostedWeather: [
      { name: "Windy", image: WEATHER_IMAGES.Windy }
    ],
    image: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_371_00.png"
  },
  {
    name: "Shadow Snover",
    tier: "Shadow 1",
    canBeShiny: true,
    types: [
      { name: "Grass", image: TYPE_IMAGES.Grass },
      { name: "Ice", image: TYPE_IMAGES.Ice }
    ],
    combatPower: {
      normal: { min: 577, max: 662 },
      boosted: { min: 721, max: 828 }
    },
    boostedWeather: [
      { name: "Sunny", image: WEATHER_IMAGES.Sunny },
      { name: "Snow", image: WEATHER_IMAGES.Snow }
    ],
    image: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_459_00.png"
  },
  {
    name: "Shadow Scyther",
    tier: "Shadow 3",
    canBeShiny: true,
    types: [
      { name: "Bug", image: TYPE_IMAGES.Bug },
      { name: "Flying", image: TYPE_IMAGES.Flying }
    ],
    combatPower: {
      normal: { min: 1414, max: 1546 },
      boosted: { min: 1768, max: 1933 }
    },
    boostedWeather: [
      { name: "Rainy", image: WEATHER_IMAGES.Rainy },
      { name: "Windy", image: WEATHER_IMAGES.Windy }
    ],
    image: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_123_00.png"
  },
  {
    name: "Shadow Aerodactyl",
    tier: "Shadow 3",
    canBeShiny: true,
    types: [
      { name: "Rock", image: TYPE_IMAGES.Rock },
      { name: "Flying", image: TYPE_IMAGES.Flying }
    ],
    combatPower: {
      normal: { min: 1456, max: 1590 },
      boosted: { min: 1821, max: 1988 }
    },
    boostedWeather: [
      { name: "Partly Cloudy", image: WEATHER_IMAGES['Partly Cloudy'] },
      { name: "Windy", image: WEATHER_IMAGES.Windy }
    ],
    image: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_142_00.png"
  },
  {
    name: "Shadow Sableye",
    tier: "Shadow 3",
    canBeShiny: true,
    types: [
      { name: "Dark", image: TYPE_IMAGES.Dark },
      { name: "Ghost", image: TYPE_IMAGES.Ghost }
    ],
    combatPower: {
      normal: { min: 747, max: 843 },
      boosted: { min: 934, max: 1054 }
    },
    boostedWeather: [
      { name: "Fog", image: WEATHER_IMAGES.Fog }
    ],
    image: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_302_00.png"
  },
  {
    name: "Shadow Cresselia",
    tier: "Shadow 5",
    canBeShiny: true,
    types: [
      { name: "Psychic", image: TYPE_IMAGES.Psychic }
    ],
    combatPower: {
      normal: { min: 1494, max: 1633 },
      boosted: { min: 1867, max: 2041 }
    },
    boostedWeather: [
      { name: "Windy", image: WEATHER_IMAGES.Windy }
    ],
    image: "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_488_00.png"
  }
];

/**
 * Parses CP range string like "653 - 703" or "653-703" into min/max numbers
 */
function parseCPRange(cpText) {
  if (!cpText) return { min: 0, max: 0 };
  
  const match = cpText.match(/(\d+)\s*-\s*(\d+)/);
  if (match) {
    return {
      min: parseInt(match[1], 10),
      max: parseInt(match[2], 10)
    };
  }
  
  // Try single number
  const single = parseInt(cpText.replace(/\D/g, ''), 10);
  if (!isNaN(single)) {
    return { min: single, max: single };
  }
  
  return { min: 0, max: 0 };
}

/**
 * Extracts type name from image URL or alt text
 */
function extractTypeName(imgElement) {
  // Try alt text first
  const alt = imgElement.getAttribute('alt') || '';
  if (alt) {
    const typeName = alt.replace(/type|pokemon|icon/gi, '').trim();
    if (typeName) return typeName;
  }
  
  // Try title
  const title = imgElement.getAttribute('title') || '';
  if (title) return title;
  
  // Try extracting from src URL
  const src = imgElement.getAttribute('src') || '';
  const match = src.match(/TYPE[_-]?(\w+)/i) || src.match(/(\w+)[_-]?type/i);
  if (match) return match[1];
  
  return null;
}

/**
 * Extracts weather name from image URL or alt text
 */
function extractWeatherName(imgElement) {
  const alt = imgElement.getAttribute('alt') || '';
  if (alt) {
    const weatherName = alt.replace(/weather|boost/gi, '').trim();
    if (weatherName) return weatherName;
  }
  
  const title = imgElement.getAttribute('title') || '';
  if (title) return title;
  
  const src = imgElement.getAttribute('src') || '';
  const match = src.match(/weather[_-]?(\w+)/i);
  if (match) return match[1];
  
  return null;
}

/**
 * Helper: Check if a name is a type or weather (NOT a Pokemon)
 */
function isTypeOrWeather(name) {
  if (!name || typeof name !== 'string') return true;
  
  const types = ['Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice', 
                 'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 
                 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'];
  
  const weather = ['Sunny', 'Rainy', 'Cloudy', 'Partly Cloudy', 'Windy', 
                   'Snow', 'Fog', 'Clear'];
  
  const cleanName = name.trim();
  
  // Exact match
  if (types.includes(cleanName) || weather.includes(cleanName)) return true;
  
  // Check if it's a combination of types (e.g., "BugRock")
  for (const type of types) {
    if (cleanName.includes(type) && cleanName !== type) {
      return true;
    }
  }
  
  // Pokemon names are at least 3 chars
  if (cleanName.length < 3) return true;
  
  return false;
}

/**
 * Helper: Extract clean text from a node, excluding nested elements
 */
function getDirectText(node) {
  if (!node) return '';
  
  let text = '';
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent;
    }
  }
  return text.trim();
}

/**
 * Helper: Parse CP ranges from text
 */
function parseCPRanges(text) {
  const cpPattern = /CP\s+(\d+)\s*-\s*(\d+)/gi;
  const matches = [...text.matchAll(cpPattern)];
  
  if (matches.length >= 2) {
    return {
      normal: {
        min: parseInt(matches[0][1], 10),
        max: parseInt(matches[0][2], 10)
      },
      boosted: {
        min: parseInt(matches[1][1], 10),
        max: parseInt(matches[1][2], 10)
      }
    };
  } else if (matches.length === 1) {
    const min = parseInt(matches[0][1], 10);
    const max = parseInt(matches[0][2], 10);
    return {
      normal: { min, max },
      boosted: {
        min: Math.floor(min * 1.25),
        max: Math.floor(max * 1.25)
      }
    };
  }
  
  return {
    normal: { min: 0, max: 0 },
    boosted: { min: 0, max: 0 }
  };
}

/**
 * Helper: Check if a header is under the Shadow Raids section
 * Walks backwards through siblings to find "Shadow Raids" header
 */
function isPreviousHeaderShadow(currentHeader) {
  let node = currentHeader.previousElementSibling;
  while (node) {
    if (node.tagName === 'H2' || node.tagName === 'H3') {
      const text = node.textContent.trim();
      if (text.includes('Shadow Raids')) {
        return true;
      }
      // If we hit a non-shadow header, stop
      if (text.includes('Star Raids') || text.includes('Mega Raids')) {
        return false;
      }
    }
    node = node.previousElementSibling;
  }
  return false;
}

/**
 * Parses LeekDuck HTML to extract raid boss data
 */
function parseLeekDuckHTML(html) {
  console.log('=== Starting LeekDuck HTML Parsing ===');
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const raids = [];
  
  // Find all tier headers (h2, h3, or divs with tier info)
  // LeekDuck uses markdown-style headers like "## 1-Star Raids"
  const tierHeaders = doc.querySelectorAll('h2, h3, [class*="tier"], [class*="raid-tier"]');
  
  tierHeaders.forEach(header => {
    const headerText = header.textContent.trim();
    console.log(`Found header: "${headerText}"`);
    
    // Determine tier from header text
    let tier = null;
    if (headerText.includes('1-Star') || headerText.includes('Tier 1')) {
      // Check if this is under Shadow Raids section
      const isShadow = headerText.includes('Shadow') || 
                       header.closest('[id*="shadow"]') !== null ||
                       // Check previous headers for "Shadow Raids"
                       isPreviousHeaderShadow(header);
      tier = isShadow ? 'Shadow 1' : 'Tier 1';
    } else if (headerText.includes('3-Star') || headerText.includes('Tier 3')) {
      const isShadow = headerText.includes('Shadow') || 
                       header.closest('[id*="shadow"]') !== null ||
                       isPreviousHeaderShadow(header);
      tier = isShadow ? 'Shadow 3' : 'Tier 3';
    } else if (headerText.includes('5-Star') || headerText.includes('Tier 5')) {
      const isShadow = headerText.includes('Shadow') || 
                       header.closest('[id*="shadow"]') !== null ||
                       isPreviousHeaderShadow(header);
      tier = isShadow ? 'Shadow 5' : 'Tier 5';
    } else if (headerText.includes('Mega')) {
      tier = 'Mega';
    }
    
    if (!tier) return;
    
    console.log(`  → Processing ${tier} section`);
    
    // Find the section container for this tier
    // Walk through siblings until next header or find parent container
    let sectionNode = header.parentElement;
    let currentElement = header.nextElementSibling;
    
    // Try to find a container that holds all cards for this tier
    while (currentElement && currentElement.tagName && !['H2', 'H3'].includes(currentElement.tagName)) {
      if (currentElement.querySelector && currentElement.querySelector('img[src*="pokemon_icons"]')) {
        sectionNode = currentElement;
        break;
      }
      currentElement = currentElement.nextElementSibling;
    }
    
    // Only find Pokemon icons, not all images
    const pokemonImages = sectionNode.querySelectorAll('img[src*="pokemon_icons"]');
    
    pokemonImages.forEach(img => {
      try {
        console.log(`    Found Pokemon image: ${img.getAttribute('src')}`);
        
        // Extract name from text node following the image
        let name = null;
        let node = img.nextSibling;
        
        // Walk through next siblings to find the Pokemon name
        while (node && !name) {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text && !isTypeOrWeather(text)) {
              name = text;
              break;
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            // Check direct text content of element
            const text = getDirectText(node);
            if (text && !isTypeOrWeather(text)) {
              name = text;
              break;
            }
            // Also check first text node child
            if (node.firstChild && node.firstChild.nodeType === Node.TEXT_NODE) {
              const text = node.firstChild.textContent.trim();
              if (text && !isTypeOrWeather(text)) {
                name = text;
                break;
              }
            }
          }
          node = node.nextSibling;
        }
        
        // If still no name, try parent element
        if (!name) {
          const parent = img.parentElement;
          if (parent) {
            const parentText = getDirectText(parent);
            if (parentText && !isTypeOrWeather(parentText)) {
              name = parentText;
            }
          }
        }
        
        // Skip if invalid
        if (!name || isTypeOrWeather(name)) {
          console.log(`      → Skipping invalid name: "${name}"`);
          return;
        }
        
        console.log(`      → Pokemon name: ${name}`);
        
        // Extract image URL
        const imageUrl = img.getAttribute('src') || 
                        `https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon/pokemon_icon_000_00.png`;
        
        // Find the card/container for this Pokemon
        let card = img.closest('[class*="card"], [class*="raid"], [class*="boss"], [class*="pokemon"], article, div');
        if (!card) {
          card = img.parentElement;
        }
        
        // Extract types from the card
        const types = [];
        const typeElements = card.querySelectorAll('img[src*="type"], img[src*="TYPE"]');
        typeElements.forEach(typeImg => {
          const typeName = extractTypeName(typeImg);
          if (typeName && TYPE_IMAGES[typeName] && !isTypeOrWeather(typeName)) {
            types.push({
              name: typeName,
              image: TYPE_IMAGES[typeName]
            });
          }
        });
        
        // Extract CP ranges from card text
        const cardText = card.textContent || '';
        const cpRanges = parseCPRanges(cardText);
        console.log(`      → CP: ${cpRanges.normal.min}-${cpRanges.normal.max} (${cpRanges.boosted.min}-${cpRanges.boosted.max} boosted)`);
        
        // Extract weather boosts
        const boostedWeather = [];
        const weatherElements = card.querySelectorAll('img[src*="weather"], img[src*="Weather"]');
        weatherElements.forEach(weatherImg => {
          const weatherName = extractWeatherName(weatherImg);
          if (weatherName && WEATHER_IMAGES[weatherName]) {
            boostedWeather.push({
              name: weatherName,
              image: WEATHER_IMAGES[weatherName]
            });
          }
        });
        
        if (types.length > 0) {
          console.log(`      → Types: ${types.map(t => t.name).join(', ')}`);
        }
        if (boostedWeather.length > 0) {
          console.log(`      → Weather: ${boostedWeather.map(w => w.name).join(', ')}`);
        }
        
        // Check for shiny
        const canBeShiny = cardText.includes('Shiny') || 
                          card.querySelector('[class*="shiny"]') !== null ||
                          card.querySelector('img[src*="shiny"]') !== null;
        
        // Build raid object
        const raid = {
          name: name,
          tier: tier,
          canBeShiny: canBeShiny,
          types: types.length > 0 ? types : [{ name: 'Normal', image: TYPE_IMAGES.Normal }],
          combatPower: {
            normal: cpRanges.normal,
            boosted: cpRanges.boosted
          },
          boostedWeather: boostedWeather,
          image: imageUrl
        };
        
        // Only add if CP is valid (not 0-0)
        if (cpRanges.normal.min > 0 && cpRanges.normal.max > 0) {
          raids.push(raid);
          console.log(`      → ✅ Added ${name} to ${tier}`);
        } else {
          console.log(`      → ❌ Skipping ${name} - invalid CP range`);
        }
      } catch (error) {
        console.warn('Error parsing Pokemon card:', error);
      }
    });
  });
  
  // If no raids found with headers, try alternative parsing
  if (raids.length === 0) {
    console.log('No raids found with headers, trying alternative parsing...');
    // Look for any Pokemon images directly
    const allPokemonImages = doc.querySelectorAll('img[src*="pokemon_icons"]');
    allPokemonImages.forEach(img => {
      try {
        // Extract name from nearby text
        let name = null;
        let node = img.nextSibling;
        while (node && !name) {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text && !isTypeOrWeather(text)) {
              name = text;
              break;
            }
          }
          node = node.nextSibling;
        }
        
        if (!name || isTypeOrWeather(name)) return;
        
        // Try to infer tier from context
        const parent = img.closest('article, [class*="card"], [class*="raid"]') || img.parentElement;
        const text = parent ? parent.textContent : '';
        const tier = text.includes('5') ? 'Tier 5' :
                    text.includes('3') ? 'Tier 3' :
                    text.includes('Mega') ? 'Mega' : 'Tier 1';
        
        const cpRanges = parseCPRanges(text);
        
        // Only add if CP is valid
        if (cpRanges.normal.min > 0 && cpRanges.normal.max > 0) {
          raids.push({
            name: name,
            tier: tier,
            canBeShiny: text.includes('Shiny'),
            types: [{ name: 'Normal', image: TYPE_IMAGES.Normal }],
            combatPower: {
              normal: cpRanges.normal,
              boosted: cpRanges.boosted
            },
            boostedWeather: [],
            image: img.getAttribute('src') || ''
          });
        }
      } catch (error) {
        console.warn('Error in alternative parsing:', error);
      }
    });
  }
  
  console.log(`=== Finished parsing. Found ${raids.length} valid raids ===`);
  return raids;
}

/**
 * Fetches raids from LeekDuck using CORS proxy
 */
async function fetchFromLeekDuck() {
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(LEEKDUCK_RAIDS_URL);
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });
      
      if (!response.ok) {
        throw new Error(`CORS proxy returned status: ${response.status}`);
      }
      
      const html = await response.text();
      const raids = parseLeekDuckHTML(html);
      
      if (raids.length > 0) {
        console.log(`Successfully fetched ${raids.length} raids from LeekDuck via ${proxy}`);
        return raids;
      }
    } catch (error) {
      console.warn(`Failed to fetch from LeekDuck via ${proxy}:`, error);
      continue;
    }
  }
  
  throw new Error('All CORS proxies failed');
}

/**
 * Fetches raids from ScrapedDuck API
 * Data structure from API:
 * {
 *   name: string,
 *   tier: "Tier 1" | "Tier 3" | "Tier 5" | "Mega",
 *   canBeShiny: boolean,
 *   types: [{name: string, image: string}],
 *   combatPower: {
 *     normal: {min: number, max: number},
 *     boosted: {min: number, max: number}
 *   },
 *   boostedWeather: [{name: string, image: string}],
 *   image: string
 * }
 */
export async function fetchRaids() {
  // Check cache first
  const cached = getCachedData(CACHE_KEY);
  if (cached !== null) {
    return cached;
  }

  // Try ScrapedDuck API first
  try {
    const response = await fetch(`${SCRAPED_DUCK_BASE}/raids.min.json`);
    
    if (response.ok) {
      const raids = await response.json();
      
      if (Array.isArray(raids) && raids.length > 0) {
        // Cache the result
        setCachedData(CACHE_KEY, raids);
        setCachedData(CACHE_KEY_SOURCE, 'scrapedduck');
        console.log('Successfully fetched raids from ScrapedDuck API');
        return raids;
      }
    }
    
    // If we get here, ScrapedDuck returned non-array or empty
    throw new Error('ScrapedDuck API returned invalid data');
  } catch (error) {
    console.warn('ScrapedDuck API failed, trying LeekDuck fallback:', error);
    
    // Fallback to LeekDuck scraping
    try {
      const raids = await fetchFromLeekDuck();
      
      if (Array.isArray(raids) && raids.length > 0) {
        // Cache the result
        setCachedData(CACHE_KEY, raids);
        setCachedData(CACHE_KEY_SOURCE, 'leekduck');
        console.log('Successfully fetched raids from LeekDuck');
        return raids;
      }
      
      throw new Error('LeekDuck parsing returned no raids');
    } catch (leekDuckError) {
      console.warn('LeekDuck fallback failed, using hardcoded data:', leekDuckError);
      
      // Last resort: hardcoded fallback
      setCachedData(CACHE_KEY, FALLBACK_RAIDS);
      setCachedData(CACHE_KEY_SOURCE, 'fallback');
      console.warn('Using hardcoded fallback data - may be outdated');
      return FALLBACK_RAIDS;
    }
  }
}

/**
 * Groups raids by tier
 * IMPORTANT: ScrapedDuck uses exact strings "Tier 1", "Tier 3", "Tier 5", "Mega"
 */
export function groupRaidsByTier(raids) {
  const grouped = { 
    1: [], 
    3: [], 
    5: [], 
    mega: [],
    shadow1: [],
    shadow3: [],
    shadow5: []
  };
  
  raids.forEach(raid => {
    const tier = raid.tier;
    
    if (tier === "Tier 1") {
      grouped[1].push(raid);
    } else if (tier === "Tier 3") {
      grouped[3].push(raid);
    } else if (tier === "Tier 5") {
      grouped[5].push(raid);
    } else if (tier === "Mega") {
      grouped.mega.push(raid);
    } else if (tier === "Shadow 1") {
      grouped.shadow1.push(raid);
    } else if (tier === "Shadow 3") {
      grouped.shadow3.push(raid);
    } else if (tier === "Shadow 5") {
      grouped.shadow5.push(raid);
    }
  });
  
  return grouped;
}

/**
 * Cache helpers
 */
function getCachedData(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch (error) {
    return null;
  }
}

function setCachedData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Cache error:', error);
  }
}

export function getCachedRaids() {
  return getCachedData(CACHE_KEY);
}

export function setCachedRaids(data) {
  setCachedData(CACHE_KEY, data);
}

/**
 * Get the current data source (for debugging/display)
 */
export function getRaidsDataSource() {
  return getCachedData(CACHE_KEY_SOURCE) || 'unknown';
}

/**
 * Raid boss counters database
 * UPDATE THIS when raids rotate or meta changes
 * Format: "Boss Name": ["Counter1", "Counter2", ...]
 */
export const RAID_COUNTERS = {
  // 5-STAR RAIDS (update these based on current rotation)
  "Genesect": ["Reshiram", "Chandelure", "Moltres", "Blaziken", "Entei", "Heatran", "Darmanitan", "Charizard", "Flareon", "Ho-Oh"],
  "Genesect (Burn)": ["Kyogre", "Swampert", "Samurott", "Kingler", "Feraligatr", "Blastoise", "Gyarados", "Empoleon"],
  "Genesect (Chill)": ["Reshiram", "Chandelure", "Moltres", "Blaziken", "Entei", "Heatran", "Darmanitan", "Charizard"],
  
  // MEGA RAIDS (update these based on current rotation)
  "Mega Blaziken": ["Kyogre", "Mewtwo", "Lugia", "Latios", "Alakazam", "Garchomp", "Rayquaza", "Palkia", "Swampert"],
  
  // 3-STAR RAIDS (update these based on current rotation)
  "Dhelmise": ["Chandelure", "Reshiram", "Moltres", "Heatran", "Darmanitan", "Blaziken", "Entei", "Flareon", "Charizard"],
  "Dondozo": ["Zarude", "Kartana", "Xurkitree", "Electivire", "Raikou", "Magnezone", "Zekrom", "Luxray", "Tangrowth"],
  
  // 1-STAR RAIDS (update these based on current rotation)
  "Corphish": ["Zarude", "Kartana", "Xurkitree", "Electivire", "Raikou", "Magnezone", "Zekrom", "Luxray"],
  "Dwebble": ["Kyogre", "Swampert", "Samurott", "Kingler", "Feraligatr", "Blastoise", "Gyarados", "Empoleon"],
  "Clauncher": ["Zarude", "Kartana", "Xurkitree", "Electivire", "Raikou", "Magnezone", "Zekrom", "Luxray"],
};

/**
 * Get counter search string for a boss
 */
export function getCountersString(bossName) {
  const counters = RAID_COUNTERS[bossName];
  if (!counters || counters.length === 0) {
    // Fallback: return boss name if no counters defined
    return bossName.toLowerCase();
  }
  return counters.join(',');
}
