import { useState, useEffect } from 'react';
import { Plus, Minus, Calendar } from 'lucide-react';
import { getUIText } from '../translations/uiTranslations';

const CustomAgeInput = ({ value, isIncluded, isExcluded, onInclude, onExclude, onValueChange, selectedLanguage = 'English' }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [error, setError] = useState('');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Parse age input and convert to Pokemon GO format
  const parseAgeInput = (input) => {
    if (!input || input.trim() === '') return null;

    const trimmed = input.trim();
    
    // Handle direct "ageX" format
    if (trimmed.startsWith('age')) {
      const agePart = trimmed.substring(3);
      if (agePart === '' || /^[\d\-]+$/.test(agePart)) {
        return trimmed;
      }
    }

    // Handle number input (e.g., "30" = last 30 days = age0-30)
    if (/^\d+$/.test(trimmed)) {
      const days = parseInt(trimmed, 10);
      if (days >= 0) {
        return `age0-${days}`;
      }
    }

    // Handle range input (e.g., "0-7" = age0-7, "7-30" = age7-30)
    const rangeMatch = trimmed.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (start >= 0 && end >= start) {
        return `age${start}-${end}`;
      }
    }

    // Handle "X+" format (e.g., "30+" = age30-)
    const plusMatch = trimmed.match(/^(\d+)\+$/);
    if (plusMatch) {
      const days = parseInt(plusMatch[1], 10);
      if (days >= 0) {
        return `age${days}-`;
      }
    }

    // Handle "X-" format (e.g., "30-" = age30-)
    const minusMatch = trimmed.match(/^(\d+)-$/);
    if (minusMatch) {
      const days = parseInt(minusMatch[1], 10);
      if (days >= 0) {
        return `age${days}-`;
      }
    }

    return null;
  };

  // Format age value for display
  const formatAgeForDisplay = (ageValue) => {
    if (!ageValue) return '';
    
    // Remove "age" prefix for display
    if (ageValue.startsWith('age')) {
      return ageValue.substring(3);
    }
    return ageValue;
  };

  // Get date range description
  const getDateRangeDescription = (ageValue) => {
    if (!ageValue || !ageValue.startsWith('age')) return '';

    const agePart = ageValue.substring(3);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Handle range (e.g., age0-30)
    const rangeMatch = agePart.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const startDays = parseInt(rangeMatch[1], 10);
      const endDays = parseInt(rangeMatch[2], 10);
      
      if (startDays === 0) {
        // Last X days
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - endDays);
        return `(since ${formatDate(startDate)})`;
      } else {
        // Between X and Y days ago
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - endDays);
        const endDate = new Date(today);
        endDate.setDate(today.getDate() - startDays);
        return `(${formatDate(startDate)} - ${formatDate(endDate)})`;
      }
    }

    // Handle single value (e.g., age0)
    if (/^\d+$/.test(agePart)) {
      const days = parseInt(agePart, 10);
      const date = new Date(today);
      date.setDate(today.getDate() - days);
      if (days === 0) {
        return '(today)';
      }
      return `(${formatDate(date)})`;
    }

    // Handle "X-" format (e.g., age30-)
    const minusMatch = agePart.match(/^(\d+)-$/);
    if (minusMatch) {
      const days = parseInt(minusMatch[1], 10);
      const date = new Date(today);
      date.setDate(today.getDate() - days);
      return `(before ${formatDate(date)})`;
    }

    return '';
  };

  const formatDate = (date) => {
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setError('');

    // Auto-parse and update if valid
    const parsed = parseAgeInput(newValue);
    if (parsed) {
      onValueChange(parsed);
    } else if (newValue.trim() === '') {
      onValueChange('');
    }
  };

  const handleBlur = () => {
    if (inputValue.trim() === '') {
      setInputValue('');
      onValueChange('');
      return;
    }

    const parsed = parseAgeInput(inputValue);
    if (parsed) {
      setInputValue(formatAgeForDisplay(parsed));
      onValueChange(parsed);
      setError('');
    } else {
      setError(getUIText('invalid_format', selectedLanguage));
    }
  };

  const handlePreset = (presetValue) => {
    setInputValue(formatAgeForDisplay(presetValue));
    onValueChange(presetValue);
    setError('');
  };

  const presets = [
    { label: getUIText('last_week', selectedLanguage), value: 'age0-7' },
    { label: getUIText('last_month', selectedLanguage), value: 'age0-30' },
    { label: getUIText('last_year', selectedLanguage), value: 'age0-365' },
  ];

  const dateRangeDesc = value ? getDateRangeDescription(value) : '';

  return (
    <div className="col-span-full sm:col-span-2 lg:col-span-3">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100">
            {getUIText('custom_date_range', selectedLanguage)}
          </h3>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2 mb-3">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePreset(preset.value)}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Input Field */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder={`e.g., 30 (${getUIText('last_30_days', selectedLanguage).toLowerCase()}) or 0-7 (${getUIText('last_week', selectedLanguage).toLowerCase()}) or age0-30`}
                className={`w-full px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                  error
                    ? 'border-red-400 dark:border-red-600'
                    : isIncluded
                    ? 'border-blue-400 dark:border-blue-500'
                    : isExcluded
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-300 dark:border-slate-600'
                } bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
              />
              {value && dateRangeDesc && (
                <div className="absolute -bottom-5 left-0 text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {dateRangeDesc}
                </div>
              )}
            </div>
            {error && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                {error}
              </div>
            )}
          </div>

          {/* Include/Exclude Buttons */}
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={onInclude}
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
              onClick={onExclude}
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

        {/* Help Text */}
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          <p>{getUIText('examples', selectedLanguage)}:</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li><code className="bg-white/50 dark:bg-slate-800/50 px-1 rounded">30</code> = {getUIText('last_30_days', selectedLanguage)}</li>
            <li><code className="bg-white/50 dark:bg-slate-800/50 px-1 rounded">0-7</code> = {getUIText('last_week', selectedLanguage)}</li>
            <li><code className="bg-white/50 dark:bg-slate-800/50 px-1 rounded">30-</code> = {getUIText('more_than_days_ago', selectedLanguage).replace('{days}', '30')}</li>
            <li><code className="bg-white/50 dark:bg-slate-800/50 px-1 rounded">age0-30</code> = Direct format</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CustomAgeInput;

