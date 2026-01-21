/**
 * Supabase Queries for Suggestions
 * Handles all database operations for suggestion management
 */

import { createClient } from "@/lib/supabase/server";
import { RESUME_SECTIONS } from "@/lib/utils/suggestion-types";
import type { DisplaySuggestion } from "@/lib/utils/suggestion-types";

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
