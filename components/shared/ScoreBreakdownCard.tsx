'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, ChevronDown, XCircle, Lightbulb, Target, AlertCircle } from 'lucide-react';
import type { ScoreBreakdown, ATSScoreV2 } from '@/types/analysis';
import type {
  ATSScoreV21,
  KeywordScoreResultV21,
  QualificationFitResult,
  ContentQualityResult,
  SectionScoreResultV21,
  FormatScoreResultV21,
} from '@/lib/scoring/types';

export interface ScoreBreakdownCardProps {
  breakdown?: ScoreBreakdown; // V1 backward compatibility
  scoreV2?: ATSScoreV2; // V2 full score object (4 components)
  scoreV21?: ATSScoreV21; // V2.1 full score object (5 components)
  className?: string;
}

interface ComponentConfig {
  name: string;
  description: string;
  tooltip: string;
}

// V2 Component configurations (4 components)
const COMPONENTS_V2: Record<string, ComponentConfig> = {
  keywords: {
    name: 'Keywords',
    description:
      'Weighted keyword matching based on importance and match type (exact, fuzzy, semantic).',
    tooltip:
      'Measures how well your resume matches job description keywords. Higher importance keywords count more. Exact matches score higher than fuzzy or semantic matches.',
  },
  experience: {
    name: 'Experience Quality',
    description:
      'Evaluates quantification (metrics), action verb strength, and keyword density in experience bullets.',
    tooltip:
      'Analyzes experience section quality: presence of quantifiable results (numbers, percentages), use of strong action verbs, and keyword usage throughout bullets.',
  },
  sections: {
    name: 'Sections',
    description:
      'Checks for essential resume sections and evaluates content density.',
    tooltip:
      'Verifies presence of Summary, Skills, and Experience sections with sufficient content depth.',
  },
  format: {
    name: 'Format',
    description:
      'Detects ATS parseability signals and penalizes outdated formats.',
    tooltip:
      'Assesses resume formatting for ATS compatibility: contact info, parseable dates, section headers, bullet structure. Penalizes outdated elements like "Objective" sections.',
  },
};

// V2.1 Component configurations with descriptions from specification
const COMPONENTS_V21: Record<string, ComponentConfig> = {
  keywords: {
    name: 'Keywords',
    description:
      'Primary driver of ATS filtering. Distinguishes required vs preferred keywords with weighted scoring based on importance, match type, and placement.',
    tooltip:
      'Measures how well your resume matches job description keywords. Required keywords are weighted heavily, with bonuses for preferred keywords and penalties for missing critical terms.',
  },
  qualificationFit: {
    name: 'Qualification Fit',
    description:
      'Checks if resume meets JD\'s explicit requirements for degree, years of experience, and required certifications.',
    tooltip:
      'Evaluates whether you meet the minimum qualifications: education level, years of experience, and required certifications.',
  },
  contentQuality: {
    name: 'Content Quality',
    description:
      'Evaluates bullet-point content across all sections. Measures quantification quality, action verb strength, and keyword density.',
    tooltip:
      'Analyzes the quality of your experience bullets: presence of metrics and quantifiable results, use of strong action verbs, and keyword density throughout content.',
  },
  sections: {
    name: 'Sections',
    description:
      'Evaluates resume structure and content density. For co-op students, also evaluates education quality.',
    tooltip:
      'Checks for essential resume sections (Summary, Skills, Experience, Education) and evaluates content completeness and depth in each section.',
  },
  format: {
    name: 'Format',
    description:
      'Detects ATS parseability signals, including penalties for outdated formats.',
    tooltip:
      'Assesses resume formatting for ATS compatibility: contact information, parseable dates, clear section headers, bullet structure, and modern format elements (LinkedIn, GitHub). Penalizes outdated elements like "Objective" sections.',
  },
};

// V1 backward compatibility configurations
const CATEGORIES_V1: Record<keyof ScoreBreakdown, ComponentConfig> = {
  keywordScore: {
    name: 'Keyword Alignment',
    description: 'Measures keyword match between resume and job description',
    tooltip:
      'Percentage of job description keywords found in your resume. Higher match = better ATS compatibility.',
  },
  sectionCoverageScore: {
    name: 'Section Coverage',
    description:
      'Checks if your resume includes essential sections: Summary, Skills, and Experience',
    tooltip:
      'Checks if your resume includes essential sections: Summary, Skills, and Experience.',
  },
  contentQualityScore: {
    name: 'Content Quality',
    description:
      'AI evaluation of how relevant, clear, and impactful your resume content is',
    tooltip:
      'AI evaluation of how relevant, clear, and impactful your resume content is for this role.',
  },
};

