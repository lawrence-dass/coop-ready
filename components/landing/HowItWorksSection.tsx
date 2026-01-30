/**
 * How It Works Section Component
 * Story 16.7: Create Full Marketing Landing Page
 *
 * Displays the 3-step process:
 * 1. Upload your resume
 * 2. Paste the job description
 * 3. Get optimized suggestions
 */

import { Upload, FileText, CheckCircle } from 'lucide-react';

const steps = [
  {
    step: 1,
    icon: Upload,
    title: 'Upload Resume',
    description:
      'Upload your resume in PDF or DOCX format. We extract the text automatically.',
  },
  {
    step: 2,
    icon: FileText,
    title: 'Paste Job Description',
    description:
      'Copy and paste the job description you want to apply for. We analyze the requirements.',
  },
  {
    step: 3,
    icon: CheckCircle,
    title: 'Get Suggestions',
    description:
      'Receive AI-powered suggestions to improve your resume and increase your ATS score.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Get started in just three simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="mx-auto mt-12 max-w-5xl">
          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Connector line (desktop only) */}
            <div
              className="absolute left-0 right-0 top-12 hidden h-0.5 bg-gradient-to-r from-transparent via-[#635BFF]/20 to-transparent md:block"
              aria-hidden="true"
            />

            {steps.map((item) => (
              <div
                key={item.step}
                className="relative flex flex-col items-center text-center"
              >
                {/* Step Number & Icon */}
                <div className="relative z-10 mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#F5F3FF]">
                  <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#635BFF] text-sm font-bold text-white">
                    {item.step}
                  </div>
                  <item.icon className="h-10 w-10 text-[#635BFF]" />
                </div>

                {/* Title & Description */}
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-xs text-sm text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
