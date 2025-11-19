import React, { useState, useMemo } from 'react';
import { 
  Search, Copy, X, ChevronDown, AlertTriangle, Check, 
  BarChart3, Zap, Sparkles, TrendingUp, Clock, Ruler, Swords
} from 'lucide-react';

const PokemonGoSearchBuilder = () => {
  const [searchString, setSearchString] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
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

  // Check for conflicts
  const getConflicts = (filters) => {
    const conflicts = [];
    filters.forEach(filter => {
      const filterDef = Object.values(filterCategories)
        .flatMap(cat => cat.filters)
        .find(f => f.id === filter);
      
      if (filterDef?.conflicts) {
        filterDef.conflicts.forEach(conflictId => {
          if (filters.includes(conflictId)) {
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
  };

  const conflicts = useMemo(() => getConflicts(activeFilters), [activeFilters]);

  // Build search string from active filters
  const buildSearchString = (filters) => {
    if (filters.length === 0) return '';
    
    const filterValues = filters.map(id => {
      const filter = Object.values(filterCategories)
        .flatMap(cat => cat.filters)
        .find(f => f.id === id);
      return filter?.value || '';
    });
    
    return filterValues.join('&');
  };

  // Update search string when filters change (but not if it's a premade search)
  React.useEffect(() => {
    if (!isPremadeSearch) {
      if (activeFilters.length > 0) {
        setSearchString(buildSearchString(activeFilters));
      } else {
        setSearchString('');
      }
    }
  }, [activeFilters, isPremadeSearch]);

  const toggleFilter = (filterId) => {
    setIsPremadeSearch(false); // Reset premade search flag when manually changing filters
    setActiveFilters(prev => {
      if (prev.includes(filterId)) {
        return prev.filter(id => id !== filterId);
      } else {
        return [...prev, filterId];
      }
    });
  };

  const removeFilter = (filterId) => {
    setIsPremadeSearch(false); // Reset premade search flag when removing filters
    setRemovingChip(filterId);
    setTimeout(() => {
      setActiveFilters(prev => prev.filter(id => id !== filterId));
      setRemovingChip(null);
    }, 300);
  };

  const clearAll = () => {
    setActiveFilters([]);
    setSearchString('');
    setIsPremadeSearch(false);
  };

  // Parse search string to extract filter IDs
  const parseSearchStringToFilters = (searchStr) => {
    const filterIds = [];
    // Split by & to get filter parts
    const parts = searchStr.split('&');
    
    // Skip the first part (Pokemon numbers), process the rest
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i].trim();
      // Handle comma-separated filters like "shadow,mega,primal"
      const filters = part.split(',').map(f => f.trim());
      
      filters.forEach(filterValue => {
        // Find the filter ID that matches this value
        const filter = Object.values(filterCategories)
          .flatMap(cat => cat.filters)
          .find(f => f.value === filterValue);
        
        if (filter) {
          filterIds.push(filter.id);
        }
      });
    }
    
    return filterIds;
  };

  const copyToClipboard = async () => {
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
    sTier: {
      label: 'S-Tier Raid Attackers',
      description: 'Top priorities - apex of power',
      searchString: '646,373,409,464,484,150,485,383,483,382,384,448,94,719,6,257,890,800,888,889&shadow,mega,primal'
    },
    aPlusTier: {
      label: 'A+ Tier Raid Attackers',
      description: 'Stand at or near the top of their types',
      searchString: '644,796,639,697,248,260,486,243,146,376,473,462,68,382,635,250,526,94,282,445,530,466,149,555,534,609,257,464,643,894,384,484,254,310,381,142,359,460,448,645,798&shadow,mega'
    },
    aTier: {
      label: 'A-Tier Raid Attackers',
      description: 'Gold-standard Pokemon worthy of investment',
      searchString: '717,637,892,248,642,492,145,461,738,398,254,381,430,297,487,244,500,142,359,373,895,409,484,150,376,3,18,380,229,214,362,354,181,65,473,792,382,647,635,720,485,383,445,905,483,491,534,609,806,998&shadow,mega'
    }
  };

  const applyPremadeSearch = (searchKey) => {
    const preset = premadeSearches[searchKey];
    if (preset) {
      // Parse the search string to extract filter tags
      const extractedFilters = parseSearchStringToFilters(preset.searchString);
      
      // Set the search string and filters
      setSearchString(preset.searchString);
      setActiveFilters(extractedFilters);
      setIsPremadeSearch(true);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-4 md:p-6 lg:p-8">
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
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Search String
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={searchString}
              onChange={(e) => {
                setSearchString(e.target.value);
                setIsPremadeSearch(false); // Reset premade search flag when manually editing
              }}
              placeholder="Your search string will appear here..."
              className="flex-[0.7] min-h-[50px] px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-sm md:text-base transition-colors"
            />
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
        {activeFilters.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-5 md:p-6 mb-6 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Active Filters ({activeFilters.length})
            </label>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map(filterId => {
                const isRemoving = removingChip === filterId;
                return (
                  <div
                    key={filterId}
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full font-medium transition-all duration-300 ${
                      isRemoving ? 'chip-fade-out' : 'chip-fade-in'
                    }`}
                  >
                    <span className="text-sm whitespace-nowrap">{getChipLabel(filterId)}</span>
                    <button
                      onClick={() => removeFilter(filterId)}
                      className="hover:bg-blue-600 rounded-full p-0.5 transition-colors"
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
          <div className="mb-3">
            <h3 className="text-base font-bold text-gray-800 mb-3">Raid Tiers</h3>
            <p className="text-sm text-gray-600 mb-4">
              Quick access to Pokemon GO Hub's raid tier rankings
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => applyPremadeSearch('sTier')}
              className="group relative p-4 rounded-lg border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 transition-all duration-200 hover:shadow-md text-left"
            >
              <div className="font-bold text-lg text-yellow-800 mb-1">
                {premadeSearches.sTier.label}
              </div>
              <div className="text-xs text-yellow-700">
                {premadeSearches.sTier.description}
              </div>
            </button>
            <button
              onClick={() => applyPremadeSearch('aPlusTier')}
              className="group relative p-4 rounded-lg border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all duration-200 hover:shadow-md text-left"
            >
              <div className="font-bold text-lg text-blue-800 mb-1">
                {premadeSearches.aPlusTier.label}
              </div>
              <div className="text-xs text-blue-700">
                {premadeSearches.aPlusTier.description}
              </div>
            </button>
            <button
              onClick={() => applyPremadeSearch('aTier')}
              className="group relative p-4 rounded-lg border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 hover:shadow-md text-left"
            >
              <div className="font-bold text-lg text-green-800 mb-1">
                {premadeSearches.aTier.label}
              </div>
              <div className="text-xs text-green-700">
                {premadeSearches.aTier.description}
              </div>
            </button>
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
                        const isActive = activeFilters.includes(filter.id);
                        const hasTooltip = filterTooltips[filter.id];
                        
                        return (
                          <Tooltip key={filter.id} filterId={filter.id}>
                            <label
                              className={`flex items-center gap-3 p-3 min-h-[48px] rounded-lg cursor-pointer transition-all duration-200 border ${
                                isActive 
                                  ? 'bg-blue-50 border-blue-400' 
                                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isActive}
                                onChange={() => toggleFilter(filter.id)}
                                className="custom-checkbox"
                              />
                              <span className={`text-sm font-medium flex-1 ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>
                                {filter.label}
                              </span>
                            </label>
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