/**
 * Returns the color class for a score value based on UX design spec ranges:
 * - 0-39%: Red
 * - 40-69%: Amber
 * - 70-100%: Green
 */
function getScoreColorClass(score: number): string {
  if (score < 40) return 'bg-red-500';
  if (score < 70) return 'bg-amber-500';
  return 'bg-green-500';
}

// ============================================================================
// HELPER FUNCTIONS TO EXTRACT ISSUES AND SUGGESTIONS FROM COMPONENT DETAILS
// ============================================================================

interface IssuesAndSuggestions {
  issues: string[];
  suggestions: string[];
}

function getKeywordIssues(details: KeywordScoreResultV21): IssuesAndSuggestions {
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (details.details.missingRequired.length > 0) {
    const missing = details.details.missingRequired;
    const displayList = missing.slice(0, 3).join(', ');
    const suffix = missing.length > 3 ? `, +${missing.length - 3} more` : '';
    issues.push(`Missing ${missing.length} required keyword${missing.length > 1 ? 's' : ''}: ${displayList}${suffix}`);
  }

  if (details.breakdown.penaltyMultiplier < 1) {
    const penaltyPercent = Math.round((1 - details.breakdown.penaltyMultiplier) * 100);
    suggestions.push(`Add missing required keywords to remove the ${penaltyPercent}% score cap`);
  }

  if (details.details.missingPreferred.length > 0) {
    const missing = details.details.missingPreferred;
    const displayList = missing.slice(0, 3).join(', ');
    const suffix = missing.length > 3 ? `, +${missing.length - 3} more` : '';
    suggestions.push(`Consider adding preferred keywords: ${displayList}${suffix}`);
  }

  return { issues, suggestions };
}

function getQualificationIssues(details: QualificationFitResult): IssuesAndSuggestions {
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (details.details.degreeNote) {
    issues.push(details.details.degreeNote);
  }
  if (details.details.experienceNote) {
    issues.push(details.details.experienceNote);
  }
  if (details.details.certificationsMissing.length > 0) {
    issues.push(`Missing certifications: ${details.details.certificationsMissing.join(', ')}`);
  }

  // Add suggestions based on what's not met
  if (!details.details.degreeMet && !details.details.degreeNote) {
    suggestions.push('Ensure your education section clearly states your degree level and field');
  }
  if (!details.details.experienceMet && !details.details.experienceNote) {
    suggestions.push('Highlight relevant experience that demonstrates years in similar roles');
  }

  return { issues, suggestions };
}

function getContentQualityIssues(details: ContentQualityResult): IssuesAndSuggestions {
  const issues: string[] = [];
  const suggestions: string[] = [];

  const bulletsWithoutMetrics = details.details.totalBullets - details.details.bulletsWithMetrics;
  if (bulletsWithoutMetrics > 0 && details.details.totalBullets > 0) {
    issues.push(`${bulletsWithoutMetrics} of ${details.details.totalBullets} bullet${details.details.totalBullets > 1 ? 's' : ''} lack quantifiable metrics`);
    suggestions.push('Add numbers, percentages, or measurable outcomes to your bullet points');
  }

  if (details.details.weakVerbCount > 0) {
    issues.push(`${details.details.weakVerbCount} weak action verb${details.details.weakVerbCount > 1 ? 's' : ''} detected`);
    suggestions.push('Replace weak verbs (helped, worked, did) with strong verbs (led, developed, achieved)');
  }

  if (details.details.keywordsMissing.length > 0) {
    const missing = details.details.keywordsMissing;
    const displayList = missing.slice(0, 3).join(', ');
    const suffix = missing.length > 3 ? `, +${missing.length - 3} more` : '';
    suggestions.push(`Incorporate these keywords into your content: ${displayList}${suffix}`);
  }

  return { issues, suggestions };
}

function getSectionIssues(details: SectionScoreResultV21): IssuesAndSuggestions {
  const issues: string[] = [];
  const suggestions: string[] = [];

  Object.entries(details.breakdown).forEach(([section, data]) => {
    if (!data.present) {
      issues.push(`Missing "${section}" section`);
    } else if (!data.meetsThreshold && data.issues) {
      issues.push(...data.issues);
    }
  });

  if (details.educationQuality?.suggestions) {
    suggestions.push(...details.educationQuality.suggestions);
  }

  return { issues, suggestions };
}

