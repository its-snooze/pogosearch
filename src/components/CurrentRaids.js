import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';
import {
  fetchRaids,
  groupRaidsByTier,
  getCachedRaids,
  setCachedRaids,
  getCountersString
} from '../utils/scrapedDuckAPI';

const tierConfig = {
  5: { name: '5-Star Raids', icon: '💎', color: 'from-purple-400 to-purple-600' },
  mega: { name: 'Mega Raids', icon: '⚡', color: 'from-pink-400 to-pink-600' },
  3: { name: '3-Star Raids', icon: '⭐', color: 'from-blue-400 to-blue-600' },
  1: { name: '1-Star Raids', icon: '🥚', color: 'from-green-400 to-green-600' }
};

const CurrentRaids = () => {
  const [raids, setRaids] = useState({ 1: [], 3: [], 5: [], mega: [] });
  const [loading, setLoading] = useState(true);
  const [copiedBoss, setCopiedBoss] = useState(null);

  /**
   * Loads raid data from cache or API
   */
  const loadRaids = async (forceRefresh = false) => {
    if (forceRefresh) {
      setLoading(true);
      // Clear cache to force fresh fetch
      localStorage.removeItem('pogosearch_raids_cache');
    }

    try {
      // Try cache first (unless forcing refresh)
      if (!forceRefresh) {
        const cached = getCachedRaids();
        if (cached) {
          const grouped = groupRaidsByTier(cached);
          setRaids(grouped);
          setLoading(false);
        }
      }

      // Always fetch fresh data in background (or immediately if no cache)
      const freshRaids = await fetchRaids();
      const grouped = groupRaidsByTier(freshRaids);
      setRaids(grouped);
      setLoading(false);
    } catch (error) {
      console.error('Error loading raids:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRaids();
  }, []);

  /**
   * Handles copying counters to clipboard
   */
  const handleCopyCounters = async (bossName) => {
    const countersString = getCountersString(bossName);
    
    try {
      await navigator.clipboard.writeText(countersString);
      setCopiedBoss(bossName);
      setTimeout(() => setCopiedBoss(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy. Please enable clipboard access.');
    }
  };

  const tierOrder = [5, 'mega', 3, 1];

  return (
    <div className="p-6">
      {/* Header with title and refresh button */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Current Raid Bosses</h1>
        <p className="text-gray-400 mb-1">
          Click 'Copy Counters' to get the best counters for each boss
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Data auto-updates from LeekDuck via ScrapedDuck
        </p>
        <button
          onClick={() => loadRaids(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          Loading current raids...
        </div>
      ) : (
        <>
          {tierOrder.map(tier => {
            const tierRaids = raids[tier] || [];
            
            if (tierRaids.length === 0) return null;

            const config = tierConfig[tier];

            return (
              <div key={tier} className="mb-8">
                {/* Tier Header */}
                <div className={`bg-gradient-to-r ${config.color} rounded-lg p-4 mb-4`}>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>{config.icon}</span>
                    {config.name}
                    <span className="text-sm font-normal">({tierRaids.length})</span>
                  </h2>
                </div>
                
                {/* Raid Boss Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {tierRaids.map((raid, index) => (
                    <div
                      key={`${raid.name}-${index}`}
                      className="bg-gray-800 rounded-xl border-2 border-gray-700 p-4 hover:border-blue-500 hover:shadow-lg transition-all"
                    >
                      {/* Boss Image Container */}
                      <div className="relative mb-3">
                        <img 
                          src={raid.image} 
                          alt={raid.name}
                          className="w-32 h-32 mx-auto object-contain"
                        />
                        {raid.canBeShiny && (
                          <div className="absolute top-0 right-0 bg-yellow-400 rounded-full w-8 h-8 flex items-center justify-center text-lg">
                            ✨
                          </div>
                        )}
                      </div>

                      {/* Boss Name */}
                      <h3 className="text-xl font-bold text-white text-center mb-2">
                        {raid.name}
                      </h3>

                      {/* Type Badges */}
                      {raid.types && raid.types.length > 0 && (
                        <div className="flex justify-center gap-2 mb-3">
                          {raid.types.map((type, i) => (
                            <img
                              key={i}
                              src={type.image}
                              alt={type.name}
                              title={type.name}
                              className="w-8 h-8"
                            />
                          ))}
                        </div>
                      )}

                      {/* CP Info */}
                      {raid.combatPower && raid.combatPower.normal && (
                        <div className="text-center mb-2">
                          <div className="text-gray-300 font-medium">
                            CP {raid.combatPower.normal.min} - {raid.combatPower.normal.max}
                          </div>
                          {raid.combatPower.boosted && raid.combatPower.boosted.max > 0 && (
                            <div className="text-orange-400 text-sm">
                              ☀️ {raid.combatPower.boosted.min} - {raid.combatPower.boosted.max}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Weather Boosts */}
                      {raid.boostedWeather && raid.boostedWeather.length > 0 && (
                        <div className="flex justify-center gap-1 mb-3">
                          {raid.boostedWeather.map((weather, i) => (
                            <img
                              key={i}
                              src={weather.image}
                              alt={weather.name}
                              title={weather.name}
                              className="w-6 h-6"
                            />
                          ))}
                        </div>
                      )}

                      {/* Copy Counters Button */}
                      <button
                        onClick={() => handleCopyCounters(raid.name)}
                        className="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors font-medium"
                      >
                        {copiedBoss === raid.name ? (
                          <>
                            <Check size={16} />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            Copy Counters
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* No Raids Message */}
          {tierOrder.every(tier => (raids[tier] || []).length === 0) && (
            <div className="text-center py-12 text-gray-400">
              No current raids available at this time.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CurrentRaids;
