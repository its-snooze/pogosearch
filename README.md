# 🔍 Pokémon GO Search Builder

**Build powerful Pokemon GO search strings visually - no syntax memorization required!**

[![Live App](https://img.shields.io/badge/Live-pogosearch-blue?style=for-the-badge)](https://its-snooze.github.io/pogosearch)
[![Discord](https://img.shields.io/badge/Discord-Join-7289DA?style=for-the-badge&logo=discord)](https://discord.gg/X9zqC3quKR)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## ✨ Features

### 🎮 Core Functionality
- **Visual Filter Builder** - Click filters instead of memorizing syntax
- **200+ Search Operators** - Every Pokemon GO search term supported
- **Smart Validation** - Catches syntax errors before you paste
- **One-Click Copy** - Copy and paste directly into Pokemon GO

### 🌍 Multi-Language Support (WIP)
- **15 Languages** - English, Spanish, French, German, Japanese, Korean, Chinese, Portuguese, Italian, Russian, Hindi, Indonesian, Thai, Turkish
- **Auto-Translation** - Search strings automatically generated in your selected language
- **Game-Accurate** - Uses official Pokemon GO terminology for each language

### 📱 Progressive Web App
- **Install on Mobile** - Works offline as a phone app
- **Cross-Platform** - Android, iOS, Desktop
- **Fast & Lightweight** - No ads, no tracking

### 🎯 Premade Searches
- **PvP Tier Lists** - S/A+/A tier shadows and non-shadows
- **Quick Combos** - Shiny legendaries, perfect shadows, trade fodder, etc.
- **CP Ranges** - Great League, Ultra League, Master League caps
- **Pokemon Groups** - Starters, Eeveelutions, Pseudo-Legendaries, by generation

### 💾 Save & Share
- **Save Searches** - Store up to 15 custom searches
- **Import/Export** - Backup and restore your searches
- **Search History** - Quick access to recent searches

### 🎨 Customization
- **Dark/Light Mode** - Easy on the eyes
- **Custom Age Ranges** - Flexible date filters for Catch Cup
- **Smart Year Formatting** - Auto-combines consecutive years (year2016-2017)

---

## 🚀 Quick Start

### Web App
1. Visit **[https://its-snooze.github.io/pogosearch](https://its-snooze.github.io/pogosearch)**
2. Click the filters you want
3. Copy the search string
4. Paste into Pokemon GO

### Install as App (PWA)
**Android/iOS:**
1. Open in browser
2. Tap share/menu button
3. Select "Add to Home Screen"
4. Use like a native app!

**Desktop (Chrome/Edge):**
1. Click the install icon in address bar
2. Or go to Settings → Install Pogosearch

---

## 📖 How to Use

### Building a Search

**Select filters from categories:**
- **Stats & IVs** - Perfect (4★), High IV (3★), specific stat ranges
- **Types** - All 18 Pokemon types
- **Special Status** - Shiny, Shadow, Lucky, Legendary, etc.
- **Evolution & Buddy** - Can evolve, mega level, buddy status
- **Time & Distance** - Caught dates, years, distance from location
- **Size & Gender** - XXS/XXL, male/female/genderless
- **Moves** - Fast moves, charged moves, legacy moves
- **Regions** - Kanto, Johto, Hoenn, etc.

**Include vs. Exclude:**
- Green ➕ button = Include (must have this)
- Red ➖ button = Exclude (must NOT have this)

**Example Searches:**
- `shiny&legendary` - All shiny legendaries
- `4*&!shadow` - Perfect Pokemon that aren't shadow
- `age0-7&evolve` - Pokemon caught this week that can evolve
- `shadow&3*,4*` - High IV shadows (3 or 4 stars)

### Quick Picks

**Generations:**
- Click any generation to add all Pokemon from that region
- Example: "Gen 1 (Kanto)" adds Pokemon #1-151

**Pokemon Groups:**
- All Starters, Eeveelutions, Pseudo-Legendaries
- Organized by region (Kanto Starters, Johto Starters, etc.)

### Premade Searches

**PvP Meta:**
- S-Tier, A+ Tier, A-Tier shadows and non-shadows
- Top 25 Master League Pokemon

**Quick Combos:**
- Shiny Legendaries
- Perfect Shadows (4★ shadow)
- High IV Non-Shiny
- Trade Fodder
- Recent Catches
- Evolution Ready
- And more!

### Language Support

**Change Language:**
1. Click globe icon (🌐) in top right
2. Select your language
3. All search strings automatically translate

**Note:** Translation feature is in beta (WIP marker shown). Report issues in Discord!

---

## 🎓 Search String Syntax Guide

### Operators
- `,` (comma) = **OR** - Example: `fire,water` finds Fire OR Water
- `&` (ampersand) = **AND** - Example: `fire&flying` finds Fire AND Flying
- `!` (exclamation) = **NOT** - Example: `!shiny` excludes shinies

### Common Patterns
- **Pokedex Numbers** - Use commas: `150,151,152`
- **Ranges** - Use hyphens: `cp1500-2500`, `year2016-2020`
- **Star Ratings** - `4*` (perfect), `3*` (82-98%), etc.
- **IVs** - `4attack` (15 atk), `0attack` (0 atk)
- **Age** - `age0` (today), `age0-7` (last week)
- **Moves** - `@special` (legacy), `@1fire` (fire fast move)

### Validation
The app automatically checks for:
- ❌ Spaces (not allowed)
- ❌ Missing ampersands between numbers and text
- ❌ Using `&` between Pokedex numbers (should be `,`)
- ✅ Suggests corrections

---

## 🛠️ Development

### Tech Stack
- **React** - UI framework
- **Lucide React** - Icons
- **Tailwind CSS** - Styling
- **GitHub Pages** - Hosting

### Local Development

```bash
# Clone the repo
git clone https://github.com/its-snooze/pogosearch.git
cd pogosearch

# Install dependencies
npm install

# Start dev server
npm start

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

### Project Structure
```
src/
├── components/          # React components
│   └── CustomAgeInput.js
├── translations/        # Translation files
│   ├── translations.js  # Pokemon GO terms (15 languages)
│   ├── uiTranslations.js
│   └── extras.js        # Overlaps, warnings, locales
├── utils/              # Helper functions
│   └── translation.js  # Translation utilities
└── App.js              # Main app component
```

---

## 🤝 Contributing

We welcome contributions! Here's how to help:

### Report Bugs
1. Join our **[Discord](https://discord.gg/X9zqC3quKR)**
2. Post in **#bug-reports** with:
   - What you tried to do
   - What happened
   - Screenshots if possible

### Suggest Features
1. Check the **[Roadmap](ROADMAP.md)** first
2. Post in Discord **#feature-requests**
3. Explain your use case and why it'd be useful

### Submit Code
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Add Premade Searches
Have a useful search combination? We'd love to add it!
1. Test it in Pokemon GO
2. Share in Discord **#tips-and-tricks**
3. If popular, we'll add it to the app

---

## 🙏 Credits

### Translations
- **Translation data** from [Leidwesen's PhraseTranslator](https://github.com/Leidwesen/PhraseTranslator)
- Covers all Pokemon GO search terms in 15 languages

### PvP Tier Lists
- Based on **PokeMiners**, **LeekDuck**, and **GamePress** data
- Updated regularly to reflect current meta

### Community
- Shoutout to everyone on **r/TheSilphRoad** and **r/PokemonGO**
- All the Discord members testing and giving feedback!

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Live App**: https://its-snooze.github.io/pogosearch
- **Discord**: https://discord.gg/X9zqC3quKR
- **GitHub**: https://github.com/its-snooze/pogosearch
- **Roadmap**: [ROADMAP.md](ROADMAP.md)

---

## 💖 Support

This tool is **100% free** and **open source**. If you find it useful:
- ⭐ Star the repo
- 🔄 Share with your Pokemon GO friends
- 💬 Join the Discord community
- 🐛 Report bugs and suggest features

---

**Built with ❤️ by the Pokemon GO community**

*Not affiliated with Niantic or The Pokemon Company*