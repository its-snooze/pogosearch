import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Search, Copy, X, ChevronDown, AlertTriangle, Check, 
  BarChart3, Zap, Sparkles, TrendingUp, Clock, Ruler, Swords, Plus, Minus,
  Bookmark, BookmarkCheck, Trash2, Download, Upload, Sun, Moon, Globe, MessageCircle
} from 'lucide-react';
import { translateSearchString, translateTerm, translateToEnglish, getAvailableLanguages, getLocale } from './utils/translation';
import { getUIText } from './translations/uiTranslations';
import CustomAgeInput from './components/CustomAgeInput';
import { parseSearchString, validateSearchString, buildSearchString as buildSearchStringFromParser } from './utils/searchParser';

// Category metadata with colors and icons - names will be translated in component
const categoryMeta = {
  stats: { 
    nameKey: 'stats_ivs',
    icon: BarChart3, 
    gradient: 'from-blue-500 to-cyan-500',
    chipColor: 'bg-blue-500'
  },
  types: { 
    nameKey: 'types',
    icon: Zap, 
    gradient: 'from-green-500 to-emerald-500',
    chipColor: 'bg-green-500'
  },
  special: { 
    nameKey: 'special_status',
    icon: Sparkles, 
    gradient: 'from-purple-500 to-pink-500',
    chipColor: 'bg-purple-500'
  },
  evolution: { 
    nameKey: 'evolution_buddy',
    icon: TrendingUp, 
    gradient: 'from-orange-500 to-red-500',
    chipColor: 'bg-orange-500'
  },
  time: { 
    nameKey: 'time_distance',
    icon: Clock, 
    gradient: 'from-teal-500 to-cyan-500',
    chipColor: 'bg-teal-500'
  },
  size: { 
    nameKey: 'size_gender',
    icon: Ruler, 
    gradient: 'from-pink-500 to-rose-500',
    chipColor: 'bg-pink-500'
  },
  moves: { 
    nameKey: 'moves',
    icon: Swords, 
    gradient: 'from-red-500 to-orange-500',
    chipColor: 'bg-red-500'
  },
  regions: { 
    nameKey: 'regions',
    icon: Globe, 
    gradient: 'from-indigo-500 to-violet-500',
    chipColor: 'bg-indigo-500'
  },
};

