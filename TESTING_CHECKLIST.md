# Testing Checklist for Events & Raids Feature

## Prerequisites
- Dev server running: `npm start`
- Browser DevTools open (F12)
- Console tab visible

---

## 1. Basic Functionality

### ✅ Navigation
- [ ] Click the "Events & Raids" tab
- [ ] Tab should highlight in blue
- [ ] "Search Builder" tab should be unselected (gray)
- [ ] Click "Search Builder" tab - should switch back
- [ ] Click "Events & Raids" tab again - should switch back

### ✅ Initial Load
- [ ] Loading spinner should appear briefly
- [ ] Data should load and display
- [ ] No console errors

---

## 2. Raid Bosses

### ✅ Tier Grouping
- [ ] Check that raid bosses are grouped by tier
- [ ] Look for "5-Star Raids" section
- [ ] Look for "Mega Raids" section  
- [ ] Look for "3-Star Raids" section
- [ ] Look for "1-Star Raids" section
- [ ] Tiers should appear in order: 5-Star, Mega, 3-Star, 1-Star
- [ ] Tiers with no bosses should not appear

### ✅ Raid Boss Cards
- [ ] Each boss card should display:
  - [ ] Boss image (Pokemon sprite)
  - [ ] Boss name (centered, bold)
  - [ ] Shiny badge (✨) if `canBeShiny` is true
  - [ ] Type icons (from `boss.types` array)
  - [ ] CP range: `{min} - {max} CP`
  - [ ] Boosted CP if available: `☀️ {min} - {max} CP`
  - [ ] Weather boost icons (from `boss.boostedWeather` array)
  - [ ] "Click to copy name" hint at bottom

### ✅ Card Styling
- [ ] Cards should have white background with gray border
- [ ] Hover effect: border turns blue, card lifts slightly
- [ ] Cards should be in a responsive grid
- [ ] Dark mode should work (if enabled)

---

## 3. Click to Copy

### ✅ Copy Functionality
- [ ] Click any raid boss card
- [ ] "Copied!" overlay should appear (green background)
- [ ] Overlay should show checkmark icon and "Copied!" text
- [ ] Overlay should disappear after 2 seconds
- [ ] Paste somewhere (Ctrl+V or Cmd+V) to verify boss name was copied
- [ ] Copied text should match the boss name exactly

### ✅ Copy State
- [ ] Only one boss should show "Copied!" at a time
- [ ] Clicking another boss should show "Copied!" on that boss
- [ ] Previous boss should no longer show "Copied!"

---

## 4. Events

### ✅ Active Events Section
- [ ] Section should only appear if `events.active.length > 0`
- [ ] Section title: "Active Events"
- [ ] Each event card should display:
  - [ ] Event image (if available)
  - [ ] Event type badge (colored badge)
  - [ ] Event name (bold, large)
  - [ ] Event heading/description (if available)
  - [ ] Date range (formatted nicely)
  - [ ] "View on LeekDuck" link with external link icon

### ✅ Upcoming Events Section
- [ ] Section should only appear if `events.upcoming.length > 0`
- [ ] Section title: "Upcoming Events"
- [ ] Event cards should have yellow border (different from active)
- [ ] Same card content as active events
- [ ] Events should be within next 7 days

### ✅ Date Formatting
- [ ] Dates should format like: "Jan 9, 2:00 PM"
- [ ] Same-day ranges: "Jan 9, 2:00 PM - 5:00 PM"
- [ ] Multi-day ranges: "Jan 9, 2:00 PM - Jan 10, 5:00 PM"
- [ ] Dates should be readable and properly formatted

### ✅ Event Links
- [ ] Click "View on LeekDuck" link
- [ ] Should open in new tab (target="_blank")
- [ ] Should have `rel="noopener noreferrer"`
- [ ] Link should work correctly

---

## 5. Caching

