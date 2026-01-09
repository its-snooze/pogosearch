/**
 * ScrapedDuck API Integration
 * 
 * Fetches Pokemon GO events and raid boss data from ScrapedDuck API
 * Includes caching to respect GitHub's 5-minute cache duration
 */

// Base URL for ScrapedDuck data
const SCRAPED_DUCK_BASE = 'https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data';

// Cache configuration - GitHub caches for 5 minutes, so we should too
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
export const CACHE_KEYS = {
  EVENTS: 'pogosearch_events_cache',
  RAIDS: 'pogosearch_raids_cache'
};

/**
 * Reads cached data from localStorage
 * Checks if timestamp is less than 5 minutes old
 * Returns cached data or null if expired/missing
 */
export function getCachedData(key) {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached);
    const now = Date.now();
    const age = now - parsed.timestamp;

    if (age < CACHE_DURATION) {
      return parsed.data;
    }

    // Cache expired, remove it
    localStorage.removeItem(key);
    return null;
  } catch (error) {
    console.error(`Error reading cache for key ${key}:`, error);
    return null;
  }
}

/**
 * Saves data to localStorage with current timestamp
 * Format: { data: ..., timestamp: Date.now() }
 */
export function setCachedData(key, data) {
  const cacheObject = {
    data,
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(cacheObject));
  } catch (error) {
    console.error(`Error saving cache for key ${key}:`, error);
    // Handle quota exceeded errors gracefully
    if (error.name === 'QuotaExceededError') {
      // Clear old cache entries if storage is full
      try {
        Object.values(CACHE_KEYS).forEach(cacheKey => {
          if (cacheKey !== key) {
            localStorage.removeItem(cacheKey);
          }
        });
        // Retry once
        localStorage.setItem(key, JSON.stringify(cacheObject));
      } catch (retryError) {
        console.error('Failed to save cache after cleanup:', retryError);
      }
    }
  }
}

/**
 * Fetches events from ScrapedDuck API
 * Returns array of event objects
 * Handles errors by returning empty array
 * Uses caching to avoid excessive API calls
 */
