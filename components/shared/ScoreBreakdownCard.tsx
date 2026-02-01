'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import type { ScoreBreakdown, ATSScoreV2 } from '@/types/analysis';
import type { ATSScoreV21 } from '@/lib/scoring/types';

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

export function ScoreBreakdownCard({
  breakdown,
  scoreV2,
  scoreV21,
  className = '',
}: ScoreBreakdownCardProps) {
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
