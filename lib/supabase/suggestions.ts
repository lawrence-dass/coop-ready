/**
 * Supabase Queries for Suggestions
 * Handles all database operations for suggestion management
 *
 * @see Story 9.2: Inference-Based Suggestion Calibration
 */

import { createClient } from "@/lib/supabase/server";
import { RESUME_SECTIONS } from "@/lib/utils/suggestion-types";
import type { DisplaySuggestion } from "@/lib/utils/suggestion-types";
import {
  getTargetSuggestionCount,
  getFocusAreasByExperience,
  type SuggestionMode,
  type ExperienceLevel
} from "@/lib/utils/suggestionCalibrator";

interface SuggestionRow {
  id: string;
  scan_id: string;
  section: string;
  item_index: number;
  original_text: string;
  suggested_text: string;
  suggestion_type: string;
  reasoning: string;
  status: string;
  created_at: string;
  // Story 9.2: Calibration metadata
  suggestion_mode?: string;
  inference_signals?: any; // JSONB
}

/**
 * Transform database row to display format (snake_case → camelCase)
 */
function transformSuggestion(row: SuggestionRow): DisplaySuggestion {
  return {
    id: row.id,
    section: row.section,
    itemIndex: row.item_index,
    originalText: row.original_text,
    suggestedText: row.suggested_text,
    suggestionType: row.suggestion_type,
    reasoning: row.reasoning,
    status: row.status,
  };
}

/**
 * Fetch and group suggestions by section
 */
export async function fetchSuggestionsBySection(
  scanId: string
): Promise<Record<string, DisplaySuggestion[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("suggestions")
    .select("*")
    .eq("scan_id", scanId)
    .order("section", { ascending: true })
    .order("item_index", { ascending: true });

  if (error) {
    console.error("[fetchSuggestionsBySection]", error);
    throw error;
  }

  const grouped: Record<string, DisplaySuggestion[]> = {};

  for (const section of RESUME_SECTIONS) {
    grouped[section] = [];
  }

  for (const row of data || []) {
    const transformed = transformSuggestion(row as SuggestionRow);
    const section = transformed.section || "format";
    if (section in grouped) {
      grouped[section].push(transformed);
    }
  }

  return grouped;
}

/**
 * Fetch suggestions filtered by type
 */
export async function fetchSuggestionsByType(
  scanId: string,
  types: string[]
): Promise<DisplaySuggestion[]> {
  const supabase = await createClient();

  let query = supabase
    .from("suggestions")
    .select("*")
    .eq("scan_id", scanId);

  if (types.length > 0) {
    query = query.in("suggestion_type", types);
  }

  const { data, error } = await query
    .order("section", { ascending: true })
    .order("item_index", { ascending: true });

  if (error) {
    console.error("[fetchSuggestionsByType]", error);
    throw error;
  }

  return (data || []).map((row: SuggestionRow) => transformSuggestion(row));
}

/**
 * Count suggestions by type
 */
export async function countSuggestionsByType(
  scanId: string
): Promise<Record<string, number>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("suggestions")
    .select("suggestion_type")
    .eq("scan_id", scanId);

  if (error) {
    console.error("[countSuggestionsByType]", error);
    throw error;
  }

  const counts: Record<string, number> = {};

  for (const row of data || []) {
    const type = row.suggestion_type || "format";
    counts[type] = (counts[type] || 0) + 1;
  }

  return counts;
}

/**
 * Get calibration summary from suggestions
 *
 * Story 9.2: Extract calibration metadata from first suggestion
 * (all suggestions in a scan share the same calibration)
 */
export async function getCalibrationSummary(scanId: string): Promise<{
  suggestionMode: string | null;
  targetSuggestionCount: number | null;
  focusAreas: string[];
  reasoning: string | null;
  atsScore: number | null;
} | null> {
  const supabase = await createClient();

  // Get first suggestion with calibration metadata
  const { data, error } = await supabase
    .from("suggestions")
    .select("suggestion_mode, inference_signals")
    .eq("scan_id", scanId)
    .not("suggestion_mode", "is", null)
    .limit(1)
    .single();

  if (error || !data || !data.suggestion_mode) {
    // No calibration data available (legacy suggestions or not yet generated)
    return null;
  }

  const mode = data.suggestion_mode as SuggestionMode;
  const inferenceSignals = data.inference_signals || {};
  const experienceLevel = (inferenceSignals.experienceLevel || 'experienced') as ExperienceLevel;
  const atsScore = inferenceSignals.atsScore || null;

  // Calculate target count from mode
  const targetRange = getTargetSuggestionCount(mode);
  const targetCount = Math.floor((targetRange.min + targetRange.max) / 2);

  // Get focus areas from experience level
  const focusAreas = getFocusAreasByExperience(experienceLevel);

  // Build reasoning from signals
  const missingKeywords = inferenceSignals.missingKeywordsCount || 0;
  const quantificationDensity = inferenceSignals.quantificationDensity || 0;
  const reasoning = `ATS Score ${atsScore} → ${mode} mode | ${missingKeywords} missing keywords | ${quantificationDensity}% quantification`;

  return {
    suggestionMode: mode,
    targetSuggestionCount: targetCount,
    focusAreas,
    reasoning,
    atsScore,
  };
}

/**
 * Get summary stats
 */
export async function getSuggestionStats(
  scanId: string
): Promise<{
  total: number;
  bySection: Record<string, number>;
  byType: Record<string, number>;
  bySectionAndType: Record<string, Record<string, number>>;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("suggestions")
    .select("section, suggestion_type")
    .eq("scan_id", scanId);

  if (error) {
    console.error("[getSuggestionStats]", error);
    throw error;
  }

  const bySection: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const bySectionAndType: Record<string, Record<string, number>> = {};

  for (const row of data || []) {
    const section = row.section || "format";
    const type = row.suggestion_type || "format";

    bySection[section] = (bySection[section] || 0) + 1;
    byType[type] = (byType[type] || 0) + 1;

    if (!bySectionAndType[section]) {
      bySectionAndType[section] = {};
    }
    bySectionAndType[section][type] =
      (bySectionAndType[section][type] || 0) + 1;
  }

  return {
    total: data?.length || 0,
    bySection,
    byType,
    bySectionAndType,
  };
}
