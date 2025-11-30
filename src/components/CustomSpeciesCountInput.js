import { useState, useEffect } from 'react';
import { Plus, Minus, Package } from 'lucide-react';
import { getUIText } from '../translations/uiTranslations';

const CustomSpeciesCountInput = ({ value, isIncluded, isExcluded, onInclude, onExclude, onValueChange, selectedLanguage = 'English' }) => {
  // Format count value for display (helper function)
  const formatCountForDisplay = (countValue) => {
    if (!countValue) return '';
    
    // Remove "count" prefix and trailing dash for display
    if (countValue.startsWith('count')) {
      const countPart = countValue.substring(5);
      return countPart.endsWith('-') ? countPart.slice(0, -1) : countPart;
    }
    return countValue;
  };

  const [inputValue, setInputValue] = useState(formatCountForDisplay(value || ''));
  const [error, setError] = useState('');

  useEffect(() => {
    setInputValue(formatCountForDisplay(value || ''));
  }, [value]);

  // Parse species count input and convert to Pokemon GO format
  const parseCountInput = (input) => {
    if (!input || input.trim() === '') return null;

    const trimmed = input.trim();
    
    // Handle direct "countX-" format
    if (trimmed.startsWith('count')) {
      const countPart = trimmed.substring(5);
      // Remove trailing dash if present
      const numberPart = countPart.endsWith('-') ? countPart.slice(0, -1) : countPart;
      if (/^\d+$/.test(numberPart)) {
        const num = parseInt(numberPart, 10);
        if (num > 0) {
          return `count${num}-`;
        }
      }
    }

    // Handle number input (e.g., "5" = count5-)
    if (/^\d+$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      if (num > 0) {
        return `count${num}-`;
      }
    }

    // Handle "X+" format (e.g., "5+" = count5-)
    const plusMatch = trimmed.match(/^(\d+)\+$/);
    if (plusMatch) {
      const num = parseInt(plusMatch[1], 10);
      if (num > 0) {
        return `count${num}-`;
      }
    }

    return null;
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    // Only allow digits
    if (newValue === '' || /^\d+$/.test(newValue)) {
      setInputValue(newValue);
      setError('');
      
      // Auto-parse and update if valid
      if (newValue.trim() !== '') {
        const parsed = parseCountInput(newValue);
        if (parsed) {
          onValueChange(parsed);
        }
      } else {
        onValueChange('');
      }
    }
  };

  const handleBlur = () => {
    if (inputValue.trim() === '') {
      setInputValue('');
      onValueChange('');
      return;
    }

    const parsed = parseCountInput(inputValue);
    if (parsed) {
      setInputValue(formatCountForDisplay(parsed));
      onValueChange(parsed);
      setError('');
    } else {
      setError(getUIText('invalid_format', selectedLanguage) || 'Please enter a positive number');
    }
  };

  const handlePreset = (presetValue) => {
    setInputValue(formatCountForDisplay(presetValue));
    onValueChange(presetValue);
    setError('');
  };

  const presets = [
    { label: 'Have 2+', value: 'count2-' },
    { label: 'Have 5+', value: 'count5-' },
    { label: 'Have 10+', value: 'count10-' },
    { label: 'Have 20+', value: 'count20-' },
  ];

  return (
    <div className="col-span-full sm:col-span-2 lg:col-span-3">
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border-2 border-orange-200 dark:border-orange-800">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <h3 className="text-sm font-bold text-orange-900 dark:text-orange-100">
            Species Count
          </h3>
          <div className="group relative">
            <span className="text-xs text-orange-600 dark:text-orange-400 cursor-help">ℹ️</span>
            <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
              Find species where you have this many or more (e.g., 5 shows species you have 5+ of)
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2 mb-3">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePreset(preset.value)}
              className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-300 rounded-lg border border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors"
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
                inputMode="numeric"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                placeholder="e.g., 5"
                className={`w-full px-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                  error
                    ? 'border-red-400 dark:border-red-600'
                    : isIncluded
                    ? 'border-orange-400 dark:border-orange-500'
                    : isExcluded
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-300 dark:border-slate-600'
                } bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400`}
              />
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
          <p>Examples:</p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li><code className="bg-white/50 dark:bg-slate-800/50 px-1 rounded">2</code> = Find species with 2+ duplicates</li>
            <li><code className="bg-white/50 dark:bg-slate-800/50 px-1 rounded">5</code> = Find species with 5+ duplicates</li>
            <li><code className="bg-white/50 dark:bg-slate-800/50 px-1 rounded">10</code> = Find species with 10+ duplicates</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CustomSpeciesCountInput;

