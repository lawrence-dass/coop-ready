'use client';

import { FileText, Wrench, Briefcase, RotateCcw } from 'lucide-react';
import { SuggestionCard } from './SuggestionCard';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
} from '@/types/suggestions';

// ---------------------------------------------------------------------------
// Discriminated union props for type-safe section rendering
// ---------------------------------------------------------------------------

interface SummarySectionProps {
  section: 'summary';
  suggestion: SummarySuggestion | null;
}

interface SkillsSectionProps {
  section: 'skills';
  suggestion: SkillsSuggestion | null;
}

interface ExperienceSectionProps {
  section: 'experience';
  suggestion: ExperienceSuggestion | null;
}

type SectionVariant = SummarySectionProps | SkillsSectionProps | ExperienceSectionProps;

export type SuggestionSectionProps = SectionVariant & {
  /** Display label for section header */
  sectionLabel: string;

  /** Optional icon for section header */
  sectionIcon?: React.ReactNode;

  /** Loading state */
  loading?: boolean;

  /** Regenerating state (Story 6.7) */
  regenerating?: boolean;

  /** Regenerate handler (Story 6.7) */
  onRegenerate?: () => void;

  /** Additional className */
  className?: string;
};

// ---------------------------------------------------------------------------
// Default icons per section
// ---------------------------------------------------------------------------

const defaultIcons: Record<SuggestionSectionProps['section'], React.ReactNode> = {
  summary: <FileText className="h-5 w-5" />,
  skills: <Wrench className="h-5 w-5" />,
  experience: <Briefcase className="h-5 w-5" />,
};

// ---------------------------------------------------------------------------
// Helper: Generate deterministic suggestion ID (Story 7.4)
// ---------------------------------------------------------------------------

/**
 * Generates a unique suggestion ID based on section and index
 * Format: "sug_{section}_{index}"
 */
function generateSuggestionId(section: string, index: number): string {
  return `sug_${section}_${index}`;
}

// ---------------------------------------------------------------------------
// Shared section header
// ---------------------------------------------------------------------------

function SectionHeader({
  icon,
  label,
  onRegenerate,
  regenerating,
}: {
  icon: React.ReactNode;
  label: string;
  onRegenerate?: () => void;
  regenerating?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="text-indigo-600">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
      </div>
      {onRegenerate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onRegenerate}
              disabled={regenerating}
              aria-label={`Regenerate ${label} suggestions`}
              className="gap-2"
              data-testid="regenerate-button"
            >
              <RotateCcw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          </TooltipTrigger>
          <TooltipContent>Generate alternative suggestions for this section</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section body renderers (type-safe, no casts)
// ---------------------------------------------------------------------------

function SummaryBody({ suggestion }: { suggestion: SummarySuggestion }) {
  return (
    <div className="space-y-4">
      <SuggestionCard
        suggestionId={generateSuggestionId('summary', 0)}
        original={suggestion.original}
        suggested={suggestion.suggested}
        keywords={suggestion.ats_keywords_added}
        sectionType="summary"
      />
    </div>
  );
}

function SkillsBody({ suggestion }: { suggestion: SkillsSuggestion }) {
  return (
    <div className="space-y-4">
      <SuggestionCard
        suggestionId={generateSuggestionId('skills', 0)}
        original={suggestion.original}
        suggested={suggestion.summary}
        keywords={suggestion.matched_keywords}
        sectionType="skills"
      />

      {suggestion.skill_additions.length > 0 && (
        <SuggestionCard
          suggestionId={generateSuggestionId('skills', 1)}
          original="Missing skills"
          suggested={`Consider adding: ${suggestion.skill_additions.join(', ')}`}
          keywords={suggestion.skill_additions}
          sectionType="skills"
        />
      )}
    </div>
  );
}

function ExperienceBody({ suggestion }: { suggestion: ExperienceSuggestion }) {
  // Calculate global bullet index across all entries for consistent suggestion IDs
  let globalBulletIndex = 0;

  return (
    <div className="space-y-4">
      {suggestion.experience_entries.map((entry, entryIndex) => (
        <div key={`${entry.company}-${entryIndex}`} className="space-y-3">
          {/* Company/Role Header */}
          <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900">{entry.role}</h4>
            <p className="text-sm text-gray-600">
              {entry.company} &bull; {entry.dates}
            </p>
          </div>

          {/* Bullet suggestions */}
          {entry.suggested_bullets.map((bullet, bulletIndex) => {
            const suggestionId = generateSuggestionId('experience', globalBulletIndex);
            globalBulletIndex++;

            return (
              <SuggestionCard
                key={`${entry.company}-bullet-${bulletIndex}`}
                suggestionId={suggestionId}
                original={bullet.original}
                suggested={bullet.suggested}
                keywords={bullet.keywords_incorporated}
                metrics={bullet.metrics_added}
                sectionType="experience"
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Type-safe body renderer using discriminated union narrowing
// ---------------------------------------------------------------------------

function renderSectionBody(props: SectionVariant): React.ReactNode {
  switch (props.section) {
    case 'summary':
      return props.suggestion ? <SummaryBody suggestion={props.suggestion} /> : null;
    case 'skills':
      return props.suggestion ? <SkillsBody suggestion={props.suggestion} /> : null;
    case 'experience':
      return props.suggestion ? <ExperienceBody suggestion={props.suggestion} /> : null;
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * SuggestionSection Component
 *
 * Groups suggestions by section (Summary, Skills, Experience).
 * Renders section header with icon and displays SuggestionCard components.
 * Uses discriminated union props for type-safe rendering per section type.
 *
 * Story 6.5: Implement Suggestion Display UI
 * Story 6.7: Added regenerate button with loading state
 */
export function SuggestionSection(props: SuggestionSectionProps) {
  const {
    section,
    suggestion,
    sectionLabel,
    sectionIcon,
    loading = false,
    regenerating = false,
    onRegenerate,
    className
  } = props;

  // Don't render if no suggestion and not loading
  if (!suggestion && !loading) {
    return null;
  }

  const icon = sectionIcon ?? defaultIcons[section];

  // Loading state
  if (loading) {
    return (
      <section className={className} aria-busy="true" data-testid={`suggestions-${section}`}>
        <SectionHeader icon={icon} label={sectionLabel} onRegenerate={onRegenerate} regenerating={regenerating} />
        <div className="flex items-center justify-center py-12 border border-gray-200 rounded-lg bg-gray-50">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
            <p className="text-sm text-gray-600">Generating suggestions...</p>
          </div>
        </div>
      </section>
    );
  }

  // Regenerating state (Story 6.7)
  if (regenerating && suggestion) {
    return (
      <section className={className} aria-busy="true" data-testid={`suggestions-${section}`}>
        <SectionHeader icon={icon} label={sectionLabel} onRegenerate={onRegenerate} regenerating={regenerating} />
        <div className="relative">
          {/* Show existing suggestions with overlay */}
          <div className="opacity-50 pointer-events-none">
            {renderSectionBody(props)}
          </div>
          {/* Loading overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
              <p className="text-sm text-gray-600">Generating new suggestions...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!suggestion) {
    return null;
  }

  // Type-safe rendering via discriminated union narrowing on props
  return (
    <section className={className} data-testid={`suggestions-${section}`}>
      <SectionHeader icon={icon} label={sectionLabel} onRegenerate={onRegenerate} regenerating={regenerating} />
      {renderSectionBody(props)}
    </section>
  );
}
