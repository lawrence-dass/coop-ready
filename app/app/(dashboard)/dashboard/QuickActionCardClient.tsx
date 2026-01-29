/**
 * QuickActionCardClient
 * Story 16.2: Implement Dashboard Home Page
 *
 * Client wrapper for QuickActionCard to enable navigation
 * Converts href to onClick handler for client-side routing
 */

'use client';

import { useRouter } from 'next/navigation';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { ScanLine, History } from 'lucide-react';

type IconName = 'ScanLine' | 'History';

interface QuickActionCardClientProps {
  title: string;
  description: string;
  iconName: IconName;
  href: string;
  ctaText: string;
}

const ICON_MAP: Record<IconName, typeof ScanLine> = {
  ScanLine,
  History,
};

export default function QuickActionCardClient({
  title,
  description,
  iconName,
  href,
  ctaText,
}: QuickActionCardClientProps) {
  const router = useRouter();
  const Icon = ICON_MAP[iconName];

  return (
    <QuickActionCard
      title={title}
      description={description}
      icon={Icon}
      onClick={() => router.push(href)}
      ctaText={ctaText}
    />
  );
}
