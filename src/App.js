import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Search, Copy, X, ChevronDown, AlertTriangle, Check, 
  BarChart3, Zap, Sparkles, TrendingUp, Clock, Ruler, Swords, Plus, Minus,
  Bookmark, BookmarkCheck, Trash2, Download, Upload, Sun, Moon, Globe
} from 'lucide-react';

// Validation function for Pokemon GO search strings
function validateSearchString(str) {
  if (!str || str.trim() === '') {
    return { valid: true };
  }
  
  // Check for spaces
  if (str.includes(' ')) {
    return { 
      valid: false, 
      error: "Remove spaces from search string" 
    };
  }
  
  // Check for numbers followed directly by letters (missing &)
  // Pattern: Pokedex numbers (digits and commas) followed directly by a letter
  // This catches cases like "373shadow" or "409,464shadow"
  // We match: start of string or &, then comma-separated digits (Pokedex numbers), then a letter
  // This distinguishes from valid filters like "3attack" (single number, no comma) or "4*" (has *)
  const missingAmpersandPattern = /(?:^|&)(\d+(?:,\d+)+)([a-z])/;
  if (missingAmpersandPattern.test(str)) {
    return { 
      valid: false, 
      error: "Missing & between filters" 
    };
  }
  
  // Also check for single Pokedex number followed by letters (e.g., "373shadow")
  // But exclude valid single-digit filters like "3attack" by checking if it's a known filter pattern
  // We'll check if a single number followed by letters appears at start or after &
  const singleNumberPattern = /(?:^|&)(\d{2,})([a-z])/;
  if (singleNumberPattern.test(str)) {
    // This catches multi-digit numbers (Pokedex numbers) followed by letters
    // Single digit + letter might be a valid filter (e.g., "3attack"), so we allow those
    return { 
      valid: false, 
      error: "Missing & between filters" 
    };
  }
  
  // Check for & between consecutive Pokedex numbers
  // Split by & and check if adjacent parts are both Pokedex number lists
  const parts = str.split('&');
  for (let i = 0; i < parts.length - 1; i++) {
    const currentPart = parts[i].trim();
    const nextPart = parts[i + 1].trim();
    
    // Check if both parts are Pokedex numbers (only digits and commas)
    // This catches "373&409" which should be "373,409"
    if (/^[\d,]+$/.test(currentPart) && /^[\d,]+$/.test(nextPart)) {
      return { 
        valid: false, 
        error: "Use commas between Pokedex numbers, not &" 
      };
    }
  }
  
  return { valid: true };
}

// Category metadata with colors and icons
const categoryMeta = {
  stats: { 
    name: 'Stats & IVs', 
    icon: BarChart3, 
    gradient: 'from-blue-500 to-cyan-500',
    chipColor: 'bg-blue-500'
  },
  types: { 
    name: 'Types', 
    icon: Zap, 
    gradient: 'from-green-500 to-emerald-500',
    chipColor: 'bg-green-500'
  },
  special: { 
    name: 'Special Status', 
    icon: Sparkles, 
    gradient: 'from-purple-500 to-pink-500',
    chipColor: 'bg-purple-500'
  },
  evolution: { 
    name: 'Evolution & Buddy', 
    icon: TrendingUp, 
    gradient: 'from-orange-500 to-red-500',
    chipColor: 'bg-orange-500'
  },
  time: { 
    name: 'Time & Distance', 
    icon: Clock, 
    gradient: 'from-teal-500 to-cyan-500',
    chipColor: 'bg-teal-500'
  },
  size: { 
    name: 'Size & Gender', 
    icon: Ruler, 
    gradient: 'from-pink-500 to-rose-500',
    chipColor: 'bg-pink-500'
  },
  moves: { 
    name: 'Moves', 
    icon: Swords, 
    gradient: 'from-red-500 to-orange-500',
    chipColor: 'bg-red-500'
  },
  regions: { 
    name: 'Regions', 
    icon: Globe, 
    gradient: 'from-indigo-500 to-violet-500',
    chipColor: 'bg-indigo-500'
  },
};

