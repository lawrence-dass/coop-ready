/**
 * Features Section Component
 * Story 16.7: Create Full Marketing Landing Page
 *
 * Displays 4 key benefits of the product:
 * - ATS Score Analysis
 * - AI-Powered Suggestions
 * - Section-by-Section Optimization
 * - Privacy-First Approach
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Sparkles, Layers, Shield } from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'ATS Score Analysis',
    description:
      'See exactly how well your resume matches the job. Get a detailed score breakdown by category.',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Suggestions',
    description:
      'Receive intelligent, context-aware suggestions to improve your resume content.',
  },
  {
    icon: Layers,
    title: 'Section-by-Section',
    description:
      'Optimize your Summary, Skills, and Experience sections independently for maximum impact.',
  },
  {
    icon: Shield,
    title: 'Privacy-First',
    description:
      'Your data is encrypted, never sold, and you can delete it anytime. We respect your privacy.',
  },
];

export function FeaturesSection() {
  return (
    <section className="bg-gray-50 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to optimize your resume
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Our AI-powered platform helps you stand out to both ATS systems and
            recruiters.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="border-0 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-[#F5F3FF]">
                  <feature.icon className="h-6 w-6 text-[#635BFF]" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