export async function fetchEvents() {
  // Check cache first
  const cached = getCachedData(CACHE_KEYS.EVENTS);
  if (cached !== null) {
    return cached;
  }

  try {
    const response = await fetch(`${SCRAPED_DUCK_BASE}/events.min.json`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const events = await response.json();
    
    // Validate that we got an array
    if (!Array.isArray(events)) {
      console.warn('ScrapedDuck events API returned non-array data');
      return [];
    }

    // Cache the result
    setCachedData(CACHE_KEYS.EVENTS, events);
    
    return events;
  } catch (error) {
    console.error('Error fetching events from ScrapedDuck:', error);
    return [];
  }
}

/**
 * Fetches raids from ScrapedDuck API
 * Returns array of raid boss objects
 * Handles errors by returning empty array
 * Uses caching to avoid excessive API calls
 */
export async function fetchRaids() {
  // Check cache first
  const cached = getCachedData(CACHE_KEYS.RAIDS);
  if (cached !== null) {
    return cached;
  }

  try {
    const response = await fetch(`${SCRAPED_DUCK_BASE}/raids.min.json`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const raids = await response.json();
    
    // Validate that we got an array
    if (!Array.isArray(raids)) {
      console.warn('ScrapedDuck raids API returned non-array data');
      return [];
    }

    // Cache the result
    setCachedData(CACHE_KEYS.RAIDS, raids);
    
    return raids;
  } catch (error) {
    console.error('Error fetching raids from ScrapedDuck:', error);
    return [];
  }
}

/**
 * Filters events to return only those that are currently active
 * Takes events array
 * Returns only events where current time is between event.start and event.end
 * Handles invalid/missing dates
 */
export function filterActiveEvents(events) {
  if (!Array.isArray(events)) {
    return [];
  }

  const now = new Date();
  
  return events.filter(event => {
    try {
      if (!event.start || !event.end) {
        return false;
      }

      const startDate = new Date(event.start);
      const endDate = new Date(event.end);

      // Check if dates are valid
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return false;
      }

      // Event is active if now is between start and end
      return now >= startDate && now <= endDate;
    } catch (error) {
      console.warn('Error parsing event dates:', error, event);
      return false;
    }
  });
}

/**
 * Filters events to return only those starting within the next X days
 * Takes events array and number of days
 * Returns events starting within next X days
 * Default to 7 days
 */
export function filterUpcomingEvents(events, daysAhead = 7) {
  if (!Array.isArray(events)) {
    return [];
  }

  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(now.getDate() + daysAhead);

  return events.filter(event => {
    try {
      if (!event.start) {
        return false;
      }

      const startDate = new Date(event.start);

      // Check if date is valid
      if (isNaN(startDate.getTime())) {
        return false;
      }

      // Event is upcoming if it starts between now and futureDate
      // and hasn't ended yet
      const hasEnded = event.end ? new Date(event.end) < now : false;
      
      return startDate >= now && startDate <= futureDate && !hasEnded;
    } catch (error) {
      console.warn('Error parsing event dates:', error, event);
      return false;
    }
  });
}

/**
 * Groups raids by tier number
 * Takes raids array
 * Parses tier string ("Tier 1", "Tier 3", "Tier 5", or "Mega")
 * Returns object: { 1: [...], 3: [...], 5: [...], mega: [...] }
 */
export function groupRaidsByTier(raids) {
  const grouped = { 1: [], 3: [], 5: [], mega: [] };
  
  raids.forEach(raid => {
    const tier = raid.tier; // "Tier 1", "Tier 3", "Tier 5", or "Mega"
    
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
 * Raid boss counters database
 * 
 * Comprehensive list of top 10-15 counters for each raid boss.
 * Update this when the meta changes or new bosses appear.
 * 
 * Format: "Boss Name": ["Counter1", "Counter2", ...]
 */
export const RAID_COUNTERS = {
  // 5-STAR RAIDS
  "Genesect": ["Reshiram", "Chandelure", "Moltres", "Blaziken", "Entei", "Heatran", "Darmanitan", "Charizard", "Flareon", "Ho-Oh"],
  
  // MEGA RAIDS
  "Mega Blaziken": ["Kyogre", "Mewtwo", "Lugia", "Latios", "Alakazam", "Garchomp", "Rayquaza", "Palkia", "Swampert", "Samurott"],
  
  // 3-STAR RAIDS
  "Dhelmise": ["Chandelure", "Reshiram", "Moltres", "Heatran", "Darmanitan", "Blaziken", "Entei", "Flareon", "Charizard", "Ho-Oh"],
  "Dondozo": ["Zarude", "Kartana", "Xurkitree", "Electivire", "Raikou", "Magnezone", "Zekrom", "Luxray", "Tangrowth", "Roserade"],
  
  // 1-STAR RAIDS
  "Corphish": ["Zarude", "Kartana", "Xurkitree", "Electivire", "Raikou", "Magnezone", "Zekrom", "Luxray", "Tangrowth", "Roserade"],
  "Dwebble": ["Kyogre", "Swampert", "Samurott", "Kingler", "Feraligatr", "Blastoise", "Gyarados", "Empoleon", "Vaporeon", "Milotic"],
  "Clauncher": ["Zarude", "Kartana", "Xurkitree", "Electivire", "Raikou", "Magnezone", "Zekrom", "Luxray", "Tangrowth", "Roserade"],
  
  // Add more as raids change...
};

/**
 * Build counter search string for a raid boss
 * 
 * Takes a boss name and returns a comma-separated string of counter Pokemon names.
 * If no counters are defined for the boss, returns the boss name in lowercase as fallback.
 * 
 * @param {string} bossName - The name of the raid boss
 * @returns {string} - Comma-separated list of counter Pokemon names
 */
export function getCountersString(bossName) {
  const counters = RAID_COUNTERS[bossName];
  if (!counters || counters.length === 0) {
    // Fallback if no counters defined
    return bossName.toLowerCase();
  }
  return counters.join(',');
}

/**
 * Convenience function to get cached raids
 * Uses the existing cache system with the RAIDS cache key
 * @returns {Array|null} - Cached raids data or null if expired/missing
 */
export function getCachedRaids() {
  return getCachedData(CACHE_KEYS.RAIDS);
}

/**
 * Convenience function to set cached raids
 * Uses the existing cache system with the RAIDS cache key
 * @param {Array} data - Raids data to cache
 */
export function setCachedRaids(data) {
  setCachedData(CACHE_KEYS.RAIDS, data);
}