// Filter definitions organized by category
const filterCategories = {
  stats: {
    name: 'Stats & IVs',
    filters: [
      { id: '4*', label: '4★ (100% IV)', value: '4*' },
      { id: '3*', label: '3★ (82-98% IV)', value: '3*' },
      { id: '2*', label: '2★ (67-80% IV)', value: '2*' },
      { id: '1*', label: '1★ (51-64% IV)', value: '1*' },
      { id: '0*', label: '0★ (0-49% IV)', value: '0*' },
      { id: '4attack', label: 'Perfect Attack (15)', value: '4attack' },
      { id: '3attack', label: 'High Attack (12-14)', value: '3attack' },
      { id: '4defense', label: 'Perfect Defense (15)', value: '4defense' },
      { id: '3defense', label: 'High Defense (12-14)', value: '3defense' },
      { id: '4hp', label: 'Perfect HP (15)', value: '4hp' },
      { id: '3hp', label: 'High HP (12-14)', value: '3hp' },
      { id: '0attack', label: 'Zero Attack', value: '0attack' },
      { id: '0defense', label: 'Zero Defense', value: '0defense' },
      { id: '0hp', label: 'Zero HP', value: '0hp' },
    ]
  },
  types: {
    name: 'Types',
    filters: [
      { id: 'normal', label: 'Normal', value: 'normal' },
      { id: 'fire', label: 'Fire', value: 'fire' },
      { id: 'water', label: 'Water', value: 'water' },
      { id: 'electric', label: 'Electric', value: 'electric' },
      { id: 'grass', label: 'Grass', value: 'grass' },
      { id: 'ice', label: 'Ice', value: 'ice' },
      { id: 'fighting', label: 'Fighting', value: 'fighting' },
      { id: 'poison', label: 'Poison', value: 'poison' },
      { id: 'ground', label: 'Ground', value: 'ground' },
      { id: 'flying', label: 'Flying', value: 'flying' },
      { id: 'psychic', label: 'Psychic', value: 'psychic' },
      { id: 'bug', label: 'Bug', value: 'bug' },
      { id: 'rock', label: 'Rock', value: 'rock' },
      { id: 'ghost', label: 'Ghost', value: 'ghost' },
      { id: 'dragon', label: 'Dragon', value: 'dragon' },
      { id: 'dark', label: 'Dark', value: 'dark' },
      { id: 'steel', label: 'Steel', value: 'steel' },
      { id: 'fairy', label: 'Fairy', value: 'fairy' },
    ]
  },
  special: {
    name: 'Special Status',
    filters: [
      { id: 'shiny', label: 'Shiny', value: 'shiny' },
      { id: 'lucky', label: 'Lucky', value: 'lucky' },
      { id: 'shadow', label: 'Shadow', value: 'shadow', conflicts: ['purified'] },
      { id: 'purified', label: 'Purified', value: 'purified', conflicts: ['shadow'] },
      { id: 'legendary', label: 'Legendary', value: 'legendary' },
      { id: 'mythical', label: 'Mythical', value: 'mythical' },
      { id: 'ultrabeast', label: 'Ultra Beast', value: 'ultrabeast' },
      { id: 'dynamax', label: 'Dynamax', value: 'dynamax' },
      { id: 'gigantamax', label: 'Gigantamax', value: 'gigantamax' },
      { id: 'costume', label: 'Costume', value: 'costume' },
      { id: 'background', label: 'Any Background', value: 'background' },
      { id: 'locationbackground', label: 'Location Background', value: 'locationbackground' },
      { id: 'specialbackground', label: 'Special Background', value: 'specialbackground' },
      { id: 'hatched', label: 'Hatched', value: 'hatched' },
      { id: 'eggsonly', label: 'Egg Exclusive (Babies)', value: 'eggsonly' },
      { id: 'traded', label: 'Traded', value: 'traded' },
      { id: 'alolan', label: 'Alolan Form', value: 'alolan' },
      { id: 'galarian', label: 'Galarian Form', value: 'galarian' },
      { id: 'hisuian', label: 'Hisuian Form', value: 'hisuian' },
      { id: 'paldean', label: 'Paldean Form', value: 'paldean' },
      { id: 'defender', label: 'Gym Defender', value: 'defender' },
      { id: 'favorite', label: 'Favorite', value: 'favorite' },
    ]
  },
  evolution: {
    name: 'Evolution & Buddy',
    filters: [
      { id: 'evolve', label: 'Can Evolve', value: 'evolve' },
      { id: 'megaevolve', label: 'Can Mega Evolve', value: 'megaevolve' },
      { id: 'evolvenew', label: 'New Dex Entry', value: 'evolvenew' },
      { id: 'item', label: 'Item Evolution', value: 'item' },
      { id: 'tradeevolve', label: 'Trade Evolution', value: 'tradeevolve' },
      { id: 'mega0', label: 'Mega Level 0', value: 'mega0' },
      { id: 'mega1', label: 'Mega Level 1', value: 'mega1' },
      { id: 'mega2', label: 'Mega Level 2', value: 'mega2' },
      { id: 'mega3', label: 'Mega Level 3', value: 'mega3' },
      { id: 'buddy0', label: 'Never Buddied', value: 'buddy0' },
      { id: 'buddy1', label: 'Buddy Level 1', value: 'buddy1' },
      { id: 'buddy2', label: 'Good Buddy', value: 'buddy2' },
      { id: 'buddy3', label: 'Great Buddy', value: 'buddy3' },
      { id: 'buddy4', label: 'Ultra Buddy', value: 'buddy4' },
      { id: 'buddy5', label: 'Best Buddy', value: 'buddy5' },
    ]
  },
  time: {
    name: 'Time & Distance',
    filters: [
      { id: 'age0', label: 'Caught Today', value: 'age0' },
      { id: 'age0-7', label: 'Last 7 Days', value: 'age0-7' },
      { id: 'age0-30', label: 'Last 30 Days', value: 'age0-30' },
      { id: 'year2024', label: '2024', value: 'year2024' },
      { id: 'year2023', label: '2023', value: 'year2023' },
      { id: 'year2022', label: '2022', value: 'year2022' },
      { id: 'year2021', label: '2021', value: 'year2021' },
      { id: 'year2020', label: '2020', value: 'year2020' },
      { id: 'year2019', label: '2019', value: 'year2019' },
      { id: 'year2018', label: '2018', value: 'year2018' },
      { id: 'year2017', label: '2017', value: 'year2017' },
      { id: 'year2016', label: '2016', value: 'year2016' },
      { id: 'distance1000-', label: 'Distance 1000km+', value: 'distance1000-' },
      { id: 'distance100-', label: 'Distance 100km+', value: 'distance100-' },
    ]
  },
  size: {
    name: 'Size & Gender',
    filters: [
      { id: 'xxs', label: 'XXS', value: 'xxs' },
      { id: 'xs', label: 'XS', value: 'xs' },
      { id: 'xl', label: 'XL', value: 'xl' },
      { id: 'xxl', label: 'XXL', value: 'xxl' },
      { id: 'male', label: 'Male', value: 'male' },
      { id: 'female', label: 'Female', value: 'female' },
      { id: 'genderunknown', label: 'Genderless', value: 'genderunknown' },
    ]
  },
  moves: {
    name: 'Moves',
    filters: [
      { id: '@special', label: 'Legacy/Special Moves', value: '@special' },
      // Fast Move Filters (Slot 1)
      { id: '@1normal', label: 'Normal Fast Move', value: '@1normal' },
      { id: '@1fire', label: 'Fire Fast Move', value: '@1fire' },
      { id: '@1water', label: 'Water Fast Move', value: '@1water' },
      { id: '@1electric', label: 'Electric Fast Move', value: '@1electric' },
      { id: '@1grass', label: 'Grass Fast Move', value: '@1grass' },
      { id: '@1ice', label: 'Ice Fast Move', value: '@1ice' },
      { id: '@1fighting', label: 'Fighting Fast Move', value: '@1fighting' },
      { id: '@1poison', label: 'Poison Fast Move', value: '@1poison' },
      { id: '@1ground', label: 'Ground Fast Move', value: '@1ground' },
      { id: '@1flying', label: 'Flying Fast Move', value: '@1flying' },
      { id: '@1psychic', label: 'Psychic Fast Move', value: '@1psychic' },
      { id: '@1bug', label: 'Bug Fast Move', value: '@1bug' },
      { id: '@1rock', label: 'Rock Fast Move', value: '@1rock' },
      { id: '@1ghost', label: 'Ghost Fast Move', value: '@1ghost' },
      { id: '@1dragon', label: 'Dragon Fast Move', value: '@1dragon' },
      { id: '@1dark', label: 'Dark Fast Move', value: '@1dark' },
      { id: '@1steel', label: 'Steel Fast Move', value: '@1steel' },
      { id: '@1fairy', label: 'Fairy Fast Move', value: '@1fairy' },
      // First Charged Move Filters (Slot 2)
      { id: '@2normal', label: 'Normal Charged Move 1', value: '@2normal' },
      { id: '@2fire', label: 'Fire Charged Move 1', value: '@2fire' },
      { id: '@2water', label: 'Water Charged Move 1', value: '@2water' },
      { id: '@2electric', label: 'Electric Charged Move 1', value: '@2electric' },
      { id: '@2grass', label: 'Grass Charged Move 1', value: '@2grass' },
      { id: '@2ice', label: 'Ice Charged Move 1', value: '@2ice' },
      { id: '@2fighting', label: 'Fighting Charged Move 1', value: '@2fighting' },
      { id: '@2poison', label: 'Poison Charged Move 1', value: '@2poison' },
      { id: '@2ground', label: 'Ground Charged Move 1', value: '@2ground' },
      { id: '@2flying', label: 'Flying Charged Move 1', value: '@2flying' },
      { id: '@2psychic', label: 'Psychic Charged Move 1', value: '@2psychic' },
      { id: '@2bug', label: 'Bug Charged Move 1', value: '@2bug' },
      { id: '@2rock', label: 'Rock Charged Move 1', value: '@2rock' },
      { id: '@2ghost', label: 'Ghost Charged Move 1', value: '@2ghost' },
      { id: '@2dragon', label: 'Dragon Charged Move 1', value: '@2dragon' },
      { id: '@2dark', label: 'Dark Charged Move 1', value: '@2dark' },
      { id: '@2steel', label: 'Steel Charged Move 1', value: '@2steel' },
      { id: '@2fairy', label: 'Fairy Charged Move 1', value: '@2fairy' },
      // Second Charged Move Filters (Slot 3)
      { id: '@3normal', label: 'Normal Charged Move 2', value: '@3normal' },
      { id: '@3fire', label: 'Fire Charged Move 2', value: '@3fire' },
      { id: '@3water', label: 'Water Charged Move 2', value: '@3water' },
      { id: '@3electric', label: 'Electric Charged Move 2', value: '@3electric' },
      { id: '@3grass', label: 'Grass Charged Move 2', value: '@3grass' },
      { id: '@3ice', label: 'Ice Charged Move 2', value: '@3ice' },
      { id: '@3fighting', label: 'Fighting Charged Move 2', value: '@3fighting' },
      { id: '@3poison', label: 'Poison Charged Move 2', value: '@3poison' },
      { id: '@3ground', label: 'Ground Charged Move 2', value: '@3ground' },
      { id: '@3flying', label: 'Flying Charged Move 2', value: '@3flying' },
      { id: '@3psychic', label: 'Psychic Charged Move 2', value: '@3psychic' },
      { id: '@3bug', label: 'Bug Charged Move 2', value: '@3bug' },
      { id: '@3rock', label: 'Rock Charged Move 2', value: '@3rock' },
      { id: '@3ghost', label: 'Ghost Charged Move 2', value: '@3ghost' },
      { id: '@3dragon', label: 'Dragon Charged Move 2', value: '@3dragon' },
      { id: '@3dark', label: 'Dark Charged Move 2', value: '@3dark' },
      { id: '@3steel', label: 'Steel Charged Move 2', value: '@3steel' },
      { id: '@3fairy', label: 'Fairy Charged Move 2', value: '@3fairy' },
      { id: '@weather', label: 'Weather Boosted', value: '@weather' },
    ]
  },
  regions: {
    name: 'Regions',
    filters: [
      { id: 'kanto', label: 'Kanto (Gen 1)', value: 'kanto' },
      { id: 'johto', label: 'Johto (Gen 2)', value: 'johto' },
      { id: 'hoenn', label: 'Hoenn (Gen 3)', value: 'hoenn' },
      { id: 'sinnoh', label: 'Sinnoh (Gen 4)', value: 'sinnoh' },
      { id: 'unova', label: 'Unova (Gen 5)', value: 'unova' },
      { id: 'kalos', label: 'Kalos (Gen 6)', value: 'kalos' },
      { id: 'alola', label: 'Alola (Gen 7)', value: 'alola' },
      { id: 'galar', label: 'Galar (Gen 8)', value: 'galar' },
      { id: 'paldea', label: 'Paldea (Gen 9)', value: 'paldea' },
    ]
  },
};

