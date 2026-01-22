/**
 * SuggestionList - Main Container Component
 * Server Component that fetches suggestions and passes to client wrapper
 */

import { fetchSuggestionsBySection } from "@/lib/supabase/suggestions";
import { SuggestionListClient } from "./SuggestionListClient";

export interface SuggestionListProps {
  scanId: string;
}

export async function SuggestionList({ scanId }: SuggestionListProps) {
  const suggestionsBySection = await fetchSuggestionsBySection(scanId);

  const totalSuggestions = Object.values(suggestionsBySection).reduce(
    (sum, suggestions) => sum + suggestions.length,
    0
  );

  return (
    <SuggestionListClient
      scanId={scanId}
      suggestionsBySection={suggestionsBySection}
      totalSuggestions={totalSuggestions}
      atsScore={null}
    />
  );
}
