"use client";

/**
 * SuggestionTypeFilter - Filter Buttons/Tabs Component
 * Allows users to filter suggestions by type (controlled component)
 */

import { Button } from "@/components/ui/button";
import {
  ALL_SUGGESTION_TYPES,
  SUGGESTION_TYPE_META,
} from "@/lib/utils/suggestion-types";

interface SuggestionTypeFilterProps {
  selectedTypes: string[];
  onFilterChange: (types: string[]) => void;
}

export function SuggestionTypeFilter({
  selectedTypes,
  onFilterChange,
}: SuggestionTypeFilterProps) {
  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onFilterChange(selectedTypes.filter((t) => t !== type));
    } else {
      onFilterChange([...selectedTypes, type]);
    }
  };

  const clearFilters = () => {
    onFilterChange([]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_SUGGESTION_TYPES.map((type) => {
        const meta = SUGGESTION_TYPE_META[type];
        const isSelected = selectedTypes.includes(type);

        return (
          <Button
            key={type}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => toggleType(type)}
            className={isSelected ? meta.badge : ""}
          >
            {meta.label}
          </Button>
        );
      })}
      {selectedTypes.length > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
