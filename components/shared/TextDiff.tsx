/**
 * TextDiff Component
 *
 * Renders text differences with visual indicators showing insertions and deletions.
 * Uses word-level diffing with accessible color coding and icons.
 *
 * Features:
 * - Green highlighting for insertions with + icon
 * - Red highlighting with strikethrough for deletions with - icon
 * - Normal styling for unchanged text
 * - WCAG AA compliant (color + icons + text)
 * - Handles long text with word wrapping
 */

'use client';

import { diffTexts, type DiffChunk } from '@/lib/utils/textDiff';
import { Plus, Minus } from 'lucide-react';
import { useMemo } from 'react';

interface TextDiffProps {
  /** Original text before changes */
  originalText: string;
  /** Suggested text after changes */
  suggestedText: string;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Renders a single diff chunk with appropriate styling and icons.
 */
function DiffChunkRenderer({ chunk }: { chunk: DiffChunk }) {
  const { type, value } = chunk;

  // Handle empty chunks
  if (!value.trim()) {
    return <span className="whitespace-pre-wrap">{value}</span>;
  }

  switch (type) {
    case 'insert':
      return (
        <ins
          className="bg-green-100 text-green-900 px-0.5 rounded inline-flex items-baseline gap-0.5 no-underline"
          aria-label="Added text"
        >
          <Plus className="w-3 h-3 inline-block flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span className="whitespace-pre-wrap">{value}</span>
        </ins>
      );

    case 'delete':
      return (
        <del
          className="bg-red-100 text-red-900 line-through px-0.5 rounded inline-flex items-baseline gap-0.5"
          aria-label="Removed text"
        >
          <Minus className="w-3 h-3 inline-block flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span className="whitespace-pre-wrap">{value}</span>
        </del>
      );

    case 'equal':
      return <span className="text-gray-900 whitespace-pre-wrap">{value}</span>;

    default:
      return <span className="whitespace-pre-wrap">{value}</span>;
  }
}

/**
 * Main TextDiff component showing before/after comparison.
 *
 * Calculates diffs on-demand and memoizes for performance.
 * Renders chunks with visual indicators for insertions and deletions.
 */
export function TextDiff({
  originalText,
  suggestedText,
  className = '',
}: TextDiffProps) {
  // Memoize diff calculation to avoid recalculation on every render
  const diffChunks = useMemo(
    () => diffTexts(originalText, suggestedText),
    [originalText, suggestedText]
  );

  // Handle edge case: No text to compare
  if (!originalText && !suggestedText) {
    return (
      <div className={`text-gray-500 text-sm italic ${className}`}>
        No text to compare
      </div>
    );
  }

  // Handle edge case: Identical texts
  if (originalText === suggestedText) {
    return (
      <div className={`text-gray-700 ${className}`}>
        <p className="text-sm italic text-gray-500 mb-2">
          No changes suggested for this section
        </p>
        <p className="text-sm">{originalText}</p>
      </div>
    );
  }

  return (
    <div className={`text-sm leading-relaxed ${className}`}>
      <div className="space-y-1">
        {diffChunks.map((chunk, index) => (
          <DiffChunkRenderer key={`${chunk.type}-${index}`} chunk={chunk} />
        ))}
      </div>
    </div>
  );
}

/**
 * Side-by-side comparison showing original on left, suggested on right.
 * Stacks vertically on mobile.
 */
export function SideBySideDiff({
  originalText,
  suggestedText,
  className = '',
}: TextDiffProps) {
  return (
    <div
      className={`relative grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 ${className}`}
    >
      {/* Original (Left/Top) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b">
          <h4 className="font-semibold text-gray-900">Original</h4>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            Before
          </span>
        </div>
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {originalText || (
            <span className="italic text-gray-400">No original text</span>
          )}
        </div>
      </div>

      {/* Divider (visible on desktop) */}
      <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200" />

      {/* Suggested (Right/Bottom) */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b">
          <h4 className="font-semibold text-gray-900">Suggested</h4>
          <span className="text-xs text-gray-500 bg-blue-100 px-2 py-0.5 rounded">
            After
          </span>
        </div>
        <TextDiff
          originalText={originalText}
          suggestedText={suggestedText}
        />
      </div>
    </div>
  );
}
