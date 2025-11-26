import { TRANSLATIONS } from './translations';
import { OVERLAPS, WARNS, LOCALES } from './extras';

// Separator characters for splitting search strings
const sepChars = [',', '|', '&', ';', ':'];
const sepRgx = /([,|&;:])/g;
const preRgx = /^[ \n!+@#-\d]*/;
const postRgx = /[ \n-\d\*]*$/;

/**
 * Tokenizes a search term into [prefix, token, postfix]
 * - Prefix: whitespace, !, +, @, #, numbers/ranges
 * - Token: the actual searchable term
 * - Postfix: whitespace, numbers/ranges, *
 */
export function tokenize(s) {
  let tmp = s;
  const pre = tmp.match(preRgx)[0];
  tmp = tmp.replace(preRgx, '');
  const post = tmp.match(postRgx)[0];
  tmp = tmp.replace(postRgx, '');
  return [pre, tmp, post];
}

/**
 * Custom comparison function that ignores accents
 */
function customCompare(s1, s2) {
  return s1.localeCompare(s2, undefined, { sensitivity: 'accent' }) === 0;
}

/**
 * Finds the index of a term in the translations array, handling OVERLAPS
 * @param {Array} arr - The translation array to search
 * @param {string} str - The term to find
 * @param {string} lang - The language name
 * @param {string} searchType - 'M' (move with @), 'S' (search with numbers/stars), 'N' (name)
 * @returns {number} - The index if found, -1 otherwise
 */
export function customIdx(arr, str, lang, searchType) {
  for (let i = 0; i < arr.length; i++) {
    const el = arr[i];
    if (customCompare(el, str)) {
      const key = `${i}•${lang}`;
      if (key in OVERLAPS && OVERLAPS[key] !== searchType) {
        // Skip this instance due to overlap conflict
        continue;
      }
      return i;
    }
  }
  return -1;
}

/**
 * Translates a single English term to the target language
 * @param {string} englishTerm - The English term to translate
 * @param {string} targetLang - The target language name (e.g., 'Spanish')
 * @param {string} context - Context: 'move' (@ prefix), 'tag' (# prefix), 'name' (pokemon name), or 'search' (with numbers/stars)
 * @returns {string} - The translated term, or the original if translation not found
 */
export function translateTerm(englishTerm, targetLang, context = 'name') {
  // If target language is English, no translation needed
  if (targetLang === 'English') {
    return englishTerm;
  }

  // If translations not available for target language, return original
  if (!TRANSLATIONS[targetLang] || !TRANSLATIONS['English']) {
    return englishTerm;
  }

  // Determine search type from context
  let searchType = 'N'; // default: name
  if (context === 'move') {
    searchType = 'M';
  } else if (context === 'search') {
    searchType = 'S';
  }

  // Find the index in English translations
  const idx = customIdx(TRANSLATIONS['English'], englishTerm, 'English', searchType);
  
  if (idx === -1) {
    // Term not found in translations, return original
    return englishTerm;
  }

  // Return the translated term at the same index
  return TRANSLATIONS[targetLang][idx] || englishTerm;
}

/**
 * Translates an entire search string from English to target language
 * Preserves separators, prefixes (!+@#), and postfixes (numbers, *)
 * @param {string} searchString - The English search string
 * @param {string} targetLang - The target language name
 * @param {boolean} returnWarnings - If true, returns object with translated string and warnings
 * @returns {string|Object} - The translated search string, or { translated: string, warnings: string[] } if returnWarnings is true
 */
export function translateSearchString(searchString, targetLang, returnWarnings = false) {
  // If target language is English, no translation needed
  if (targetLang === 'English' || !searchString) {
    return returnWarnings ? { translated: searchString, warnings: [] } : searchString;
  }

  // Split by separators while preserving them
  const tokens = searchString.split(sepRgx);
  const warnedTerms = [];
  const warnings = [];
  let result = '';

  for (const str of tokens) {
    // If it's a separator or empty, keep as-is
    if (sepChars.includes(str) || str.length === 0) {
      result += str;
      continue;
    }

    // Tokenize the string
    const [pre, token, post] = tokenize(str);

    // Don't translate tags (#) or empty tokens
    if (token.length === 0 || pre.includes('#')) {
      result += str;
      continue;
    }

    // Determine search type from prefix/postfix
    const searchType = pre.indexOf('@') >= 0 ? 'M' :
                      post.match(/[-\d\*]/) != null ? 'S' :
                      'N';

    // Find translation index
    const idx = customIdx(TRANSLATIONS['English'], token, 'English', searchType);
    
    if (idx === -1) {
      // Could not translate, keep original
      result += str;
      continue;
    }

    // Get translated term
    const translatedToken = TRANSLATIONS[targetLang][idx];
    
    // Check for warnings from English term
    const keyFrom = `${token.toUpperCase()}•English`;
    if (!warnedTerms.includes(keyFrom) && keyFrom in WARNS) {
      const [qual, warnFrom, warnTo] = WARNS[keyFrom];
      if (qual === '*' || qual === searchType) {
        warnedTerms.push(keyFrom);
        if (returnWarnings) {
          warnings.push(warnFrom);
        }
      }
    }

    // Check for warnings in translated term
    const keyTo = `${translatedToken.toUpperCase()}•${targetLang}`;
    if (!warnedTerms.includes(keyTo) && keyTo in WARNS) {
      const [qual, warnFrom, warnTo] = WARNS[keyTo];
      if (qual === '*' || qual === searchType) {
        warnedTerms.push(keyTo);
        if (returnWarnings) {
          warnings.push(warnTo);
        }
      }
    }

    // Reconstruct with translated token
    result += `${pre}${translatedToken}${post}`;
  }

  if (returnWarnings) {
    return { translated: result, warnings };
  }

  return result;
}

/**
 * Gets the locale string for a language (for toLowerCase/toUpperCase)
 * @param {string} lang - The language name
 * @returns {string} - The locale string (e.g., 'es', 'fr')
 */
export function getLocale(lang) {
  return LOCALES[lang] || 'en';
}

/**
 * Translates a search string from any language back to English
 * Used when parsing user input that might be in a different language
 * @param {string} searchString - The search string in any language
 * @param {string} sourceLang - The source language name (if known, otherwise will try to detect)
 * @returns {string} - The English search string
 */
export function translateToEnglish(searchString, sourceLang = null) {
  // If source language is English or not provided, try to detect
  if (!sourceLang || sourceLang === 'English' || !searchString) {
    // Try to detect language by checking which language contains the terms
    const tokens = searchString.split(sepRgx);
    const possibleLangs = new Set(Object.keys(TRANSLATIONS));
    
    for (const str of tokens) {
      if (sepChars.includes(str) || str.length === 0) continue;
      const [pre, token, post] = tokenize(str);
      if (token.length === 0 || pre.includes('#')) continue;
      
      const searchType = pre.indexOf('@') >= 0 ? 'M' :
                        post.match(/[-\d\*]/) != null ? 'S' :
                        'N';
      
      const matchingLangs = [];
      for (const lang of Object.keys(TRANSLATIONS)) {
        if (customIdx(TRANSLATIONS[lang], token, lang, searchType) !== -1) {
          matchingLangs.push(lang);
        }
      }
      
      // Intersect with possible languages
      for (const lang of possibleLangs) {
        if (!matchingLangs.includes(lang)) {
          possibleLangs.delete(lang);
        }
      }
      
      if (possibleLangs.size === 0) break;
    }
    
    // If we found a single language, use it; otherwise default to English
    if (possibleLangs.size === 1) {
      sourceLang = Array.from(possibleLangs)[0];
    } else {
      // If ambiguous or no match, assume it's already English or try English first
      sourceLang = 'English';
    }
  }
  
  if (sourceLang === 'English') {
    return searchString;
  }
  
  if (!TRANSLATIONS[sourceLang] || !TRANSLATIONS['English']) {
    return searchString;
  }
  
  // Translate from source language to English
  const tokens = searchString.split(sepRgx);
  let result = '';
  
  for (const str of tokens) {
    if (sepChars.includes(str) || str.length === 0) {
      result += str;
      continue;
    }
    
    const [pre, token, post] = tokenize(str);
    if (token.length === 0 || pre.includes('#')) {
      result += str;
      continue;
    }
    
    const searchType = pre.indexOf('@') >= 0 ? 'M' :
                      post.match(/[-\d\*]/) != null ? 'S' :
                      'N';
    
    // Find index in source language
    const idx = customIdx(TRANSLATIONS[sourceLang], token, sourceLang, searchType);
    
    if (idx === -1) {
      // Could not translate, keep original
      result += str;
      continue;
    }
    
    // Get English term at same index
    const englishToken = TRANSLATIONS['English'][idx];
    result += `${pre}${englishToken}${post}`;
  }
  
  return result;
}

/**
 * Gets all available languages
 * @returns {Array<string>} - Array of language names
 */
export function getAvailableLanguages() {
  return Object.keys(TRANSLATIONS);
}

