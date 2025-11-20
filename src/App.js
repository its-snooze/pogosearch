import React, { useState, useMemo, useCallback, useRef } from 'react';
import { 
  Search, Copy, X, ChevronDown, AlertTriangle, Check, 
  BarChart3, Zap, Sparkles, TrendingUp, Clock, Ruler, Swords, Plus, Minus
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
      { id: 'costume', label: 'Costume', value: 'costume' },
      { id: 'hatched', label: 'Hatched', value: 'hatched' },
      { id: 'traded', label: 'Traded', value: 'traded' },
      { id: 'defender', label: 'Gym Defender', value: 'defender' },
      { id: 'favorite', label: 'Favorite', value: 'favorite' },
    ]
  },
  evolution: {
    name: 'Evolution & Buddy',
    filters: [
      { id: 'evolve', label: 'Can Evolve', value: 'evolve' },
      { id: 'evolvenew', label: 'New Dex Entry', value: 'evolvenew' },
      { id: 'item', label: 'Needs Item', value: 'item' },
      { id: 'tradeevolve', label: 'Trade Evolve', value: 'tradeevolve' },
      { id: 'megaevolve', label: 'Can Mega Evolve', value: 'megaevolve' },
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
      { id: 'year2024', label: 'Year 2024', value: 'year2024' },
      { id: 'year2023', label: 'Year 2023', value: 'year2023' },
      { id: 'year2022', label: 'Year 2022', value: 'year2022' },
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
      { id: '@weather', label: 'Weather Boosted', value: '@weather' },
      { id: '@1fire', label: 'Fire Fast Move', value: '@1fire' },
      { id: '@2fire', label: 'Fire Charged Move', value: '@2fire' },
      { id: '@1water', label: 'Water Fast Move', value: '@1water' },
      { id: '@2water', label: 'Water Charged Move', value: '@2water' },
      { id: '@1electric', label: 'Electric Fast Move', value: '@1electric' },
      { id: '@2electric', label: 'Electric Charged Move', value: '@2electric' },
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
  
  // Ref to store Pokedex numbers extracted from search string
  // This preserves Pokedex numbers when filters are updated
  const pokedexNumbersRef = useRef('');

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
      searchString: '889,888,646,382,383,384,448,94,719,6,257,890,800&mega,primal',
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
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-4 md:p-6 lg:p-8">
      <CopyToast />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Pokémon GO Search Builder
          </h1>
          <p className="text-gray-600 text-base md:text-lg">
            Build advanced search strings with ease
          </p>
        </div>

        {/* Search String Display - BIGGEST ELEMENT */}
        <div className="bg-white rounded-xl shadow-lg p-5 md:p-6 mb-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <label className="block text-sm font-semibold text-gray-700">
              Search String
            </label>
            {!validationResult.valid && (
              <div 
                className="relative"
                onMouseEnter={() => setShowValidationTooltip(true)}
                onMouseLeave={() => setShowValidationTooltip(false)}
              >
                <AlertTriangle className="w-5 h-5 text-yellow-600 cursor-help" />
                {showValidationTooltip && (
                  <div className="absolute left-0 top-full mt-2 z-50 px-3 py-2 bg-yellow-100 border-2 border-yellow-400 rounded-lg shadow-lg whitespace-nowrap">
                    <p className="text-sm font-semibold text-yellow-800">
                      Invalid syntax: {validationResult.error}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-[0.7] relative">
              <input
                type="text"
                value={searchString}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSearchString(newValue);
                  setIsPremadeSearch(false); // Reset premade search flag when manually editing
                  // Extract and preserve Pokedex numbers from the manually edited string
                  extractPokedexNumbers(newValue);
                }}
                placeholder="Your search string will appear here..."
                className={`w-full min-h-[50px] px-4 py-3 border-2 rounded-lg focus:outline-none font-mono text-sm md:text-base transition-colors ${
                  !validationResult.valid 
                    ? 'border-yellow-500 focus:border-yellow-600' 
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {!validationResult.valid && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
              )}
            </div>
            <button
              onClick={copyToClipboard}
              className={`flex-[0.15] min-h-[50px] px-4 py-3 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90 ${
                copySuccess 
                  ? 'bg-green-500' 
                  : 'bg-[#10B981] hover:bg-[#059669]'
              } flex items-center justify-center gap-2`}
            >
              {copySuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              onClick={clearAll}
              className="flex-[0.15] min-h-[50px] px-4 py-3 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-lg font-semibold transition-all duration-200 hover:opacity-90"
            >
              Clear All
            </button>
          </div>

          {/* Conflicts Warning */}
          {conflicts.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800 mb-1">⚠️ Conflicting Filters Detected</p>
                {conflicts.map((conflict, idx) => (
                  <p key={idx} className="text-sm text-yellow-700">{conflict}</p>
                ))}
                <p className="text-xs text-yellow-600 mt-2">This search won't return any results in Pokémon GO.</p>
              </div>
            </div>
          )}
        </div>

        {/* Active Filter Chips - PROMINENTLY DISPLAYED */}
        {(includedFilters.length > 0 || excludedFilters.length > 0) && (
          <div className="bg-white rounded-xl shadow-lg p-5 md:p-6 mb-6 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Active Filters ({includedFilters.length + excludedFilters.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {includedFilters.map(filterId => {
                const isRemoving = removingChip === filterId;
                return (
                  <div
                    key={`included-${filterId}`}
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full font-medium transition-all duration-300 ${
                      isRemoving ? 'chip-fade-out' : 'chip-fade-in'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    <span className="text-sm whitespace-nowrap">{getChipLabel(filterId)}</span>
                    <button
                      onClick={() => removeFilter(filterId, false)}
                      className="hover:bg-blue-600 rounded-full p-0.5 transition-colors"
                      aria-label="Remove filter"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {excludedFilters.map(filterId => {
                const isRemoving = removingChip === filterId;
                return (
                  <div
                    key={`excluded-${filterId}`}
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full font-medium transition-all duration-300 ${
                      isRemoving ? 'chip-fade-out' : 'chip-fade-in'
                    }`}
                  >
                    <Minus className="w-3 h-3" />
                    <span className="text-sm whitespace-nowrap">{getChipLabel(filterId)}</span>
                    <button
                      onClick={() => removeFilter(filterId, true)}
                      className="hover:bg-red-600 rounded-full p-0.5 transition-colors"
                      aria-label="Remove filter"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Premade Searches - Raid Tiers */}
        <div className="bg-white rounded-xl shadow-lg p-5 md:p-6 mb-6 border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Premade Searches
          </label>
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-800 mb-2">Raid Tier Attackers</h3>
            <p className="text-sm text-gray-600 mb-2">
              Quick access to Pokemon GO Hub's raid tier rankings
            </p>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 font-medium mb-1">ℹ️ Shadow vs Non-Shadow</p>
              <p className="text-xs text-blue-700">
                Pokemon GO cannot display Shadow and non-Shadow versions simultaneously in search results. 
                Use separate searches for Shadow and non-Shadow Pokemon.
              </p>
            </div>
          </div>
          
          {/* S-Tier */}
          <div className="mb-4">
            <h4 className="text-sm font-bold text-yellow-700 mb-2">S-Tier (Apex of Power)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={(e) => applyPremadeSearch('sTierShadow', e)}
                className="group relative p-4 rounded-lg border-2 border-red-400 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all duration-200 hover:shadow-md text-left"
                title="Shadow Pokemon - apex of power"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-red-800">
                    {premadeSearches.sTierShadow.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-red-200 text-red-800 rounded-full font-semibold">SHADOW</span>
                </div>
                <div className="text-xs text-red-700">
                  {premadeSearches.sTierShadow.description}
                </div>
              </button>
              <button
                onClick={(e) => applyPremadeSearch('sTierNonShadow', e)}
                className="group relative p-4 rounded-lg border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 transition-all duration-200 hover:shadow-md text-left"
                title="Mega/Primal Pokemon - top priorities"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-yellow-800">
                    {premadeSearches.sTierNonShadow.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full font-semibold">MEGA/PRIMAL</span>
                </div>
                <div className="text-xs text-yellow-700">
                  {premadeSearches.sTierNonShadow.description}
                </div>
              </button>
            </div>
          </div>

          {/* A+ Tier */}
          <div className="mb-4">
            <h4 className="text-sm font-bold text-blue-700 mb-2">A+ Tier (Stand at or Near the Top)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={(e) => applyPremadeSearch('aPlusTierShadow', e)}
                className="group relative p-4 rounded-lg border-2 border-red-400 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all duration-200 hover:shadow-md text-left"
                title="Shadow Pokemon - stand at or near the top"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-red-800">
                    {premadeSearches.aPlusTierShadow.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-red-200 text-red-800 rounded-full font-semibold">SHADOW</span>
                </div>
                <div className="text-xs text-red-700">
                  {premadeSearches.aPlusTierShadow.description}
                </div>
              </button>
              <button
                onClick={(e) => applyPremadeSearch('aPlusTierNonShadow', e)}
                className="group relative p-4 rounded-lg border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all duration-200 hover:shadow-md text-left"
                title="Mega Pokemon - stand at or near the top"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-blue-800">
                    {premadeSearches.aPlusTierNonShadow.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full font-semibold">MEGA</span>
                </div>
                <div className="text-xs text-blue-700">
                  {premadeSearches.aPlusTierNonShadow.description}
                </div>
              </button>
            </div>
          </div>

          {/* A Tier */}
          <div className="mb-2">
            <h4 className="text-sm font-bold text-green-700 mb-2">A-Tier (Gold-Standard Worthy of Investment)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={(e) => applyPremadeSearch('aTierShadow', e)}
                className="group relative p-4 rounded-lg border-2 border-red-400 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all duration-200 hover:shadow-md text-left"
                title="Shadow Pokemon - gold-standard worthy of investment"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-red-800">
                    {premadeSearches.aTierShadow.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-red-200 text-red-800 rounded-full font-semibold">SHADOW</span>
                </div>
                <div className="text-xs text-red-700">
                  {premadeSearches.aTierShadow.description}
                </div>
              </button>
              <button
                onClick={(e) => applyPremadeSearch('aTierNonShadow', e)}
                className="group relative p-4 rounded-lg border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 hover:shadow-md text-left"
                title="Mega Pokemon - gold-standard worthy of investment"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-lg text-green-800">
                    {premadeSearches.aTierNonShadow.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded-full font-semibold">MEGA</span>
                </div>
                <div className="text-xs text-green-700">
                  {premadeSearches.aTierNonShadow.description}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Search */}
        <div className="bg-white rounded-xl shadow-lg p-5 md:p-6 mb-6 border border-gray-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search filters... (e.g., 'shiny', 'attack', 'mega')"
              className="w-full pl-12 pr-12 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-base transition-colors"
            />
            {filterSearch && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Clear search"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Categories - STACK VERTICALLY */}
        <div className="space-y-4">
          {Object.entries(filteredCategories).map(([key, category]) => {
            const meta = categoryMeta[key];
            const Icon = meta.icon;
            const isExpanded = expandedCategories[key];
            
            return (
              <div key={key} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                {/* Category Header - FULL WIDTH BAR */}
                <button
                  onClick={() => toggleCategory(key)}
                  className={`w-full h-[60px] px-6 flex items-center justify-between bg-gradient-to-r ${meta.gradient} text-white hover:opacity-90 transition-all duration-300`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className="w-6 h-6" />
                    <span className="font-bold text-lg">
                      {category.name} ({category.filters.length})
                    </span>
                  </div>
                  <ChevronDown 
                    className={`w-6 h-6 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Category Content - SMOOTH EXPAND */}
                {isExpanded && (
                  <div className="category-expand p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {category.filters.map(filter => {
                        const isIncluded = includedFilters.includes(filter.id);
                        const isExcluded = excludedFilters.includes(filter.id);
                        
                        return (
                          <Tooltip key={filter.id} filterId={filter.id}>
                            <div
                              className={`flex items-center gap-2 p-3 min-h-[48px] rounded-lg transition-all duration-200 border ${
                                isIncluded 
                                  ? 'bg-blue-50 border-blue-400' 
                                  : isExcluded
                                  ? 'bg-red-50 border-red-400'
                                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              <span className={`text-sm font-medium flex-1 ${
                                isIncluded ? 'text-blue-700' : isExcluded ? 'text-red-700' : 'text-gray-800'
                              }`}>
                                {filter.label}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => toggleIncludeFilter(filter.id)}
                                  className={`px-2 py-1 rounded text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
                                    isIncluded
                                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                  title="Include"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Include</span>
                                </button>
                                <button
                                  onClick={() => toggleExcludeFilter(filter.id)}
                                  className={`px-2 py-1 rounded text-xs font-semibold transition-all duration-200 flex items-center gap-1 ${
                                    isExcluded
                                      ? 'bg-red-500 text-white hover:bg-red-600'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                  title="Exclude"
                                >
                                  <Minus className="w-3 h-3" />
                                  <span>Exclude</span>
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
        <div className="mt-8 mb-6 text-center text-gray-600 text-sm">
          <p>Built for Pokémon GO trainers who want better inventory management 🎮</p>
        </div>
      </div>
    </div>
  );
};

export default PokemonGoSearchBuilder;