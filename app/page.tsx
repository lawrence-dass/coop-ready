/**
 * Landing Page
 * Story 16.7: Create Full Marketing Landing Page
 *
 * Main marketing landing page that displays for unauthenticated users.
 * Authenticated users are redirected to /dashboard.
 *
 * This is a Server Component for optimal performance and SEO.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { Footer } from '@/components/landing/Footer';
import { ROUTES } from '@/lib/constants/routes';

export default async function LandingPage() {
  // Check if user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect authenticated users to dashboard
  if (user) {
    redirect(ROUTES.APP.DASHBOARD);
  }

  return (
    <main className="min-h-screen bg-white">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <Footer />
    </main>
  );
}
