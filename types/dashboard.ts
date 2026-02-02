/**
 * Dashboard statistics calculated from user session data
 */
export interface DashboardStats {
  /** Total number of scans completed by user */
  totalScans: number;

  /** Average ATS score across all sessions with scores (0-100) */
  averageAtsScore: number | null;

  /** Average improvement in points from comparison sessions */
  improvementRate: number | null;
}
