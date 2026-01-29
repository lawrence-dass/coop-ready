/**
 * QuickActionCard Component
 * Story 16.2: Implement Dashboard Home Page
 *
 * Reusable card component for dashboard quick actions
 * Displays icon, title, description, and CTA button
 */

'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  ctaText: string;
}

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  ctaText,
}: QuickActionCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <Icon className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">{description}</p>
        <Button onClick={onClick} className="w-full">
          {ctaText}
        </Button>
      </CardContent>
    </Card>
  );
}
