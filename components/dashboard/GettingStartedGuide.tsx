/**
 * GettingStartedGuide Component
 * Story 16.2: Implement Dashboard Home Page
 *
 * Displays onboarding guide for first-time users with no sessions
 * Shows 3 steps to help users get started
 */

'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Sparkles } from 'lucide-react';
import { ROUTES } from '@/lib/constants/routes';

const STEPS = [
  {
    number: 1,
    icon: Upload,
    title: 'Upload Resume',
    description: 'Upload your resume in PDF or DOCX format',
  },
  {
    number: 2,
    icon: FileText,
    title: 'Paste Job Description',
    description: 'Add the job description you want to optimize for',
  },
  {
    number: 3,
    icon: Sparkles,
    title: 'Get Suggestions',
    description: 'Receive ATS-optimized suggestions to improve your resume',
  },
];

export function GettingStartedGuide() {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting Started</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Steps */}
        <div className="space-y-4 mb-6">
          {STEPS.map((step) => (
            <div key={step.number} className="flex items-start gap-4">
              {/* Step number badge */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                {step.number}
              </div>

              {/* Icon and content */}
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <step.icon className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => router.push(ROUTES.APP.SCAN.NEW)}
          className="w-full"
          size="lg"
        >
          Start Your First Scan
        </Button>
      </CardContent>
    </Card>
  );
}
