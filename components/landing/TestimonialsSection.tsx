/**
 * Testimonials Section Component
 * Story 16.7: Create Full Marketing Landing Page
 *
 * Displays placeholder testimonial cards.
 * TODO: Replace with real testimonials when available.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';

/* TODO: Replace with real testimonials */
const testimonials = [
  {
    quote: 'My ATS score went from 38% to 72%! Finally understanding what keywords I was missing.',
    name: 'Sarah K.',
    title: 'Software Engineer',
    initials: 'SK',
  },
  {
    quote: 'I finally understand why my resume was getting ignored. This tool is a game changer.',
    name: 'Michael T.',
    title: 'Marketing Manager',
    initials: 'MT',
  },
  {
    quote: 'Landed 3 interviews in my first week after optimizing my resume. Highly recommend!',
    name: 'Emily R.',
    title: 'Data Analyst',
    initials: 'ER',
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-gray-50 py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            What our users say
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Join thousands of job seekers who have improved their resumes
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="border-0 bg-white shadow-sm"
            >
              <CardContent className="pt-6">
                {/* Quote Icon */}
                <Quote className="h-8 w-8 text-[#635BFF]/20" />

                {/* Quote Text */}
                <p className="mt-4 text-gray-700 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="mt-6 flex items-center gap-3">
                  {/* Avatar Placeholder */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#635BFF]/10">
                    <span className="text-sm font-medium text-[#635BFF]">
                      {testimonial.initials}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-500">{testimonial.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
