import { useState, useEffect } from 'react';
import { Plus, Minus, Tag, AlertTriangle } from 'lucide-react';
import { getUIText } from '../translations/uiTranslations';

const CustomTagInput = ({ 
  anyTaggedIncluded, 
  anyTaggedExcluded, 
  customTagValue,
  customTagIncluded,
  customTagExcluded,
  onAnyTaggedInclude, 
  onAnyTaggedExclude,
  onCustomTagInclude,
  onCustomTagExclude,
  onCustomTagValueChange,
  selectedLanguage = 'English' 
}) => {
  const [inputValue, setInputValue] = useState(customTagValue || '');

  useEffect(() => {
    setInputValue(customTagValue || '');
  }, [customTagValue]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    // Update the parent with the raw value (will be formatted as #tagname in search string)
    onCustomTagValueChange(newValue);
  };

  return (
    <div className="col-span-full sm:col-span-2 lg:col-span-3">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-sm font-bold text-purple-900 dark:text-purple-100">
            {getUIText('tags', selectedLanguage)}
          </h3>
        </div>

        {/* Any Tagged Pokemon Checkbox */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-800 dark:text-slate-100">
                {getUIText('any_tagged_pokemon', selectedLanguage)}
              </span>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button
                onClick={onAnyTaggedInclude}
                className={`min-w-[48px] min-h-[48px] px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center active:scale-95 filter-button-plus ${
                  anyTaggedIncluded
                    ? 'filter-button-plus-selected'
                    : anyTaggedExcluded
                    ? 'filter-button-plus-disabled'
                    : 'filter-button-plus-default'
                }`}
                title={getUIText('include', selectedLanguage)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={onAnyTaggedExclude}
                className={`min-w-[48px] min-h-[48px] px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center active:scale-95 filter-button-minus ${
                  anyTaggedExcluded
                    ? 'filter-button-minus-selected'
                    : anyTaggedIncluded
                    ? 'filter-button-minus-disabled'
                    : 'filter-button-minus-default'
                }`}
                title={getUIText('exclude', selectedLanguage)}
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
            {getUIText('any_tagged_pokemon_desc', selectedLanguage)}
          </p>
        </div>

        {/* Custom Tag Name Input */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-800 dark:text-slate-100 mb-2">
            {getUIText('custom_tag_name', selectedLanguage)}
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-mono">
                  #
                </span>
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder={getUIText('tag_name_placeholder', selectedLanguage)}
                  className={`w-full pl-8 pr-3 py-2 text-sm rounded-lg border-2 transition-colors ${
                    customTagIncluded
                      ? 'border-purple-400 dark:border-purple-500'
                      : customTagExcluded
                      ? 'border-red-400 dark:border-red-500'
                      : 'border-gray-300 dark:border-slate-600'
                  } bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400`}
                />
              </div>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button
                onClick={onCustomTagInclude}
                className={`min-w-[48px] min-h-[48px] px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center active:scale-95 filter-button-plus ${
                  customTagIncluded
                    ? 'filter-button-plus-selected'
                    : customTagExcluded
                    ? 'filter-button-plus-disabled'
                    : 'filter-button-plus-default'
                }`}
                title={getUIText('include', selectedLanguage)}
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={onCustomTagExclude}
                className={`min-w-[48px] min-h-[48px] px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center active:scale-95 filter-button-minus ${
                  customTagExcluded
                    ? 'filter-button-minus-selected'
                    : customTagIncluded
                    ? 'filter-button-minus-disabled'
                    : 'filter-button-minus-default'
                }`}
                title={getUIText('exclude', selectedLanguage)}
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Help Text and Warnings */}
        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">{getUIText('tag_case_sensitive_warning', selectedLanguage)}</p>
              <p className="text-gray-600 dark:text-gray-400">{getUIText('tag_spaces_allowed', selectedLanguage)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {getUIText('tag_help_text', selectedLanguage)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomTagInput;

