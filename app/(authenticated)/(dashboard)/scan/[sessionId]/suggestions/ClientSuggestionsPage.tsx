'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SuggestionCard } from '@/components/shared/SuggestionCard';
import { ScoreComparisonSection } from './ScoreComparisonSection';
import { SectionSummaryCard } from './SectionSummaryCard';
import { CompareUploadDialog } from '@/components/scan/CompareUploadDialog';
import { StructuralSuggestionsBanner } from '@/components/shared/StructuralSuggestionsBanner';
import { ROUTES } from '@/lib/constants/routes';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
  EducationSuggestion,
  ProjectsSuggestion,
  StructuralSuggestion,
} from '@/types/suggestions';
import type { ATSScore } from '@/types/analysis';
import type { CandidateType } from '@/lib/scoring/types';

interface SessionData {
  id: string;
  createdAt: string;
  resumeContent: string;
  jdContent: string;
  analysis: {
    score: ATSScore;
    keywordAnalysis: any;
  } | null;
  suggestions: {
    summary?: SummarySuggestion[];
    skills?: SkillsSuggestion[];
    experience?: ExperienceSuggestion[];
    education?: EducationSuggestion[];
    projects?: ProjectsSuggestion[];
  };
  preferences: any;
  anonymousId: string | null;
  userId: string;
  comparedAtsScore?: ATSScore | null;
  candidateType?: CandidateType | null;
  structuralSuggestions?: StructuralSuggestion[];
}

interface ClientSuggestionsPageProps {
  session: SessionData;
}

type SectionType = 'summary' | 'skills' | 'experience' | 'education' | 'projects';

// Tab order configuration by candidate type
const TAB_ORDER: Record<CandidateType, SectionType[]> = {
  coop: ['skills', 'education', 'projects', 'experience', 'summary'],
  fulltime: ['summary', 'skills', 'experience', 'projects', 'education'],
  career_changer: ['summary', 'skills', 'education', 'projects', 'experience'],
};

const TAB_LABELS: Record<SectionType, string> = {
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
};

