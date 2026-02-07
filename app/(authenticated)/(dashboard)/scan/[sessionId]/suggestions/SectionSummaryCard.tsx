'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Briefcase, Sparkles, GraduationCap, Code } from 'lucide-react';

interface SectionSummaryCardProps {
  /** Section name (Summary, Skills, Experience) */
  sectionName: string;

  /** Number of suggestions available */
  suggestionCount: number;

  /** Potential point improvement */
  potentialPoints: number;

  /** Brief description of what will be improved */
  description: string;
}

/**
 * SectionSummaryCard Component
 *
 * Displays a summary of suggestions for a given section.
 * Shows count, potential score impact, and description.
 *
 * Story 16.5: Implement Suggestions Page (AC#6)
 */
export function SectionSummaryCard({
  sectionName,
  suggestionCount,
  potentialPoints,
  description,
}: SectionSummaryCardProps) {
  // Icon mapping
  const getIcon = () => {
    switch (sectionName.toLowerCase()) {
      case 'summary':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'skills':
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      case 'experience':
        return <Briefcase className="w-5 h-5 text-green-600" />;
      case 'education':
        return <GraduationCap className="w-5 h-5 text-amber-600" />;
      case 'projects':
        return <Code className="w-5 h-5 text-indigo-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  // Color coding for badges
  const getBadgeColor = (count: number) => {
    if (count >= 10) return 'bg-green-100 text-green-800';
    if (count >= 5) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="border-l-4 border-l-blue-500 bg-gray-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="shrink-0 mt-1">{getIcon()}</div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{sectionName}</h3>
              <Badge className={getBadgeColor(suggestionCount)}>
                {suggestionCount} {suggestionCount === 1 ? 'suggestion' : 'suggestions'}
              </Badge>
              {potentialPoints > 0 && (
                <Badge variant="outline" className="text-green-700 border-green-700">
                  +{potentialPoints} pts
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
