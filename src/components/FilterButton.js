import { Plus, Minus } from 'lucide-react';
import Tooltip from './Tooltip';

const FilterButton = ({ filter, isIncluded, isExcluded, onToggleInclude, onToggleExclude }) => {
  return (
    <Tooltip filterId={filter.id}>
      <div
        className={`group flex items-center gap-2 p-3 min-h-[48px] rounded-xl transition-all duration-200 border-2 cursor-pointer touch-manipulation ${
          isIncluded 
            ? 'bg-blue-50 border-blue-400 shadow-sm dark:bg-blue-500/10 dark:border-blue-400/60'
            : isExcluded
            ? 'bg-red-50 border-red-400 shadow-sm dark:bg-red-500/10 dark:border-red-400/60'
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600'
        }`}
      >
        <span className={`text-sm font-medium flex-1 ${
          isIncluded ? 'text-blue-800 dark:text-blue-200' : isExcluded ? 'text-red-800 dark:text-red-200' : 'text-gray-800 dark:text-slate-100'
        }`}>
          {filter.label}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleInclude();
            }}
            className={`min-w-[48px] min-h-[48px] px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center active:scale-95 filter-button-plus ${
              isIncluded
                ? 'filter-button-plus-selected'
                : isExcluded
                ? 'filter-button-plus-disabled'
                : 'filter-button-plus-default'
            }`}
            title="Include"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExclude();
            }}
            className={`min-w-[48px] min-h-[48px] px-2 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center active:scale-95 filter-button-minus ${
              isExcluded
                ? 'filter-button-minus-selected'
                : isIncluded
                ? 'filter-button-minus-disabled'
                : 'filter-button-minus-default'
            }`}
            title="Exclude"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Tooltip>
  );
};

export default FilterButton;

