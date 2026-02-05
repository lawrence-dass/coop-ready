/**
 * History Types
 *
 * Types for displaying optimization history to users.
 * Story 10.1: Implement History List View
 */

/**
 * HistorySession - Simplified view of OptimizationSession for history list
 *
 * This type represents a single optimization session in the history list.
 * It's a subset of OptimizationSession with computed display fields.
 *
 * **Design Decision:** We reuse the existing `sessions` table rather than
 * creating a separate `optimization_history` table to avoid data duplication.
 */
export interface HistorySession {
  /** Session ID (UUID) */
  id: string;

  /** When the optimization was performed */
  createdAt: Date;

  /** Resume name (extracted from resume content if available) */
  resumeName: string | null;

  /** Job title (extracted from JD if available) */
  jobTitle: string | null;

  /** Company name (extracted from JD if available) */
  companyName: string | null;

  /** Brief preview of job description (first 100 chars) */
  jdPreview: string | null;

  /** ATS score from this session (null if not available) */
  atsScore: number | null;

  /** ATS score after applying suggestions (null if no comparison uploaded) */
  comparedAtsScore: number | null;

  /** Number of suggestions generated (0 if none) */
  suggestionCount: number;
}