export function ClientSuggestionsPage({ session }: ClientSuggestionsPageProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Extract suggestions by section
  const summarySuggestions = session.suggestions.summary || [];
  const skillsSuggestions = session.suggestions.skills || [];
  const experienceSuggestions = session.suggestions.experience || [];
  const educationSuggestions = session.suggestions.education || [];
  const projectsSuggestions = session.suggestions.projects || [];

  // Calculate total suggestions per section
  const summarySuggestionsCount = summarySuggestions.length;
  const skillsSuggestionsCount = skillsSuggestions.reduce((total, skillSugg) => {
    return total + (skillSugg.skill_additions?.length || 0) + (skillSugg.missing_but_relevant?.length || 0);
  }, 0);
  const experienceSuggestionsCount = experienceSuggestions.reduce((total, expSugg) => {
    return total + expSugg.experience_entries.reduce((entryTotal, entry) => {
      return entryTotal + (entry.suggested_bullets?.length || 0);
    }, 0);
  }, 0);
  const educationSuggestionsCount = educationSuggestions.reduce((total, eduSugg) => {
    return total + eduSugg.education_entries.reduce((entryTotal, entry) => {
      return entryTotal + (entry.suggested_bullets?.length || 0);
    }, 0);
  }, 0);
  const projectsSuggestionsCount = projectsSuggestions.reduce((total, projSugg) => {
    return total + projSugg.project_entries.reduce((entryTotal, entry) => {
      return entryTotal + (entry.suggested_bullets?.length || 0);
    }, 0);
  }, 0);

  // Calculate raw potential points per section
  const summaryRawPoints = summarySuggestions.reduce((sum, s) => sum + (s.point_value || 0), 0);
  const skillsRawPoints = skillsSuggestions.reduce((sum, s) => sum + (s.total_point_value || 0), 0);
  const experienceRawPoints = experienceSuggestions.reduce((sum, s) => sum + (s.total_point_value || 0), 0);
  const educationRawPoints = educationSuggestions.reduce((sum, s) => sum + (s.total_point_value || 0), 0);
  const projectsRawPoints = projectsSuggestions.reduce((sum, s) => sum + (s.total_point_value || 0), 0);

  const totalRawPoints = summaryRawPoints + skillsRawPoints + experienceRawPoints + educationRawPoints + projectsRawPoints;
  const originalScore = session.analysis?.score.overall || 0;

  // Calculate achievable gain (capped at 100)
  const projectedScore = Math.min(originalScore + totalRawPoints, 100);
  const achievableGain = projectedScore - originalScore;

  // Calculate effective (proportional) points per section
  // Formula: effectivePoints = (rawPoints / totalRawPoints) * achievableGain
  const calculateEffectivePoints = (rawPoints: number): number => {
    if (totalRawPoints === 0) return 0;
    return Math.round((rawPoints / totalRawPoints) * achievableGain);
  };

  const summaryEffectivePoints = calculateEffectivePoints(summaryRawPoints);
  const skillsEffectivePoints = calculateEffectivePoints(skillsRawPoints);
  const experienceEffectivePoints = calculateEffectivePoints(experienceRawPoints);
  const educationEffectivePoints = calculateEffectivePoints(educationRawPoints);
  const projectsEffectivePoints = calculateEffectivePoints(projectsRawPoints);

  // Build counts and effectivePoints lookups for data-driven tabs
  const counts: Record<SectionType, number> = {
    summary: summarySuggestionsCount,
    skills: skillsSuggestionsCount,
    experience: experienceSuggestionsCount,
    education: educationSuggestionsCount,
    projects: projectsSuggestionsCount,
  };

  const effectivePoints: Record<SectionType, number> = {
    summary: summaryEffectivePoints,
    skills: skillsEffectivePoints,
    experience: experienceEffectivePoints,
    education: educationEffectivePoints,
    projects: projectsEffectivePoints,
  };

  // Get ordered tabs based on candidate type, filtering to sections with data
  const candidateType = session.candidateType || 'fulltime';
  const orderedSections = TAB_ORDER[candidateType];
  const orderedTabs = orderedSections.filter((section) => counts[section] > 0);

  // Dynamic grid columns based on visible tab count
  const GRID_COLS: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  };
  const gridCols = GRID_COLS[orderedTabs.length] || 'grid-cols-4';

  // Active section defaults to first ordered tab
  const [activeSection, setActiveSection] = useState<SectionType>(orderedTabs[0] || 'summary');

  // For backward compatibility with ScoreComparisonSection
  const totalPotentialPoints = totalRawPoints;

  const handleBackToResults = () => {
    router.push(ROUTES.APP.SCAN.SESSION(session.id));
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Optimization Suggestions</h1>
          <p className="mt-2 text-gray-600">
            Review and apply suggestions to improve your ATS score
          </p>
        </div>

        {/* Score Comparison Section */}
        <ScoreComparisonSection
          originalScore={originalScore}
          potentialPoints={totalPotentialPoints}
        />

        {/* Structural Suggestions Banner */}
        <StructuralSuggestionsBanner suggestions={session.structuralSuggestions ?? []} />

        {/* Section Navigation Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Suggestions by Section</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeSection} onValueChange={(val) => setActiveSection(val as SectionType)}>
              <TabsList className={`grid w-full ${gridCols}`}>
                {orderedTabs.map((section) => {
                  const isCoopSummary = section === 'summary' && candidateType === 'coop';
                  return (
                    <TabsTrigger
                      key={section}
                      value={section}
                      className={`relative ${isCoopSummary ? 'opacity-60' : ''}`}
                    >
                      {TAB_LABELS[section]}
                      {counts[section] > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {counts[section]}
                        </Badge>
                      )}
                      {isCoopSummary && (
                        <Badge variant="outline" className="ml-1 text-xs opacity-60">
                          Optional
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Summary Section */}
              <TabsContent value="summary" className="mt-6 space-y-6">
                <SectionSummaryCard
                  sectionName="Summary"
                  suggestionCount={summarySuggestionsCount}
                  potentialPoints={summaryEffectivePoints}
                  description="Optimize your professional summary with targeted keywords and compelling language"
                />

                {summarySuggestionsCount === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No summary suggestions available for this session.
                  </div>
                )}

                {summarySuggestions.map((suggestion, index) => (
                  <SuggestionCard
                    key={`summary-${index}`}
                    suggestionId={`sug_summary_${index}`}
                    original={suggestion.original}
                    suggested={suggestion.suggested}
                    suggestedCompact={suggestion.suggested_compact}
                    originalWordCount={suggestion.original_word_count}
                    compactWordCount={suggestion.compact_word_count}
                    fullWordCount={suggestion.full_word_count}
                    points={suggestion.point_value}
                    impact={suggestion.impact}
                    keywords={suggestion.ats_keywords_added}
                    sectionType="summary"
                    explanation={suggestion.explanation}
                  />
                ))}
              </TabsContent>

              {/* Skills Section */}
              <TabsContent value="skills" className="mt-6 space-y-6">
                <SectionSummaryCard
                  sectionName="Skills"
                  suggestionCount={skillsSuggestionsCount}
                  potentialPoints={skillsEffectivePoints}
                  description="Add relevant skills from the job description to improve keyword matching"
                />

                {skillsSuggestionsCount === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No skills suggestions available for this session.
                  </div>
                )}

                {skillsSuggestions.map((skillSugg, index) => (
                  <div key={`skills-${index}`} className="space-y-4">
                    {/* Skills additions */}
                    {skillSugg.skill_additions && skillSugg.skill_additions.length > 0 && (
                      <SuggestionCard
                        suggestionId={`sug_skills_additions_${index}`}
                        original={skillSugg.original}
                        suggested={`Add these skills: ${skillSugg.skill_additions.join(', ')}`}
                        points={skillSugg.total_point_value}
                        keywords={skillSugg.skill_additions}
                        sectionType="skills"
                        explanation={skillSugg.explanation}
                      />
                    )}

                    {/* Missing but relevant skills */}
                    {skillSugg.missing_but_relevant && skillSugg.missing_but_relevant.length > 0 && (
                      <div className="space-y-4">
                        {skillSugg.missing_but_relevant.map((skillItem, skillIndex) => (
                          <SuggestionCard
                            key={`skills-missing-${index}-${skillIndex}`}
                            suggestionId={`sug_skills_missing_${index}_${skillIndex}`}
                            original="Not currently listed in your skills"
                            suggested={`Add: ${skillItem.skill}`}
                            points={skillItem.point_value}
                            impact={skillItem.impact}
                            keywords={[skillItem.skill]}
                            sectionType="skills"
                            explanation={skillItem.reason}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>

              {/* Experience Section */}
              <TabsContent value="experience" className="mt-6 space-y-6">
                <SectionSummaryCard
                  sectionName="Experience"
                  suggestionCount={experienceSuggestionsCount}
                  potentialPoints={experienceEffectivePoints}
                  description="Enhance your work experience with quantified achievements and relevant keywords"
                />

                {experienceSuggestionsCount === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No experience suggestions available for this session.
                  </div>
                )}

                {experienceSuggestions.map((expSugg, index) => (
                  <div key={`experience-${index}`} className="space-y-6">
                    {expSugg.experience_entries.map((entry, entryIndex) => (
                      <div key={`entry-${index}-${entryIndex}`} className="space-y-4">
                        {/* Entry header */}
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {entry.role} at {entry.company}
                          </h3>
                          <p className="text-sm text-gray-500">{entry.dates}</p>
                        </div>

                        {/* Suggested bullets */}
                        {entry.suggested_bullets.map((bullet, bulletIndex) => (
                          <SuggestionCard
                            key={`bullet-${index}-${entryIndex}-${bulletIndex}`}
                            suggestionId={`sug_experience_${index}_${entryIndex}_${bulletIndex}`}
                            original={bullet.original}
                            suggested={bullet.suggested}
                            suggestedCompact={bullet.suggested_compact}
                            originalWordCount={bullet.original_word_count}
                            compactWordCount={bullet.compact_word_count}
                            fullWordCount={bullet.full_word_count}
                            points={bullet.point_value}
                            impact={bullet.impact}
                            keywords={bullet.keywords_incorporated}
                            metrics={bullet.metrics_added}
                            sectionType="experience"
                            explanation={bullet.explanation}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </TabsContent>

              {/* Education Section */}
              <TabsContent value="education" className="mt-6 space-y-6">
                <SectionSummaryCard
                  sectionName="Education"
                  suggestionCount={educationSuggestionsCount}
                  potentialPoints={educationEffectivePoints}
                  description="Highlight relevant coursework, academic projects, and achievements that align with the job requirements"
                />

                {educationSuggestionsCount === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No education suggestions available for this session.
                  </div>
                )}

                {educationSuggestions.map((eduSugg, index) => (
                  <div key={`education-${index}`} className="space-y-6">
                    {eduSugg.education_entries.map((entry, entryIndex) => (
                      <div key={`edu-entry-${index}-${entryIndex}`} className="space-y-4">
                        {/* Entry header */}
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {entry.degree}
                          </h3>
                          <p className="text-sm text-gray-600">{entry.institution}</p>
                          <p className="text-sm text-gray-500">
                            {entry.dates}
                            {entry.gpa && ` | GPA: ${entry.gpa}`}
                          </p>
                        </div>

                        {/* Relevant coursework highlight */}
                        {eduSugg.relevant_coursework && eduSugg.relevant_coursework.length > 0 && entryIndex === 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-sm font-medium text-blue-800">
                              Relevant Coursework to Highlight:
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              {eduSugg.relevant_coursework.join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Suggested bullets */}
                        {entry.suggested_bullets.map((bullet, bulletIndex) => (
                          <SuggestionCard
                            key={`edu-bullet-${index}-${entryIndex}-${bulletIndex}`}
                            suggestionId={`sug_education_${index}_${entryIndex}_${bulletIndex}`}
                            original={bullet.original || 'Add new detail'}
                            suggested={bullet.suggested}
                            points={bullet.point_value}
                            impact={bullet.impact}
                            keywords={bullet.keywords_incorporated}
                            sectionType="education"
                            explanation={bullet.explanation}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </TabsContent>

              {/* Projects Section */}
              <TabsContent value="projects" className="mt-6 space-y-6">
                <SectionSummaryCard
                  sectionName="Projects"
                  suggestionCount={projectsSuggestionsCount}
                  potentialPoints={projectsEffectivePoints}
                  description="Showcase technical projects with quantified impact and keyword alignment to demonstrate hands-on skills"
                />

                {projectsSuggestionsCount === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No projects suggestions available for this session.
                  </div>
                )}

                {projectsSuggestions.map((projSugg, index) => (
                  <div key={`projects-${index}`} className="space-y-6">
                    {/* Heading suggestion banner (if provided) */}
                    {projSugg.heading_suggestion && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium text-indigo-800">
                          Section Heading Recommendation:
                        </p>
                        <p className="text-sm text-indigo-700 mt-1">
                          {projSugg.heading_suggestion}
                        </p>
                      </div>
                    )}

                    {projSugg.project_entries.map((entry, entryIndex) => (
                      <div key={`proj-entry-${index}-${entryIndex}`} className="space-y-4">
                        {/* Entry header */}
                        <div className="mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {entry.title}
                          </h3>
                          {entry.technologies && entry.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {entry.technologies.map((tech, techIndex) => (
                                <Badge key={techIndex} variant="outline" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {entry.dates && (
                            <p className="text-sm text-gray-500 mt-1">{entry.dates}</p>
                          )}
                        </div>

                        {/* Suggested bullets */}
                        {entry.suggested_bullets.map((bullet, bulletIndex) => (
                          <SuggestionCard
                            key={`proj-bullet-${index}-${entryIndex}-${bulletIndex}`}
                            suggestionId={`sug_projects_${index}_${entryIndex}_${bulletIndex}`}
                            original={bullet.original}
                            suggested={bullet.suggested}
                            suggestedCompact={bullet.suggested_compact}
                            originalWordCount={bullet.original_word_count}
                            compactWordCount={bullet.compact_word_count}
                            fullWordCount={bullet.full_word_count}
                            points={bullet.point_value}
                            impact={bullet.impact}
                            keywords={bullet.keywords_incorporated}
                            metrics={bullet.metrics_added}
                            sectionType="projects"
                            explanation={bullet.explanation}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleBackToResults}
            variant="outline"
            size="default"
            data-testid="back-to-results-button"
          >
            Back to Results
          </Button>

          {/* Story 17.2: Compare button - always visible for better discoverability */}
          <Button
            onClick={() => setDialogOpen(true)}
            size="default"
            data-testid="compare-button"
          >
            <Upload className="mr-2 h-4 w-4" />
            Compare with Updated Resume
          </Button>

          <Button
            variant="ghost"
            size="default"
            disabled
            title="Apply all feature coming soon"
            data-testid="apply-all-button"
          >
            Apply All Suggestions (Coming Soon)
          </Button>
        </div>

        {/* Comparison Summary - shown when comparison exists */}
        {session.comparedAtsScore && (
          <Card className="mt-6 border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-blue-600">📊</span>
                Comparison Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Original Score</div>
                    <div className="text-2xl font-bold">{originalScore}</div>
                  </div>
                  <div className="text-2xl text-muted-foreground">→</div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Updated Score</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {session.comparedAtsScore.overall}
                    </div>
                  </div>
                  <div className="text-center ml-4">
                    {(() => {
                      const diff = session.comparedAtsScore.overall - originalScore;
                      const isPositive = diff > 0;
                      const isNegative = diff < 0;
                      return (
                        <Badge
                          variant={isPositive ? "default" : isNegative ? "destructive" : "secondary"}
                          className="text-base px-3 py-1"
                        >
                          {isPositive ? '+' : ''}{diff} points
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/scan/${session.id}/comparison`)}
                  className="border-blue-300 hover:bg-blue-100"
                >
                  View Full Comparison →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Story 17.2: Comparison dialog */}
        <CompareUploadDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          sessionId={session.id}
        />
      </div>
    </div>
  );
}