### ✅ LocalStorage
- [ ] Open DevTools > Application > Local Storage
- [ ] Should see `pogosearch_events_cache`
- [ ] Should see `pogosearch_raids_cache`
- [ ] Cache entries should have structure: `{ data: [...], timestamp: number }`

### ✅ Cache Behavior
- [ ] Reload the page
- [ ] Data should load instantly from cache (no loading spinner if cache is fresh)
- [ ] Wait 5+ minutes
- [ ] Reload the page
- [ ] Should fetch fresh data (may show brief loading spinner)
- [ ] New data should be cached

### ✅ Cache Expiration
- [ ] Check cache timestamp in localStorage
- [ ] Cache should expire after 5 minutes
- [ ] Expired cache should be removed automatically

---

## 6. Refresh Button

### ✅ Refresh Functionality
- [ ] Click the refresh button (top right, with RefreshCw icon)
- [ ] Button should show loading spinner (icon spins)
- [ ] Data should reload
- [ ] Loading state should show briefly
- [ ] Fresh data should appear
- [ ] Cache should be updated

### ✅ Refresh State
- [ ] Button should be disabled while loading
- [ ] Button should re-enable after loading completes

---

## 7. Mobile/Responsive

### ✅ Responsive Layout
- [ ] Resize browser to mobile size (375px width)
- [ ] Cards should stack in single column
- [ ] Navigation tabs should be visible and clickable
- [ ] Text should be readable
- [ ] Images should scale properly

### ✅ Touch Interactions
- [ ] Tap raid boss card on mobile
- [ ] Should trigger copy functionality
- [ ] "Copied!" overlay should appear
- [ ] Touch targets should be large enough (48px minimum)

### ✅ Tablet Size
- [ ] Resize to tablet size (768px width)
- [ ] Cards should be in 2-3 columns
- [ ] Layout should be optimized

---

## 8. Console Checks

### ✅ No Errors
- [ ] Open browser console (F12)
- [ ] Should be no red errors
- [ ] Should be no warnings (yellow) related to our code

### ✅ API Calls
- [ ] Check Network tab
- [ ] Should see requests to:
  - `https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.min.json`
  - `https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/raids.min.json`
- [ ] API calls should succeed (200 status)
- [ ] Responses should be JSON arrays

### ✅ Console Logs
- [ ] Check for any unexpected console.log statements
- [ ] Error messages should be helpful if API fails

---

## 9. Edge Cases

### ✅ Empty States
- [ ] If no active events, section should not appear
- [ ] If no upcoming events, section should not appear
- [ ] If no raids, section should not appear
- [ ] If all empty, should show: "No current events or raids available at this time."

### ✅ Missing Data
- [ ] If event image fails to load, should handle gracefully
- [ ] If type icon fails to load, should handle gracefully
- [ ] If weather icon fails to load, should handle gracefully
- [ ] Missing dates should not break formatting

### ✅ Network Errors
- [ ] Disable network (DevTools > Network > Offline)
- [ ] Reload page
- [ ] Should show empty state or cached data
- [ ] Should not crash
- [ ] Re-enable network
- [ ] Click refresh
- [ ] Should fetch data successfully

---

## 10. Integration

### ✅ Tab Switching
- [ ] Switch to "Events & Raids" tab
- [ ] Data should load
- [ ] Switch to "Search Builder" tab
- [ ] Original search builder should work
- [ ] Switch back to "Events & Raids"
- [ ] Data should still be there (from cache)

### ✅ Theme/Dark Mode
- [ ] Toggle dark mode (if available)
- [ ] Events & Raids page should respect dark mode
- [ ] Cards should have dark backgrounds
- [ ] Text should be readable
- [ ] Borders should be visible

---

## Notes

- If any test fails, note the issue and browser/OS
- Check console for error messages
- Verify API endpoints are accessible
- Test in multiple browsers if possible (Chrome, Firefox, Safari)

---

## Quick Test Commands

```bash
# Start dev server
npm start

# Check for linting errors
npm run build

# Check console in browser
# F12 > Console tab
```
