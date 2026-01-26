'use client';

// Story 5.4: Priority Filter Chips Component
import { ExtractedKeyword } from '@/types/analysis';

export type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

interface PriorityFilterChipsProps {
  missing: ExtractedKeyword[];
  activeFilter: PriorityFilter;
  onFilterChange: (filter: PriorityFilter) => void;
}

/**
 * Filter chips for gap analysis by priority
 *
 * Allows filtering missing keywords by priority level:
 * - All: Show all keywords
 * - High: Show only high priority keywords
 * - Medium: Show only medium priority keywords
 * - Low: Show only low priority keywords
 */
export function PriorityFilterChips({ missing, activeFilter, onFilterChange }: PriorityFilterChipsProps) {
  const counts = {
    all: missing.length,
    high: missing.filter((k) => k.importance === 'high').length,
    medium: missing.filter((k) => k.importance === 'medium').length,
    low: missing.filter((k) => k.importance === 'low').length,
  };

  const filters: Array<{ value: PriorityFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'high', label: 'High Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'low', label: 'Low Priority' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeFilter === filter.value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {filter.label} ({counts[filter.value]})
        </button>
      ))}
    </div>
  );
}
