/**
 * Unit Tests for Landing Page Components
 * Story 16.7: Create Full Marketing Landing Page
 *
 * Tests cover:
 * - HeroSection renders headline and CTAs
 * - FeaturesSection renders all 4 features
 * - HowItWorksSection renders 3 steps
 * - TestimonialsSection renders testimonial cards
 * - PricingSection renders free tier
 * - Footer renders all links
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { Footer } from '@/components/landing/Footer';

// ===========================================================================
// HeroSection Tests
// ===========================================================================

describe('HeroSection', () => {
  it('renders the main headline correctly', () => {
    render(<HeroSection />);

    // Check for h1 heading
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/Land More Interviews/i);
    expect(heading).toHaveTextContent(/ATS-Optimized/i);
  });

  it('renders subheadline explaining value proposition', () => {
    render(<HeroSection />);

    expect(
      screen.getByText(/Upload your resume, paste the job description/i)
    ).toBeInTheDocument();
  });

  it('renders Get Started Free CTA with correct link', () => {
    render(<HeroSection />);

    const ctaLink = screen.getByRole('link', { name: /Get Started Free/i });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink).toHaveAttribute('href', '/auth/signup');
  });

  it('renders Sign In CTA with correct link', () => {
    render(<HeroSection />);

    const signInLink = screen.getByRole('link', { name: /Sign In/i });
    expect(signInLink).toBeInTheDocument();
    expect(signInLink).toHaveAttribute('href', '/auth/login');
  });
});

// ===========================================================================
// FeaturesSection Tests
// ===========================================================================

describe('FeaturesSection', () => {
  it('renders section heading', () => {
    render(<FeaturesSection />);

    expect(
      screen.getByRole('heading', { name: /Everything you need/i })
    ).toBeInTheDocument();
  });

  it('renders all 4 feature titles', () => {
    render(<FeaturesSection />);

    expect(screen.getByText('ATS Score Analysis')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Section-by-Section')).toBeInTheDocument();
    expect(screen.getByText('Privacy-First')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(<FeaturesSection />);

    expect(
      screen.getByText(/See exactly how well your resume matches/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Receive intelligent, context-aware suggestions/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Optimize your Summary, Skills, and Experience/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Your data is encrypted, never sold/i)
    ).toBeInTheDocument();
  });
});

// ===========================================================================
// HowItWorksSection Tests
// ===========================================================================

describe('HowItWorksSection', () => {
  it('renders section heading', () => {
    render(<HowItWorksSection />);

    expect(
      screen.getByRole('heading', { name: /How it works/i })
    ).toBeInTheDocument();
  });

  it('renders all 3 step titles', () => {
    render(<HowItWorksSection />);

    expect(screen.getByText('Upload Resume')).toBeInTheDocument();
    expect(screen.getByText('Paste Job Description')).toBeInTheDocument();
    expect(screen.getByText('Get Suggestions')).toBeInTheDocument();
  });

  it('renders step numbers 1, 2, 3', () => {
    render(<HowItWorksSection />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders step descriptions', () => {
    render(<HowItWorksSection />);

    expect(
      screen.getByText(/Upload your resume in PDF or DOCX format/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Copy and paste the job description/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Receive AI-powered suggestions/i)
    ).toBeInTheDocument();
  });
});

// ===========================================================================
// TestimonialsSection Tests
// ===========================================================================

describe('TestimonialsSection', () => {
  it('renders section heading', () => {
    render(<TestimonialsSection />);

    expect(
      screen.getByRole('heading', { name: /What our users say/i })
    ).toBeInTheDocument();
  });

  it('renders all 3 testimonial quotes', () => {
    render(<TestimonialsSection />);

    expect(
      screen.getByText(/My ATS score went from 38% to 72%/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/I finally understand why my resume was getting ignored/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Landed 3 interviews in my first week/i)
    ).toBeInTheDocument();
  });

  it('renders testimonial author names', () => {
    render(<TestimonialsSection />);

    expect(screen.getByText('Sarah K.')).toBeInTheDocument();
    expect(screen.getByText('Michael T.')).toBeInTheDocument();
    expect(screen.getByText('Emily R.')).toBeInTheDocument();
  });

  it('renders author titles', () => {
    render(<TestimonialsSection />);

    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('Marketing Manager')).toBeInTheDocument();
    expect(screen.getByText('Data Analyst')).toBeInTheDocument();
  });
});

// ===========================================================================
// PricingSection Tests
// ===========================================================================

describe('PricingSection', () => {
  it('renders section heading', () => {
    render(<PricingSection />);

    expect(
      screen.getByRole('heading', { name: /Simple, transparent pricing/i })
    ).toBeInTheDocument();
  });

  it('renders free tier name and price', () => {
    render(<PricingSection />);

    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('renders free badge', () => {
    render(<PricingSection />);

    expect(screen.getByText('Free Forever')).toBeInTheDocument();
  });

  it('renders list of features', () => {
    render(<PricingSection />);

    expect(screen.getByText('Unlimited resume scans')).toBeInTheDocument();
    expect(screen.getByText('AI-powered suggestions')).toBeInTheDocument();
    expect(screen.getByText('ATS score analysis')).toBeInTheDocument();
    expect(
      screen.getByText('Section-by-section optimization')
    ).toBeInTheDocument();
    expect(screen.getByText('Copy suggestions to clipboard')).toBeInTheDocument();
  });

  it('renders CTA button with correct link', () => {
    render(<PricingSection />);

    const ctaButton = screen.getByRole('link', { name: /Get Started Free/i });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveAttribute('href', '/auth/signup');
  });
});

// ===========================================================================
// Footer Tests
// ===========================================================================

describe('Footer', () => {
  it('renders brand name', () => {
    render(<Footer />);

    expect(screen.getByText('SubmitSmart')).toBeInTheDocument();
  });

  it('renders Privacy Policy link with correct href', () => {
    render(<Footer />);

    const privacyLink = screen.getByRole('link', { name: /Privacy Policy/i });
    expect(privacyLink).toBeInTheDocument();
    expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
  });

  it('renders Terms of Service link with correct href', () => {
    render(<Footer />);

    const termsLink = screen.getByRole('link', { name: /Terms of Service/i });
    expect(termsLink).toBeInTheDocument();
    expect(termsLink).toHaveAttribute('href', '/terms-of-service');
  });

  it('renders copyright notice with current year', () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`© ${currentYear} SubmitSmart`))
    ).toBeInTheDocument();
  });
});
