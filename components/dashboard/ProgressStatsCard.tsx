/**
 * ProgressStatsCard Component
 * Story 16.2: Implement Dashboard Home Page
 * Story 17.5: Dashboard Stats Calculation
 *
 * Displays real progress statistics calculated from user sessions:
 * - Total Scans: Count of all sessions
 * - Average ATS Score: Mean score across all sessions
 * - Improvement Rate: Average improvement from comparison sessions
 */

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BarChart3, TrendingUp, Target } from 'lucide-react';

interface ProgressStatsCardProps {
  totalScans?: number;
  averageAtsScore?: number | null;
  improvementRate?: number | null;
}

export function ProgressStatsCard({
  totalScans = 0,
  averageAtsScore = null,
  improvementRate = null,
}: ProgressStatsCardProps) {
  const hasAtsScore = averageAtsScore !== null && averageAtsScore !== undefined;
  const hasImprovementRate = improvementRate !== null && improvementRate !== undefined;

  const stats = [
    {
      label: 'Total Scans',
      value: totalScans.toString(),
      icon: BarChart3,
      isTbd: false,
    },
    {
      label: 'Average ATS Score',
      value: hasAtsScore ? `${Math.round(averageAtsScore)}%` : '--',
      icon: Target,
      isTbd: !hasAtsScore,
    },
    {
      label: 'Improvement Rate',
      value: hasImprovementRate
        ? `${improvementRate > 0 ? '+' : ''}${Math.round(improvementRate)} pts`
        : '--',
      icon: TrendingUp,
      isTbd: !hasImprovementRate,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50"
            >
              <stat.icon className="h-6 w-6 text-primary mb-2" />
              <p
                className={`text-2xl font-bold ${stat.isTbd ? 'text-muted-foreground' : ''}`}
              >
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
