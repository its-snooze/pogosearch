import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';
import {
  fetchEvents,
  fetchRaids,
  filterActiveEvents,
  filterUpcomingEvents,
  groupRaidsByTier,
  getCachedData,
  setCachedData,
  CACHE_KEYS
} from '../utils/scrapedDuckAPI';

const tierNames = {
  1: '1-Star Raids',
  3: '3-Star Raids',
  5: '5-Star Raids',
  6: 'Mega Raids'
};

/**
 * Formats a date string to a nice format like "Jan 9, 2:00 PM"
 */
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const options = {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    return dateString;
  }
}

/**
 * Formats a date range string
 */
function formatDateRange(start, end) {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return `${start} - ${end}`;
    }
    
    // If same day, show: "Jan 9, 2:00 PM - 5:00 PM"
    if (startDate.toDateString() === endDate.toDateString()) {
      const dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const startTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const endTime = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return `${dateStr}, ${startTime} - ${endTime}`;
    }
    
    // Different days: "Jan 9, 2:00 PM - Jan 10, 5:00 PM"
    return `${formatDate(start)} - ${formatDate(end)}`;
  } catch (error) {
    return `${start} - ${end}`;
  }
}

const CurrentEvents = () => {
  const [events, setEvents] = useState({ active: [], upcoming: [] });
  const [raids, setRaids] = useState({});
  const [loading, setLoading] = useState(true);
  const [copiedBoss, setCopiedBoss] = useState(null);

  /**
   * Loads data from cache or API
   */
  const loadData = async (forceRefresh = false) => {
    if (forceRefresh) {
      setLoading(true);
      // Clear cache to force fresh fetch
      localStorage.removeItem(CACHE_KEYS.EVENTS);
      localStorage.removeItem(CACHE_KEYS.RAIDS);
    }

    try {
      // Try loading from cache first (unless forcing refresh)
      let cachedEvents = null;
      let cachedRaids = null;

      if (!forceRefresh) {
        cachedEvents = getCachedData(CACHE_KEYS.EVENTS);
        cachedRaids = getCachedData(CACHE_KEYS.RAIDS);
      }

      // If we have cached data, use it immediately
      if (cachedEvents && cachedRaids) {
        const activeEvents = filterActiveEvents(cachedEvents);
        const upcomingEvents = filterUpcomingEvents(cachedEvents);
        const groupedRaids = groupRaidsByTier(cachedRaids);

        setEvents({ active: activeEvents, upcoming: upcomingEvents });
        setRaids(groupedRaids);
        setLoading(false);
      }

      // Always fetch fresh data in background (or immediately if no cache)
      const [freshEvents, freshRaids] = await Promise.all([
        fetchEvents(),
        fetchRaids()
      ]);

      // Process fetched data
      const activeEvents = filterActiveEvents(freshEvents);
      const upcomingEvents = filterUpcomingEvents(freshEvents);
      const groupedRaids = groupRaidsByTier(freshRaids);

      setEvents({ active: activeEvents, upcoming: upcomingEvents });
      setRaids(groupedRaids);
      setLoading(false);
    } catch (error) {
      console.error('Error loading events and raids:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Handles copying boss name to clipboard
   */
  const handleCopyBoss = async (bossName) => {
    try {
      await navigator.clipboard.writeText(bossName);
      setCopiedBoss(bossName);
      setTimeout(() => {
        setCopiedBoss(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  /**
   * Renders a raid boss card
   */
  const renderRaidBossCard = (boss) => {
    const isCopied = copiedBoss === boss.name;

    return (
      <div
        key={boss.name}
        onClick={() => handleCopyBoss(boss.name)}
        className="relative bg-white border-2 border-gray-200 rounded-xl p-4 cursor-pointer transition-all hover:border-blue-500 hover:-translate-y-1 hover:shadow-lg dark:bg-slate-800 dark:border-slate-700 dark:hover:border-blue-400"
      >
        {/* Copied overlay */}
        {isCopied && (
          <div className="absolute inset-0 bg-green-500/90 rounded-xl flex items-center justify-center z-10 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <Check className="w-5 h-5" />
              <span>Copied!</span>
            </div>
          </div>
        )}

        {/* Boss image */}
        <div className="flex justify-center mb-3">
          <img
            src={boss.image}
            alt={boss.name}
            className="w-24 h-24 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Shiny badge */}
        {boss.canBeShiny && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 rounded-full px-2 py-1 text-xs font-bold flex items-center gap-1">
            <span>✨</span>
            <span>Shiny</span>
          </div>
        )}

        {/* Boss name */}
        <h3 className="text-lg font-bold text-center mb-2 text-gray-800 dark:text-slate-100">
          {boss.name}
        </h3>

        {/* Type icons */}
        {boss.types && boss.types.length > 0 && (
          <div className="flex justify-center gap-1 mb-2">
            {boss.types.map((type, idx) => (
              <img
                key={idx}
                src={type.image}
                alt={type.name}
                className="w-6 h-6"
                title={type.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ))}
          </div>
        )}

        {/* CP range */}
        {boss.combatPower && (
          <div className="space-y-1 text-sm">
            <div className="text-gray-700 dark:text-slate-300 text-center">
              <span className="font-semibold">
                {boss.combatPower.normal?.min || '?'} - {boss.combatPower.normal?.max || '?'} CP
              </span>
            </div>
            {boss.combatPower.boosted && (
              <div className="text-gray-600 dark:text-slate-400 text-center flex items-center justify-center gap-1">
                <span>☀️</span>
                <span>
                  {boss.combatPower.boosted.min} - {boss.combatPower.boosted.max} CP
                </span>
              </div>
            )}
          </div>
        )}

        {/* Weather icons */}
        {boss.boostedWeather && boss.boostedWeather.length > 0 && (
          <div className="mt-2 flex justify-center gap-1 flex-wrap">
            {boss.boostedWeather.map((weather, idx) => (
              <img
                key={idx}
                src={weather.image}
                alt={weather.name}
                className="w-5 h-5"
                title={weather.name}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ))}
          </div>
        )}

        {/* Copy hint */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-700 flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-slate-400">
          <Copy className="w-3 h-3" />
          <span>Click to copy name</span>
        </div>
      </div>
    );
  };

  /**
   * Renders an event card
   */
  const renderEventCard = (event, isUpcoming = false) => {
    return (
      <div
        key={event.eventID}
        className={`bg-white border-2 rounded-xl p-4 transition-all hover:shadow-lg dark:bg-slate-800 ${
          isUpcoming
            ? 'border-yellow-300 hover:border-yellow-400 dark:border-yellow-600 dark:hover:border-yellow-500'
            : 'border-gray-200 hover:border-blue-500 dark:border-slate-700 dark:hover:border-blue-400'
        }`}
      >
        {/* Event image */}
        {event.image && (
          <div className="flex justify-center mb-3">
            <img
              src={event.image}
              alt={event.name}
              className="w-full h-32 object-cover rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Event type badge */}
        {event.eventType && (
          <div className="mb-2">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-200">
              {event.eventType}
            </span>
          </div>
        )}

        {/* Event name */}
        <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-slate-100">
          {event.name}
        </h3>

        {/* Event heading */}
        {event.heading && (
          <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">
            {event.heading}
          </p>
        )}

        {/* Date range */}
        {event.start && event.end && (
          <div className="text-sm text-gray-700 dark:text-slate-300 mb-3">
            {formatDateRange(event.start, event.end)}
          </div>
        )}

        {/* Link to LeekDuck */}
        {event.link && (
          <a
            href={event.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium dark:text-blue-400 dark:hover:text-blue-300"
          >
            <span>View on LeekDuck</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
            Current Events & Raids
          </h1>
          <button
            onClick={() => loadData(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Data from LeekDuck via ScrapedDuck
        </p>
      </div>

      {loading && events.active.length === 0 && events.upcoming.length === 0 && Object.keys(raids).length === 0 ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-slate-400">Loading events and raids...</p>
        </div>
      ) : (
        <>
          {/* Raids Section */}
          {Object.keys(raids).length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-slate-100">
                Current Raid Bosses
              </h2>
              {/* Render tiers in order: 5, 6 (Mega), 3, 1 */}
              {[5, 6, 3, 1].map((tier) => {
                if (!raids[tier] || raids[tier].length === 0) {
                  return null;
                }
                return (
                  <div key={tier} className="mb-8">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-slate-200">
                      {tierNames[tier]}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {raids[tier].map((boss) => renderRaidBossCard(boss))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Active Events Section */}
          {events.active.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-slate-100">
                Active Events
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.active.map((event) => renderEventCard(event, false))}
              </div>
            </div>
          )}

          {/* Upcoming Events Section */}
          {events.upcoming.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-slate-100">
                Upcoming Events
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.upcoming.map((event) => renderEventCard(event, true))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {events.active.length === 0 && events.upcoming.length === 0 && Object.keys(raids).length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-slate-400">
                No current events or raids available at this time.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CurrentEvents;