const PokemonGoSearchBuilder = () => {
  const [searchString, setSearchString] = useState('');
  const [includedFilters, setIncludedFilters] = useState([]);
  const [excludedFilters, setExcludedFilters] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({
    stats: true,
    types: false,
    special: false,
    evolution: false,
    time: false,
    size: false,
    moves: false,
    regions: false,
  });
  const [filterSearch, setFilterSearch] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [removingChip, setRemovingChip] = useState(null);
  const [isPremadeSearch, setIsPremadeSearch] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastHiding, setToastHiding] = useState(false);
  const [toastPosition, setToastPosition] = useState({ x: 0, y: 0 });
  const [toastKey, setToastKey] = useState(0);
  const toastTimeoutRef = useRef(null);
  const [validationResult, setValidationResult] = useState({ valid: true });
  const [showValidationTooltip, setShowValidationTooltip] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showQuickSearches, setShowQuickSearches] = useState(false);
  const [showCPRanges, setShowCPRanges] = useState(false);
  const [showPokemonSelection, setShowPokemonSelection] = useState(false);
  const [saveSuccessVisible, setSaveSuccessVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('pogoDarkMode');
    if (stored !== null) {
      return stored === 'true';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const MAX_SAVED_SEARCHES = 15;
  
  // Ref to store Pokedex numbers extracted from search string
  // This preserves Pokedex numbers when filters are updated
  const pokedexNumbersRef = useRef('');

  // Load saved searches from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pogoSearches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSavedSearches(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load saved searches:', err);
    }
  }, []);

  // Save searches to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('pogoSearches', JSON.stringify(savedSearches));
    } catch (err) {
      console.error('Failed to save searches:', err);
      // Handle quota exceeded error
      if (err.name === 'QuotaExceededError') {
        alert('Storage limit reached. Please delete some saved searches.');
      }
    }
  }, [savedSearches]);

  useEffect(() => {
    try {
      localStorage.setItem('pogoDarkMode', JSON.stringify(isDarkMode));
    } catch (err) {
      console.error('Failed to persist theme preference:', err);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
  }, [isDarkMode]);

  // Cleanup toast timeout on unmount
  React.useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Tooltip explanations for filters
  const filterTooltips = {
    '4*': "Perfect Pokémon with 15/15/15 stats. Also called 'hundos'.",
    '3*': "High IV Pokémon with 37-44 total stat points.",
    '2*': "Medium IV Pokémon with 30-36 total stat points.",
    '1*': "Low IV Pokémon with 23-29 total stat points.",
    '0*': "Very low IV Pokémon with 0-22 total stat points.",
    '4attack': "Pokémon with maximum 15 Attack IV.",
    '3attack': "Pokémon with high Attack IV (12-14).",
    '4defense': "Pokémon with maximum 15 Defense IV.",
    '3defense': "Pokémon with high Defense IV (12-14).",
    '4hp': "Pokémon with maximum 15 HP IV.",
    '3hp': "Pokémon with high HP IV (12-14).",
    '0attack': "Pokémon with 0 Attack IV.",
    '0defense': "Pokémon with 0 Defense IV.",
    '0hp': "Pokémon with 0 HP IV.",
    'shadow': "Pokémon caught from Team GO Rocket. Can be powered up or purified.",
    'purified': "Shadow Pokémon that have been cleansed. Cannot be both shadow and purified.",
    'lucky': "Pokémon received from Lucky Trades. Cost less dust to power up.",
    '@special': "Pokémon with legacy or Community Day exclusive moves.",
    'age0': "Pokémon caught in the last 24 hours.",
    'age0-7': "Pokémon caught in the last 7 days.",
    'age0-30': "Pokémon caught in the last 30 days.",
    'distance1000-': "Pokémon caught 1000km or more from your current location.",
    'distance100-': "Pokémon caught 100km or more from your current location.",
    'buddy5': "Best Buddy status - maximum buddy level with CP boost.",
    'buddy4': "Ultra Buddy status - high buddy level.",
    'buddy3': "Great Buddy status - medium buddy level.",
    'buddy2': "Good Buddy status - low buddy level.",
    'buddy1': "Buddy Level 1 - just started walking.",
    'buddy0': "Never been set as a buddy.",
    'evolvenew': "Pokémon that will give a new Pokédex entry when evolved.",
    'item': "Pokémon that need an evolution item (e.g., Sinnoh Stone) to evolve.",
    'tradeevolve': "Pokémon eligible for candy-free evolution after trading.",
    'eggsonly': "Baby Pokémon that can only be obtained from eggs. Important because they're cheaper to unlock second charge moves before evolving.",
    'mega0': "Pokémon that can Mega Evolve but haven't been Mega Evolved yet.",
    'mega1': "Mega Level 1 - can Mega Evolve for 4 hours.",
    'mega2': "Mega Level 2 - can Mega Evolve for 8 hours.",
    'mega3': "Mega Level 3 - can Mega Evolve for 8 hours with reduced cost.",
  };

  // Check for conflicts
  const getConflicts = useCallback((included, excluded) => {
    const conflicts = [];
    const allFilters = [...included, ...excluded];
    
    // Check for include/exclude conflicts on same filter
    included.forEach(filter => {
      if (excluded.includes(filter)) {
        const filterDef = Object.values(filterCategories)
          .flatMap(cat => cat.filters)
          .find(f => f.id === filter);
        conflicts.push(`${filterDef?.label || filter} cannot be both included and excluded`);
      }
    });
    
    // Check for multiple star ratings (mutually exclusive)
    const starRatings = ['4*', '3*', '2*', '1*', '0*'];
    const selectedStars = allFilters.filter(f => starRatings.includes(f));
    if (selectedStars.length > 1) {
      const starLabels = selectedStars.map(id => {
        const filterDef = Object.values(filterCategories)
          .flatMap(cat => cat.filters)
          .find(f => f.id === id);
        return filterDef?.label || id;
      });
      conflicts.push(`Star ratings are mutually exclusive. Cannot select multiple: ${starLabels.join(', ')}`);
    }
    
    // Check for filter definition conflicts
    allFilters.forEach(filter => {
      const filterDef = Object.values(filterCategories)
        .flatMap(cat => cat.filters)
        .find(f => f.id === filter);
      
      if (filterDef?.conflicts) {
        filterDef.conflicts.forEach(conflictId => {
          if (allFilters.includes(conflictId)) {
            conflicts.push(`${filterDef.label} conflicts with ${
              Object.values(filterCategories)
                .flatMap(cat => cat.filters)
                .find(f => f.id === conflictId)?.label
            }`);
          }
        });
      }
    });
    return [...new Set(conflicts)];
  }, []);

  const conflicts = useMemo(() => getConflicts(includedFilters, excludedFilters), [includedFilters, excludedFilters, getConflicts]);

  // Extract Pokedex numbers from a search string
  // Returns the Pokedex number part (e.g., "373,409,464") or empty string
  // Also updates the ref to preserve Pokedex numbers
  const extractPokedexNumbers = useCallback((searchStr) => {
    if (!searchStr || searchStr.trim() === '') {
      pokedexNumbersRef.current = '';
      return '';
    }
    
    // Split by & to get parts
    const parts = searchStr.split('&').map(p => p.trim()).filter(p => p);
    
    // Find the first part that is all digits and commas (Pokedex numbers)
    for (const part of parts) {
      if (/^[\d,]+$/.test(part)) {
        pokedexNumbersRef.current = part;
        return part;
      }
    }
    
    pokedexNumbersRef.current = '';
    return '';
  }, []);

  // Build search string from included and excluded filters
  // Follows Pokemon GO syntax rules:
  // - Commas (,) for OR logic (types, multiple special statuses)
  // - Ampersands (&) for AND logic (combining different filter categories)
  // - Exclamation (!) for NOT (goes before the term)
  // - Star ratings are mutually exclusive (only one can be selected)
  // - Pokedex numbers are preserved from ref (extracted from search string)
  const buildSearchString = useCallback((included, excluded) => {
    // Get filter objects for included and excluded
    const getFilterObject = (id) => {
      return Object.values(filterCategories)
        .flatMap(cat => cat.filters)
        .find(f => f.id === id);
    };

    // Categorize filters
    const starRatings = ['4*', '3*', '2*', '1*', '0*'];
    const statFilters = ['4attack', '3attack', '4defense', '3defense', '4hp', '3hp', '0attack', '0defense', '0hp'];
    const typeFilters = filterCategories.types.filters.map(f => f.id);
    const specialFilters = filterCategories.special.filters.map(f => f.id);
    const evolutionFilters = filterCategories.evolution.filters.map(f => f.id);
    const timeFilters = filterCategories.time.filters.map(f => f.id);
    const sizeFilters = filterCategories.size.filters.map(f => f.id);
    const moveFilters = filterCategories.moves.filters.map(f => f.id);

    // Separate included filters by category
    const includedStar = included.filter(id => starRatings.includes(id));
    const includedStats = included.filter(id => statFilters.includes(id));
    const includedTypes = included.filter(id => typeFilters.includes(id));
    const includedSpecial = included.filter(id => specialFilters.includes(id));
    const includedEvolution = included.filter(id => evolutionFilters.includes(id));
    const includedTime = included.filter(id => timeFilters.includes(id));
    const includedSize = included.filter(id => sizeFilters.includes(id));
    const includedMoves = included.filter(id => moveFilters.includes(id));

    // Separate excluded filters by category
    const excludedStar = excluded.filter(id => starRatings.includes(id));
    const excludedStats = excluded.filter(id => statFilters.includes(id));
    const excludedTypes = excluded.filter(id => typeFilters.includes(id));
    const excludedSpecial = excluded.filter(id => specialFilters.includes(id));
    const excludedEvolution = excluded.filter(id => evolutionFilters.includes(id));
    const excludedTime = excluded.filter(id => timeFilters.includes(id));
    const excludedSize = excluded.filter(id => sizeFilters.includes(id));
    const excludedMoves = excluded.filter(id => moveFilters.includes(id));

    // Build parts of the search string
    const parts = [];

    // Star ratings: Only one can be included (mutually exclusive)
    // If multiple are selected, use the first one (or handle conflict)
    if (includedStar.length > 0) {
      const filter = getFilterObject(includedStar[0]);
      if (filter?.value) {
        parts.push(filter.value);
      }
    }

    // Stat filters: Combine with commas (OR logic) if multiple
    if (includedStats.length > 0) {
      const statValues = includedStats
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean);
      if (statValues.length > 0) {
        parts.push(statValues.join(','));
      }
    }

    // Types: Combine with commas (OR logic)
    if (includedTypes.length > 0) {
      const typeValues = includedTypes
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean);
      if (typeValues.length > 0) {
        parts.push(typeValues.join(','));
      }
    }

    // Special status: Combine with commas (OR logic) if multiple
    if (includedSpecial.length > 0) {
      const specialValues = includedSpecial
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean);
      if (specialValues.length > 0) {
        parts.push(specialValues.join(','));
      }
    }

    // Evolution: Combine with commas (OR logic) if multiple
    if (includedEvolution.length > 0) {
      const evolutionValues = includedEvolution
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean);
      if (evolutionValues.length > 0) {
        parts.push(evolutionValues.join(','));
      }
    }

    // Time: Combine with commas (OR logic) if multiple
    if (includedTime.length > 0) {
      const timeValues = includedTime
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean);
      if (timeValues.length > 0) {
        parts.push(timeValues.join(','));
      }
    }

    // Size: Combine with commas (OR logic) if multiple
    if (includedSize.length > 0) {
      const sizeValues = includedSize
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean);
      if (sizeValues.length > 0) {
        parts.push(sizeValues.join(','));
      }
    }

    // Moves: Combine with commas (OR logic) if multiple
    if (includedMoves.length > 0) {
      const moveValues = includedMoves
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean);
      if (moveValues.length > 0) {
        parts.push(moveValues.join(','));
      }
    }

    // Excluded filters: Add with ! prefix, combine with commas if multiple of same category
    const excludedParts = [];

    if (excludedStar.length > 0) {
      const filter = getFilterObject(excludedStar[0]);
      if (filter?.value) {
        excludedParts.push(`!${filter.value}`);
      }
    }

    if (excludedStats.length > 0) {
      const statValues = excludedStats
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean)
        .map(v => `!${v}`);
      if (statValues.length > 0) {
        excludedParts.push(statValues.join(','));
      }
    }

    if (excludedTypes.length > 0) {
      const typeValues = excludedTypes
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean)
        .map(v => `!${v}`);
      if (typeValues.length > 0) {
        excludedParts.push(typeValues.join(','));
      }
    }

    if (excludedSpecial.length > 0) {
      const specialValues = excludedSpecial
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean)
        .map(v => `!${v}`);
      if (specialValues.length > 0) {
        excludedParts.push(specialValues.join(','));
      }
    }

    if (excludedEvolution.length > 0) {
      const evolutionValues = excludedEvolution
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean)
        .map(v => `!${v}`);
      if (evolutionValues.length > 0) {
        excludedParts.push(evolutionValues.join(','));
      }
    }

    if (excludedTime.length > 0) {
      const timeValues = excludedTime
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean)
        .map(v => `!${v}`);
      if (timeValues.length > 0) {
        excludedParts.push(timeValues.join(','));
      }
    }

    if (excludedSize.length > 0) {
      const sizeValues = excludedSize
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean)
        .map(v => `!${v}`);
      if (sizeValues.length > 0) {
        excludedParts.push(sizeValues.join(','));
      }
    }

    if (excludedMoves.length > 0) {
      const moveValues = excludedMoves
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean)
        .map(v => `!${v}`);
      if (moveValues.length > 0) {
        excludedParts.push(moveValues.join(','));
      }
    }

    // Get Pokedex numbers from ref (preserved from previous search string)
    const pokedexNumbers = pokedexNumbersRef.current;
    
    // Combine all filter parts with & (AND logic)
    // First add included parts, then excluded parts
    const allFilterParts = [...parts, ...excludedParts];
    
    // Build the final search string
    const finalParts = [];
    
    // Add Pokedex numbers first (if they exist)
    if (pokedexNumbers) {
      finalParts.push(pokedexNumbers);
    }
    
    // Add filter parts
    if (allFilterParts.length > 0) {
      finalParts.push(...allFilterParts);
    }
    
    // CRITICAL: Join with & (no spaces) - this ensures Pokedex numbers and filters are separated by &
    if (finalParts.length === 0) return '';
    
    const result = finalParts.join('&');
    
    // Validate the generated search string as a safety check
    const validation = validateSearchString(result);
    if (!validation.valid && process.env.NODE_ENV === 'development') {
      console.warn(`Generated invalid search string: "${result}" - ${validation.error}`);
    }
    
    return result;
  }, []);

  // Update search string when filters change (but not if it's a premade search)
  React.useEffect(() => {
    if (!isPremadeSearch) {
      const newSearchString = buildSearchString(includedFilters, excludedFilters);
      setSearchString(newSearchString);
    }
  }, [includedFilters, excludedFilters, isPremadeSearch, buildSearchString]);

  // Validate search string whenever it changes
  React.useEffect(() => {
    const validation = validateSearchString(searchString);
    setValidationResult(validation);
    
    // Console warning during development
    if (!validation.valid && process.env.NODE_ENV === 'development') {
      console.warn(`Invalid search string: "${searchString}" - ${validation.error}`);
    }
  }, [searchString]);

  const toggleIncludeFilter = (filterId) => {
    setIsPremadeSearch(false);
    setIncludedFilters(prev => {
      if (prev.includes(filterId)) {
        return prev.filter(id => id !== filterId);
      } else {
        // Remove from excluded if it's there
        setExcludedFilters(prevExcluded => prevExcluded.filter(id => id !== filterId));
        
        // Star ratings are mutually exclusive - remove other star ratings
        const starRatings = ['4*', '3*', '2*', '1*', '0*'];
        if (starRatings.includes(filterId)) {
          return [...prev.filter(id => !starRatings.includes(id)), filterId];
        }
        
        return [...prev, filterId];
      }
    });
  };

  const toggleExcludeFilter = (filterId) => {
    setIsPremadeSearch(false);
    setExcludedFilters(prev => {
      if (prev.includes(filterId)) {
        return prev.filter(id => id !== filterId);
      } else {
        // Remove from included if it's there
        setIncludedFilters(prevIncluded => prevIncluded.filter(id => id !== filterId));
        
        // Star ratings are mutually exclusive - remove other star ratings
        const starRatings = ['4*', '3*', '2*', '1*', '0*'];
        if (starRatings.includes(filterId)) {
          return [...prev.filter(id => !starRatings.includes(id)), filterId];
        }
        
        return [...prev, filterId];
      }
    });
  };

  const removeFilter = (filterId, isExcluded = false) => {
    setIsPremadeSearch(false);
    setRemovingChip(filterId);
    setTimeout(() => {
      if (isExcluded) {
        setExcludedFilters(prev => prev.filter(id => id !== filterId));
      } else {
        setIncludedFilters(prev => prev.filter(id => id !== filterId));
      }
      setRemovingChip(null);
    }, 300);
  };

  const clearAll = () => {
    setIncludedFilters([]);
    setExcludedFilters([]);
    setSearchString('');
    setIsPremadeSearch(false);
    pokedexNumbersRef.current = ''; // Clear Pokedex numbers ref
  };

  // Parse search string to extract filter IDs (included and excluded)
  // Handles Pokemon GO syntax: filters separated by &, comma-separated values within parts
  const parseSearchStringToFilters = (searchStr) => {
    const includedIds = [];
    const excludedIds = [];
    
    if (!searchStr || searchStr.trim() === '') {
      return { included: includedIds, excluded: excludedIds };
    }
    
    // Split by & to get filter parts (no spaces)
    const parts = searchStr.split('&').map(p => p.trim()).filter(p => p);
    
    // Process each part
    parts.forEach(part => {
      // Check if this part is Pokemon numbers (comma-separated digits)
      // If it's all digits and commas, skip it (it's a Pokedex number list)
      const isPokemonNumbers = /^[\d,]+$/.test(part);
      if (isPokemonNumbers) {
        return; // Skip Pokemon number parts
      }
      
      // Handle comma-separated filters like "shadow,mega,primal" or "fire,water,grass"
      const filters = part.split(',').map(f => f.trim()).filter(f => f);
      
      filters.forEach(filterValue => {
        const isExcluded = filterValue.startsWith('!');
        const cleanValue = isExcluded ? filterValue.substring(1) : filterValue;
        
        // Find the filter ID that matches this value
        const filter = Object.values(filterCategories)
          .flatMap(cat => cat.filters)
          .find(f => f.value === cleanValue);
        
        if (filter) {
          if (isExcluded) {
            excludedIds.push(filter.id);
          } else {
            includedIds.push(filter.id);
          }
        }
      });
    });
    
    return { included: includedIds, excluded: excludedIds };
  };

  const copyToClipboard = async () => {
    // Validate before copying
    const validation = validateSearchString(searchString);
    if (!validation.valid) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Cannot copy invalid search string: "${searchString}" - ${validation.error}`);
      }
      // Still allow copying, but show validation error
      setValidationResult(validation);
      return;
    }
    
    try {
      await navigator.clipboard.writeText(searchString);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Filter search functionality
  const filteredCategories = useMemo(() => {
    if (!filterSearch) return filterCategories;
    
    const search = filterSearch.toLowerCase();
    const result = {};
    
    Object.entries(filterCategories).forEach(([key, category]) => {
      const matchingFilters = category.filters.filter(filter =>
        filter.label.toLowerCase().includes(search) ||
        filter.value.toLowerCase().includes(search)
      );
      
      if (matchingFilters.length > 0) {
        result[key] = {
          ...category,
          filters: matchingFilters
        };
      }
    });
    
    return result;
  }, [filterSearch]);

  const getChipLabel = (filterId) => {
    const filter = Object.values(filterCategories)
      .flatMap(cat => cat.filters)
      .find(f => f.id === filterId);
    return filter?.label || filterId;
  };

  const clearSearch = () => {
    setFilterSearch('');
  };

  // Append filter combo to search string
  const appendFilterCombo = (comboString) => {
    setIsPremadeSearch(false);
    
    // Parse the combo string to get new filters (remove leading & if present)
    const cleanCombo = comboString.startsWith('&') ? comboString.substring(1) : comboString;
    const { included: newIncluded, excluded: newExcluded } = parseSearchStringToFilters(cleanCombo);
    
    // Merge with existing filters
    setIncludedFilters(prev => {
      const merged = [...prev, ...newIncluded];
      // Remove duplicates
      return [...new Set(merged)];
    });
    
    setExcludedFilters(prev => {
      const merged = [...prev, ...newExcluded];
      // Remove duplicates
      return [...new Set(merged)];
    });
    
    // Append to search string
    if (!searchString || searchString.trim() === '') {
      setSearchString(cleanCombo);
    } else {
      const newSearchString = `${searchString}${comboString}`;
      setSearchString(newSearchString);
      // Preserve any Pokedex numbers
      extractPokedexNumbers(newSearchString);
    }
  };

  // Insert or replace CP range in search string
  const insertCPRange = (cpRange) => {
    setIsPremadeSearch(false);
    
    if (!searchString || searchString.trim() === '') {
      // If search string is empty, just set the CP range
      setSearchString(cpRange);
      return;
    }
    
    // Split by & to get parts
    const parts = searchString.split('&').map(p => p.trim()).filter(p => p);
    
    // Find existing CP range (starts with "cp" followed by numbers and hyphens)
    let cpIndex = -1;
    for (let i = 0; i < parts.length; i++) {
      if (/^cp[\d\-]+$/.test(parts[i])) {
        cpIndex = i;
        break;
      }
    }
    
    // Replace existing CP range or insert new one
    if (cpIndex >= 0) {
      // Replace existing CP range
      parts[cpIndex] = cpRange;
    } else {
      // Insert CP range (after Pokedex numbers if they exist, otherwise at the beginning)
      let insertIndex = 0;
      for (let i = 0; i < parts.length; i++) {
        // Check if this part is Pokedex numbers (digits, commas, and hyphens for ranges)
        if (/^[\d,\-]+$/.test(parts[i])) {
          insertIndex = i + 1;
          break;
        }
      }
      parts.splice(insertIndex, 0, cpRange);
    }
    
    const newSearchString = parts.join('&');
    setSearchString(newSearchString);
    // Preserve any Pokedex numbers
    extractPokedexNumbers(newSearchString);
  };

  // Insert Pokemon numbers into search string
  const insertPokemonNumbers = (numbers) => {
    setIsPremadeSearch(false);
    
    if (!searchString || searchString.trim() === '') {
      // If search string is empty, just set the numbers
      setSearchString(numbers);
      extractPokedexNumbers(numbers);
      return;
    }
    
    // Split by & to get parts
    const parts = searchString.split('&').map(p => p.trim()).filter(p => p);
    
    // Find the Pokedex number part (all digits and commas, or ranges)
    let pokedexIndex = -1;
    let existingPokedex = '';
    
    for (let i = 0; i < parts.length; i++) {
      // Check if this part is Pokedex numbers (digits, commas, and hyphens for ranges)
      if (/^[\d,\-]+$/.test(parts[i])) {
        pokedexIndex = i;
        existingPokedex = parts[i];
        break;
      }
    }
    
    // If there's an existing Pokedex number part, merge with comma
    if (pokedexIndex >= 0) {
      // Merge existing numbers with new numbers using comma
      const merged = existingPokedex ? `${existingPokedex},${numbers}` : numbers;
      parts[pokedexIndex] = merged;
      const newSearchString = parts.join('&');
      setSearchString(newSearchString);
      extractPokedexNumbers(newSearchString);
    } else {
      // No existing Pokedex numbers, prepend them
      const newSearchString = `${numbers}&${searchString}`;
      setSearchString(newSearchString);
      extractPokedexNumbers(newSearchString);
    }
  };

  // Saved searches functions
  const handleSaveSearch = () => {
    if (!searchString || searchString.trim() === '') {
      return;
    }
    setSaveSearchName('');
    setShowSaveModal(true);
  };

  const confirmSaveSearch = () => {
    const name = saveSearchName.trim();
    if (!name) {
      return;
    }

    const newSearch = {
      id: Date.now().toString(),
      name: name,
      searchString: searchString,
      createdAt: new Date().toISOString()
    };

    setSavedSearches(prev => {
      const updated = [newSearch, ...prev];
      // Limit to MAX_SAVED_SEARCHES
      if (updated.length > MAX_SAVED_SEARCHES) {
        return updated.slice(0, MAX_SAVED_SEARCHES);
      }
      return updated;
    });

    setShowSaveModal(false);
    setSaveSearchName('');
    
    // Show success animation
    setSaveSuccessVisible(true);
    setTimeout(() => {
      setSaveSuccessVisible(false);
    }, 2000);
  };

  const deleteSavedSearch = (id) => {
    setSavedSearches(prev => prev.filter(s => s.id !== id));
  };

  const loadSavedSearch = (savedSearch) => {
    const { included, excluded } = parseSearchStringToFilters(savedSearch.searchString);
    extractPokedexNumbers(savedSearch.searchString);
    setSearchString(savedSearch.searchString);
    setIncludedFilters(included);
    setExcludedFilters(excluded);
    setIsPremadeSearch(true);
  };

  const copySavedSearch = async (searchString) => {
    try {
      await navigator.clipboard.writeText(searchString);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const exportSavedSearches = () => {
    try {
      const dataStr = JSON.stringify(savedSearches, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'pogo-searches.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export:', err);
    }
  };

  const importSavedSearches = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          setSavedSearches(prev => {
            const combined = [...imported, ...prev];
            // Remove duplicates based on searchString
            const unique = combined.filter((search, index, self) =>
              index === self.findIndex(s => s.searchString === search.searchString)
            );
            // Limit to MAX_SAVED_SEARCHES
            return unique.slice(0, MAX_SAVED_SEARCHES);
          });
        }
      } catch (err) {
        console.error('Failed to import:', err);
        alert('Failed to import saved searches. Please check the file format.');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  // Pokemon Generation and Group data
  const pokemonGenerations = [
    { label: 'Gen 1 (Kanto)', range: '1-151' },
    { label: 'Gen 2 (Johto)', range: '152-251' },
    { label: 'Gen 3 (Hoenn)', range: '252-386' },
    { label: 'Gen 4 (Sinnoh)', range: '387-493' },
    { label: 'Gen 5 (Unova)', range: '494-649' },
    { label: 'Gen 6 (Kalos)', range: '650-721' },
    { label: 'Gen 7 (Alola)', range: '722-809' },
    { label: 'Gen 8 (Galar)', range: '810-905' },
  ];

  const pokemonGroups = [
    { label: 'All Starters', numbers: '1,2,3,4,5,6,7,8,9,152,153,154,155,156,157,158,159,160,252,253,254,255,256,257,258,259,260,387,388,389,390,391,392,393,394,395,495,496,497,498,499,500,501,502,503,650,651,652,653,654,655,656,657,658,722,723,724,725,726,727,728,729,730,810,811,812,813,814,815,816,817,818' },
    { label: 'Kanto Starters', numbers: '1,2,3,4,5,6,7,8,9' },
    { label: 'Johto Starters', numbers: '152,153,154,155,156,157,158,159,160' },
    { label: 'Hoenn Starters', numbers: '252,253,254,255,256,257,258,259,260' },
    { label: 'Sinnoh Starters', numbers: '387,388,389,390,391,392,393,394,395' },
    { label: 'Unova Starters', numbers: '495,496,497,498,499,500,501,502,503' },
    { label: 'Kalos Starters', numbers: '650,651,652,653,654,655,656,657,658' },
    { label: 'Alola Starters', numbers: '722,723,724,725,726,727,728,729,730' },
    { label: 'Galar Starters', numbers: '810,811,812,813,814,815,816,817,818' },
    { label: 'Pseudo-Legendaries', numbers: '147,148,149,246,247,248,371,372,373,443,444,445,610,611,612,633,634,635,704,705,706,782,783,784,885,886,887' },
    { label: 'Eeveelutions', numbers: '133,134,135,136,196,197,470,471,700' },
  ];

  // Premade search presets
  const premadeSearches = {
    sTierShadow: {
      label: 'S-Tier Shadows',
      description: 'Shadow Pokemon - apex of power',
      searchString: '373,409,464,484,150,485,383,483&shadow',
      tier: 'S',
      type: 'Shadow'
    },
    sTierNonShadow: {
      label: 'S-Tier Non-Shadow',
      description: 'Mega/Primal Pokemon - top priorities',
      searchString: '889,888,646,382,383,384,448,94,719,6,257,890,800',
      tier: 'S',
      type: 'Non-Shadow'
    },
    aPlusTierShadow: {
      label: 'A+ Tier Shadows',
      description: 'Shadow Pokemon - stand at or near the top',
      searchString: '697,248,260,486,243,146,376,473,462,68,382,635,250,526,94,282,445,530,466,149,555,534,609,257&shadow',
      tier: 'A+',
      type: 'Shadow'
    },
    aPlusTierNonShadow: {
      label: 'A+ Tier Non-Shadow',
      description: 'Mega Pokemon - stand at or near the top',
      searchString: '644,796,639,464,643,894,384,484,248,260,254,376,310,381,282,445,142,359,460,448,645,798&mega',
      tier: 'A+',
      type: 'Non-Shadow'
    },
    aTierShadow: {
      label: 'A-Tier Shadows',
      description: 'Shadow Pokemon - gold-standard worthy of investment',
      searchString: '145,461,738,398,254,381,430,297,487,244,500,142,359&shadow',
      tier: 'A',
      type: 'Shadow'
    },
    aTierNonShadow: {
      label: 'A-Tier Non-Shadow',
      description: 'Mega Pokemon - gold-standard worthy of investment',
      searchString: '717,637,892,248,642,492,373,895,409,484,150,376,3,18,380,229,214,362,354,181,65,473,792,382,647,635,720,485,383,487,445,905,483,491,534,609,806,998&mega',
      tier: 'A',
      type: 'Non-Shadow'
    },
    top25MasterLeague: {
      label: 'Top 25 Master League',
      description: 'Top ranked Pokemon for Master League PvP competitive battling',
      searchString: '888,484,889,483,646,644,643,249,376,890,800,792,250,383,381,648,671,468,791',
      tier: 'PvP',
      type: 'Master League'
    }
  };

  const applyPremadeSearch = async (searchKey, event) => {
    const preset = premadeSearches[searchKey];
    if (preset) {
      // Validate the premade search string
      const validation = validateSearchString(preset.searchString);
      if (!validation.valid && process.env.NODE_ENV === 'development') {
        console.warn(`Premade search "${searchKey}" has invalid syntax: "${preset.searchString}" - ${validation.error}`);
      }
      
      // Extract and preserve Pokedex numbers from the premade search string
      extractPokedexNumbers(preset.searchString);
      
      // Parse the search string to extract filter tags
      const { included, excluded } = parseSearchStringToFilters(preset.searchString);
      
      // Set the search string and filters
      setSearchString(preset.searchString);
      setIncludedFilters(included);
      setExcludedFilters(excluded);
      setIsPremadeSearch(true);

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(preset.searchString);
        
        // Get button position for toast placement
        if (event && event.currentTarget) {
          const buttonRect = event.currentTarget.getBoundingClientRect();
          const scrollY = window.scrollY || window.pageYOffset;
          const scrollX = window.scrollX || window.pageXOffset;
          
          // Position toast above the button, centered horizontally
          setToastPosition({
            x: buttonRect.left + scrollX + (buttonRect.width / 2),
            y: buttonRect.top + scrollY
          });
        }
        
        // Clear any existing timeout first
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        
        // Reset hiding state and show toast with new key to force animation
        setToastHiding(false);
        setToastKey(prev => prev + 1);
        
        // Use requestAnimationFrame to ensure DOM is ready before showing toast
        requestAnimationFrame(() => {
          setToastVisible(true);
        });
        
        // Start fade out after 1.5 seconds
        toastTimeoutRef.current = setTimeout(() => {
          setToastHiding(true);
          // Remove from DOM after fade out completes (300ms)
          setTimeout(() => {
            setToastVisible(false);
            setToastHiding(false);
          }, 300);
        }, 1500);
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        // Still show toast but with error message
        if (event && event.currentTarget) {
          const buttonRect = event.currentTarget.getBoundingClientRect();
          const scrollY = window.scrollY || window.pageYOffset;
          const scrollX = window.scrollX || window.pageXOffset;
          
          setToastPosition({
            x: buttonRect.left + scrollX + (buttonRect.width / 2),
            y: buttonRect.top + scrollY
          });
        }
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        setToastHiding(false);
        setToastKey(prev => prev + 1);
        requestAnimationFrame(() => {
          setToastVisible(true);
        });
        toastTimeoutRef.current = setTimeout(() => {
          setToastHiding(true);
          setTimeout(() => {
            setToastVisible(false);
            setToastHiding(false);
          }, 300);
        }, 1500);
      }
    }
  };

  // Tooltip component
  const Tooltip = ({ children, text, filterId }) => {
    if (!text && !filterTooltips[filterId]) return children;
    
    const tooltipText = text || filterTooltips[filterId];
    
    return (
      <div className="tooltip-container w-full">
        {children}
        <div className="tooltip tooltip-bottom">
          {tooltipText}
        </div>
      </div>
    );
  };

  // Toast notification component
  const CopyToast = () => {
    if (!toastVisible) return null;
    
    // Ensure we have valid position (fallback to center of screen if not set)
    const x = toastPosition.x > 0 ? toastPosition.x : window.innerWidth / 2;
    const y = toastPosition.y > 0 ? toastPosition.y : 100;
    
    return (
      <div
        key={`toast-${toastKey}`}
        className={`copy-toast ${toastHiding ? 'hiding' : ''}`}
        style={{
          left: `${x}px`,
          top: `${y}px`,
        }}
      >
        <Check className="w-4 h-4" />
        <span>Copied!</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/50 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100 transition-colors duration-300">
      <CopyToast />
      
      {/* Sticky Header with Output Section */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm dark:bg-slate-900/90 dark:border-slate-800 dark:shadow-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Compact Header */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#0077BE] to-[#00A7E5] bg-clip-text text-transparent">
                Pokémon GO Search Builder
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                Build search strings visually
              </p>
            </div>
            <button
              onClick={() => setIsDarkMode(prev => !prev)}
              aria-pressed={isDarkMode}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-full border border-blue-200/70 text-[#0077BE] hover:bg-blue-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 transition-colors self-start"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {isDarkMode ? 'Light mode' : 'Dark mode'}
              </span>
            </button>
          </div>

          {/* Output Section - FOCAL POINT */}
          <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-xl shadow-lg p-4 sm:p-5 border-2 border-blue-200/50 dark:from-slate-900 dark:to-slate-900/70 dark:border-slate-700 dark:shadow-slate-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-gray-700 dark:text-slate-200">
                  Search String
                </label>
                {(includedFilters.length > 0 || excludedFilters.length > 0) && (
                  <span className="px-2 py-0.5 bg-[#0077BE] text-white text-xs font-bold rounded-full">
                    {includedFilters.length + excludedFilters.length} active
                  </span>
                )}
                {!validationResult.valid && (
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowValidationTooltip(true)}
                    onMouseLeave={() => setShowValidationTooltip(false)}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500 cursor-help" />
                    {showValidationTooltip && (
                      <div className="absolute left-0 top-full mt-2 z-50 px-3 py-2 bg-amber-50 border-2 border-amber-400 rounded-lg shadow-xl whitespace-nowrap">
                        <p className="text-xs font-semibold text-amber-800">
                          {validationResult.error}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end">
                <button
                  onClick={clearAll}
                  className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors px-2 py-1 dark:text-slate-400 dark:hover:text-red-300"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchString}
                  readOnly
                  placeholder="Your search string will appear here..."
                  className={`w-full min-h-[48px] sm:min-h-[56px] px-4 py-3 border-2 rounded-xl focus:outline-none font-mono text-sm sm:text-base transition-all duration-200 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 cursor-default ${
                    !validationResult.valid 
                      ? 'border-amber-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-500 dark:focus:ring-amber-500/40'
                      : 'border-blue-200 focus:border-[#0077BE] focus:ring-2 focus:ring-blue-200 bg-white dark:bg-slate-900 dark:border-slate-700 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/40'
                  }`}
                />
                {!validationResult.valid && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                )}
              </div>
              <button
                onClick={copyToClipboard}
                className={`min-h-[48px] sm:min-h-[56px] px-6 sm:px-8 rounded-xl font-bold text-white transition-all duration-200 transform active:scale-95 ${
                  copySuccess 
                    ? 'bg-emerald-500 shadow-lg shadow-emerald-200' 
                    : 'bg-[#0077BE] hover:bg-[#005A8F] hover:shadow-lg hover:shadow-blue-200'
                } flex items-center justify-center gap-2 text-sm sm:text-base`}
              >
                {copySuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Save Search Button */}
            {searchString && searchString.trim() !== '' && (
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={handleSaveSearch}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 touch-manipulation"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Save this search</span>
                </button>
                {saveSuccessVisible && (
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm animate-save-success">
                    <BookmarkCheck className="w-5 h-5" />
                    <span>Search saved!</span>
                  </div>
                )}
              </div>
            )}

            {/* Conflicts Warning */}
            {conflicts.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 border-2 border-amber-400 rounded-lg flex items-start gap-2 animate-pulse-warning dark:bg-amber-950/30 dark:border-amber-500">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-amber-800 text-sm mb-1 dark:text-amber-200">⚠️ Conflicting Filters</p>
                  {conflicts.map((conflict, idx) => (
                    <p key={idx} className="text-xs text-amber-700 dark:text-amber-100">{conflict}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Active Filter Chips - Compact Display */}
        {(includedFilters.length > 0 || excludedFilters.length > 0) && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 mb-6 border border-blue-100 dark:bg-slate-900/70 dark:border-slate-800">
            <div className="flex flex-wrap gap-2">
              {includedFilters.map(filterId => {
                const isRemoving = removingChip === filterId;
                return (
                  <div
                    key={`included-${filterId}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#0077BE] to-[#00A7E5] text-white rounded-full text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                      isRemoving ? 'chip-fade-out' : 'chip-fade-in'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    <span className="whitespace-nowrap">{getChipLabel(filterId)}</span>
                    <button
                      onClick={() => removeFilter(filterId, false)}
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors touch-manipulation"
                      aria-label="Remove filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
              {excludedFilters.map(filterId => {
                const isRemoving = removingChip === filterId;
                return (
                  <div
                    key={`excluded-${filterId}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                      isRemoving ? 'chip-fade-out' : 'chip-fade-in'
                    }`}
                  >
                    <Minus className="w-3 h-3" />
                    <span className="whitespace-nowrap">{getChipLabel(filterId)}</span>
                    <button
                      onClick={() => removeFilter(filterId, true)}
                      className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors touch-manipulation"
                      aria-label="Remove filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Saved Searches - Collapsible Section */}
        {savedSearches.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 sm:p-5 mb-6 border border-purple-100 dark:bg-slate-900/70 dark:border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSavedSearches(!showSavedSearches)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-slate-100">Saved Searches</h3>
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform duration-300 ${showSavedSearches ? 'rotate-180' : ''}`}
                  />
                </button>
                <span className="px-2 py-0.5 bg-purple-200 text-purple-800 text-xs font-bold rounded-full dark:bg-purple-500/30 dark:text-purple-100">
                  {savedSearches.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer p-2 hover:bg-purple-50 rounded-lg transition-colors touch-manipulation dark:hover:bg-slate-800" title="Import searches">
                  <Upload className="w-4 h-4 text-purple-600" />
                  <input
                    type="file"
                    accept=".json"
                    onChange={importSavedSearches}
                    className="hidden"
                  />
                </label>
                {savedSearches.length > 0 && (
                  <button
                    onClick={exportSavedSearches}
                    className="p-2 hover:bg-purple-50 rounded-lg transition-colors touch-manipulation dark:hover:bg-slate-800"
                    title="Export searches"
                  >
                    <Download className="w-4 h-4 text-purple-600" />
                  </button>
                )}
              </div>
            </div>

            {showSavedSearches && (
              <div className="saved-searches-expand space-y-2">
                {savedSearches.map((saved) => (
                  <div
                    key={saved.id}
                    className="group flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all duration-200 dark:from-slate-900 dark:to-slate-900/60 dark:border-purple-500/40 dark:hover:border-purple-400/50"
                  >
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => loadSavedSearch(saved)}
                    >
                      <div className="font-semibold text-sm text-gray-800 dark:text-slate-100 mb-1 truncate">
                        {saved.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-slate-400 font-mono truncate">
                        {saved.searchString}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copySavedSearch(saved.searchString)}
                        className="p-2 hover:bg-purple-100 rounded-lg transition-colors touch-manipulation"
                        title="Copy search string"
                      >
                        <Copy className="w-4 h-4 text-purple-600" />
                      </button>
                      <button
                        onClick={() => deleteSavedSearch(saved.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors touch-manipulation"
                        title="Delete saved search"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Searches - Collapsible Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 sm:p-5 mb-6 border border-blue-100 dark:bg-slate-900/70 dark:border-blue-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowQuickSearches(!showQuickSearches)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-slate-100">Quick Searches</h3>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform duration-300 ${showQuickSearches ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block dark:text-slate-400">Raid tiers, PvP, and common combos</p>
          </div>

          {showQuickSearches && (
            <div className="saved-searches-expand">
              {/* PvP & Competitive Subsection */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-4">PvP & Competitive</h3>
                
                {/* Raid Tier Attackers */}
                <div className="mb-5">
                  <h4 className="text-xs font-bold mb-3 uppercase tracking-wide bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Raid Tier Attackers</h4>
                  <div className="mb-3 p-3 bg-blue-50/80 border border-blue-200 rounded-lg dark:bg-slate-900/60 dark:border-blue-500/30">
                    <p className="text-xs text-blue-800 font-semibold mb-1 dark:text-blue-200">ℹ️ Shadow vs Non-Shadow</p>
                    <p className="text-xs text-blue-700 leading-relaxed dark:text-blue-100">
                      Pokemon GO cannot display Shadow and non-Shadow versions simultaneously. Use separate searches.
                    </p>
                  </div>
                  
                  {/* S-Tier */}
                  <div className="mb-4">
                    <h5 className="text-xs font-bold text-amber-700 mb-2 uppercase tracking-wide">S-Tier • Apex of Power</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <button
                        onClick={(e) => applyPremadeSearch('sTierShadow', e)}
                        className="group relative p-3 sm:p-4 rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm sm:text-base text-red-800">
                            {premadeSearches.sTierShadow.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-200 text-red-800 rounded-full font-bold">SHADOW</span>
                        </div>
                        <div className="text-[10px] sm:text-xs text-red-700">
                          {premadeSearches.sTierShadow.description}
                        </div>
                      </button>
                      <button
                        onClick={(e) => applyPremadeSearch('sTierNonShadow', e)}
                        className="group relative p-3 sm:p-4 rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm sm:text-base text-amber-800">
                            {premadeSearches.sTierNonShadow.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded-full font-bold">MEGA/PRIMAL</span>
                        </div>
                        <div className="text-[10px] sm:text-xs text-amber-700">
                          {premadeSearches.sTierNonShadow.description}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* A+ Tier */}
                  <div className="mb-4">
                    <h5 className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">A+ Tier • Stand at or Near the Top</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <button
                        onClick={(e) => applyPremadeSearch('aPlusTierShadow', e)}
                        className="group relative p-3 sm:p-4 rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm sm:text-base text-red-800">
                            {premadeSearches.aPlusTierShadow.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-200 text-red-800 rounded-full font-bold">SHADOW</span>
                        </div>
                        <div className="text-[10px] sm:text-xs text-red-700">
                          {premadeSearches.aPlusTierShadow.description}
                        </div>
                      </button>
                      <button
                        onClick={(e) => applyPremadeSearch('aPlusTierNonShadow', e)}
                        className="group relative p-3 sm:p-4 rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm sm:text-base text-blue-800">
                            {premadeSearches.aPlusTierNonShadow.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded-full font-bold">MEGA</span>
                        </div>
                        <div className="text-[10px] sm:text-xs text-blue-700">
                          {premadeSearches.aPlusTierNonShadow.description}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* A Tier */}
                  <div className="mb-4">
                    <h5 className="text-xs font-bold text-emerald-700 mb-2 uppercase tracking-wide">A Tier • Gold-Standard Investment</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <button
                        onClick={(e) => applyPremadeSearch('aTierShadow', e)}
                        className="group relative p-3 sm:p-4 rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm sm:text-base text-red-800">
                            {premadeSearches.aTierShadow.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-200 text-red-800 rounded-full font-bold">SHADOW</span>
                        </div>
                        <div className="text-[10px] sm:text-xs text-red-700">
                          {premadeSearches.aTierShadow.description}
                        </div>
                      </button>
                      <button
                        onClick={(e) => applyPremadeSearch('aTierNonShadow', e)}
                        className="group relative p-3 sm:p-4 rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm sm:text-base text-emerald-800">
                            {premadeSearches.aTierNonShadow.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-200 text-emerald-800 rounded-full font-bold">MEGA</span>
                        </div>
                        <div className="text-[10px] sm:text-xs text-emerald-700">
                          {premadeSearches.aTierNonShadow.description}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Master League PvP */}
                <div>
                  <h4 className="text-xs font-bold mb-3 uppercase tracking-wide bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">Master League PvP</h4>
                  <div className="mb-3 p-3 bg-indigo-50/80 border border-indigo-200 rounded-lg dark:bg-slate-900/60 dark:border-indigo-500/30">
                    <p className="text-xs text-indigo-800 font-semibold mb-1 dark:text-indigo-200">ℹ️ Master League Rankings</p>
                    <p className="text-xs text-indigo-700 leading-relaxed dark:text-indigo-100">
                      Based on Master League PvP rankings for competitive battling. Includes top-ranked Pokemon like Zacian (Crowned Sword), Palkia (Origin & Shadow), Zamazenta (Crowned Shield), Dialga (Origin & Shadow), Kyurem (White & Black), Zekrom, Reshiram, Lugia, Metagross, Eternatus, Necrozma, Lunala, Ho-Oh, Groudon, Latios, Meloetta, Florges, Togekiss, and Solgaleo.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <button
                      onClick={(e) => applyPremadeSearch('top25MasterLeague', e)}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm sm:text-base text-indigo-800">
                          {premadeSearches.top25MasterLeague.label}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-200 text-indigo-800 rounded-full font-bold">PvP</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-indigo-700">
                        {premadeSearches.top25MasterLeague.description}
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Common Combos Subsection */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-4">Common Combos</h3>
                <h4 className="text-xs font-bold mb-3 uppercase tracking-wide bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Quick Combos</h4>
                <div className="mb-3 p-3 bg-purple-50/80 border border-purple-200 rounded-lg dark:bg-slate-900/60 dark:border-purple-500/30">
                  <p className="text-xs text-purple-800 font-semibold mb-1 dark:text-purple-200">ℹ️ Quick Combos</p>
                  <p className="text-xs text-purple-700 leading-relaxed dark:text-purple-100">
                    These buttons append filter combinations to your existing search string, allowing you to stack multiple combos together.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <Tooltip text="All shiny legendary Pokemon">
                    <button
                      onClick={() => appendFilterCombo('&shiny&legendary')}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/60 dark:to-pink-900/60 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/70 dark:hover:to-pink-800/70 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="font-bold text-sm sm:text-base text-purple-800 dark:text-white mb-1">Shiny Legendaries</div>
                      <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-100">All shiny legendary Pokemon</div>
                    </button>
                  </Tooltip>

                  <Tooltip text="100% IV shadow Pokemon">
                    <button
                      onClick={() => appendFilterCombo('&4*&shadow')}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/60 dark:to-pink-900/60 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/70 dark:hover:to-pink-800/70 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="font-bold text-sm sm:text-base text-purple-800 dark:text-purple-100 mb-1">Perfect Shadows</div>
                      <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-200">100% IV shadow Pokemon</div>
                    </button>
                  </Tooltip>

                  <Tooltip text="3-4★ Pokemon that aren't shiny">
                    <button
                      onClick={() => appendFilterCombo('&3*,4*&!shiny')}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/60 dark:to-pink-900/60 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/70 dark:hover:to-pink-800/70 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="font-bold text-sm sm:text-base text-purple-800 dark:text-purple-100 mb-1">High IV Non-Shiny</div>
                      <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-200">3-4★ Pokemon that aren't shiny</div>
                    </button>
                  </Tooltip>

                  <Tooltip text="Low IV non-favorites for trading">
                    <button
                      onClick={() => appendFilterCombo('&!favorite&!shiny&0*,1*')}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/60 dark:to-pink-900/60 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/70 dark:hover:to-pink-800/70 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="font-bold text-sm sm:text-base text-purple-800 dark:text-purple-100 mb-1">Trade Fodder</div>
                      <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-200">Low IV non-favorites for trading</div>
                    </button>
                  </Tooltip>

                  <Tooltip text="Pokemon caught in the last week">
                    <button
                      onClick={() => appendFilterCombo('&age0-7')}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/60 dark:to-pink-900/60 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/70 dark:hover:to-pink-800/70 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="font-bold text-sm sm:text-base text-purple-800 dark:text-purple-100 mb-1">Recent Catches</div>
                      <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-200">Pokemon caught in the last week</div>
                    </button>
                  </Tooltip>

                  <Tooltip text="Can evolve, not favorited">
                    <button
                      onClick={() => appendFilterCombo('&evolve&!favorite')}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/60 dark:to-pink-900/60 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/70 dark:hover:to-pink-800/70 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="font-bold text-sm sm:text-base text-purple-800 dark:text-purple-100 mb-1">Evolution Ready</div>
                      <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-200">Can evolve, not favorited</div>
                    </button>
                  </Tooltip>

                  <Tooltip text="Shiny Pokemon with costumes">
                    <button
                      onClick={() => appendFilterCombo('&shiny&costume')}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/60 dark:to-pink-900/60 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/70 dark:hover:to-pink-800/70 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="font-bold text-sm sm:text-base text-purple-800 dark:text-purple-100 mb-1">Shiny Costume</div>
                      <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-200">Shiny Pokemon with costumes</div>
                    </button>
                  </Tooltip>

                  <Tooltip text="Legendaries you haven't found shiny">
                    <button
                      onClick={() => appendFilterCombo('&legendary&!shiny')}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/60 dark:to-pink-900/60 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/70 dark:hover:to-pink-800/70 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="font-bold text-sm sm:text-base text-purple-800 dark:text-purple-100 mb-1">Legendary Non-Shiny</div>
                      <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-200">Legendaries you haven't found shiny</div>
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          )}
        </div>


        {/* CP Ranges - Collapsible Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 sm:p-5 mb-6 border border-violet-100 dark:bg-slate-900/70 dark:border-violet-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCPRanges(!showCPRanges)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-slate-100">CP Ranges</h3>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform duration-300 ${showCPRanges ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block dark:text-slate-400">Insert CP ranges for PvP leagues</p>
          </div>

          {showCPRanges && (
            <div className="saved-searches-expand">
              <div className="mb-3 p-3 bg-violet-50/80 border border-violet-200 rounded-lg dark:bg-slate-900/60 dark:border-violet-500/30">
                <p className="text-xs text-violet-800 font-semibold mb-1 dark:text-violet-200">ℹ️ PvP League CP Caps</p>
                <p className="text-xs text-violet-700 leading-relaxed dark:text-violet-100">
                  These are the competitive PvP league CP caps used in Pokemon GO. Clicking a button will insert or replace the CP range in your search string.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                <button
                  onClick={() => insertCPRange('cp0-1500')}
                  className="group relative p-3 sm:p-4 rounded-xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                >
                  <div className="font-bold text-sm sm:text-base text-violet-800 mb-1">Great League</div>
                  <div className="text-[10px] sm:text-xs text-violet-600 font-mono">CP 0-1500</div>
                </button>

                <button
                  onClick={() => insertCPRange('cp0-2500')}
                  className="group relative p-3 sm:p-4 rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                >
                  <div className="font-bold text-sm sm:text-base text-blue-800 mb-1">Ultra League</div>
                  <div className="text-[10px] sm:text-xs text-blue-600 font-mono">CP 0-2500</div>
                </button>

                <button
                  onClick={() => insertCPRange('cp2500-')}
                  className="group relative p-3 sm:p-4 rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                >
                  <div className="font-bold text-sm sm:text-base text-amber-800 mb-1">Master League</div>
                  <div className="text-[10px] sm:text-xs text-amber-600 font-mono">CP 2500+</div>
                </button>

                <button
                  onClick={() => insertCPRange('cp0-500')}
                  className="group relative p-3 sm:p-4 rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                >
                  <div className="font-bold text-sm sm:text-base text-green-800 mb-1">Under 500 CP</div>
                  <div className="text-[10px] sm:text-xs text-green-600 font-mono">CP 0-500</div>
                </button>

                <button
                  onClick={() => insertCPRange('cp3000-')}
                  className="group relative p-3 sm:p-4 rounded-xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                >
                  <div className="font-bold text-sm sm:text-base text-orange-800 mb-1">High CP</div>
                  <div className="text-[10px] sm:text-xs text-orange-600 font-mono">CP 3000+</div>
                </button>

                <button
                  onClick={() => insertCPRange('cp4000-')}
                  className="group relative p-3 sm:p-4 rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                >
                  <div className="font-bold text-sm sm:text-base text-red-800 mb-1">Perfect CP</div>
                  <div className="text-[10px] sm:text-xs text-red-600 font-mono">CP 4000+</div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pokemon Selection Buttons - Collapsible Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 sm:p-5 mb-6 border border-green-100 dark:bg-slate-900/70 dark:border-green-500/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPokemonSelection(!showPokemonSelection)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <h3 className="text-base sm:text-lg font-bold text-gray-800">Pokemon Selection</h3>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform duration-300 ${showPokemonSelection ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block dark:text-slate-400">Quick insert Pokemon ranges and groups</p>
          </div>

          {showPokemonSelection && (
            <div className="saved-searches-expand">
              {/* Generation Buttons */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-gray-700 dark:text-slate-200 mb-3 uppercase tracking-wide">Generations</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {pokemonGenerations.map((gen) => (
                    <button
                      key={gen.label}
                      onClick={() => insertPokemonNumbers(gen.range)}
                      className="px-3 py-2 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg hover:from-green-100 hover:to-emerald-100 hover:border-green-300 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation dark:from-slate-900 dark:to-slate-900/60 dark:border-emerald-500/40 dark:hover:border-emerald-400/60"
                    >
                      <div className="font-bold text-sm text-green-800 dark:text-emerald-200 mb-0.5">{gen.label}</div>
                      <div className="text-[10px] text-green-600 dark:text-emerald-100 font-mono">{gen.range}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pokemon Group Buttons */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 dark:text-slate-200 mb-3 uppercase tracking-wide">Pokemon Groups</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {pokemonGroups.map((group) => (
                    <button
                      key={group.label}
                      onClick={() => insertPokemonNumbers(group.numbers)}
                      className="px-3 py-2 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg hover:from-purple-100 hover:to-pink-100 hover:border-purple-300 transition-all duration-200 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation dark:from-slate-900 dark:to-slate-900/60 dark:border-purple-500/40 dark:hover:border-purple-400/50"
                    >
                      <div className="font-bold text-sm text-purple-800 dark:text-purple-100 mb-0.5">{group.label}</div>
                      <div className="text-[10px] text-purple-600 dark:text-purple-200 font-mono truncate" title={group.numbers}>
                        {group.numbers.length > 40 ? `${group.numbers.substring(0, 40)}...` : group.numbers}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Filter Search */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 mb-6 border border-blue-100 dark:bg-slate-900/70 dark:border-blue-500/30">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search filters... (e.g., 'shiny', 'attack', 'mega')"
              className="w-full pl-12 pr-12 py-3 border-2 border-blue-200 rounded-xl focus:border-[#0077BE] focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm sm:text-base transition-all duration-200 bg-white text-slate-900 dark:text-slate-100 dark:bg-slate-900 dark:border-slate-700 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/40 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {filterSearch && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation dark:hover:bg-slate-800"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Categories - Modern Accordion */}
        <div className="space-y-3 sm:space-y-4">
          {Object.entries(filteredCategories).map(([key, category]) => {
            const meta = categoryMeta[key];
            const Icon = meta.icon;
            const isExpanded = expandedCategories[key];
            const activeCount = category.filters.filter(f => 
              includedFilters.includes(f.id) || excludedFilters.includes(f.id)
            ).length;
            
            return (
              <div key={key} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md overflow-hidden border border-blue-100 hover:shadow-lg transition-shadow duration-200 dark:bg-slate-900/70 dark:border-slate-800 dark:hover:shadow-slate-900/40">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(key)}
                  className={`w-full min-h-[56px] px-4 sm:px-6 flex items-center justify-between bg-gradient-to-r ${meta.gradient} text-white hover:opacity-95 active:opacity-90 transition-all duration-200 touch-manipulation`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-bold text-sm sm:text-base truncate">
                        {category.name}
                      </span>
                      <span className="text-xs sm:text-sm opacity-90">
                        ({category.filters.length})
                      </span>
                      {activeCount > 0 && (
                        <span className="px-2 py-0.5 bg-white/30 text-white text-xs font-bold rounded-full">
                          {activeCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Category Content - Smooth Expand */}
                {isExpanded && (
                  <div className="category-expand p-4 sm:p-5 bg-white dark:bg-slate-950/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                      {category.filters.map(filter => {
                        const isIncluded = includedFilters.includes(filter.id);
                        const isExcluded = excludedFilters.includes(filter.id);
                        
                        return (
                          <Tooltip key={filter.id} filterId={filter.id}>
                            <div
                              className={`group flex items-center gap-2 p-3 min-h-[48px] rounded-xl transition-all duration-200 border-2 cursor-pointer touch-manipulation ${
                                isIncluded 
                                  ? 'bg-blue-50 border-blue-400 shadow-sm dark:bg-blue-500/10 dark:border-blue-400/60'
                                  : isExcluded
                                  ? 'bg-red-50 border-red-400 shadow-sm dark:bg-red-500/10 dark:border-red-400/60'
                                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600'
                              }`}
                            >
                              <span className={`text-sm font-medium flex-1 ${
                                isIncluded ? 'text-blue-800 dark:text-blue-200' : isExcluded ? 'text-red-800 dark:text-red-200' : 'text-gray-800 dark:text-slate-100'
                              }`}>
                                {filter.label}
                              </span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleIncludeFilter(filter.id);
                                  }}
                                  className={`min-w-[48px] min-h-[48px] px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center active:scale-95 filter-button-plus ${
                                    isIncluded
                                      ? 'filter-button-plus-selected'
                                      : isExcluded
                                      ? 'filter-button-plus-disabled'
                                      : 'filter-button-plus-default'
                                  }`}
                                  title="Include"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExcludeFilter(filter.id);
                                  }}
                                  className={`min-w-[48px] min-h-[48px] px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center active:scale-95 filter-button-minus ${
                                    isExcluded
                                      ? 'filter-button-minus-selected'
                                      : isIncluded
                                      ? 'filter-button-minus-disabled'
                                      : 'filter-button-minus-default'
                                  }`}
                                  title="Exclude"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 mb-6 text-center text-gray-500 text-xs sm:text-sm dark:text-slate-500">
          <p>Built for Pokémon GO trainers 🎮</p>
        </div>
      </div>

      {/* Save Search Modal */}
      {showSaveModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-modal-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSaveModal(false);
              setSaveSearchName('');
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-4 animate-modal-slide-up dark:bg-slate-900 dark:shadow-slate-900/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">Save Search</h3>
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveSearchName('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
              Give your search a name to save it for later.
            </p>
            <input
              type="text"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmSaveSearch();
                } else if (e.key === 'Escape') {
                  setShowSaveModal(false);
                  setSaveSearchName('');
                }
              }}
              placeholder="e.g., Perfect IV Shadows"
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-xl focus:border-[#0077BE] focus:ring-2 focus:ring-blue-200 focus:outline-none text-sm sm:text-base mb-4 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/40 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveSearchName('');
                }}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmSaveSearch}
                disabled={!saveSearchName.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PokemonGoSearchBuilder;