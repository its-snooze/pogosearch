import { useState, useCallback } from 'react';
import { parseSearchString } from '../utils/searchParser';
import { translateToEnglish } from '../utils/translation';
import { filterCategories } from '../data/filterDefinitions';

const allFilters = Object.values(filterCategories).flatMap((category) => category.filters);

export const parseSearchStringToFilters = (searchStr, language = 'English') => {
  if (!searchStr || searchStr.trim() === '') {
    return { included: [], excluded: [], tags: { anyTagged: { included: false, excluded: false }, customTag: { value: '', included: false, excluded: false } } };
  }

  let englishSearchStr = searchStr;
  if (language !== 'English') {
    englishSearchStr = translateToEnglish(searchStr, language);
  }

  const result = parseSearchString(englishSearchStr);
  const includedIds = [];
  const excludedIds = [];
  const tags = {
    anyTagged: { included: false, excluded: false },
    customTag: { value: '', included: false, excluded: false }
  };

  result.included.forEach((filterValue) => {
    if (/^[\d,]+$/.test(filterValue)) {
      return;
    }
    // Handle tags
    if (filterValue === '#') {
      tags.anyTagged.included = true;
      return;
    }
    if (filterValue.startsWith('#')) {
      const tagName = filterValue.substring(1);
      if (tagName) {
        tags.customTag.value = tagName;
        tags.customTag.included = true;
      }
      return;
    }
    const filter = allFilters.find((f) => f.value === filterValue);
    if (filter) {
      includedIds.push(filter.id);
    }
  });

  result.excluded.forEach((filterValue) => {
    // Handle excluded tags (parser strips the ! prefix, so excluded tags are just # or #tagname)
    if (filterValue === '#') {
      tags.anyTagged.excluded = true;
      return;
    }
    if (filterValue.startsWith('#')) {
      const tagName = filterValue.substring(1);
      if (tagName) {
        tags.customTag.value = tagName;
        tags.customTag.excluded = true;
      }
      return;
    }
    const filter = allFilters.find((f) => f.value === filterValue);
    if (filter) {
      excludedIds.push(filter.id);
    }
  });

  return { included: includedIds, excluded: excludedIds, tags };
};

const useFilters = ({ selectedLanguage = 'English' } = {}) => {
  const [includedFilters, setIncludedFilters] = useState([]);
  const [excludedFilters, setExcludedFilters] = useState([]);

  const toggleFilter = useCallback((filterId, mode = 'include') => {
    if (mode === 'include') {
      setIncludedFilters((prev) =>
        prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId]
      );
      setExcludedFilters((prev) => prev.filter((id) => id !== filterId));
    } else if (mode === 'exclude') {
      setExcludedFilters((prev) =>
        prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId]
      );
      setIncludedFilters((prev) => prev.filter((id) => id !== filterId));
    }
  }, []);

  const toggleIncludeFilter = useCallback((filterId) => {
    toggleFilter(filterId, 'include');
  }, [toggleFilter]);

  const toggleExcludeFilter = useCallback((filterId) => {
    toggleFilter(filterId, 'exclude');
  }, [toggleFilter]);

  const clearAllFilters = useCallback(() => {
    setIncludedFilters([]);
    setExcludedFilters([]);
  }, []);

  const setFiltersFromString = useCallback(
    (searchStr, language = selectedLanguage) => {
      const { included, excluded, tags } = parseSearchStringToFilters(searchStr, language);
      setIncludedFilters(included);
      setExcludedFilters(excluded);
      return { included, excluded, tags };
    },
    [selectedLanguage]
  );

  return {
    includedFilters,
    excludedFilters,
    toggleFilter,
    toggleIncludeFilter,
    toggleExcludeFilter,
    clearAllFilters,
    setFiltersFromString,
    setIncludedFilters,
    setExcludedFilters,
  };
};

export default useFilters;