// Filter definitions organized by category
const filterCategories = {
  stats: {
    nameKey: 'stats_ivs',
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
    nameKey: 'types',
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
    nameKey: 'special_status',
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
    nameKey: 'evolution_buddy',
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
    nameKey: 'time_distance',
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
    nameKey: 'size_gender',
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
    nameKey: 'moves',
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
    nameKey: 'regions',
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
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'English';
    const stored = localStorage.getItem('pogoLanguage');
    return stored || 'English';
  });
  const [translationWarnings, setTranslationWarnings] = useState([]);
  const [discordDismissed, setDiscordDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('pogoDiscordDismissed') === 'true';
  });
  const [customAgeValue, setCustomAgeValue] = useState('');
  const [customAgeIncluded, setCustomAgeIncluded] = useState(false);
  const [customAgeExcluded, setCustomAgeExcluded] = useState(false);
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
    
    // Map filter IDs to filter values for the parser
    const includedValues = included.map(filterId => {
      const filter = Object.values(filterCategories)
        .flatMap(cat => cat.filters)
        .find(f => f.id === filterId);
      return filter?.value;
    }).filter(Boolean);
    
    const excludedValues = excluded.map(filterId => {
      const filter = Object.values(filterCategories)
        .flatMap(cat => cat.filters)
        .find(f => f.id === filterId);
      return filter?.value;
    }).filter(Boolean);
    
    // Build a test search string
    const testString = buildSearchStringFromParser(includedValues, excludedValues);
    
    // Parse and check for conflicts
    const result = parseSearchString(testString);
    
    // Convert parser conflicts to user-friendly messages
    if (result.conflicts && result.conflicts.length > 0) {
      conflicts.push(...result.conflicts.map(conflict => conflict.message));
    }
    
    // Also check for include/exclude conflicts on same filter (legacy check)
    included.forEach(filterId => {
      if (excluded.includes(filterId)) {
        const filterDef = Object.values(filterCategories)
          .flatMap(cat => cat.filters)
          .find(f => f.id === filterId);
        conflicts.push(`${filterDef?.label || filterId} cannot be both included and excluded`);
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
  // - Star ratings can be OR'd together with commas (e.g., "3*,4*" means 3* OR 4*)
  // - Pokedex numbers are preserved from ref (extracted from search string)
  // - Terms are translated to selected language before output
  const buildSearchString = useCallback((included, excluded) => {
    // Get filter objects for included and excluded
    const getFilterObject = (id) => {
      return Object.values(filterCategories)
        .flatMap(cat => cat.filters)
        .find(f => f.id === id);
    };

    // Helper function to combine consecutive year filters into ranges
    const combineYearRanges = (timeFilterIds) => {
      // Separate year filters from other time filters (age, distance)
      const yearFilters = timeFilterIds.filter(id => id.startsWith('year'));
      const otherTimeFilters = timeFilterIds.filter(id => !id.startsWith('year'));
      
      if (yearFilters.length === 0) {
        // No year filters, return other time filters as-is
        return otherTimeFilters.map(id => getFilterObject(id)?.value).filter(Boolean);
      }
      
      // Extract years and sort them
      const years = yearFilters
        .map(id => {
          const match = id.match(/year(\d{4})/);
          return match ? parseInt(match[1], 10) : null;
        })
        .filter(year => year !== null)
        .sort((a, b) => a - b);
      
      // Combine consecutive years into ranges
      const yearRanges = [];
      let rangeStart = years[0];
      let rangeEnd = years[0];
      
      for (let i = 1; i < years.length; i++) {
        if (years[i] === rangeEnd + 1) {
          // Consecutive year, extend the range
          rangeEnd = years[i];
        } else {
          // Gap found, save current range and start a new one
          if (rangeStart === rangeEnd) {
            yearRanges.push(`year${rangeStart}`);
          } else {
            yearRanges.push(`year${rangeStart}-${rangeEnd}`);
          }
          rangeStart = years[i];
          rangeEnd = years[i];
        }
      }
      
      // Add the last range
      if (rangeStart === rangeEnd) {
        yearRanges.push(`year${rangeStart}`);
      } else {
        yearRanges.push(`year${rangeStart}-${rangeEnd}`);
      }
      
      // Combine year ranges with other time filters
      return [...yearRanges, ...otherTimeFilters.map(id => getFilterObject(id)?.value).filter(Boolean)];
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
    const regionFilters = filterCategories.regions.filters.map(f => f.id);

    // Separate included filters by category
    const includedStar = included.filter(id => starRatings.includes(id));
    const includedStats = included.filter(id => statFilters.includes(id));
    const includedTypes = included.filter(id => typeFilters.includes(id));
    const includedSpecial = included.filter(id => specialFilters.includes(id));
    const includedEvolution = included.filter(id => evolutionFilters.includes(id));
    const includedTime = included.filter(id => timeFilters.includes(id));
    const includedSize = included.filter(id => sizeFilters.includes(id));
    const includedMoves = included.filter(id => moveFilters.includes(id));
    const includedRegions = included.filter(id => regionFilters.includes(id));

    // Separate excluded filters by category
    const excludedStar = excluded.filter(id => starRatings.includes(id));
    const excludedStats = excluded.filter(id => statFilters.includes(id));
    const excludedTypes = excluded.filter(id => typeFilters.includes(id));
    const excludedSpecial = excluded.filter(id => specialFilters.includes(id));
    const excludedEvolution = excluded.filter(id => evolutionFilters.includes(id));
    const excludedTime = excluded.filter(id => timeFilters.includes(id));
    const excludedSize = excluded.filter(id => sizeFilters.includes(id));
    const excludedMoves = excluded.filter(id => moveFilters.includes(id));
    const excludedRegions = excluded.filter(id => regionFilters.includes(id));

    // Build parts of the search string
    const parts = [];

    // Star ratings: Combine with commas (OR logic) if multiple
    // This allows searches like 0*,1* for trade fodder
    if (includedStar.length > 0) {
      const starValues = includedStar
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean);
      if (starValues.length > 0) {
        parts.push(starValues.join(','));
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

    // Time: Combine with commas (OR logic) if multiple, with smart year range detection
    if (includedTime.length > 0 || customAgeIncluded) {
      const timeValues = combineYearRanges(includedTime);
      // Add custom age if included
      if (customAgeIncluded && customAgeValue) {
        timeValues.push(customAgeValue);
      }
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

    // Regions: Combine with commas (OR logic) if multiple
    if (includedRegions.length > 0) {
      const regionValues = includedRegions
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean);
      if (regionValues.length > 0) {
        parts.push(regionValues.join(','));
      }
    }

    // Excluded filters: Add with ! prefix, combine with commas if multiple of same category
    const excludedParts = [];

    if (excludedStar.length > 0) {
      const starValues = excludedStar
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean)
        .map(v => `!${v}`);
      if (starValues.length > 0) {
        excludedParts.push(starValues.join(','));
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
      excludedSpecial.forEach(id => {
        const filter = getFilterObject(id);
        if (filter?.value) {
          excludedParts.push(`!${filter.value}`);
        }
      });
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

    if (excludedTime.length > 0 || customAgeExcluded) {
      const timeValues = combineYearRanges(excludedTime);
      // Add custom age if excluded
      if (customAgeExcluded && customAgeValue) {
        timeValues.push(customAgeValue);
      }
      const excludedTimeValues = timeValues.map(v => `!${v}`);
      if (excludedTimeValues.length > 0) {
        excludedParts.push(excludedTimeValues.join(','));
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

    if (excludedRegions.length > 0) {
      const regionValues = excludedRegions
        .map(id => getFilterObject(id)?.value)
        .filter(Boolean)
        .map(v => `!${v}`);
      if (regionValues.length > 0) {
        excludedParts.push(regionValues.join(','));
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
    
    let result = finalParts.join('&');
    
    // Translate the search string to the selected language
    if (selectedLanguage !== 'English' && result) {
      result = translateSearchString(result, selectedLanguage);
    }
    
    // Validate the generated search string as a safety check
    const validation = validateSearchString(result);
    if (!validation.valid && process.env.NODE_ENV === 'development') {
      console.warn(`Generated invalid search string: "${result}" - ${validation.error}`);
    }
    
    return result;
  }, [selectedLanguage, customAgeIncluded, customAgeExcluded, customAgeValue]);

  // Save language preference to localStorage
  React.useEffect(() => {
    localStorage.setItem('pogoLanguage', selectedLanguage);
  }, [selectedLanguage]);

  // Save Discord dismissed state to localStorage
  React.useEffect(() => {
    localStorage.setItem('pogoDiscordDismissed', discordDismissed.toString());
  }, [discordDismissed]);

  // Helper function to translate and set search string (for manual insertions)
  const setTranslatedSearchString = useCallback((englishString) => {
    if (!englishString) {
      setSearchString('');
      setTranslationWarnings([]);
      return;
    }
    
    if (selectedLanguage !== 'English') {
      const translationResult = translateSearchString(englishString, selectedLanguage, true);
      setSearchString(translationResult.translated);
      setTranslationWarnings(translationResult.warnings);
    } else {
      setSearchString(englishString);
      setTranslationWarnings([]);
    }
  }, [selectedLanguage]);

  // Update warnings when search string or language changes
  React.useEffect(() => {
    if (selectedLanguage !== 'English' && searchString) {
      // Get the English version first (if it's already translated, translate back)
      const englishString = translateToEnglish(searchString, selectedLanguage);
      
      // Then translate to get warnings
      const translationResult = translateSearchString(englishString, selectedLanguage, true);
      setTranslationWarnings(translationResult.warnings);
    } else {
      setTranslationWarnings([]);
    }
  }, [searchString, selectedLanguage]);

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
    
    // Convert parser errors to display format
    if (!validation.valid && validation.errors && validation.errors.length > 0) {
      // Get the first error message (or combine all if multiple)
      const errorMessages = validation.errors.map(err => err.message || err);
      setValidationResult({
        valid: false,
        error: errorMessages.length === 1 ? errorMessages[0] : errorMessages.join('; ')
      });
    } else {
      setValidationResult({ valid: validation.valid });
    }
    
    // Console warning during development
    if (!validation.valid && process.env.NODE_ENV === 'development') {
      const errorMsg = validation.errors && validation.errors.length > 0 
        ? validation.errors.map(e => e.message || e).join('; ')
        : 'Invalid search string';
      console.warn(`Invalid search string: "${searchString}" - ${errorMsg}`);
    }
  }, [searchString, selectedLanguage]);

  const toggleIncludeFilter = (filterId) => {
    setIsPremadeSearch(false);
    setIncludedFilters(prev => {
      if (prev.includes(filterId)) {
        return prev.filter(id => id !== filterId);
      } else {
        // Remove from excluded if it's there
        setExcludedFilters(prevExcluded => prevExcluded.filter(id => id !== filterId));
        
        // Allow multiple star ratings (they'll be OR'd together with commas)
        
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
        
        // Allow multiple star ratings (they'll be OR'd together with commas)
        
        return [...prev, filterId];
      }
    });
  };

  // Custom age handlers
  const handleCustomAgeInclude = () => {
    setIsPremadeSearch(false);
    if (customAgeIncluded) {
      setCustomAgeIncluded(false);
    } else {
      setCustomAgeExcluded(false);
      setCustomAgeIncluded(true);
    }
  };

  const handleCustomAgeExclude = () => {
    setIsPremadeSearch(false);
    if (customAgeExcluded) {
      setCustomAgeExcluded(false);
    } else {
      setCustomAgeIncluded(false);
      setCustomAgeExcluded(true);
    }
  };

  const handleCustomAgeValueChange = (value) => {
    setCustomAgeValue(value);
    // Clear include/exclude if value is cleared
    if (!value || value.trim() === '') {
      setCustomAgeIncluded(false);
      setCustomAgeExcluded(false);
    }
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
    setTranslationWarnings([]);
    setIsPremadeSearch(false);
    setCustomAgeValue('');
    setCustomAgeIncluded(false);
    setCustomAgeExcluded(false);
    pokedexNumbersRef.current = ''; // Clear Pokedex numbers ref
  };

  // Parse search string to extract filter IDs (included and excluded)
  // Handles Pokemon GO syntax: filters separated by &, comma-separated values within parts
  // Also handles translated search strings by converting them to English first
  const parseSearchStringToFilters = (searchStr) => {
    if (!searchStr || searchStr.trim() === '') {
      return { included: [], excluded: [] };
    }
    
    // Translate to English first if needed (for parsing)
    // This allows users to paste translated strings and have them parsed correctly
    let englishSearchStr = searchStr;
    if (selectedLanguage !== 'English') {
      // Try to translate back to English for parsing
      englishSearchStr = translateToEnglish(searchStr, selectedLanguage);
    }
    
    // Use the new parser to extract filters
    const result = parseSearchString(englishSearchStr);
    
    // Map filter values to filter IDs
    const includedIds = [];
    const excludedIds = [];
    
    // Map included filter values to IDs
    result.included.forEach(filterValue => {
      // Skip Pokedex numbers (all digits and commas)
      if (/^[\d,]+$/.test(filterValue)) {
        return;
      }
      
      const filter = Object.values(filterCategories)
        .flatMap(cat => cat.filters)
        .find(f => f.value === filterValue);
      
      if (filter) {
        includedIds.push(filter.id);
      }
    });
    
    // Map excluded filter values to IDs
    result.excluded.forEach(filterValue => {
      const filter = Object.values(filterCategories)
        .flatMap(cat => cat.filters)
        .find(f => f.value === filterValue);
      
      if (filter) {
        excludedIds.push(filter.id);
      }
    });
    
    return { included: includedIds, excluded: excludedIds };
  };

  const copyToClipboard = async () => {
    // Validate before copying
    const validation = validateSearchString(searchString);
    if (!validation.valid) {
      if (process.env.NODE_ENV === 'development') {
        const errorMsg = validation.errors && validation.errors.length > 0 
          ? validation.errors.map(e => e.message || e).join('; ')
          : 'Invalid search string';
        console.warn(`Cannot copy invalid search string: "${searchString}" - ${errorMsg}`);
      }
      // Still allow copying, but show validation error
      const errorMessages = validation.errors && validation.errors.length > 0
        ? validation.errors.map(err => err.message || err)
        : ['Invalid search string'];
      setValidationResult({
        valid: false,
        error: errorMessages.length === 1 ? errorMessages[0] : errorMessages.join('; ')
      });
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

  // Helper function to translate filter labels
  const translateFilterLabel = (filter, language) => {
    if (!filter || !filter.label) return '';
    
    const filterId = filter.id;
    const originalLabel = filter.label;
    
    // Handle time-related filters (UI-only terms)
    if (filterId === 'age0') {
      return getUIText('caught_today', language);
    }
    if (filterId === 'age0-7') {
      return getUIText('last_7_days', language);
    }
    if (filterId === 'age0-30') {
      return getUIText('last_30_days', language);
    }
    if (filterId.startsWith('year')) {
      // Year numbers stay as numbers
      return filterId.replace('year', '');
    }
    if (filterId === 'distance1000-') {
      return getUIText('distance_1000km_plus', language);
    }
    if (filterId === 'distance100-') {
      return getUIText('distance_100km_plus', language);
    }
    
    // Handle move filters (with @ prefix)
    if (filterId.startsWith('@')) {
      // Extract type from move filter (e.g., @1fire -> fire)
      const moveMatch = filterId.match(/@[123](normal|fire|water|electric|grass|ice|fighting|poison|ground|flying|psychic|bug|rock|ghost|dragon|dark|steel|fairy|special|weather)/);
      if (moveMatch) {
        const type = moveMatch[1];
        if (type === 'special') {
          // Try to translate "Legacy/Special Moves"
          const translated = translateTerm('special', language, 'move');
          return translated !== 'special' ? translated + ' / ' + translateTerm('Legacy', language, 'move') : originalLabel;
        }
        if (type === 'weather') {
          const translated = translateTerm('weather', language, 'move');
          return translated !== 'weather' ? translated : originalLabel;
        }
        // Translate the type name
        const translatedType = translateTerm(type, language, 'name');
        if (translatedType === type) {
          // If translation not found, return original
          return originalLabel;
        }
        // Replace the type in the original label
        // Original labels are like "Fire Fast Move", "Normal Charged Move 1", etc.
        const typeMatch = originalLabel.match(/^(\w+)\s+(.+)$/);
        if (typeMatch) {
          return `${translatedType} ${typeMatch[2]}`;
        }
        return translatedType;
      }
      return originalLabel;
    }
    
    // Handle type filters (game terms)
    const typeNames = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
    if (typeNames.includes(filterId)) {
      const translated = translateTerm(filterId, language, 'name');
      // Capitalize first letter for display (search string stays lowercase)
      return translated.charAt(0).toUpperCase() + translated.slice(1);
    }
    
    // Handle special status filters (game terms)
    const specialStatus = ['shiny', 'lucky', 'shadow', 'purified', 'legendary', 'mythical', 'ultrabeast', 'dynamax', 'gigantamax', 'costume', 'background', 'locationbackground', 'specialbackground', 'hatched', 'eggsonly', 'traded', 'alolan', 'galarian', 'hisuian', 'paldean', 'defender', 'favorite'];
    if (specialStatus.includes(filterId)) {
      const translated = translateTerm(filterId, language, 'name');
      // Capitalize first letter for display (search string stays lowercase)
      return translated.charAt(0).toUpperCase() + translated.slice(1);
    }
    
    // Handle region filters (game terms)
    const regions = ['kanto', 'johto', 'hoenn', 'sinnoh', 'unova', 'kalos', 'alola', 'galar', 'paldea'];
    if (regions.includes(filterId)) {
      const translated = translateTerm(filterId, language, 'name');
      // Keep the Gen number part
      const genMatch = originalLabel.match(/\(Gen \d+\)/);
      if (genMatch) {
        return `${translated} ${genMatch[0]}`;
      }
      return translated;
    }
    
    // Handle gender filters
    if (filterId === 'male' || filterId === 'female') {
      return translateTerm(filterId, language, 'name');
    }
    if (filterId === 'genderunknown') {
      return translateTerm('genderless', language, 'name');
    }
    
    // Handle size filters - these are usually abbreviations, but check if they exist in translations
    if (filterId === 'xxs' || filterId === 'xs' || filterId === 'xl' || filterId === 'xxl') {
      // These are usually kept as abbreviations, but try to translate if available
      const translated = translateTerm(filterId.toUpperCase(), language, 'name');
      return translated !== filterId.toUpperCase() ? translated : originalLabel;
    }
    
    // Handle evolution/buddy filters
    const evolutionTerms = ['evolve', 'megaevolve', 'evolvenew', 'item', 'tradeevolve', 'mega0', 'mega1', 'mega2', 'mega3', 'buddy0', 'buddy1', 'buddy2', 'buddy3', 'buddy4', 'buddy5'];
    if (evolutionTerms.includes(filterId)) {
      // Try to translate the full term first
      let translated = translateTerm(filterId, language, 'name');
      if (translated !== filterId) {
        return translated;
      }
      // If that doesn't work, try the base term
      const baseTerm = filterId.replace(/\d+$/, '');
      translated = translateTerm(baseTerm, language, 'name');
      if (translated !== baseTerm) {
        // If we have a number suffix, try to preserve the label structure
        const numMatch = filterId.match(/(\d+)$/);
        if (numMatch && originalLabel.includes(numMatch[0])) {
          // Try to reconstruct: translate base + keep number part
          const labelParts = originalLabel.split(' ');
          const translatedParts = labelParts.map(part => {
            if (part.toLowerCase().includes(baseTerm)) {
              return part.replace(new RegExp(baseTerm, 'gi'), translated);
            }
            return part;
          });
          return translatedParts.join(' ');
        }
        return translated;
      }
    }
    
    // Handle stats filters - try to translate the whole term first, then fall back to parts
    if (filterId.includes('attack') || filterId.includes('defense') || filterId.includes('hp')) {
      // Try translating the full term first (e.g., "4attack" -> "Perfect Attack")
      const translated = translateTerm(filterId, language, 'search');
      if (translated !== filterId) {
        // If we got a translation, use it
        return translated;
      }
      // Otherwise, try to translate parts of the label
      const parts = originalLabel.split(' ');
      const translatedParts = parts.map(part => {
        // Remove parentheses and numbers for translation
        const cleanPart = part.replace(/[()0-9-]/g, '').trim();
        if (cleanPart === 'Perfect' || cleanPart === 'High' || cleanPart === 'Zero') {
          const translated = translateTerm(cleanPart, language, 'name');
          return translated !== cleanPart ? translated : part;
        }
        if (cleanPart === 'Attack' || cleanPart === 'Defense' || cleanPart === 'HP') {
          const translated = translateTerm(cleanPart.toLowerCase(), language, 'name');
          return translated !== cleanPart.toLowerCase() ? translated : part;
        }
        return part;
      });
      return translatedParts.join(' ');
    }
    
    // Default: return original label if no translation found
    return originalLabel;
  };

  const getChipLabel = (filterId) => {
    // Handle custom age
    if (filterId === 'customAge') {
      const formatAgeForDisplay = (ageValue) => {
        if (!ageValue) return getUIText('custom_age', selectedLanguage);
        if (ageValue.startsWith('age')) {
          const agePart = ageValue.substring(3);
          // Format for display
          if (agePart === '0') return getUIText('today', selectedLanguage);
          if (agePart.match(/^0-(\d+)$/)) {
            const days = agePart.match(/^0-(\d+)$/)[1];
            return getUIText('last_days', selectedLanguage).replace('{days}', days);
          }
          if (agePart.match(/^(\d+)-$/)) {
            const days = agePart.match(/^(\d+)-$/)[1];
            return getUIText('more_than_days_ago', selectedLanguage).replace('{days}', days);
          }
          if (agePart.match(/^(\d+)-(\d+)$/)) {
            const match = agePart.match(/^(\d+)-(\d+)$/);
            return getUIText('days_ago', selectedLanguage).replace('{start}', match[1]).replace('{end}', match[2]);
          }
          return getUIText('age_label', selectedLanguage).replace('{value}', agePart);
        }
        return ageValue;
      };
      return formatAgeForDisplay(customAgeValue);
    }
    const filter = Object.values(filterCategories)
      .flatMap(cat => cat.filters)
      .find(f => f.id === filterId);
    if (filter) {
      return translateFilterLabel(filter, selectedLanguage);
    }
    return filterId;
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
    // Note: cleanCombo and comboString are already in English (from filter values)
    // We need to translate them if language is not English
    if (!searchString || searchString.trim() === '') {
      setTranslatedSearchString(cleanCombo);
    } else {
      // Translate current search string back to English, append, then translate
      const currentEnglish = selectedLanguage !== 'English' 
        ? translateToEnglish(searchString, selectedLanguage) 
        : searchString;
      const newEnglishString = `${currentEnglish}${comboString}`;
      setTranslatedSearchString(newEnglishString);
      // Preserve any Pokedex numbers
      extractPokedexNumbers(newEnglishString);
    }
  };

  // Insert or replace CP range in search string
  const insertCPRange = (cpRange) => {
    setIsPremadeSearch(false);
    
    // CP range is language-independent (starts with "cp"), so we can work with English version
    const currentEnglish = selectedLanguage !== 'English' 
      ? translateToEnglish(searchString, selectedLanguage) 
      : searchString;
    
    if (!currentEnglish || currentEnglish.trim() === '') {
      // If search string is empty, just set the CP range
      setTranslatedSearchString(cpRange);
      return;
    }
    
    // Split by & to get parts
    const parts = currentEnglish.split('&').map(p => p.trim()).filter(p => p);
    
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
    
    const newEnglishString = parts.join('&');
    setTranslatedSearchString(newEnglishString);
    // Preserve any Pokedex numbers
    extractPokedexNumbers(newEnglishString);
  };

  // Insert Pokemon numbers into search string
  const insertPokemonNumbers = (numbers) => {
    setIsPremadeSearch(false);
    
    // Pokedex numbers are language-independent, so we can work with English version
    const currentEnglish = selectedLanguage !== 'English' 
      ? translateToEnglish(searchString, selectedLanguage) 
      : searchString;
    
    if (!currentEnglish || currentEnglish.trim() === '') {
      // If search string is empty, just set the numbers
      setTranslatedSearchString(numbers);
      extractPokedexNumbers(numbers);
      return;
    }
    
    // Split by & to get parts
    const parts = currentEnglish.split('&').map(p => p.trim()).filter(p => p);
    
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
      const newEnglishString = parts.join('&');
      setTranslatedSearchString(newEnglishString);
      extractPokedexNumbers(newEnglishString);
    } else {
      // No existing Pokedex numbers, prepend them
      const newEnglishString = `${numbers}&${currentEnglish}`;
      setTranslatedSearchString(newEnglishString);
      extractPokedexNumbers(newEnglishString);
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
    // Saved search string might be in any language - translate to English for parsing
    const englishString = selectedLanguage !== 'English'
      ? translateToEnglish(savedSearch.searchString, selectedLanguage)
      : savedSearch.searchString;
    
    const { included, excluded } = parseSearchStringToFilters(englishString);
    extractPokedexNumbers(englishString);
    
    // If the saved search was in a different language, translate it to current language
    // Otherwise, if it's already in current language, use it as-is
    if (selectedLanguage !== 'English') {
      setTranslatedSearchString(englishString);
    } else {
      setSearchString(englishString);
      setTranslationWarnings([]);
    }
    
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

  // Pokemon Generation and Group data - translated based on selected language
  const pokemonGenerations = useMemo(() => [
    { label: getUIText('gen_1_kanto', selectedLanguage), range: '1-151' },
    { label: getUIText('gen_2_johto', selectedLanguage), range: '152-251' },
    { label: getUIText('gen_3_hoenn', selectedLanguage), range: '252-386' },
    { label: getUIText('gen_4_sinnoh', selectedLanguage), range: '387-493' },
    { label: getUIText('gen_5_unova', selectedLanguage), range: '494-649' },
    { label: getUIText('gen_6_kalos', selectedLanguage), range: '650-721' },
    { label: getUIText('gen_7_alola', selectedLanguage), range: '722-809' },
    { label: getUIText('gen_8_galar', selectedLanguage), range: '810-905' },
  ], [selectedLanguage]);

  const pokemonGroups = useMemo(() => [
    { label: getUIText('all_starters', selectedLanguage), numbers: '1,2,3,4,5,6,7,8,9,152,153,154,155,156,157,158,159,160,252,253,254,255,256,257,258,259,260,387,388,389,390,391,392,393,394,395,495,496,497,498,499,500,501,502,503,650,651,652,653,654,655,656,657,658,722,723,724,725,726,727,728,729,730,810,811,812,813,814,815,816,817,818' },
    { label: getUIText('kanto_starters', selectedLanguage), numbers: '1,2,3,4,5,6,7,8,9' },
    { label: getUIText('johto_starters', selectedLanguage), numbers: '152,153,154,155,156,157,158,159,160' },
    { label: getUIText('hoenn_starters', selectedLanguage), numbers: '252,253,254,255,256,257,258,259,260' },
    { label: getUIText('sinnoh_starters', selectedLanguage), numbers: '387,388,389,390,391,392,393,394,395' },
    { label: getUIText('unova_starters', selectedLanguage), numbers: '495,496,497,498,499,500,501,502,503' },
    { label: getUIText('kalos_starters', selectedLanguage), numbers: '650,651,652,653,654,655,656,657,658' },
    { label: getUIText('alola_starters', selectedLanguage), numbers: '722,723,724,725,726,727,728,729,730' },
    { label: getUIText('galar_starters', selectedLanguage), numbers: '810,811,812,813,814,815,816,817,818' },
    { label: getUIText('pseudo_legendaries', selectedLanguage), numbers: '147,148,149,246,247,248,371,372,373,443,444,445,610,611,612,633,634,635,704,705,706,782,783,784,885,886,887' },
    { label: getUIText('eeveelutions', selectedLanguage), numbers: '133,134,135,136,196,197,470,471,700' },
  ], [selectedLanguage]);

  // Premade search presets
  const premadeSearches = useMemo(() => ({
    sTierShadow: {
      label: getUIText('premade_s_tier_shadows', selectedLanguage),
      description: getUIText('premade_s_tier_shadows_desc', selectedLanguage),
      searchString: '373,409,464,484,150,485,383,483&shadow',
      tier: 'S',
      type: 'Shadow'
    },
    sTierNonShadow: {
      label: getUIText('premade_s_tier_nonshadow', selectedLanguage),
      description: getUIText('premade_s_tier_nonshadow_desc', selectedLanguage),
      searchString: '889,888,646,382,383,384,448,94,719,6,257,890,800',
      tier: 'S',
      type: 'Non-Shadow'
    },
    aPlusTierShadow: {
      label: getUIText('premade_aplus_tier_shadows', selectedLanguage),
      description: getUIText('premade_aplus_tier_shadows_desc', selectedLanguage),
      searchString: '697,248,260,486,243,146,376,473,462,68,382,635,250,526,94,282,445,530,466,149,555,534,609,257&shadow',
      tier: 'A+',
      type: 'Shadow'
    },
    aPlusTierNonShadow: {
      label: getUIText('premade_aplus_tier_nonshadow', selectedLanguage),
      description: getUIText('premade_aplus_tier_nonshadow_desc', selectedLanguage),
      searchString: '644,796,639,464,643,894,384,484,248,260,254,376,310,381,282,445,142,359,460,448,645,798&mega',
      tier: 'A+',
      type: 'Non-Shadow'
    },
    aTierShadow: {
      label: getUIText('premade_a_tier_shadows', selectedLanguage),
      description: getUIText('premade_a_tier_shadows_desc', selectedLanguage),
      searchString: '145,461,738,398,254,381,430,297,487,244,500,142,359&shadow',
      tier: 'A',
      type: 'Shadow'
    },
    aTierNonShadow: {
      label: getUIText('premade_a_tier_nonshadow', selectedLanguage),
      description: getUIText('premade_a_tier_nonshadow_desc', selectedLanguage),
      searchString: '717,637,892,248,642,492,373,895,409,484,150,376,3,18,380,229,214,362,354,181,65,473,792,382,647,635,720,485,383,487,445,905,483,491,534,609,806,998&mega',
      tier: 'A',
      type: 'Non-Shadow'
    },
    top25MasterLeague: {
      label: getUIText('premade_top25_master_league', selectedLanguage),
      description: getUIText('premade_top25_master_league_desc', selectedLanguage),
      searchString: '888,484,889,483,646,644,643,249,376,890,800,792,250,383,381,648,671,468,791',
      tier: 'PvP',
      type: 'Master League'
    }
  }), [selectedLanguage]);

  const applyPremadeSearch = async (searchKey, event) => {
    const preset = premadeSearches[searchKey];
    if (preset) {
      // Validate the premade search string
      const validation = validateSearchString(preset.searchString);
      if (!validation.valid && process.env.NODE_ENV === 'development') {
        const errorMsg = validation.errors && validation.errors.length > 0 
          ? validation.errors.map(e => e.message || e).join('; ')
          : 'Invalid search string';
        console.warn(`Premade search "${searchKey}" has invalid syntax: "${preset.searchString}" - ${errorMsg}`);
      }
      
      // Extract and preserve Pokedex numbers from the premade search string
      extractPokedexNumbers(preset.searchString);
      
      // Parse the search string to extract filter tags (preset.searchString is in English)
      const { included, excluded } = parseSearchStringToFilters(preset.searchString);
      
      // Set the search string and filters (translate if needed)
      setTranslatedSearchString(preset.searchString);
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
      
      {/* Discord Invite Banner */}
      {!discordDismissed && (
        <div className="bg-gradient-to-r from-indigo-600/90 to-purple-600/90 backdrop-blur-sm border-b border-indigo-500/30 dark:from-indigo-900/80 dark:to-purple-900/80 dark:border-indigo-700/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              <a
                href={getUIText('discord_link', selectedLanguage)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white hover:text-indigo-100 transition-colors flex-1 min-w-0"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate">
                  {getUIText('join_discord', selectedLanguage)}
                </span>
              </a>
              <button
                onClick={() => setDiscordDismissed(true)}
                className="text-white/80 hover:text-white transition-colors p-1 flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Sticky Header with Output Section */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm dark:bg-slate-900/90 dark:border-slate-800 dark:shadow-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Compact Header */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#0077BE] to-[#00A7E5] bg-clip-text text-transparent">
                {getUIText('app_title', selectedLanguage)}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
                {getUIText('app_subtitle', selectedLanguage)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 rounded-full border border-blue-200/70 text-[#0077BE] hover:bg-blue-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900 cursor-pointer appearance-none pr-8"
                >
                  {getAvailableLanguages().map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                  <Globe className="w-4 h-4 text-[#0077BE] dark:text-slate-100" />
                  <span className="text-[10px] opacity-70 text-[#0077BE] dark:text-slate-100">{getUIText('language_wip', selectedLanguage)}</span>
                </div>
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
                  {isDarkMode ? getUIText('light_mode', selectedLanguage) : getUIText('dark_mode', selectedLanguage)}
                </span>
              </button>
            </div>
          </div>

          {/* Output Section - FOCAL POINT */}
          <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-xl shadow-lg p-4 sm:p-5 border-2 border-blue-200/50 dark:from-slate-900 dark:to-slate-900/70 dark:border-slate-700 dark:shadow-slate-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-gray-700 dark:text-slate-200">
                  {getUIText('search_string', selectedLanguage)}
                </label>
                {(includedFilters.length > 0 || excludedFilters.length > 0) && (
                  <span className="px-2 py-0.5 bg-[#0077BE] text-white text-xs font-bold rounded-full">
                    {includedFilters.length + excludedFilters.length} {getUIText('active', selectedLanguage)}
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
                      <div className="absolute left-0 top-full mt-2 z-50 px-3 py-2 bg-amber-50 dark:bg-amber-900/80 border-2 border-amber-400 dark:border-amber-500 rounded-lg shadow-xl max-w-xs">
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                          {validationResult.error}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {translationWarnings.length > 0 && (
                  <div className="relative group">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 cursor-help" />
                    <div className="absolute left-0 top-full mt-2 z-50 w-80 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/80 border-2 border-yellow-400 dark:border-yellow-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                        {getUIText('translation_warnings', selectedLanguage)}
                      </p>
                      <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                        {translationWarnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end">
                <button
                  onClick={clearAll}
                  className="text-xs font-semibold text-gray-500 hover:text-red-500 transition-colors px-2 py-1 dark:text-slate-400 dark:hover:text-red-300"
                >
                  {getUIText('clear_all', selectedLanguage)}
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchString}
                  readOnly
                  placeholder={getUIText('search_placeholder', selectedLanguage)}
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
                    <span>{getUIText('copied', selectedLanguage)}</span>
                  </> 
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span className="hidden sm:inline">{getUIText('copy', selectedLanguage)}</span>
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
                  <span>{getUIText('save_this_search', selectedLanguage)}</span>
                </button>
                {saveSuccessVisible && (
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm animate-save-success">
                    <BookmarkCheck className="w-5 h-5" />
                    <span>{getUIText('search_saved', selectedLanguage)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Conflicts Warning */}
            {conflicts.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50 border-2 border-amber-400 rounded-lg flex items-start gap-2 animate-pulse-warning dark:bg-amber-950/30 dark:border-amber-500">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-amber-800 text-sm mb-1 dark:text-amber-200">⚠️ {getUIText('conflicting_filters', selectedLanguage)}</p>
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
        {(includedFilters.length > 0 || excludedFilters.length > 0 || customAgeIncluded || customAgeExcluded) && (
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
              {customAgeIncluded && customAgeValue && (
                <div
                  key="included-customAge"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#0077BE] to-[#00A7E5] text-white rounded-full text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                    removingChip === 'customAge' ? 'chip-fade-out' : 'chip-fade-in'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                  <span className="whitespace-nowrap">{getChipLabel('customAge')}</span>
                  <button
                    onClick={() => {
                      setRemovingChip('customAge');
                      setTimeout(() => {
                        setCustomAgeIncluded(false);
                        setCustomAgeValue('');
                        setRemovingChip(null);
                      }, 300);
                    }}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors touch-manipulation"
                    aria-label="Remove filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
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
              {customAgeExcluded && customAgeValue && (
                <div
                  key="excluded-customAge"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${
                    removingChip === 'customAge' ? 'chip-fade-out' : 'chip-fade-in'
                  }`}
                >
                  <Minus className="w-3 h-3" />
                  <span className="whitespace-nowrap">{getChipLabel('customAge')}</span>
                  <button
                    onClick={() => {
                      setRemovingChip('customAge');
                      setTimeout(() => {
                        setCustomAgeExcluded(false);
                        setCustomAgeValue('');
                        setRemovingChip(null);
                      }, 300);
                    }}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors touch-manipulation"
                    aria-label="Remove filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
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
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-slate-100">{getUIText('saved_searches', selectedLanguage)}</h3>
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
                <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-slate-100">{getUIText('quick_searches', selectedLanguage)}</h3>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform duration-300 ${showQuickSearches ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block dark:text-slate-400">{getUIText('premade_section_title', selectedLanguage)}</p>
          </div>

          {showQuickSearches && (
            <div className="saved-searches-expand">
              {/* PvP & Competitive Subsection */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-4">{getUIText('premade_pvp_competitive', selectedLanguage)}</h3>
                
                {/* Raid Tier Attackers */}
                <div className="mb-5">
                  <h4 className="text-xs font-bold mb-3 uppercase tracking-wide bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">{getUIText('premade_raid_attackers', selectedLanguage)}</h4>
                  <div className="mb-3 p-3 bg-blue-50/80 border border-blue-200 rounded-lg dark:bg-slate-900/60 dark:border-blue-500/30">
                    <p className="text-xs text-blue-800 font-semibold mb-1 dark:text-blue-200">ℹ️ {getUIText('info_shadow_vs_nonshadow_title', selectedLanguage)}</p>
                    <p className="text-xs text-blue-700 leading-relaxed dark:text-blue-100">
                      {getUIText('info_shadow_vs_nonshadow_text', selectedLanguage)}
                    </p>
                  </div>
                  
                  {/* S-Tier */}
                  <div className="mb-4">
                    <h5 className="text-xs font-bold text-amber-700 mb-2 uppercase tracking-wide">{getUIText('tier_s_label', selectedLanguage)} • {getUIText('tier_s_description', selectedLanguage)}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <button
                        onClick={(e) => applyPremadeSearch('sTierShadow', e)}
                        className="group relative p-3 sm:p-4 rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm sm:text-base text-red-800">
                            {premadeSearches.sTierShadow.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-200 text-red-800 rounded-full font-bold">
                            {getUIText('badge_shadow', selectedLanguage)}
                          </span>
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
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded-full font-bold">
                            {getUIText('badge_mega_primal', selectedLanguage)}
                          </span>
                        </div>
                        <div className="text-[10px] sm:text-xs text-amber-700">
                          {premadeSearches.sTierNonShadow.description}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* A+ Tier */}
                  <div className="mb-4">
                    <h5 className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">{getUIText('tier_aplus_label', selectedLanguage)} • {getUIText('tier_aplus_description', selectedLanguage)}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <button
                        onClick={(e) => applyPremadeSearch('aPlusTierShadow', e)}
                        className="group relative p-3 sm:p-4 rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm sm:text-base text-red-800">
                            {premadeSearches.aPlusTierShadow.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-200 text-red-800 rounded-full font-bold">
                            {getUIText('badge_shadow', selectedLanguage)}
                          </span>
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
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-200 text-blue-800 rounded-full font-bold">
                            {getUIText('badge_mega', selectedLanguage)}
                          </span>
                        </div>
                        <div className="text-[10px] sm:text-xs text-blue-700">
                          {premadeSearches.aPlusTierNonShadow.description}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* A Tier */}
                  <div className="mb-4">
                    <h5 className="text-xs font-bold text-emerald-700 mb-2 uppercase tracking-wide">{getUIText('tier_a_label', selectedLanguage)} • {getUIText('tier_a_description', selectedLanguage)}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <button
                        onClick={(e) => applyPremadeSearch('aTierShadow', e)}
                        className="group relative p-3 sm:p-4 rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm sm:text-base text-red-800">
                            {premadeSearches.aTierShadow.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-200 text-red-800 rounded-full font-bold">
                            {getUIText('badge_shadow', selectedLanguage)}
                          </span>
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
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-200 text-emerald-800 rounded-full font-bold">
                            {getUIText('badge_mega', selectedLanguage)}
                          </span>
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
                  <h4 className="text-xs font-bold mb-3 uppercase tracking-wide bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">{getUIText('premade_master_league', selectedLanguage)}</h4>
                  <div className="mb-3 p-3 bg-indigo-50/80 border border-indigo-200 rounded-lg dark:bg-slate-900/60 dark:border-indigo-500/30">
                    <p className="text-xs text-indigo-800 font-semibold mb-1 dark:text-indigo-200">ℹ️ {getUIText('info_master_league_title', selectedLanguage)}</p>
                    <p className="text-xs text-indigo-700 leading-relaxed dark:text-indigo-100">
                      {getUIText('info_master_league_text', selectedLanguage)}
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
                <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 mb-4">{getUIText('premade_common_combos', selectedLanguage)}</h3>
                <h4 className="text-xs font-bold mb-3 uppercase tracking-wide bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">{getUIText('quick_combos', selectedLanguage)}</h4>
                <div className="mb-3 p-3 bg-purple-50/80 border border-purple-200 rounded-lg dark:bg-slate-900/60 dark:border-purple-500/30">
                  <p className="text-xs text-purple-800 font-semibold mb-1 dark:text-purple-200">ℹ️ {getUIText('quick_combos', selectedLanguage)}</p>
                  <p className="text-xs text-purple-700 leading-relaxed dark:text-purple-100">
                    {getUIText('quick_combos_info', selectedLanguage)}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <Tooltip text={getUIText('shiny_legendaries_desc', selectedLanguage)}>
                    <button
                      onClick={() => appendFilterCombo('&shiny&legendary')}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/60 dark:to-pink-900/60 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/70 dark:hover:to-pink-800/70 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="font-bold text-sm sm:text-base text-purple-800 dark:text-white mb-1">{getUIText('shiny_legendaries', selectedLanguage)}</div>
                      <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-100">{getUIText('shiny_legendaries_desc', selectedLanguage)}</div>
                    </button>
                  </Tooltip>

                  <Tooltip text={getUIText('perfect_shadows_desc', selectedLanguage)}>
                    <button
                      onClick={() => appendFilterCombo('&4*&shadow')}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/60 dark:to-pink-900/60 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/70 dark:hover:to-pink-800/70 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="font-bold text-sm sm:text-base text-purple-800 dark:text-purple-100 mb-1">{getUIText('perfect_shadows', selectedLanguage)}</div>
                      <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-200">{getUIText('perfect_shadows_desc', selectedLanguage)}</div>
                    </button>
                  </Tooltip>

                  <Tooltip text={getUIText('high_iv_non_shiny_desc', selectedLanguage)}>
                    <button
                      onClick={() => appendFilterCombo('&3*,4*&!shiny')}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/60 dark:to-pink-900/60 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/70 dark:hover:to-pink-800/70 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="font-bold text-sm sm:text-base text-purple-800 dark:text-purple-100 mb-1">{getUIText('high_iv_non_shiny', selectedLanguage)}</div>
                      <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-200">{getUIText('high_iv_non_shiny_desc', selectedLanguage)}</div>
                    </button>
                  </Tooltip>

                  <Tooltip text={getUIText('trade_fodder_desc', selectedLanguage)}>
                    <button
                      onClick={() => appendFilterCombo('&0*&!favorite')}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/60 dark:to-pink-900/60 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/70 dark:hover:to-pink-800/70 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="font-bold text-sm sm:text-base text-purple-800 dark:text-purple-100 mb-1">{getUIText('trade_fodder', selectedLanguage)}</div>
                      <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-200">{getUIText('trade_fodder_desc', selectedLanguage)}</div>
                    </button>
                  </Tooltip>

                  <Tooltip text={getUIText('recent_catches_desc', selectedLanguage)}>
                    <button
                      onClick={() => appendFilterCombo('&age0-7')}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/60 dark:to-pink-900/60 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/70 dark:hover:to-pink-800/70 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="font-bold text-sm sm:text-base text-purple-800 dark:text-purple-100 mb-1">{getUIText('recent_catches', selectedLanguage)}</div>
                      <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-200">{getUIText('recent_catches_desc', selectedLanguage)}</div>
                    </button>
                  </Tooltip>

                  <Tooltip text={getUIText('evolution_ready_desc', selectedLanguage)}>
                    <button
                      onClick={() => appendFilterCombo('&evolve&!favorite')}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/60 dark:to-pink-900/60 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/70 dark:hover:to-pink-800/70 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="font-bold text-sm sm:text-base text-purple-800 dark:text-purple-100 mb-1">{getUIText('evolution_ready', selectedLanguage)}</div>
                      <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-200">{getUIText('evolution_ready_desc', selectedLanguage)}</div>
                    </button>
                  </Tooltip>

                  <Tooltip text={getUIText('shiny_costume_desc', selectedLanguage)}>
                    <button
                      onClick={() => appendFilterCombo('&shiny&costume')}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/60 dark:to-pink-900/60 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/70 dark:hover:to-pink-800/70 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="font-bold text-sm sm:text-base text-purple-800 dark:text-purple-100 mb-1">{getUIText('shiny_costume', selectedLanguage)}</div>
                      <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-200">{getUIText('shiny_costume_desc', selectedLanguage)}</div>
                    </button>
                  </Tooltip>

                  <Tooltip text={getUIText('legendary_non_shiny_desc', selectedLanguage)}>
                    <button
                      onClick={() => appendFilterCombo('&legendary&!shiny')}
                      className="group relative p-3 sm:p-4 rounded-xl border-2 border-purple-300 dark:border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/60 dark:to-pink-900/60 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-800/70 dark:hover:to-pink-800/70 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                    >
                      <div className="font-bold text-sm sm:text-base text-purple-800 dark:text-purple-100 mb-1">{getUIText('legendary_non_shiny', selectedLanguage)}</div>
                      <div className="text-[10px] sm:text-xs text-purple-600 dark:text-purple-200">{getUIText('legendary_non_shiny_desc', selectedLanguage)}</div>
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
                <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-slate-100">{getUIText('cp_ranges', selectedLanguage)}</h3>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform duration-300 ${showCPRanges ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block dark:text-slate-400">{getUIText('insert_cp_range', selectedLanguage)}</p>
          </div>

          {showCPRanges && (
            <div className="saved-searches-expand">
              <div className="mb-3 p-3 bg-violet-50/80 border border-violet-200 rounded-lg dark:bg-slate-900/60 dark:border-violet-500/30">
                <p className="text-xs text-violet-800 font-semibold mb-1 dark:text-violet-200">ℹ️ {getUIText('pvp_league_cp_caps', selectedLanguage)}</p>
                <p className="text-xs text-violet-700 leading-relaxed dark:text-violet-100">
                  {getUIText('pvp_league_cp_caps_desc', selectedLanguage)}
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                <button
                  onClick={() => insertCPRange('cp0-1500')}
                  className="group relative p-3 sm:p-4 rounded-xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                >
                  <div className="font-bold text-sm sm:text-base text-violet-800 mb-1">{getUIText('great_league', selectedLanguage)}</div>
                  <div className="text-[10px] sm:text-xs text-violet-600 font-mono">{getUIText('great_league_cp', selectedLanguage)}</div>
                </button>

                <button
                  onClick={() => insertCPRange('cp0-2500')}
                  className="group relative p-3 sm:p-4 rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                >
                  <div className="font-bold text-sm sm:text-base text-blue-800 mb-1">{getUIText('ultra_league', selectedLanguage)}</div>
                  <div className="text-[10px] sm:text-xs text-blue-600 font-mono">{getUIText('ultra_league_cp', selectedLanguage)}</div>
                </button>

                <button
                  onClick={() => insertCPRange('cp2500-')}
                  className="group relative p-3 sm:p-4 rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                >
                  <div className="font-bold text-sm sm:text-base text-amber-800 mb-1">{getUIText('master_league', selectedLanguage)}</div>
                  <div className="text-[10px] sm:text-xs text-amber-600 font-mono">{getUIText('master_league_cp', selectedLanguage)}</div>
                </button>

                <button
                  onClick={() => insertCPRange('cp0-500')}
                  className="group relative p-3 sm:p-4 rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                >
                  <div className="font-bold text-sm sm:text-base text-green-800 mb-1">{getUIText('under_500_cp', selectedLanguage)}</div>
                  <div className="text-[10px] sm:text-xs text-green-600 font-mono">{getUIText('under_500_cp_value', selectedLanguage)}</div>
                </button>

                <button
                  onClick={() => insertCPRange('cp3000-')}
                  className="group relative p-3 sm:p-4 rounded-xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                >
                  <div className="font-bold text-sm sm:text-base text-orange-800 mb-1">{getUIText('high_cp', selectedLanguage)}</div>
                  <div className="text-[10px] sm:text-xs text-orange-600 font-mono">{getUIText('high_cp_value', selectedLanguage)}</div>
                </button>

                <button
                  onClick={() => insertCPRange('cp4000-')}
                  className="group relative p-3 sm:p-4 rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation"
                >
                  <div className="font-bold text-sm sm:text-base text-red-800 mb-1">{getUIText('perfect_cp', selectedLanguage)}</div>
                  <div className="text-[10px] sm:text-xs text-red-600 font-mono">{getUIText('perfect_cp_value', selectedLanguage)}</div>
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
                <h3 className="text-base sm:text-lg font-bold text-gray-800">{getUIText('pokemon_selection', selectedLanguage)}</h3>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform duration-300 ${showPokemonSelection ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 hidden sm:block dark:text-slate-400">{getUIText('quick_insert_pokemon', selectedLanguage)}</p>
          </div>

          {showPokemonSelection && (
            <div className="saved-searches-expand">
              {/* Generation Buttons */}
              <div className="mb-4">
                <h4 className="text-xs font-bold text-gray-700 dark:text-slate-200 mb-3 uppercase tracking-wide">{getUIText('generations', selectedLanguage)}</h4>
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
                <h4 className="text-xs font-bold text-gray-700 dark:text-slate-200 mb-3 uppercase tracking-wide">{getUIText('pokemon_groups', selectedLanguage)}</h4>
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
              placeholder={getUIText('filter_search_placeholder', selectedLanguage)}
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
            ).length + (key === 'time' && (customAgeIncluded || customAgeExcluded) ? 1 : 0);
            
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
                        {getUIText(category.nameKey, selectedLanguage)}
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
                                {translateFilterLabel(filter, selectedLanguage)}
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
                                  title={getUIText('include', selectedLanguage)}
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
                                  title={getUIText('exclude', selectedLanguage)}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </Tooltip>
                        );
                      })}
                      {/* Custom Age Input - only show in time category */}
                      {key === 'time' && (
                        <CustomAgeInput
                          value={customAgeValue}
                          isIncluded={customAgeIncluded}
                          isExcluded={customAgeExcluded}
                          onInclude={handleCustomAgeInclude}
                          onExclude={handleCustomAgeExclude}
                          onValueChange={handleCustomAgeValueChange}
                          selectedLanguage={selectedLanguage}
                        />
                      )}
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