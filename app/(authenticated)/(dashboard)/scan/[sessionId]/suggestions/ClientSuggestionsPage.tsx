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
import { useOptimizationStore } from '@/store';
import { ROUTES } from '@/lib/constants/routes';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
  EducationSuggestion,
} from '@/types/suggestions';
import type { ATSScore } from '@/types/analysis';

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
  };
  preferences: any;
  anonymousId: string | null;
  userId: string;
}

interface ClientSuggestionsPageProps {
  session: SessionData;
}

type SectionType = 'summary' | 'skills' | 'experience' | 'education';

export function ClientSuggestionsPage({ session }: ClientSuggestionsPageProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<SectionType>('summary');
  const [dialogOpen, setDialogOpen] = useState(false);

  // Check if user has copied any suggestions (Story 17.2)
  const hasAnyCopied = useOptimizationStore((state: { hasAnyCopied: () => boolean }) => state.hasAnyCopied());

  // Extract suggestions by section
  const summarySuggestions = session.suggestions.summary || [];
  const skillsSuggestions = session.suggestions.skills || [];
  const experienceSuggestions = session.suggestions.experience || [];
  const educationSuggestions = session.suggestions.education || [];

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

  // Calculate raw potential points per section
  const summaryRawPoints = summarySuggestions.reduce((sum, s) => sum + (s.point_value || 0), 0);
  const skillsRawPoints = skillsSuggestions.reduce((sum, s) => sum + (s.total_point_value || 0), 0);
  const experienceRawPoints = experienceSuggestions.reduce((sum, s) => sum + (s.total_point_value || 0), 0);
  const educationRawPoints = educationSuggestions.reduce((sum, s) => sum + (s.total_point_value || 0), 0);

  const totalRawPoints = summaryRawPoints + skillsRawPoints + experienceRawPoints + educationRawPoints;
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

        {/* Section Navigation Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Suggestions by Section</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeSection} onValueChange={(val) => setActiveSection(val as SectionType)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="summary" className="relative">
                  Summary
                  {summarySuggestionsCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {summarySuggestionsCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="skills" className="relative">
                  Skills
                  {skillsSuggestionsCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {skillsSuggestionsCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="experience" className="relative">
                  Experience
                  {experienceSuggestionsCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {experienceSuggestionsCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="education" className="relative">
                  Education
                  {educationSuggestionsCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {educationSuggestionsCount}
                    </Badge>
                  )}
                </TabsTrigger>
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

          {/* Story 17.2: Compare button (shown when user has copied suggestions) */}
          {hasAnyCopied && (
            <Button
              onClick={() => setDialogOpen(true)}
              size="default"
              data-testid="compare-button"
            >
              <Upload className="mr-2 h-4 w-4" />
              Compare with Updated Resume
            </Button>
          )}

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
