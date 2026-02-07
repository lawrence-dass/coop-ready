'use client';

import { useOptimizationStore } from '@/store';
import { ClientSuggestionsPage } from './ClientSuggestionsPage';
import { SuggestionsLoadingState } from './SuggestionsLoadingState';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
  EducationSuggestion,
  ProjectsSuggestion,
  StructuralSuggestion,
} from '@/types/suggestions';
import type { ATSScore, KeywordAnalysisResult } from '@/types/analysis';
import type { CandidateType } from '@/lib/scoring/types';

interface SessionData {
  id: string;
  createdAt: string;
  resumeContent: string;
  jdContent: string;
  analysis: {
    score: ATSScore;
    keywordAnalysis: KeywordAnalysisResult;
  } | null;
  suggestions: {
    summary?: SummarySuggestion[];
    skills?: SkillsSuggestion[];
    experience?: ExperienceSuggestion[];
    education?: EducationSuggestion[];
    projects?: ProjectsSuggestion[];
  } | null;
  preferences: any;
  anonymousId: string | null;
  userId: string;
  comparedAtsScore?: ATSScore | null;
  candidateType?: CandidateType | null;
  structuralSuggestions?: StructuralSuggestion[];
}

interface SuggestionsPageWrapperProps {
  session: SessionData;
}

/**
 * Wrapper that bridges server-fetched session data with Zustand store fallback.
 * Solves the race condition where generateAllSuggestions completes and stores data
 * in Zustand, but the DB write fails or hasn't propagated yet.
 */
export function SuggestionsPageWrapper({ session }: SuggestionsPageWrapperProps) {
  // Read suggestion data from Zustand (populated by generateAllSuggestions fire-and-forget)
  const summarySuggestion = useOptimizationStore((s) => s.summarySuggestion);
  const skillsSuggestion = useOptimizationStore((s) => s.skillsSuggestion);
  const experienceSuggestion = useOptimizationStore((s) => s.experienceSuggestion);
  const educationSuggestion = useOptimizationStore((s) => s.educationSuggestion);
  const projectsSuggestion = useOptimizationStore((s) => s.projectsSuggestion);

  // Build suggestions from Zustand if server data is missing
  const hasStoreSuggestions = !!(summarySuggestion || skillsSuggestion || experienceSuggestion || educationSuggestion || projectsSuggestion);

  const suggestions = session.suggestions ?? (hasStoreSuggestions ? {
    summary: summarySuggestion ? [summarySuggestion] : [],
    skills: skillsSuggestion ? [skillsSuggestion] : [],
    experience: experienceSuggestion ? [experienceSuggestion] : [],
    education: educationSuggestion ? [educationSuggestion] : [],
    projects: projectsSuggestion ? [projectsSuggestion] : [],
  } : null);

  // If neither DB nor Zustand has suggestions, show loading state
  if (!suggestions) {
    return <SuggestionsLoadingState sessionId={session.id} />;
  }

  return (
    <ClientSuggestionsPage
      session={{
        ...session,
        suggestions,
      }}
    />
  );
}
