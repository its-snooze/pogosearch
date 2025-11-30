import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Search, Copy, X, ChevronDown, AlertTriangle, Check, 
  BarChart3, Zap, Sparkles, TrendingUp, Clock, Ruler, Swords,
  Bookmark, BookmarkCheck, Trash2, Download, Upload, Sun, Moon, Globe, MessageCircle
} from 'lucide-react';
import { translateSearchString, translateTerm, translateToEnglish, getAvailableLanguages, getLocale } from './utils/translation';
import { getUIText } from './translations/uiTranslations';
import CustomAgeInput from './components/CustomAgeInput';
import CustomSpeciesCountInput from './components/CustomSpeciesCountInput';
import { parseSearchString, validateSearchString, buildSearchString as buildSearchStringFromParser } from './utils/searchParser';

// Category metadata with colors and icons - names will be translated in component
const categoryMeta = {
  stats: { 
    nameKey: 'stats_ivs',
    icon: BarChart3, 
    gradient: 'from-blue-500 to-cyan-500',
    chipColor: 'bg-blue-500'
  },
  cpRanges: {
    nameKey: 'cp_ranges',
    icon: TrendingUp,
    gradient: 'from-violet-500 to-purple-500',
    chipColor: 'bg-violet-500'
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
  typeEffectiveness: {
    nameKey: 'type_effectiveness',
    icon: Zap,
    gradient: 'from-yellow-500 to-amber-500',
    chipColor: 'bg-yellow-500'
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
  cpRanges: {
    nameKey: 'cp_ranges',
    filters: [] // Special category - uses custom UI
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
  typeEffectiveness: {
    nameKey: 'type_effectiveness',
    filters: [
      // Strong Against (Counters) - uses > operator
      { id: 'strong_normal', label: 'Strong Against Normal', value: '>normal' },
      { id: 'strong_fire', label: 'Strong Against Fire', value: '>fire' },
      { id: 'strong_water', label: 'Strong Against Water', value: '>water' },
      { id: 'strong_electric', label: 'Strong Against Electric', value: '>electric' },
      { id: 'strong_grass', label: 'Strong Against Grass', value: '>grass' },
      { id: 'strong_ice', label: 'Strong Against Ice', value: '>ice' },
      { id: 'strong_fighting', label: 'Strong Against Fighting', value: '>fighting' },
      { id: 'strong_poison', label: 'Strong Against Poison', value: '>poison' },
      { id: 'strong_ground', label: 'Strong Against Ground', value: '>ground' },
      { id: 'strong_flying', label: 'Strong Against Flying', value: '>flying' },
      { id: 'strong_psychic', label: 'Strong Against Psychic', value: '>psychic' },
      { id: 'strong_bug', label: 'Strong Against Bug', value: '>bug' },
      { id: 'strong_rock', label: 'Strong Against Rock', value: '>rock' },
      { id: 'strong_ghost', label: 'Strong Against Ghost', value: '>ghost' },
      { id: 'strong_dragon', label: 'Strong Against Dragon', value: '>dragon' },
      { id: 'strong_dark', label: 'Strong Against Dark', value: '>dark' },
      { id: 'strong_steel', label: 'Strong Against Steel', value: '>steel' },
      { id: 'strong_fairy', label: 'Strong Against Fairy', value: '>fairy' },

      // Weak To (Vulnerable) - uses < operator
      { id: 'weak_normal', label: 'Weak To Normal', value: '<normal' },
      { id: 'weak_fire', label: 'Weak To Fire', value: '<fire' },
      { id: 'weak_water', label: 'Weak To Water', value: '<water' },
      { id: 'weak_electric', label: 'Weak To Electric', value: '<electric' },
      { id: 'weak_grass', label: 'Weak To Grass', value: '<grass' },
      { id: 'weak_ice', label: 'Weak To Ice', value: '<ice' },
      { id: 'weak_fighting', label: 'Weak To Fighting', value: '<fighting' },
      { id: 'weak_poison', label: 'Weak To Poison', value: '<poison' },
      { id: 'weak_ground', label: 'Weak To Ground', value: '<ground' },
      { id: 'weak_flying', label: 'Weak To Flying', value: '<flying' },
      { id: 'weak_psychic', label: 'Weak To Psychic', value: '<psychic' },
      { id: 'weak_bug', label: 'Weak To Bug', value: '<bug' },
      { id: 'weak_rock', label: 'Weak To Rock', value: '<rock' },
      { id: 'weak_ghost', label: 'Weak To Ghost', value: '<ghost' },
      { id: 'weak_dragon', label: 'Weak To Dragon', value: '<dragon' },
      { id: 'weak_dark', label: 'Weak To Dark', value: '<dark' },
      { id: 'weak_steel', label: 'Weak To Steel', value: '<steel' },
      { id: 'weak_fairy', label: 'Weak To Fairy', value: '<fairy' },
    ]
  },
};

const PokemonGoSearchBuilder = () => {
  const [searchString, setSearchString] = useState('');
  const [filterOperators, setFilterOperators] = useState({});
  // Structure: { 'filterId': 'AND' | 'OR' | 'NOT' | null }
  // null = not selected
  // Example: { '4*': 'AND', 'shiny': 'OR', 'shadow': 'NOT' }
  const [expandedCategories, setExpandedCategories] = useState({
    stats: true,
    types: false,
    special: false,
    evolution: false,
    time: false,
    typeEffectiveness: false,
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
  const [validationResult, setValidationResult] = useState({ 
    valid: true, 
    hasWarnings: false,
    errors: [], 
    warnings: [] 
  });
  const [showValidationTooltip, setShowValidationTooltip] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [showQuickSearches, setShowQuickSearches] = useState(false);
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
  const [customSpeciesCountValue, setCustomSpeciesCountValue] = useState('');
  const [customSpeciesCountIncluded, setCustomSpeciesCountIncluded] = useState(false);
  const [customSpeciesCountExcluded, setCustomSpeciesCountExcluded] = useState(false);
  const [showOperatorHelp, setShowOperatorHelp] = useState(true);
  const [customMinCP, setCustomMinCP] = useState('');
  const [customMaxCP, setCustomMaxCP] = useState('');
  const [customCPOperator, setCustomCPOperator] = useState('AND');
  const [cpRangeError, setCPRangeError] = useState('');
  const [cpRangeValue, setCPRangeValue] = useState('');
  const [cpRangeOperator, setCPRangeOperator] = useState('AND');
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

  // Extract included and excluded filters from filterOperators for conflict checking
  const conflicts = useMemo(() => {
    const included = [];
    const excluded = [];
    Object.entries(filterOperators).forEach(([filterId, operator]) => {
      if (operator === 'AND' || operator === 'OR') {
        included.push(filterId);
      } else if (operator === 'NOT') {
        excluded.push(filterId);
      }
    });
    return getConflicts(included, excluded);
  }, [filterOperators, getConflicts]);

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

  // Helper function to get filter object by ID
  const getFilterObject = useCallback((id) => {
    return Object.values(filterCategories)
      .flatMap(cat => cat.filters)
      .find(f => f.id === id);
  }, []);

  // Validate filter operators based on Pokemon GO search logic
  const validateFilterOperators = useCallback((filterOps, language = 'English') => {
    const errors = [];
    const warnings = [];

    // Group by operator type
    const andFilters = Object.entries(filterOps)
      .filter(([_, op]) => op === 'AND')
      .map(([id]) => id);
    const orFilters = Object.entries(filterOps)
      .filter(([_, op]) => op === 'OR')
      .map(([id]) => id);
    const notFilters = Object.entries(filterOps)
      .filter(([_, op]) => op === 'NOT')
      .map(([id]) => id);

    console.log('Validation check:', { andFilters, orFilters, notFilters }); // DEBUG

    // RULE 1: Same stat with different values using AND
    const attackStats = ['4attack', '3attack', '0attack'];
    const defenseStats = ['4defense', '3defense', '0defense'];
    const hpStats = ['4hp', '3hp', '0hp'];

    const andAttacks = andFilters.filter(id => attackStats.includes(id));
    const andDefenses = andFilters.filter(id => defenseStats.includes(id));
    const andHPs = andFilters.filter(id => hpStats.includes(id));

    if (andAttacks.length > 1) {
      const filtersStr = andAttacks.join(' & ');
      errors.push({
        issue: getUIText('validation_error_multiple_attack_ivs', language).replace('{filters}', filtersStr),
        why: getUIText('validation_error_multiple_attack_ivs_why', language).replace('{filters}', andAttacks.join(' AND ')),
        fix: getUIText('validation_error_multiple_attack_ivs_fix', language).replace('{filters}', andAttacks.join(','))
      });
    }

    if (andDefenses.length > 1) {
      const filtersStr = andDefenses.join(' & ');
      errors.push({
        issue: getUIText('validation_error_multiple_defense_ivs', language).replace('{filters}', filtersStr),
        why: getUIText('validation_error_multiple_defense_ivs_why', language).replace('{filters}', andDefenses.join(' AND ')),
        fix: getUIText('validation_error_multiple_defense_ivs_fix', language).replace('{filters}', andDefenses.join(','))
      });
    }

    if (andHPs.length > 1) {
      const filtersStr = andHPs.join(' & ');
      errors.push({
        issue: getUIText('validation_error_multiple_hp_ivs', language).replace('{filters}', filtersStr),
        why: getUIText('validation_error_multiple_hp_ivs_why', language).replace('{filters}', andHPs.join(' AND ')),
        fix: getUIText('validation_error_multiple_hp_ivs_fix', language).replace('{filters}', andHPs.join(','))
      });
    }

    // RULE 2: Multiple star ratings with AND
    const starRatings = ['4*', '3*', '2*', '1*', '0*'];
    const andStars = andFilters.filter(id => starRatings.includes(id));

    if (andStars.length > 1) {
      const filtersStr = andStars.join(' & ');
      errors.push({
        issue: getUIText('validation_error_multiple_star_ratings', language).replace('{filters}', filtersStr),
        why: getUIText('validation_error_multiple_star_ratings_why', language).replace('{filters}', andStars.join(' AND ')),
        fix: getUIText('validation_error_multiple_star_ratings_fix', language).replace('{filters}', andStars.join(','))
      });
    }

    // RULE 3: Shadow AND Purified (IMPOSSIBLE)
    const hasShadowAnd = andFilters.includes('shadow');
    const hasPurifiedAnd = andFilters.includes('purified');

    if (hasShadowAnd && hasPurifiedAnd) {
      errors.push({
        issue: getUIText('validation_error_shadow_and_purified', language),
        why: getUIText('validation_error_shadow_and_purified_why', language),
        fix: getUIText('validation_error_shadow_and_purified_fix', language)
      });
    }

    // RULE 4: 4★ with non-perfect IVs (IMPOSSIBLE)
    const has4StarAnd = andFilters.includes('4*');

    if (has4StarAnd) {
      const nonPerfectIVs = ['3attack', '0attack', '3defense', '0defense', '3hp', '0hp'];
      const conflicts = andFilters.filter(id => nonPerfectIVs.includes(id));

      if (conflicts.length > 0) {
        const filtersStr = conflicts.join(', ');
        const nonperfectStr = conflicts.map(c => c.includes('3') ? '12-14' : '0').join(' or ');
        errors.push({
          issue: getUIText('validation_error_4star_with_nonperfect', language).replace('{filters}', filtersStr),
          why: getUIText('validation_error_4star_with_nonperfect_why', language).replace('{nonperfect}', nonperfectStr),
          fix: getUIText('validation_error_4star_with_nonperfect_fix', language).replace('{filters}', filtersStr)
        });
      }
    }

    // RULE 5: Perfect stats excluding 4★ (IMPOSSIBLE)
    const hasPerfectAttack = andFilters.includes('4attack');
    const hasPerfectDefense = andFilters.includes('4defense');
    const hasPerfectHP = andFilters.includes('4hp');
    const excludes4Star = notFilters.includes('4*');

    if (hasPerfectAttack && hasPerfectDefense && hasPerfectHP && excludes4Star) {
      errors.push({
        issue: getUIText('validation_error_perfect_stats_exclude_4star', language),
        why: getUIText('validation_error_perfect_stats_exclude_4star_why', language),
        fix: getUIText('validation_error_perfect_stats_exclude_4star_fix', language)
      });
    }

    // RULE 6: 0★ with high IVs (IMPOSSIBLE)
    const has0StarAnd = andFilters.includes('0*');

    if (has0StarAnd) {
      const highIVs = ['4attack', '3attack', '4defense', '3defense', '4hp', '3hp'];
      const conflicts = andFilters.filter(id => highIVs.includes(id));

      if (conflicts.length > 0) {
        const filtersStr = conflicts.join(', ');
        errors.push({
          issue: getUIText('validation_error_0star_with_high_ivs', language).replace('{filters}', filtersStr),
          why: getUIText('validation_error_0star_with_high_ivs_why', language).replace('{filters}', filtersStr),
          fix: getUIText('validation_error_0star_with_high_ivs_fix', language).replace('{filters}', filtersStr)
        });
      }
    }

    // RULE 7: Mega AND Shadow (WARNING - returns zero results)
    const hasMegaAnd = andFilters.includes('mega') || andFilters.includes('megaevolve');

    if (hasMegaAnd && hasShadowAnd) {
      warnings.push({
        issue: `Mega AND Shadow`,
        why: `Currently, Shadow Pokémon cannot Mega Evolve in Pokémon GO.`,
        suggestion: `This search will return zero results. Consider using OR instead if you want either.`
      });
    }

    // RULE 8: 3★ with multiple zero IVs (IMPOSSIBLE)
    const has3StarAnd = andFilters.includes('3*');

    if (has3StarAnd) {
      const zeroIVs = ['0attack', '0defense', '0hp'].filter(id => andFilters.includes(id));

      if (zeroIVs.length >= 2) {
        const filtersStr = zeroIVs.join(', ');
        errors.push({
          issue: getUIText('validation_error_3star_with_zero_ivs', language).replace('{count}', zeroIVs.length).replace('{filters}', filtersStr),
          why: getUIText('validation_error_3star_with_zero_ivs_why', language),
          fix: getUIText('validation_error_3star_with_zero_ivs_fix', language).replace('{filters}', filtersStr)
        });
      }
    }

    // RULE 9: 2★ with multiple zero IVs (IMPOSSIBLE)
    const has2StarAnd = andFilters.includes('2*');

    if (has2StarAnd) {
      const zeroIVs = ['0attack', '0defense', '0hp'].filter(id => andFilters.includes(id));

      if (zeroIVs.length >= 2) {
        const filtersStr = zeroIVs.join(', ');
        errors.push({
          issue: getUIText('validation_error_2star_with_zero_ivs', language).replace('{filters}', filtersStr),
          why: getUIText('validation_error_2star_with_zero_ivs_why', language),
          fix: getUIText('validation_error_2star_with_zero_ivs_fix', language).replace('{filters}', filtersStr)
        });
      }
    }

    // RULE 10: 3★ with all perfect IVs (IMPOSSIBLE)
    const has3StarPerfectIVs = andFilters.includes('3*');

    if (has3StarPerfectIVs) {
      const hasPerfectAttack = andFilters.includes('4attack');
      const hasPerfectDefense = andFilters.includes('4defense');
      const hasPerfectHP = andFilters.includes('4hp');

      if (hasPerfectAttack && hasPerfectDefense && hasPerfectHP) {
        errors.push({
          issue: getUIText('validation_error_3star_with_all_perfect', language),
          why: getUIText('validation_error_3star_with_all_perfect_why', language),
          fix: getUIText('validation_error_3star_with_all_perfect_fix', language)
        });
      }
    }

    console.log('Validation result:', { valid: errors.length === 0, errors, warnings }); // DEBUG

    return {
      valid: errors.length === 0,
      hasWarnings: warnings.length > 0,
      errors,
      warnings
    };
  }, []);

  // Build search string from filter operators
  // Follows Pokemon GO syntax rules:
  // - & (AND) = Must have ALL conditions
  // - , (OR) = Can have ANY condition
  // - ! (NOT) = Exclude condition
  // - Operator precedence: NOT > AND > OR (commas distribute over &)
  const buildSearchString = useCallback((filterOps, customAge, customAgeOp, cpRange, cpRangeOp, speciesCount, speciesCountOp, lang = 'English') => {
    try {
      // Validate BEFORE building
      const validation = validateFilterOperators(filterOps, lang);
      setValidationResult(validation);
      console.log('Validation in buildSearchString:', validation); // DEBUG

      // Group filters by operator type
      const andFilters = [];
      const orFilters = [];
      const notFilters = [];

      // Process each filter with its operator
      Object.entries(filterOps).forEach(([filterId, operator]) => {
        const filter = getFilterObject(filterId);
        if (!filter?.value) return;

        if (operator === 'AND') {
          andFilters.push(filter.value);
        } else if (operator === 'OR') {
          orFilters.push(filter.value);
        } else if (operator === 'NOT') {
          notFilters.push(filter.value);
        }
      });

      // Handle custom age
      if (customAge && customAge.trim()) {
        const ageValue = `age${customAge.trim()}`;
        if (customAgeOp === 'AND') {
          andFilters.push(ageValue);
        } else if (customAgeOp === 'OR') {
          orFilters.push(ageValue);
        } else if (customAgeOp === 'NOT') {
          notFilters.push(ageValue);
        }
      }

      // Handle CP range
      if (cpRange && cpRange.trim()) {
        if (cpRangeOp === 'AND') {
          andFilters.push(cpRange);
        } else if (cpRangeOp === 'OR') {
          orFilters.push(cpRange);
        } else if (cpRangeOp === 'NOT') {
          notFilters.push(cpRange);
        }
      }

      // Handle species count
      if (speciesCount && speciesCount.trim()) {
        if (speciesCountOp === 'AND') {
          andFilters.push(speciesCount);
        } else if (speciesCountOp === 'OR') {
          orFilters.push(speciesCount);
        } else if (speciesCountOp === 'NOT') {
          notFilters.push(speciesCount);
        }
      }

      // Get Pokedex numbers from ref
      const pokedexNumbers = pokedexNumbersRef.current;

      // Build search string following Pokemon GO syntax
      // Structure: [pokedex]&[AND filters]&[OR filters]&[NOT filters]

      const parts = [];

      // 1. Pokedex numbers (if any)
      if (pokedexNumbers && pokedexNumbers.trim()) {
        parts.push(pokedexNumbers.trim());
      }

      // 2. AND filters - join with & between them
      // CRITICAL: Each AND filter must be separated by &
      if (andFilters.length > 0) {
        // Join all AND filters with &
        parts.push(andFilters.join('&'));
      }

      // 3. OR filters - join with , between them  
      // CRITICAL: Each OR filter must be separated by ,
      if (orFilters.length > 0) {
        // If there are both AND and OR filters, wrap OR in proper grouping
        // Example: fire&shiny,legendary becomes fire&(shiny,legendary)
        // But Pokemon GO doesn't support parentheses, so we rely on operator precedence
        // Comma has lower precedence, so fire&shiny,legendary = (fire&shiny),(fire&legendary)
        parts.push(orFilters.join(','));
      }

      // 4. NOT filters - each gets ! prefix, join with &
      // CRITICAL: NOT filters are joined with & (multiple exclusions)
      if (notFilters.length > 0) {
        const notPart = notFilters.map(v => `!${v}`).join('&');
        parts.push(notPart);
      }

      // Join all parts with &
      // CRITICAL: Use & to separate different sections
      let result = parts.filter(p => p && p.trim()).join('&');

      // Translate if needed
      if (lang !== 'English' && result) {
        const translationResult = translateSearchString(result, lang, true);
        setTranslationWarnings(translationResult.warnings || []);
        return translationResult.translated;
      }

      setTranslationWarnings([]);
      return result;

    } catch (error) {
      console.error('Error building search string:', error);
      setValidationResult({ 
        valid: false,
        hasWarnings: false,
        errors: [{ 
          issue: 'Error building search string',
          why: error.message,
          fix: 'Please try again or report this bug.'
        }],
        warnings: []
      });
      return '';
    }
  }, [getFilterObject, validateFilterOperators]);

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
      const customAgeOp = customAgeIncluded ? 'AND' : customAgeExcluded ? 'NOT' : null;
      const speciesCountOp = customSpeciesCountIncluded ? 'AND' : customSpeciesCountExcluded ? 'NOT' : null;
      const newSearchString = buildSearchString(
        filterOperators,
        customAgeValue,
        customAgeOp,
        cpRangeValue,
        cpRangeOperator,
        customSpeciesCountValue,
        speciesCountOp,
        selectedLanguage
      );
      setSearchString(newSearchString);
    }
  }, [filterOperators, customAgeValue, customAgeIncluded, customAgeExcluded, cpRangeValue, cpRangeOperator, customSpeciesCountValue, customSpeciesCountIncluded, customSpeciesCountExcluded, selectedLanguage, isPremadeSearch, buildSearchString]);

  // Run validation on filterOperators change
  useEffect(() => {
    console.log('Running validation with filterOperators:', filterOperators); // DEBUG
    const result = validateFilterOperators(filterOperators, selectedLanguage);
    console.log('Setting validation result:', result); // DEBUG
    setValidationResult(result);
  }, [filterOperators, validateFilterOperators, selectedLanguage]);

  // Validate search string whenever it changes (for syntax errors)
  // Note: This is separate from filterOperators validation which handles logic errors
  // The filterOperators validation takes precedence for UI display
  React.useEffect(() => {
    const validation = validateSearchString(searchString);
    
    // Only update validationResult if there are no filterOperators validation errors
    // This prevents overriding the more comprehensive filterOperators validation
    setValidationResult(prev => {
      // If we already have filterOperators errors, keep them
      if (!prev.valid && prev.errors && prev.errors.length > 0) {
        return prev;
      }
      
      // Otherwise, use search string validation results
      if (!validation.valid && validation.errors && validation.errors.length > 0) {
        const errorMessages = validation.errors.map(err => err.message || err);
        return {
          valid: false,
          hasWarnings: false,
          errors: errorMessages.map(msg => ({ issue: msg, why: msg, fix: 'Check the search string syntax.' })),
          warnings: []
        };
      }
      
      return { 
        valid: validation.valid,
        hasWarnings: false,
        errors: [],
        warnings: []
      };
    });
    
    // Console warning during development
    if (!validation.valid && process.env.NODE_ENV === 'development') {
      const errorMsg = validation.errors && validation.errors.length > 0 
        ? validation.errors.map(e => e.message || e).join('; ')
        : 'Invalid search string';
      console.warn(`Invalid search string: "${searchString}" - ${errorMsg}`);
    }
  }, [searchString, selectedLanguage]);

  const setFilterOperator = (filterId, operator) => {
    setIsPremadeSearch(false);
    setFilterOperators(prev => {
      const current = prev[filterId];
      
      // If clicking same operator, deselect it
      if (current === operator) {
        const newState = { ...prev };
        delete newState[filterId];
        return newState;
      }
      
      // Otherwise, set the new operator
      return {
        ...prev,
        [filterId]: operator
      };
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

  // Custom species count handlers
  const handleCustomSpeciesCountInclude = () => {
    setIsPremadeSearch(false);
    if (customSpeciesCountIncluded) {
      setCustomSpeciesCountIncluded(false);
    } else {
      setCustomSpeciesCountExcluded(false);
      setCustomSpeciesCountIncluded(true);
    }
  };

  const handleCustomSpeciesCountExclude = () => {
    setIsPremadeSearch(false);
    if (customSpeciesCountExcluded) {
      setCustomSpeciesCountExcluded(false);
    } else {
      setCustomSpeciesCountIncluded(false);
      setCustomSpeciesCountExcluded(true);
    }
  };

  const handleCustomSpeciesCountValueChange = (value) => {
    setCustomSpeciesCountValue(value);
    // Clear include/exclude if value is cleared
    if (!value || value.trim() === '') {
      setCustomSpeciesCountIncluded(false);
      setCustomSpeciesCountExcluded(false);
    }
  };

  const removeFilter = (filterId) => {
    setIsPremadeSearch(false);
    setRemovingChip(filterId);
    setTimeout(() => {
      setFilterOperators(prev => {
        const newState = { ...prev };
        delete newState[filterId];
        return newState;
      });
      setRemovingChip(null);
    }, 300);
  };

  const clearAll = () => {
    setFilterOperators({});
    setSearchString('');
    setTranslationWarnings([]);
    setIsPremadeSearch(false);
    setCustomAgeValue('');
    setCustomAgeIncluded(false);
    setCustomAgeExcluded(false);
    setCustomSpeciesCountValue('');
    setCustomSpeciesCountIncluded(false);
    setCustomSpeciesCountExcluded(false);
    setCPRangeValue('');
    setCPRangeOperator('AND');
    pokedexNumbersRef.current = ''; // Clear Pokedex numbers ref
  };

  // Helper function to find filter by value
  const findFilterByValue = useCallback((value) => {
    return Object.values(filterCategories)
      .flatMap(cat => cat.filters)
      .find(f => f.value === value);
  }, []);

  // Parse search string to extract filter operators
  // Handles Pokemon GO syntax: & for AND, , for OR, ! for NOT
  // Also handles translated search strings by converting them to English first
  const parseSearchStringToFilters = useCallback((searchStr) => {
    if (!searchStr || searchStr.trim() === '') {
      setFilterOperators({});
      pokedexNumbersRef.current = '';
      return;
    }

    try {
      // Convert to English if translated
      const englishStr = selectedLanguage !== 'English' 
        ? translateToEnglish(searchStr, selectedLanguage) 
        : searchStr;
      
      // Extract Pokedex numbers
      extractPokedexNumbers(englishStr);
      
      // Parse the search string by analyzing its structure
      // Split by & to get major parts
      const parts = englishStr.split('&').map(p => p.trim()).filter(p => p);
      
      const newOperators = {};
      let customAgeFound = null;
      let customAgeOp = null;
      let cpRangeFound = null;
      let cpRangeOpFound = null;
      let speciesCountFound = null;
      let speciesCountOpFound = null;
      
      parts.forEach(part => {
        // Skip Pokedex numbers (all digits and commas)
        if (/^[\d,]+$/.test(part)) {
          return;
        }
        
        // Check if this part contains commas (OR logic)
        if (part.includes(',')) {
          // This is an OR group - split by comma
          const orValues = part.split(',').map(v => v.trim()).filter(v => v);
          orValues.forEach(value => {
            // Check for NOT prefix
            if (value.startsWith('!')) {
              const cleanValue = value.substring(1);
              // Check if it's CP range
              if (/^cp[\d-]+$/.test(cleanValue)) {
                cpRangeFound = cleanValue;
                cpRangeOpFound = 'NOT';
              } else if (cleanValue.startsWith('age')) {
                // Check if it's custom age
                const ageValue = cleanValue.substring(3);
                customAgeFound = ageValue;
                customAgeOp = 'NOT';
              } else if (cleanValue.startsWith('count') && cleanValue.endsWith('-')) {
                // Check if it's species count
                speciesCountFound = cleanValue;
                speciesCountOpFound = 'NOT';
              } else {
                const filter = findFilterByValue(cleanValue);
                if (filter) {
                  newOperators[filter.id] = 'NOT';
                }
              }
            } else {
              // Check if it's CP range
              if (/^cp[\d-]+$/.test(value)) {
                cpRangeFound = value;
                cpRangeOpFound = 'OR';
              } else if (value.startsWith('age')) {
                // Check if it's custom age
                const ageValue = value.substring(3);
                customAgeFound = ageValue;
                customAgeOp = 'OR';
              } else if (value.startsWith('count') && value.endsWith('-')) {
                // Check if it's species count
                speciesCountFound = value;
                speciesCountOpFound = 'OR';
              } else {
                const filter = findFilterByValue(value);
                if (filter) {
                  newOperators[filter.id] = 'OR';
                }
              }
            }
          });
        } else {
          // This is a single filter or AND group
          // Check for NOT prefix
          if (part.startsWith('!')) {
            const cleanValue = part.substring(1);
            // Check if it's CP range
            if (/^cp[\d-]+$/.test(cleanValue)) {
              cpRangeFound = cleanValue;
              cpRangeOpFound = 'NOT';
            } else if (cleanValue.startsWith('age')) {
              // Check if it's custom age
              const ageValue = cleanValue.substring(3);
              customAgeFound = ageValue;
              customAgeOp = 'NOT';
            } else if (cleanValue.startsWith('count') && cleanValue.endsWith('-')) {
              // Check if it's species count
              speciesCountFound = cleanValue;
              speciesCountOpFound = 'NOT';
            } else {
              const filter = findFilterByValue(cleanValue);
              if (filter) {
                newOperators[filter.id] = 'NOT';
              }
            }
          } else {
            // Check if it's CP range
            if (/^cp[\d-]+$/.test(part)) {
              cpRangeFound = part;
              cpRangeOpFound = 'AND';
            } else if (part.startsWith('age')) {
              // Check if it's custom age
              const ageValue = part.substring(3);
              customAgeFound = ageValue;
              customAgeOp = 'AND';
            } else if (part.startsWith('count') && part.endsWith('-')) {
              // Check if it's species count
              speciesCountFound = part;
              speciesCountOpFound = 'AND';
            } else {
              const filter = findFilterByValue(part);
              if (filter) {
                newOperators[filter.id] = 'AND';
              }
            }
          }
        }
      });
      
      setFilterOperators(newOperators);
      
      // Handle custom age
      if (customAgeFound !== null) {
        setCustomAgeValue(customAgeFound);
        if (customAgeOp === 'AND') {
          setCustomAgeIncluded(true);
          setCustomAgeExcluded(false);
        } else if (customAgeOp === 'OR') {
          setCustomAgeIncluded(true);
          setCustomAgeExcluded(false);
        } else if (customAgeOp === 'NOT') {
          setCustomAgeIncluded(false);
          setCustomAgeExcluded(true);
        }
      } else {
        setCustomAgeValue('');
        setCustomAgeIncluded(false);
        setCustomAgeExcluded(false);
      }

      // Handle species count
      if (speciesCountFound !== null) {
        setCustomSpeciesCountValue(speciesCountFound);
        if (speciesCountOpFound === 'AND') {
          setCustomSpeciesCountIncluded(true);
          setCustomSpeciesCountExcluded(false);
        } else if (speciesCountOpFound === 'OR') {
          setCustomSpeciesCountIncluded(true);
          setCustomSpeciesCountExcluded(false);
        } else if (speciesCountOpFound === 'NOT') {
          setCustomSpeciesCountIncluded(false);
          setCustomSpeciesCountExcluded(true);
        }
      } else {
        setCustomSpeciesCountValue('');
        setCustomSpeciesCountIncluded(false);
        setCustomSpeciesCountExcluded(false);
      }

      // Handle CP range
      if (cpRangeFound !== null) {
        setCPRangeValue(cpRangeFound);
        setCPRangeOperator(cpRangeOpFound || 'AND');
      } else {
        setCPRangeValue('');
        setCPRangeOperator('AND');
      }
    } catch (error) {
      console.error('Error parsing search string:', error);
    }
  }, [selectedLanguage, findFilterByValue, extractPokedexNumbers]);

  const copyToClipboard = async () => {
    // Validate before copying (for console warnings only, UI validation is handled separately)
    const validation = validateSearchString(searchString);
    if (!validation.valid) {
      if (process.env.NODE_ENV === 'development') {
        const errorMsg = validation.errors && validation.errors.length > 0 
          ? validation.errors.map(e => e.message || e).join('; ')
          : 'Invalid search string';
        console.warn(`Copying search string with issues: "${searchString}" - ${errorMsg}`);
      }
      // Don't override filterOperators validation - allow copying even with errors
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
      // Special handling for cpRanges - always show it
      if (key === 'cpRanges') {
        result[key] = category;
        return;
      }
      
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
    
    // If language is English, return original label
    if (language === 'English') {
      return filter.label;
    }
    
    // If filter has a labelKey, use it for translation
    if (filter.labelKey) {
      const translated = getUIText(filter.labelKey, language);
      if (translated && translated !== filter.labelKey) {
        return translated;
      }
      // Fall back to original label if translation not found
      return filter.label;
    }
    
    const filterId = filter.id;
    const filterValue = filter.value || filterId; // Use filter.value if available, fallback to filterId
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
    
    // Handle star ratings (4*, 3*, 2*, 1*, 0*)
    if (filterId.match(/^\d\*$/)) {
      // Star ratings are usually kept as-is in search strings, but try to translate the label
      // The value is like "4*", "3*", etc.
      const translated = translateTerm(filterValue, language, 'search');
      if (translated !== filterValue) {
        return translated;
      }
      // If translation not found, try to translate parts of the label
      const labelMatch = originalLabel.match(/^(\d★)\s*\(([^)]+)\)/);
      if (labelMatch) {
        // Keep the star symbol, try to translate the percentage part
        return originalLabel; // For now, keep original as star ratings are complex
      }
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
      // Try translating the full term first using filter value (e.g., "4attack" -> translated)
      const translated = translateTerm(filterValue, language, 'search');
      if (translated !== filterValue) {
        // If we got a translation, capitalize first letter for display
        return translated.charAt(0).toUpperCase() + translated.slice(1);
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
    
    // General fallback: try to translate the filter value directly
    // This handles any filters that weren't caught by the specific cases above
    const translated = translateTerm(filterValue, language, 'name');
    if (translated !== filterValue) {
      // Capitalize first letter for display
      return translated.charAt(0).toUpperCase() + translated.slice(1);
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
    if (filterId === 'customSpeciesCount') {
      if (!customSpeciesCountValue) return 'Species Count';
      // Remove "count" prefix and trailing dash for display
      if (customSpeciesCountValue.startsWith('count')) {
        const countPart = customSpeciesCountValue.substring(5);
        return countPart.endsWith('-') ? `Have ${countPart.slice(0, -1)}+` : `Have ${countPart}+`;
      }
      return `Have ${customSpeciesCountValue}+`;
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
    
    // Merge with existing filters - default to AND for included, NOT for excluded
    setFilterOperators(prev => {
      const newState = { ...prev };
      newIncluded.forEach(filterId => {
        newState[filterId] = 'AND';
      });
      newExcluded.forEach(filterId => {
        newState[filterId] = 'NOT';
      });
      return newState;
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

  // Generate CP range string from min/max values
  const generateCPRange = (minCP, maxCP) => {
    if (!minCP && !maxCP) return null;
    
    if (minCP && maxCP) {
      return `cp${minCP}-${maxCP}`;
    } else if (minCP) {
      return `cp${minCP}-`;
    } else if (maxCP) {
      return `cp-${maxCP}`;
    }
    return null;
  };

  // Insert or replace CP range in search string with operator support
  const insertCPRange = (cpRange, operator = 'AND') => {
    if (!cpRange) return;
    
    setIsPremadeSearch(false);
    // Set CP range state - this will trigger buildSearchString via useEffect
    setCPRangeValue(cpRange);
    setCPRangeOperator(operator);
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
    
    // ParseSearchStringToFilters now sets filterOperators state directly
    parseSearchStringToFilters(englishString);
    extractPokedexNumbers(englishString);
    
    // If the saved search was in a different language, translate it to current language
    // Otherwise, if it's already in current language, use it as-is
    if (selectedLanguage !== 'English') {
      setTranslatedSearchString(englishString);
    } else {
      setSearchString(englishString);
      setTranslationWarnings([]);
    }
    
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
      
      // ParseSearchStringToFilters now sets filterOperators state directly
      parseSearchStringToFilters(preset.searchString);
      
      // Set the search string (translate if needed)
      setTranslatedSearchString(preset.searchString);
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
          <div className="w-full max-w-full md:max-w-7xl md:mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-3">
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
      
      {/* Header Section - Scrolls normally */}
      <div className="bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm dark:bg-slate-900/90 dark:border-slate-800 dark:shadow-slate-900/40">
        <div className="w-full max-w-full md:max-w-7xl md:mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4">
          {/* Responsive Header */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#0077BE] to-[#00A7E5] bg-clip-text text-transparent w-full">
                {getUIText('app_title', selectedLanguage)}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                {getUIText('app_subtitle', selectedLanguage)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end w-full">
              {/* Ko-fi Button - keep separate so it's not accidentally tapped */}
              <a 
                href="https://ko-fi.com/K3K0ZNM6K" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '6px 12px',
                  backgroundColor: '#72a4f2',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                onMouseLeave={(e) => e.target.style.opacity = '1'}
              >
                ☕ Support
              </a>

              {/* Language + Theme controls grouped on the right */}
              <div className="flex items-center gap-2 ml-auto">
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
          </div>

          {/* Validation Messages - Scroll normally */}
          <div className="mb-4">
            {/* Validation Errors - Red background, show WHY and HOW TO FIX */}
            {!validationResult.valid && validationResult.errors && validationResult.errors.length > 0 && (
              <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border-2 border-red-500">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle size={24} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-bold text-base text-red-800 dark:text-red-200 mb-1">
                      {getUIText('validation_error_title', selectedLanguage)}
                    </h3>
                    <p className="text-xs text-red-700 dark:text-red-300 mb-3">
                      {getUIText('validation_error_subtitle', selectedLanguage)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {validationResult.errors.map((error, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 rounded p-3 border border-red-300 dark:border-red-700">
                      <div className="font-semibold text-sm text-red-900 dark:text-red-100 mb-1">
                        ❌ {error.issue}
                      </div>
                      <div className="text-xs text-red-800 dark:text-red-200 mb-2">
                        <strong>{getUIText('validation_why_label', selectedLanguage)}</strong> {error.why}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                        <strong>{getUIText('validation_fix_label', selectedLanguage)}</strong> {error.fix}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Warnings - Yellow background, helpful tips */}
            {validationResult.valid && validationResult.hasWarnings && validationResult.warnings && validationResult.warnings.length > 0 && (
              <div className="mb-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-500">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                      ℹ️ Heads up
                    </h3>
                    <div className="space-y-2">
                      {validationResult.warnings.map((warning, idx) => (
                        <div key={idx} className="text-xs text-yellow-700 dark:text-yellow-300">
                          <div className="font-medium">{warning.issue}</div>
                          <div>{warning.why}</div>
                          {warning.suggestion && (
                            <div className="mt-1 italic">💡 {warning.suggestion}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Search String Display Bar */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-sm dark:bg-slate-900/90 dark:border-slate-800 dark:shadow-slate-900/40">
        <div className="w-full max-w-full md:max-w-7xl md:mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4">
          <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-xl shadow-lg p-4 sm:p-5 border-2 border-blue-200/50 dark:from-slate-900 dark:to-slate-900/70 dark:border-slate-700 dark:shadow-slate-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-gray-700 dark:text-slate-200">
                  {getUIText('search_string', selectedLanguage)}
                </label>
                {Object.keys(filterOperators).length > 0 && (
                  <span className="px-2 py-0.5 bg-[#0077BE] text-white text-xs font-bold rounded-full">
                    {Object.keys(filterOperators).length} {getUIText('active', selectedLanguage)}
                  </span>
                )}
                {!validationResult.valid && validationResult.errors && validationResult.errors.length > 0 && (
                  <div 
                    className="relative"
                    onMouseEnter={() => setShowValidationTooltip(true)}
                    onMouseLeave={() => setShowValidationTooltip(false)}
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500 cursor-help" />
                    {showValidationTooltip && (
                      <div className="absolute left-0 top-full mt-2 z-50 px-3 py-2 bg-red-50 dark:bg-red-900/80 border-2 border-red-400 dark:border-red-500 rounded-lg shadow-xl max-w-xs">
                        <p className="text-xs font-semibold text-red-800 dark:text-red-200">
                          {validationResult.errors[0]?.issue || 'Validation error'}
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
                    !validationResult.valid && validationResult.errors && validationResult.errors.length > 0
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50/50 dark:bg-red-950/30 dark:border-red-500 dark:focus:ring-red-500/40'
                      : 'border-blue-200 focus:border-[#0077BE] focus:ring-2 focus:ring-blue-200 bg-white dark:bg-slate-900 dark:border-slate-700 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/40'
                  }`}
                />
                {!validationResult.valid && validationResult.errors && validationResult.errors.length > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                )}
              </div>
              <button
                onClick={copyToClipboard}
                disabled={!searchString || searchString.trim() === ''}
                className={`min-h-[48px] sm:min-h-[56px] px-6 sm:px-8 rounded-xl font-bold text-white transition-all duration-200 transform active:scale-95 ${
                  !searchString || searchString.trim() === ''
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-50'
                    : copySuccess 
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
                    <span className="hidden sm:inline">
                      {!validationResult.valid 
                        ? getUIText('copy_has_issues', selectedLanguage)
                        : getUIText('copy', selectedLanguage)
                      }
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Search Button and Conflicts - Scroll normally */}
      <div className="w-full max-w-full md:max-w-7xl md:mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-4">
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

      {/* Main Content */}
      <div className="w-full max-w-full md:max-w-7xl md:mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">

        {/* Active Filter Chips - Compact Display */}
        {(Object.keys(filterOperators).length > 0 || (customAgeValue && (customAgeIncluded || customAgeExcluded)) || (customSpeciesCountValue && (customSpeciesCountIncluded || customSpeciesCountExcluded)) || cpRangeValue) && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-4 mb-6 border border-blue-100 dark:bg-slate-900/70 dark:border-slate-800">
            <div className="flex flex-wrap gap-2">
              {Object.entries(filterOperators).map(([filterId, operator]) => {
                const filter = getFilterObject(filterId);
                if (!filter) return null;

                const symbols = { 'AND': '&', 'OR': ',', 'NOT': '!' };
                const colors = {
                  'AND': isDarkMode 
                    ? 'bg-blue-600 border-blue-500 text-blue-100' 
                    : 'bg-blue-100 border-blue-300 text-blue-800',
                  'OR': isDarkMode 
                    ? 'bg-green-600 border-green-500 text-green-100' 
                    : 'bg-green-100 border-green-300 text-green-800',
                  'NOT': isDarkMode 
                    ? 'bg-red-600 border-red-500 text-red-100' 
                    : 'bg-red-100 border-red-300 text-red-800'
                };

                return (
                  <div
                    key={filterId}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                      border-2 transition-all duration-300
                      ${colors[operator]}
                      ${removingChip === filterId ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
                    `}
                  >
                    <span className="font-mono font-bold text-xs">{symbols[operator]}</span>
                    <span>{translateFilterLabel(filter, selectedLanguage)}</span>
                    <button
                      onClick={() => removeFilter(filterId)}
                      className="hover:scale-110 transition-transform"
                    >
                      <X size={14} />
                    </button>
                  </div>
                );
              })}
              {customAgeValue && (customAgeIncluded || customAgeExcluded) && (
                <div
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                    border-2 transition-all
                    ${customAgeIncluded 
                      ? (isDarkMode ? 'bg-blue-600 border-blue-500 text-blue-100' : 'bg-blue-100 border-blue-300 text-blue-800')
                      : (isDarkMode ? 'bg-red-600 border-red-500 text-red-100' : 'bg-red-100 border-red-300 text-red-800')
                    }
                    ${removingChip === 'customAge' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
                  `}
                >
                  <span className="font-mono font-bold text-xs">
                    {customAgeIncluded ? '&' : '!'}
                  </span>
                  <span>age{customAgeValue}</span>
                  <button
                    onClick={() => {
                      setRemovingChip('customAge');
                      setTimeout(() => {
                        setCustomAgeIncluded(false);
                        setCustomAgeExcluded(false);
                        setCustomAgeValue('');
                        setRemovingChip(null);
                      }, 300);
                    }}
                    className="hover:scale-110 transition-transform"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {customSpeciesCountValue && (customSpeciesCountIncluded || customSpeciesCountExcluded) && (
                <div
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                    border-2 transition-all
                    ${customSpeciesCountIncluded 
                      ? (isDarkMode ? 'bg-blue-600 border-blue-500 text-blue-100' : 'bg-blue-100 border-blue-300 text-blue-800')
                      : (isDarkMode ? 'bg-red-600 border-red-500 text-red-100' : 'bg-red-100 border-red-300 text-red-800')
                    }
                    ${removingChip === 'customSpeciesCount' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
                  `}
                >
                  <span className="font-mono font-bold text-xs">
                    {customSpeciesCountIncluded ? '&' : '!'}
                  </span>
                  <span>{customSpeciesCountValue}</span>
                  <button
                    onClick={() => {
                      setRemovingChip('customSpeciesCount');
                      setTimeout(() => {
                        setCustomSpeciesCountIncluded(false);
                        setCustomSpeciesCountExcluded(false);
                        setCustomSpeciesCountValue('');
                        setRemovingChip(null);
                      }, 300);
                    }}
                    className="hover:scale-110 transition-transform"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              {cpRangeValue && (
                <div
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                    border-2 transition-all
                    ${cpRangeOperator === 'AND'
                      ? (isDarkMode ? 'bg-blue-600 border-blue-500 text-blue-100' : 'bg-blue-100 border-blue-300 text-blue-800')
                      : cpRangeOperator === 'OR'
                      ? (isDarkMode ? 'bg-green-600 border-green-500 text-green-100' : 'bg-green-100 border-green-300 text-green-800')
                      : (isDarkMode ? 'bg-red-600 border-red-500 text-red-100' : 'bg-red-100 border-red-300 text-red-800')
                    }
                    ${removingChip === 'cpRange' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
                  `}
                >
                  <span className="font-mono font-bold text-xs">
                    {cpRangeOperator === 'AND' ? '&' : cpRangeOperator === 'OR' ? ',' : '!'}
                  </span>
                  <span>{cpRangeValue}</span>
                  <button
                    onClick={() => {
                      setRemovingChip('cpRange');
                      setTimeout(() => {
                        setCPRangeValue('');
                        setCPRangeOperator('AND');
                        setRemovingChip(null);
                      }, 300);
                    }}
                    className="hover:scale-110 transition-transform"
                  >
                    <X size={14} />
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

        {/* Operator Help Section */}
        <div className={`
          mb-6 rounded-lg border-2 transition-all
          ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'}
        `}>
          <button
            onClick={() => setShowOperatorHelp(!showOperatorHelp)}
            className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2">
              <Search size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
              <h3 className="font-semibold text-sm text-gray-800 dark:text-slate-100">{getUIText('how_to_use_filter_buttons', selectedLanguage)}</h3>
            </div>
            <ChevronDown 
              size={20} 
              className={`transform transition-transform ${showOperatorHelp ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
            />
          </button>
          
          {showOperatorHelp && (
            <div className="px-4 pb-4">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded bg-blue-500 text-white font-bold min-w-[70px] text-center flex flex-col items-center">
                    <span className="text-xs">{getUIText('operator_and_title', selectedLanguage)}</span>
                    <span className="font-mono text-[10px] opacity-70">{getUIText('operator_and_symbol', selectedLanguage)}</span>
                  </span>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {getUIText('operator_and_description', selectedLanguage)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded bg-green-500 text-white font-bold min-w-[70px] text-center flex flex-col items-center">
                    <span className="text-xs">{getUIText('operator_or_title', selectedLanguage)}</span>
                    <span className="font-mono text-[10px] opacity-70">{getUIText('operator_or_symbol', selectedLanguage)}</span>
                  </span>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {getUIText('operator_or_description', selectedLanguage)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded bg-red-500 text-white font-bold min-w-[70px] text-center flex flex-col items-center">
                    <span className="text-xs">{getUIText('operator_not_title', selectedLanguage)}</span>
                    <span className="font-mono text-[10px] opacity-70">{getUIText('operator_not_symbol', selectedLanguage)}</span>
                  </span>
                  <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {getUIText('operator_not_description', selectedLanguage)}
                  </span>
                </div>
              </div>
              <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-blue-300'}`}>
                <p className={`text-xs italic ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {getUIText('operator_tip', selectedLanguage)}
                </p>
              </div>
              <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-blue-300'}`}>
                <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {getUIText('type_effectiveness_help', selectedLanguage)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Filter Categories - Modern Accordion */}
        <div className="space-y-3 sm:space-y-4">
          {Object.entries(filteredCategories).map(([key, category]) => {
            const meta = categoryMeta[key];
            const Icon = meta.icon;
            const isExpanded = expandedCategories[key];
            const activeCount = category.filters.filter(f => 
              filterOperators[f.id] !== undefined
            ).length + (key === 'time' && (customAgeIncluded || customAgeExcluded) ? 1 : 0) + (key === 'evolution' && (customSpeciesCountIncluded || customSpeciesCountExcluded) ? 1 : 0) + (key === 'cpRanges' && cpRangeValue ? 1 : 0);
            
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
                      <span className="font-bold text-sm sm:text-base truncate flex items-center gap-2">
                        {getUIText(category.nameKey, selectedLanguage)}
                        {key === 'typeEffectiveness' && (
                          <span className="text-[10px] sm:text-xs font-semibold text-red-200 bg-red-700/70 px-2 py-0.5 rounded-full uppercase tracking-wide">
                            Work in Progress – may have issues
                          </span>
                        )}
                      </span>
                      <span className="text-xs sm:text-sm opacity-90">
                        ({key === 'cpRanges' ? '6' : category.filters.length})
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
                  {key === 'cpRanges' ? (
                    <div>
                      <div className="mb-3 p-3 bg-violet-50/80 border border-violet-200 rounded-lg dark:bg-slate-900/60 dark:border-violet-500/30">
                        <p className="text-xs text-violet-800 font-semibold mb-1 dark:text-violet-200">ℹ️ {getUIText('pvp_league_cp_caps', selectedLanguage)}</p>
                        <p className="text-xs text-violet-700 leading-relaxed dark:text-violet-100">
                          {getUIText('pvp_league_cp_caps_desc', selectedLanguage)}
                        </p>
                      </div>

                      {/* Custom CP Range Input */}
                      <div className="mb-4 p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-xl border-2 border-violet-200 dark:border-violet-500/30">
                        <h4 className="text-sm font-bold text-violet-900 dark:text-violet-100 mb-3">Custom CP Range</h4>
                        
                        <div className="flex flex-col sm:flex-row gap-3 mb-3">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-violet-800 dark:text-violet-200 mb-1">Min CP</label>
                            <input
                              type="text"
                              value={customMinCP}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setCustomMinCP(value);
                                setCPRangeError('');
                              }}
                              placeholder="e.g., 1500"
                              className="w-full px-3 py-2 border-2 border-violet-300 dark:border-violet-600 rounded-lg focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/40 focus:outline-none text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-violet-800 dark:text-violet-200 mb-1">Max CP</label>
                            <input
                              type="text"
                              value={customMaxCP}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9]/g, '');
                                setCustomMaxCP(value);
                                setCPRangeError('');
                              }}
                              placeholder="e.g., 1500"
                              className="w-full px-3 py-2 border-2 border-violet-300 dark:border-violet-600 rounded-lg focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:focus:ring-violet-500/40 focus:outline-none text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                          </div>
                        </div>

                        {cpRangeError && (
                          <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                            <p className="text-xs text-red-800 dark:text-red-200">{cpRangeError}</p>
                          </div>
                        )}

                        {/* Operator Buttons */}
                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={() => setCustomCPOperator('AND')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              customCPOperator === 'AND'
                                ? isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                                : isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            AND (&)
                          </button>
                          <button
                            onClick={() => setCustomCPOperator('OR')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              customCPOperator === 'OR'
                                ? isDarkMode ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                                : isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-white text-green-700 border-2 border-green-300 hover:bg-green-50'
                            }`}
                          >
                            OR (,)
                          </button>
                          <button
                            onClick={() => setCustomCPOperator('NOT')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              customCPOperator === 'NOT'
                                ? isDarkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                                : isDarkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-white text-red-700 border-2 border-red-300 hover:bg-red-50'
                            }`}
                          >
                            NOT (!)
                          </button>
                        </div>

                        {/* Add Button */}
                        <button
                          onClick={() => {
                            // Validate inputs
                            if (!customMinCP && !customMaxCP) {
                              setCPRangeError('Please enter at least one CP value');
                              return;
                            }
                            
                            const min = customMinCP ? parseInt(customMinCP, 10) : null;
                            const max = customMaxCP ? parseInt(customMaxCP, 10) : null;
                            
                            if (min !== null && max !== null && min > max) {
                              setCPRangeError('Min CP cannot be greater than Max CP');
                              return;
                            }
                            
                            const cpRange = generateCPRange(customMinCP, customMaxCP);
                            if (cpRange) {
                              insertCPRange(cpRange, customCPOperator);
                              setCustomMinCP('');
                              setCustomMaxCP('');
                              setCPRangeError('');
                            }
                          }}
                          className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white font-semibold rounded-lg transition-colors text-sm"
                        >
                          Add CP Range to Search
                        </button>
                      </div>
                      
                      {/* Preset CP Range Buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        <div className="group relative p-3 sm:p-4 rounded-xl border-2 border-violet-300 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 dark:border-violet-500/30 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation">
                          <div className="font-bold text-sm sm:text-base text-violet-800 dark:text-violet-200 mb-1">{getUIText('great_league', selectedLanguage)}</div>
                          <div className="text-[10px] sm:text-xs text-violet-600 dark:text-violet-300 font-mono mb-2">{getUIText('great_league_cp', selectedLanguage)}</div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp-1500', 'AND');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                            >
                              AND
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp-1500', 'OR');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                            >
                              OR
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp-1500', 'NOT');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                            >
                              NOT
                            </button>
                          </div>
                        </div>

                        <div className="group relative p-3 sm:p-4 rounded-xl border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 dark:border-blue-500/30 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation">
                          <div className="font-bold text-sm sm:text-base text-blue-800 dark:text-blue-200 mb-1">{getUIText('ultra_league', selectedLanguage)}</div>
                          <div className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-300 font-mono mb-2">{getUIText('ultra_league_cp', selectedLanguage)}</div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp-2500', 'AND');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                            >
                              AND
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp-2500', 'OR');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                            >
                              OR
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp-2500', 'NOT');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                            >
                              NOT
                            </button>
                          </div>
                        </div>

                        <div className="group relative p-3 sm:p-4 rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 hover:from-amber-100 hover:to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 dark:border-amber-500/30 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation">
                          <div className="font-bold text-sm sm:text-base text-amber-800 dark:text-amber-200 mb-1">{getUIText('master_league', selectedLanguage)}</div>
                          <div className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-300 font-mono mb-2">{getUIText('master_league_cp', selectedLanguage)}</div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp2500-', 'AND');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                            >
                              AND
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp2500-', 'OR');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                            >
                              OR
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp2500-', 'NOT');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                            >
                              NOT
                            </button>
                          </div>
                        </div>

                        <div className="group relative p-3 sm:p-4 rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 dark:border-green-500/30 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation">
                          <div className="font-bold text-sm sm:text-base text-green-800 dark:text-green-200 mb-1">{getUIText('under_500_cp', selectedLanguage)}</div>
                          <div className="text-[10px] sm:text-xs text-green-600 dark:text-green-300 font-mono mb-2">{getUIText('under_500_cp_value', selectedLanguage)}</div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp-500', 'AND');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                            >
                              AND
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp-500', 'OR');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                            >
                              OR
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp-500', 'NOT');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                            >
                              NOT
                            </button>
                          </div>
                        </div>

                        <div className="group relative p-3 sm:p-4 rounded-xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 dark:from-orange-900/30 dark:to-red-900/30 dark:border-orange-500/30 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation">
                          <div className="font-bold text-sm sm:text-base text-orange-800 dark:text-orange-200 mb-1">{getUIText('high_cp', selectedLanguage)}</div>
                          <div className="text-[10px] sm:text-xs text-orange-600 dark:text-orange-300 font-mono mb-2">{getUIText('high_cp_value', selectedLanguage)}</div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp3000-', 'AND');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                            >
                              AND
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp3000-', 'OR');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                            >
                              OR
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp3000-', 'NOT');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                            >
                              NOT
                            </button>
                          </div>
                        </div>

                        <div className="group relative p-3 sm:p-4 rounded-xl border-2 border-red-300 bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 dark:border-red-500/30 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] text-left touch-manipulation">
                          <div className="font-bold text-sm sm:text-base text-red-800 dark:text-red-200 mb-1">{getUIText('perfect_cp', selectedLanguage)}</div>
                          <div className="text-[10px] sm:text-xs text-red-600 dark:text-red-300 font-mono mb-2">{getUIText('perfect_cp_value', selectedLanguage)}</div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp4000-', 'AND');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                            >
                              AND
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp4000-', 'OR');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                            >
                              OR
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                insertCPRange('cp4000-', 'NOT');
                              }}
                              className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${isDarkMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                            >
                              NOT
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                      {category.filters.map(filter => {
                        const currentOperator = filterOperators[filter.id];
                        const operators = [
                          { key: 'AND', symbol: '&', label: 'AND', description: 'Must have this' },
                          { key: 'OR', symbol: ',', label: 'OR', description: 'Can have this' },
                          { key: 'NOT', symbol: '!', label: 'NOT', description: 'Exclude this' }
                        ];
                        
                        const colors = {
                          'AND': isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600',
                          'OR': isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600',
                          'NOT': isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                        };
                        
                        return (
                          <div
                            key={filter.id}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                          >
                            <span className="flex-1 text-sm font-medium text-gray-800 dark:text-slate-100">
                              {translateFilterLabel(filter, selectedLanguage)}
                            </span>
                            <div className="flex gap-1">
                              {operators.map(op => (
                                <button
                                  key={op.key}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFilterOperator(filter.id, op.key);
                                  }}
                                  className={`
                                    px-2 py-1.5 rounded text-xs font-medium transition-all active:scale-95
                                    flex flex-col items-center gap-0.5 min-w-[50px]
                                    ${currentOperator === op.key 
                                      ? colors[op.key] + ' text-white shadow-md scale-105' 
                                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                    }
                                  `}
                                  title={op.description}
                                >
                                  <span className="font-bold text-xs">{op.label}</span>
                                  <span className="font-mono text-[10px] opacity-70">{op.symbol}</span>
                                </button>
                              ))}
                            </div>
                          </div>
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
                      {/* Custom Species Count Input - only show in evolution category */}
                      {key === 'evolution' && (
                        <CustomSpeciesCountInput
                          value={customSpeciesCountValue}
                          isIncluded={customSpeciesCountIncluded}
                          isExcluded={customSpeciesCountExcluded}
                          onInclude={handleCustomSpeciesCountInclude}
                          onExclude={handleCustomSpeciesCountExclude}
                          onValueChange={handleCustomSpeciesCountValueChange}
                          selectedLanguage={selectedLanguage}
                        />
                      )}
                    </div>
                  )}
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