'use client';

// Story 5.4: Missing Keyword Item Component with Expandable Guidance
import { useState } from 'react';
import { ExtractedKeyword } from '@/types/analysis';
import { AlertCircle } from 'lucide-react';
import { getKeywordGuidance } from '@/lib/utils/keywordGuidance';

interface MissingKeywordItemProps {
  keyword: ExtractedKeyword;
}

/**
 * Displays a single missing keyword with expandable actionable guidance
 *
 * Features:
 * - Priority-based color coding (high/medium/low)
 * - Expandable details section
 * - Actionable guidance (why/where/example)
 */
export function MissingKeywordItem({ keyword }: MissingKeywordItemProps) {
  const [expanded, setExpanded] = useState(false);

  const guidance = getKeywordGuidance(keyword);

  // Get priority-based styling
  const getPriorityBgColor = (importance: 'high' | 'medium' | 'low') => {
    switch (importance) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-amber-200 bg-amber-50';
      case 'low':
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  const getPriorityColor = (importance: 'high' | 'medium' | 'low') => {
    switch (importance) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-amber-600';
      case 'low':
        return 'text-yellow-600';
    }
  };

  const getPriorityTextColor = (importance: 'high' | 'medium' | 'low') => {
    switch (importance) {
      case 'high':
        return 'text-red-900';
      case 'medium':
        return 'text-amber-900';
      case 'low':
        return 'text-yellow-900';
    }
  };

  return (
    <div className={`rounded-lg border p-3 ${getPriorityBgColor(keyword.importance)}`}>
      <div className="flex items-start gap-2">
        <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 ${getPriorityColor(keyword.importance)}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className={`font-medium ${getPriorityTextColor(keyword.importance)}`}>{keyword.keyword}</p>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-600 hover:underline"
              aria-expanded={expanded}
              aria-label={`Show tips for ${keyword.keyword}`}
            >
              {expanded ? 'Hide details' : 'Show tips'}
            </button>
          </div>

          <p className="text-xs text-muted-foreground">{keyword.importance} priority</p>

          {/* Expandable Guidance */}
          {expanded && (
            <div className="mt-3 space-y-2 text-sm border-t pt-2">
              <div>
                <p className="font-semibold">Why it matters:</p>
                <p className="text-muted-foreground">{guidance.why}</p>
              </div>
              <div>
                <p className="font-semibold">Where to add:</p>
                <p className="text-muted-foreground">{guidance.where}</p>
              </div>
              <div>
                <p className="font-semibold">Example:</p>
                <p className="text-muted-foreground italic">{guidance.example}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
