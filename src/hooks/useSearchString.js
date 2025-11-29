import { useState, useRef, useEffect, useCallback } from 'react';
import { translateSearchString, translateToEnglish } from '../utils/translation';
import { parseSearchString, validateSearchString } from '../utils/searchParser';
import { filterCategories } from '../data/filterDefinitions';
import { parseSearchStringToFilters } from './useFilters';

/**
 * Encapsulates all search string state, helpers, and side effects.
 * Accepts current filter selections and language along with supporting setters so
 * components can reuse the existing logic without duplicating implementation details.
 */
const useSearchString = (
  includedFilters,
  excludedFilters,
  selectedLanguage,
  {
    customAgeIncluded = false,
    customAgeExcluded = false,
    customAgeValue = '',
    anyTaggedIncluded = false,
    anyTaggedExcluded = false,
    customTagIncluded = false,
    customTagExcluded = false,
    customTagValue = '',
    isPremadeSearch = false,
    setIsPremadeSearch,
    setIncludedFilters,
    setExcludedFilters,
  } = {}
) => {
  const [searchString, setSearchString] = useState('');
  const [translationWarnings, setTranslationWarnings] = useState([]);
  const [validationResult, setValidationResult] = useState({ valid: true });
  const pokedexNumbersRef = useRef('');

  // Extract Pokedex numbers from a search string and preserve them in a ref.
  const extractPokedexNumbers = useCallback((searchStr) => {
    if (!searchStr || searchStr.trim() === '') {
      pokedexNumbersRef.current = '';
      return '';
    }

    const parts = searchStr.split('&').map((p) => p.trim()).filter(Boolean);

    for (const part of parts) {
      if (/^[\d,]+$/.test(part)) {
        pokedexNumbersRef.current = part;
        return part;
      }
    }

    pokedexNumbersRef.current = '';
    return '';
  }, []);

  const buildSearchString = useCallback(
    (included, excluded, { translate = true } = {}) => {
      const getFilterObject = (id) =>
        Object.values(filterCategories)
          .flatMap((cat) => cat.filters)
          .find((f) => f.id === id);

      const combineYearRanges = (timeFilterIds) => {
        const yearFilters = timeFilterIds.filter((id) => id.startsWith('year'));
        const otherTimeFilters = timeFilterIds.filter((id) => !id.startsWith('year'));

        if (yearFilters.length === 0) {
          return otherTimeFilters.map((id) => getFilterObject(id)?.value).filter(Boolean);
        }

        const years = yearFilters
          .map((id) => {
            const match = id.match(/year(\d{4})/);
            return match ? parseInt(match[1], 10) : null;
          })
          .filter((year) => year !== null)
          .sort((a, b) => a - b);

        const yearRanges = [];
        let rangeStart = years[0];
        let rangeEnd = years[0];

        for (let i = 1; i < years.length; i++) {
          if (years[i] === rangeEnd + 1) {
            rangeEnd = years[i];
          } else {
            if (rangeStart === rangeEnd) {
              yearRanges.push(`year${rangeStart}`);
            } else {
              yearRanges.push(`year${rangeStart}-${rangeEnd}`);
            }
            rangeStart = years[i];
            rangeEnd = years[i];
          }
        }

        if (rangeStart === rangeEnd) {
          yearRanges.push(`year${rangeStart}`);
        } else {
          yearRanges.push(`year${rangeStart}-${rangeEnd}`);
        }

        return [
          ...yearRanges,
          ...otherTimeFilters.map((id) => getFilterObject(id)?.value).filter(Boolean),
        ];
      };

      const starRatings = ['4*', '3*', '2*', '1*', '0*'];
      const statFilters = ['4attack', '3attack', '4defense', '3defense', '4hp', '3hp', '0attack', '0defense', '0hp'];
      const typeFilters = filterCategories.types.filters.map((f) => f.id);
      const specialFilters = filterCategories.special.filters.map((f) => f.id);
      const evolutionFilters = filterCategories.evolution.filters.map((f) => f.id);
      const timeFilters = filterCategories.time.filters.map((f) => f.id);
      const sizeFilters = filterCategories.size.filters.map((f) => f.id);
      const moveFilters = filterCategories.moves.filters.map((f) => f.id);
      const regionFilters = filterCategories.regions.filters.map((f) => f.id);

      const includedStar = included.filter((id) => starRatings.includes(id));
      const includedStats = included.filter((id) => statFilters.includes(id));
      const includedTypes = included.filter((id) => typeFilters.includes(id));
      const includedSpecial = included.filter((id) => specialFilters.includes(id));
      const includedEvolution = included.filter((id) => evolutionFilters.includes(id));
      const includedTime = included.filter((id) => timeFilters.includes(id));
      const includedSize = included.filter((id) => sizeFilters.includes(id));
      const includedMoves = included.filter((id) => moveFilters.includes(id));
      const includedRegions = included.filter((id) => regionFilters.includes(id));

      const excludedStar = excluded.filter((id) => starRatings.includes(id));
      const excludedStats = excluded.filter((id) => statFilters.includes(id));
      const excludedTypes = excluded.filter((id) => typeFilters.includes(id));
      const excludedSpecial = excluded.filter((id) => specialFilters.includes(id));
      const excludedEvolution = excluded.filter((id) => evolutionFilters.includes(id));
      const excludedTime = excluded.filter((id) => timeFilters.includes(id));
      const excludedSize = excluded.filter((id) => sizeFilters.includes(id));
      const excludedMoves = excluded.filter((id) => moveFilters.includes(id));
      const excludedRegions = excluded.filter((id) => regionFilters.includes(id));

      const parts = [];

      if (includedStar.length > 0) {
        const starValues = includedStar.map((id) => getFilterObject(id)?.value).filter(Boolean);
        if (starValues.length > 0) {
          parts.push(starValues.join(','));
        }
      }

      if (includedStats.length > 0) {
        const statValues = includedStats.map((id) => getFilterObject(id)?.value).filter(Boolean);
        if (statValues.length > 0) {
          parts.push(statValues.join(','));
        }
      }

      if (includedTypes.length > 0) {
        const typeValues = includedTypes.map((id) => getFilterObject(id)?.value).filter(Boolean);
        if (typeValues.length > 0) {
          parts.push(typeValues.join(','));
        }
      }

      if (includedSpecial.length > 0) {
        const specialValues = includedSpecial.map((id) => getFilterObject(id)?.value).filter(Boolean);
        if (specialValues.length > 0) {
          parts.push(specialValues.join(','));
        }
      }

      if (includedEvolution.length > 0) {
        const evolutionValues = includedEvolution.map((id) => getFilterObject(id)?.value).filter(Boolean);
        if (evolutionValues.length > 0) {
          parts.push(evolutionValues.join(','));
        }
      }

      if (includedTime.length > 0 || customAgeIncluded) {
        const timeValues = combineYearRanges(includedTime);
        if (customAgeIncluded && customAgeValue) {
          timeValues.push(customAgeValue);
        }
        if (timeValues.length > 0) {
          parts.push(timeValues.join(','));
        }
      }

      if (includedSize.length > 0) {
        const sizeValues = includedSize.map((id) => getFilterObject(id)?.value).filter(Boolean);
        if (sizeValues.length > 0) {
          parts.push(sizeValues.join(','));
        }
      }

      if (includedMoves.length > 0) {
        const moveValues = includedMoves.map((id) => getFilterObject(id)?.value).filter(Boolean);
        if (moveValues.length > 0) {
          parts.push(moveValues.join(','));
        }
      }

      if (includedRegions.length > 0) {
        const regionValues = includedRegions.map((id) => getFilterObject(id)?.value).filter(Boolean);
        if (regionValues.length > 0) {
          parts.push(regionValues.join(','));
        }
      }

      // Handle tags
      if (anyTaggedIncluded) {
        parts.push('#');
      }
      if (customTagIncluded && customTagValue && customTagValue.trim()) {
        parts.push(`#${customTagValue.trim()}`);
      }

      const excludedParts = [];

      if (excludedStar.length > 0) {
        const starValues = excludedStar
          .map((id) => getFilterObject(id)?.value)
          .filter(Boolean)
          .map((v) => `!${v}`);
        if (starValues.length > 0) {
          excludedParts.push(starValues.join(','));
        }
      }

      if (excludedStats.length > 0) {
        const statValues = excludedStats
          .map((id) => getFilterObject(id)?.value)
          .filter(Boolean)
          .map((v) => `!${v}`);
        if (statValues.length > 0) {
          excludedParts.push(statValues.join(','));
        }
      }

      if (excludedTypes.length > 0) {
        const typeValues = excludedTypes
          .map((id) => getFilterObject(id)?.value)
          .filter(Boolean)
          .map((v) => `!${v}`);
        if (typeValues.length > 0) {
          excludedParts.push(typeValues.join(','));
        }
      }

      if (excludedSpecial.length > 0) {
        excludedSpecial.forEach((id) => {
          const filter = getFilterObject(id);
          if (filter?.value) {
            excludedParts.push(`!${filter.value}`);
          }
        });
      }

      if (excludedEvolution.length > 0) {
        const evolutionValues = excludedEvolution
          .map((id) => getFilterObject(id)?.value)
          .filter(Boolean)
          .map((v) => `!${v}`);
        if (evolutionValues.length > 0) {
          excludedParts.push(evolutionValues.join(','));
        }
      }

      if (excludedTime.length > 0 || customAgeExcluded) {
        const timeValues = combineYearRanges(excludedTime);
        if (customAgeExcluded && customAgeValue) {
          timeValues.push(customAgeValue);
        }
        const excludedTimeValues = timeValues.map((v) => `!${v}`);
        if (excludedTimeValues.length > 0) {
          excludedParts.push(excludedTimeValues.join(','));
        }
      }

      if (excludedSize.length > 0) {
        const sizeValues = excludedSize
          .map((id) => getFilterObject(id)?.value)
          .filter(Boolean)
          .map((v) => `!${v}`);
        if (sizeValues.length > 0) {
          excludedParts.push(sizeValues.join(','));
        }
      }

      if (excludedMoves.length > 0) {
        const moveValues = excludedMoves
          .map((id) => getFilterObject(id)?.value)
          .filter(Boolean)
          .map((v) => `!${v}`);
        if (moveValues.length > 0) {
          excludedParts.push(moveValues.join(','));
        }
      }

      if (excludedRegions.length > 0) {
        const regionValues = excludedRegions
          .map((id) => getFilterObject(id)?.value)
          .filter(Boolean)
          .map((v) => `!${v}`);
        if (regionValues.length > 0) {
          excludedParts.push(regionValues.join(','));
        }
      }

      // Handle excluded tags
      if (anyTaggedExcluded) {
        excludedParts.push('!#');
      }
      if (customTagExcluded && customTagValue && customTagValue.trim()) {
        excludedParts.push(`!#${customTagValue.trim()}`);
      }

      const pokedexNumbers = pokedexNumbersRef.current;
      const allFilterParts = [...parts, ...excludedParts];
      const finalParts = [];

      if (pokedexNumbers) {
        finalParts.push(pokedexNumbers);
      }

      if (allFilterParts.length > 0) {
        finalParts.push(...allFilterParts);
      }

      if (finalParts.length === 0) return '';

      let result = finalParts.join('&');

      if (selectedLanguage !== 'English' && result && translate) {
        result = translateSearchString(result, selectedLanguage);
      }

      const validation = validateSearchString(result);
      if (!validation.valid && process.env.NODE_ENV === 'development') {
        console.warn(`Generated invalid search string: "${result}" - ${validation.error}`);
      }

      return result;
    },
    [selectedLanguage, customAgeIncluded, customAgeExcluded, customAgeValue, anyTaggedIncluded, anyTaggedExcluded, customTagIncluded, customTagExcluded, customTagValue]
  );

  const updateSearchString = useCallback(
    (englishString) => {
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
    },
    [selectedLanguage]
  );

  useEffect(() => {
    if (!isPremadeSearch) {
      const newSearchString = buildSearchString(includedFilters, excludedFilters);
      if (selectedLanguage !== 'English' && newSearchString) {
        const translationResult = translateSearchString(newSearchString, selectedLanguage, true);
        setSearchString(translationResult.translated);
        setTranslationWarnings(translationResult.warnings);
      } else {
        setSearchString(newSearchString);
        setTranslationWarnings([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includedFilters, excludedFilters, isPremadeSearch, anyTaggedIncluded, anyTaggedExcluded, customTagIncluded, customTagExcluded, customTagValue, selectedLanguage]);

  useEffect(() => {
    if (selectedLanguage !== 'English' && searchString) {
      const englishString = translateToEnglish(searchString, selectedLanguage);
      const translationResult = translateSearchString(englishString, selectedLanguage, true);
      setTranslationWarnings(translationResult.warnings);
    } else {
      setTranslationWarnings([]);
    }
  }, [searchString, selectedLanguage]);

  useEffect(() => {
    const validation = validateSearchString(searchString);
    if (!validation.valid && validation.errors && validation.errors.length > 0) {
      const errorMessages = validation.errors.map((err) => err.message || err);
      setValidationResult({
        valid: false,
        error: errorMessages.length === 1 ? errorMessages[0] : errorMessages.join('; '),
      });
    } else {
      setValidationResult({ valid: validation.valid });
    }

    if (!validation.valid && process.env.NODE_ENV === 'development') {
      const errorMsg =
        validation.errors && validation.errors.length > 0
          ? validation.errors.map((e) => e.message || e).join('; ')
          : 'Invalid search string';
      console.warn(`Invalid search string: "${searchString}" - ${errorMsg}`);
    }
  }, [searchString, selectedLanguage]);

  const appendFilterCombo = useCallback(
    (comboString) => {
      if (!comboString || !setIncludedFilters || !setExcludedFilters) return;
      setIsPremadeSearch && setIsPremadeSearch(false);

      const cleanCombo = comboString.startsWith('&') ? comboString.slice(1) : comboString;
      const { included: newIncluded, excluded: newExcluded } = parseSearchStringToFilters(
        cleanCombo,
        'English'
      );

      setIncludedFilters((prev) => {
        const merged = [...prev, ...newIncluded];
        return [...new Set(merged)];
      });

      setExcludedFilters((prev) => {
        const merged = [...prev, ...newExcluded];
        return [...new Set(merged)];
      });

      if (!searchString || searchString.trim() === '') {
        updateSearchString(cleanCombo);
      } else {
        const currentEnglish =
          selectedLanguage !== 'English' ? translateToEnglish(searchString, selectedLanguage) : searchString;
        const newEnglishString = `${currentEnglish}${comboString}`;
        updateSearchString(newEnglishString);
        extractPokedexNumbers(newEnglishString);
      }
    },
    [
      parseSearchStringToFilters,
      setIncludedFilters,
      setExcludedFilters,
      searchString,
      selectedLanguage,
      updateSearchString,
      extractPokedexNumbers,
      setIsPremadeSearch,
    ]
  );

  const insertCPRange = useCallback(
    (cpRange) => {
      if (!cpRange) return;
      setIsPremadeSearch && setIsPremadeSearch(false);

      const currentEnglish =
        selectedLanguage !== 'English' ? translateToEnglish(searchString, selectedLanguage) : searchString;

      if (!currentEnglish || currentEnglish.trim() === '') {
        updateSearchString(cpRange);
        return;
      }

      const parts = currentEnglish.split('&').map((p) => p.trim()).filter(Boolean);
      let cpIndex = -1;

      for (let i = 0; i < parts.length; i++) {
        if (/^cp[\d-]+$/.test(parts[i])) {
          cpIndex = i;
          break;
        }
      }

      if (cpIndex >= 0) {
        parts[cpIndex] = cpRange;
      } else {
        let insertIndex = 0;
        for (let i = 0; i < parts.length; i++) {
          if (/^[\d,-]+$/.test(parts[i])) {
            insertIndex = i + 1;
            break;
          }
        }
        parts.splice(insertIndex, 0, cpRange);
      }

      const newEnglishString = parts.join('&');
      updateSearchString(newEnglishString);
      extractPokedexNumbers(newEnglishString);
    },
    [searchString, selectedLanguage, updateSearchString, extractPokedexNumbers, setIsPremadeSearch]
  );

  const insertPokemonNumbers = useCallback(
    (numbers) => {
      if (!numbers) return;
      setIsPremadeSearch && setIsPremadeSearch(false);

      const currentEnglish =
        selectedLanguage !== 'English' ? translateToEnglish(searchString, selectedLanguage) : searchString;

      if (!currentEnglish || currentEnglish.trim() === '') {
        updateSearchString(numbers);
        extractPokedexNumbers(numbers);
        return;
      }

      const parts = currentEnglish.split('&').map((p) => p.trim()).filter(Boolean);
      let pokedexIndex = -1;
      let existingPokedex = '';

      for (let i = 0; i < parts.length; i++) {
        if (/^[\d,-]+$/.test(parts[i])) {
          pokedexIndex = i;
          existingPokedex = parts[i];
          break;
        }
      }

      if (pokedexIndex >= 0) {
        const merged = existingPokedex ? `${existingPokedex},${numbers}` : numbers;
        parts[pokedexIndex] = merged;
        const newEnglishString = parts.join('&');
        updateSearchString(newEnglishString);
        extractPokedexNumbers(newEnglishString);
      } else {
        const newEnglishString = `${numbers}&${currentEnglish}`;
        updateSearchString(newEnglishString);
        extractPokedexNumbers(newEnglishString);
      }
    },
    [searchString, selectedLanguage, updateSearchString, extractPokedexNumbers, setIsPremadeSearch]
  );

  const resetSearchState = useCallback(() => {
    setSearchString('');
    setTranslationWarnings([]);
    pokedexNumbersRef.current = '';
  }, []);

  return {
    searchString,
    translationWarnings,
    validationResult,
    buildSearchString,
    updateSearchString,
    extractPokedexNumbers,
    appendFilterCombo,
    insertCPRange,
    insertPokemonNumbers,
    resetSearchState,
    setValidationState: setValidationResult,
  };
};

export default useSearchString;

