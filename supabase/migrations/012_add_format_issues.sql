-- Migration: Add format_issues column to scans table
-- Story: 4.6 - Resume Format Issues Detection
-- Purpose: Store array of format issues detected during analysis

ALTER TABLE public.scans
  ADD COLUMN format_issues JSONB;

-- Add index for JSONB querying (enables filtering by format issue types in future)
CREATE INDEX IF NOT EXISTS idx_scans_format_issues
  ON public.scans USING GIN (format_issues);

-- Add detailed comment explaining the data structure
COMMENT ON COLUMN public.scans.format_issues IS 'Array of format issues detected during analysis. Structure: [{ type: "critical" | "warning" | "suggestion", message: string, detail: string, source: "rule-based" | "ai-detected" }]. Nullable when no format analysis performed or no issues found.';
