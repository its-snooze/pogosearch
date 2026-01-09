/**
 * ScrapedDuck API Integration
 * Fetches Pokemon GO raid boss data from ScrapedDuck API
 * Includes caching to respect GitHub's 5-minute cache duration
 */

// Base URL for ScrapedDuck data - DO NOT CHANGE THIS
const SCRAPED_DUCK_BASE = 'https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data';

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = 'pogosearch_raids_cache';

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

  try {
    const response = await fetch(`${SCRAPED_DUCK_BASE}/raids.min.json`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const raids = await response.json();
    
    if (!Array.isArray(raids)) {
      console.warn('ScrapedDuck raids API returned non-array data');
      return [];
    }

    // Cache the result
    setCachedData(CACHE_KEY, raids);
    
    return raids;
  } catch (error) {
    console.error('Error fetching raids from ScrapedDuck:', error);
    return [];
  }
}

/**
 * Groups raids by tier
 * IMPORTANT: ScrapedDuck uses exact strings "Tier 1", "Tier 3", "Tier 5", "Mega"
 */
export function groupRaidsByTier(raids) {
  const grouped = { 1: [], 3: [], 5: [], mega: [] };
  
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