function getFormatIssues(details: FormatScoreResultV21): IssuesAndSuggestions {
  return {
    issues: details.issues,
    suggestions: details.warnings,
  };
}

type ComponentKey = 'keywords' | 'qualificationFit' | 'contentQuality' | 'sections' | 'format';

function getComponentIssues(
  key: ComponentKey,
  details: KeywordScoreResultV21 | QualificationFitResult | ContentQualityResult | SectionScoreResultV21 | FormatScoreResultV21
): IssuesAndSuggestions {
  switch (key) {
    case 'keywords':
      return getKeywordIssues(details as KeywordScoreResultV21);
    case 'qualificationFit':
      return getQualificationIssues(details as QualificationFitResult);
    case 'contentQuality':
      return getContentQualityIssues(details as ContentQualityResult);
    case 'sections':
      return getSectionIssues(details as SectionScoreResultV21);
    case 'format':
      return getFormatIssues(details as FormatScoreResultV21);
    default:
      return { issues: [], suggestions: [] };
  }
}

export function ScoreBreakdownCard({
  breakdown,
  scoreV2,
  scoreV21,
  className = '',
}: ScoreBreakdownCardProps) {
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);

  // Determine version
  const isV21 = scoreV21 && scoreV21.metadata?.version === 'v2.1';
  const isV2 = !isV21 && scoreV2 && scoreV2.metadata?.version === 'v2';

  // Render V2.1 breakdown (5 components)
  if (isV21) {
    const components = scoreV21.breakdownV21;
    const componentKeys: Array<keyof typeof components> = [
      'keywords',
      'qualificationFit',
      'contentQuality',
      'sections',
      'format',
    ];

    // Get baseline weights from spec
    const BASELINE_WEIGHTS_V21 = {
      keywords: 0.40,
      qualificationFit: 0.15,
      contentQuality: 0.20,
      sections: 0.15,
      format: 0.10,
    };

    // Format role and seniority for display
    const formatRole = (role: string) => {
      return role.split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    };

    const formatSeniority = (seniority: string) => {
      return seniority.charAt(0).toUpperCase() + seniority.slice(1);
    };

    return (
      <TooltipProvider delayDuration={200}>
        <Card className={className}>
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Role Detection Info (if weights were adjusted) */}
            {scoreV21.metadata && (
              (() => {
                const actualWeights = scoreV21.metadata.weightsUsed;
                const hasAdjustments = Object.keys(actualWeights).some(
                  key => actualWeights[key as keyof typeof actualWeights] !== BASELINE_WEIGHTS_V21[key as keyof typeof BASELINE_WEIGHTS_V21]
                );

                return hasAdjustments ? (
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg flex items-start gap-2">
                    <Info className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Component weights adjusted for{' '}
                      <strong>{formatRole(scoreV21.metadata.detectedRole)}</strong> role
                      ({formatSeniority(scoreV21.metadata.detectedSeniority)} level)
                    </p>
                  </div>
                ) : null;
              })()
            )}

            <div className="space-y-4">
              {componentKeys.map((key) => {
                const component = components[key];
                const config = COMPONENTS_V21[key];
                const score = Math.round(component.score);
                const weight = component.weight;
                const contribution = Math.round(component.weighted);
                const colorClass = getScoreColorClass(score);
                const isExpanded = expandedComponent === key;
                const { issues, suggestions } = getComponentIssues(key, component.details);
                const totalIssues = issues.length + suggestions.length;

                return (
                  <div
                    key={key}
                    className={`space-y-2 p-3 -mx-3 rounded-lg transition-colors ${
                      isExpanded ? 'bg-slate-50' : ''
                    }`}
                  >
                    {/* Header row with name, info, weight */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {config.name}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              role="button"
                              tabIndex={0}
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label={`More info about ${config.name}`}
                            >
                              <Info className="h-3.5 w-3.5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">
                              {config.tooltip}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                        {!isExpanded && totalIssues > 0 && (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <AlertCircle className="h-3 w-3" />
                            {totalIssues} {totalIssues === 1 ? 'item' : 'items'}
                          </span>
                        )}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm text-gray-500 font-mono cursor-help">
                            ×{weight.toFixed(2)} = {contribution}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {weight !== BASELINE_WEIGHTS_V21[key] ? (
                            <p className="text-xs">
                              Adjusted from {BASELINE_WEIGHTS_V21[key].toFixed(2)} for {formatRole(scoreV21.metadata.detectedRole)} role
                            </p>
                          ) : (
                            <p className="text-xs">
                              Baseline weight (no adjustment)
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Progress bar row */}
                    <div className="flex items-center gap-3">
                      <div
                        role="progressbar"
                        aria-valuenow={score}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${config.name} score: ${score} percent`}
                        className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 flex-1"
                      >
                        <div
                          className={`h-full transition-all ${colorClass}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">
                        {score}
                      </span>
                    </div>

                    {/* Description with expand/collapse button */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-gray-500 flex-1">{config.description}</p>
                      <button
                        type="button"
                        onClick={() => setExpandedComponent(isExpanded ? null : key)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors shrink-0"
                        aria-expanded={isExpanded}
                        aria-controls={`${key}-details`}
                      >
                        <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div
                        id={`${key}-details`}
                        className="mt-3 pt-3 border-t border-gray-200 space-y-3"
                      >
                        {issues.length === 0 && suggestions.length === 0 ? (
                          <p className="text-xs text-green-600 flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            No issues detected
                          </p>
                        ) : (
                          <>
                            {/* Issues List */}
                            {issues.length > 0 && (
                              <div className="space-y-1.5">
                                {issues.map((issue, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs">
                                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-gray-700">{issue}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Suggestions List */}
                            {suggestions.length > 0 && (
                              <div className="space-y-1.5">
                                {suggestions.map((suggestion, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs">
                                    <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    <span className="text-gray-700">{suggestion}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Top Priorities Section */}
            {scoreV21.actionItems.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4" />
                  Top Priorities
                </h3>
                <div className="space-y-2">
                  {scoreV21.actionItems.slice(0, 5).map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-2 rounded-md bg-slate-50"
                    >
                      <Badge
                        variant={item.priority === 'critical' ? 'destructive' : 'secondary'}
                        className="text-[10px] px-1.5 py-0 shrink-0"
                      >
                        {item.priority}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700">{item.message}</p>
                        <p className="text-[10px] text-green-600 mt-0.5">
                          +{item.potentialImpact} pts potential
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  // Render V2 breakdown (4 components)
  if (isV2) {
    const components = scoreV2.breakdownV2;
    const componentKeys: Array<keyof typeof components> = [
      'keywords',
      'experience',
      'sections',
      'format',
    ];

    // V2 weights
    const V2_WEIGHTS = {
      keywords: 0.50,
      experience: 0.20,
      sections: 0.15,
      format: 0.15,
    };

    return (
      <TooltipProvider delayDuration={200}>
        <Card className={className}>
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {componentKeys.map((key) => {
                const component = components[key];
                const config = COMPONENTS_V2[key];
                const score = Math.round(component.score);
                const weight = V2_WEIGHTS[key];
                const contribution = Math.round(score * weight);
                const colorClass = getScoreColorClass(score);

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {config.name}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label={`More info about ${config.name}`}
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">
                              {config.tooltip}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-sm text-gray-500 font-mono">
                        ×{weight.toFixed(2)} = {contribution}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        role="progressbar"
                        aria-valuenow={score}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${config.name} score: ${score} percent`}
                        className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 flex-1"
                      >
                        <div
                          className={`h-full transition-all ${colorClass}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">
                        {score}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500">{config.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  }

  // Fallback: Render V1 breakdown (3 components) for backward compatibility
  if (!breakdown) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Card className={className}>
        <CardHeader>
          <CardTitle>Score Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(Object.keys(CATEGORIES_V1) as Array<keyof ScoreBreakdown>).map(
              (key) => {
                const category = CATEGORIES_V1[key];
                const score = breakdown[key];
                const colorClass = getScoreColorClass(score);

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {category.name}
                        </span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-gray-400 hover:text-gray-600 transition-colors"
                              aria-label={`More info about ${category.name}`}
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">
                              {category.tooltip}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <span className="text-sm text-gray-500">
                        {/* V1 weights - shown for backward compatibility */}
                        {key === 'keywordScore' && '50% weight'}
                        {key === 'sectionCoverageScore' && '25% weight'}
                        {key === 'contentQualityScore' && '25% weight'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        role="progressbar"
                        aria-valuenow={score}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${category.name} score: ${score} percent`}
                        className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 flex-1"
                      >
                        <div
                          className={`h-full transition-all ${colorClass}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">
                        {score}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
