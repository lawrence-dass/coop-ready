/**
 * Pricing Section Component
 * Story 16.7: Create Full Marketing Landing Page
 *
 * Displays the Free pricing tier.
 * TODO: Add paid tiers when ready.
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/lib/constants/routes';
import { Check } from 'lucide-react';

/* TODO: Add paid tiers when ready */
const freeTier = {
  name: 'Free',
  price: '$0',
  description: 'Everything you need to optimize your resume',
  features: [
    'Unlimited resume scans',
    'AI-powered suggestions',
    'ATS score analysis',
    'Section-by-section optimization',
    'Copy suggestions to clipboard',
    'Resume library storage',
    'Optimization history',
  ],
};

export function PricingSection() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Start optimizing your resume today - completely free
          </p>
        </div>

        {/* Pricing Card */}
        <div className="mx-auto mt-12 max-w-md">
          <Card className="relative border-2 border-[#635BFF] shadow-lg">
            {/* Free Badge */}
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#635BFF] px-4 py-1">
              Free Forever
            </Badge>

            <CardHeader className="pt-8 text-center">
              <CardTitle className="text-2xl">{freeTier.name}</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold text-gray-900">
                  {freeTier.price}
                </span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="mt-2 text-gray-600">{freeTier.description}</p>
            </CardHeader>

            <CardContent>
              {/* Features List */}
              <ul className="space-y-3">
                {freeTier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 text-[#10B981]" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                size="lg"
                className="mt-8 w-full bg-[#635BFF] hover:bg-[#5851e0]"
                asChild
              >
                <Link href={ROUTES.AUTH.SIGNUP}>Get Started Free</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
