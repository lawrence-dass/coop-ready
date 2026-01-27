// Story 5.4: Category icon mapping utility
import { KeywordCategory } from '@/types/analysis';
import { Wrench, Code, Award, Briefcase, Users, BadgeCheck, LucideIcon } from 'lucide-react';
import { JSX } from 'react';

/**
 * Returns the appropriate Lucide icon component for a keyword category
 */
export function getCategoryIcon(category: KeywordCategory): JSX.Element {
  const iconMap: Record<KeywordCategory, LucideIcon> = {
    [KeywordCategory.SKILLS]: Wrench,
    [KeywordCategory.TECHNOLOGIES]: Code,
    [KeywordCategory.QUALIFICATIONS]: Award,
    [KeywordCategory.EXPERIENCE]: Briefcase,
    [KeywordCategory.SOFT_SKILLS]: Users,
    [KeywordCategory.CERTIFICATIONS]: BadgeCheck,
  };

  const Icon = iconMap[category];
  return <Icon className="h-4 w-4" />;
}
