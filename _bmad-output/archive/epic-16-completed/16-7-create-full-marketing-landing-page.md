# Story 16.7: Create Full Marketing Landing Page

**Epic:** 16 - Dashboard UI Architecture (V0.5)
**Status:** done
**Story Key:** 16-7-create-full-marketing-landing-page

---

## User Story

As a visitor (not authenticated),
I want to see a marketing landing page that explains the product,
So that I can understand the value and sign up.

---

## Acceptance Criteria

**AC#1: Hero Section**
- [x] Clear value proposition headline displayed prominently
- [x] Subheadline explaining the benefit
- [x] Primary CTA: "Get Started Free" → `/auth/signup`
- [x] Secondary CTA: "Sign In" → `/auth/login`
- [x] Hero uses Stripe-inspired purple/indigo primary color (#635BFF)
- [x] Clean white background with generous whitespace

**AC#2: Features Section**
- [x] 3-4 key benefits highlighted:
  - ATS Score Analysis
  - AI-Powered Suggestions
  - Section-by-Section Optimization
  - Privacy-First Approach
- [x] Each feature has icon, title, and brief description
- [x] Card-based layout following Stripe aesthetic
- [x] Responsive grid: 1 column mobile, 2 column tablet, 4 column desktop

**AC#3: How It Works Section**
- [x] 3 steps displayed:
  1. Upload your resume
  2. Paste the job description
  3. Get optimized suggestions
- [x] Each step has number, icon, title, and description
- [x] Visual flow indicator between steps
- [x] Step icons use consistent lucide-react library

**AC#4: Testimonials Placeholder Section**
- [x] Placeholder section with 3 testimonial cards
- [x] Cards show avatar placeholder, quote, and name/title
- [x] Marked as "placeholder" in code comments for future content
- [x] Uses Card component from shadcn/ui

**AC#5: Pricing Placeholder Section**
- [x] Single pricing tier displayed (Free tier for MVP)
- [x] Clear "Free" badge or indicator
- [x] List of included features
- [x] CTA: "Get Started Free" → `/auth/signup`
- [x] Marked as placeholder for future pricing tiers

**AC#6: Footer**
- [x] Links to Privacy Policy (`/privacy-policy`)
- [x] Links to Terms of Service (placeholder - can be same as privacy for now)
- [x] Copyright notice: "© 2026 SubmitSmart. All rights reserved."
- [x] Social links placeholders (optional)
- [x] Consistent styling with overall design

**AC#7: Authentication Redirect**
- [x] Authenticated users visiting `/` are redirected to `/app/dashboard`
- [x] Redirect handled server-side for optimal UX
- [x] No flash of landing page content for authenticated users

**AC#8: Mobile Responsiveness**
- [x] Hero section stacks CTAs vertically on mobile
- [x] Features grid collapses to single column
- [x] How It Works steps stack vertically
- [x] All text remains readable and properly sized
- [x] Touch targets meet minimum 44px size
- [x] No horizontal scrolling on any device width

**AC#9: Performance & SEO**
- [x] Landing page is a Server Component (no `"use client"`)
- [x] Static rendering for optimal performance
- [x] Proper heading hierarchy (single h1, logical h2/h3 structure)
- [x] Meta tags for SEO (title, description) via Next.js metadata

---

## Implementation Strategy

### Component Architecture

The landing page will be built as a Server Component with isolated client components only where interactivity is required (CTAs with Link component).

| Component | Type | Purpose |
|-----------|------|---------|
| `app/page.tsx` | Server | Main landing page with auth redirect |
| `components/landing/HeroSection.tsx` | Server | Hero with headline and CTAs |
| `components/landing/FeaturesSection.tsx` | Server | Feature cards grid |
| `components/landing/HowItWorksSection.tsx` | Server | 3-step guide |
| `components/landing/TestimonialsSection.tsx` | Server | Testimonial cards |
| `components/landing/PricingSection.tsx` | Server | Pricing tier |
| `components/landing/Footer.tsx` | Server | Page footer |

### File Structure

**New files:**
```
/components/landing/
├── HeroSection.tsx
├── FeaturesSection.tsx
├── HowItWorksSection.tsx
├── TestimonialsSection.tsx
├── PricingSection.tsx
└── Footer.tsx
```

**Modified files:**
```
/app/page.tsx           → Replace with marketing landing page
/lib/constants/routes.ts → Add TERMS_OF_SERVICE route
/next.config.ts         → Add redirect from old home to dashboard
```

### Design Tokens

From UX Design Specification:

| Token | Value | Usage |
|-------|-------|-------|
| Primary | #635BFF | CTAs, accents, icons |
| Primary Light | #F5F3FF | Feature card backgrounds |
| Success | #10B981 | Score/improvement indicators |
| Gray 900 | #111827 | Primary text |
| Gray 500 | #6B7280 | Muted/secondary text |
| Gray 100 | #F3F4F6 | Section backgrounds |
| White | #FFFFFF | Cards, main background |

### Content Strategy

**Headline Options:**
- "Optimize Your Resume for ATS Systems"
- "Land More Interviews with ATS-Optimized Resumes"
- "Beat the Bots. Get Seen by Humans."

**Subheadline:**
- "Upload your resume, paste the job description, and get AI-powered suggestions to improve your ATS score."

**Feature Descriptions:**
1. **ATS Score Analysis** - "See exactly how well your resume matches the job. Get a detailed score breakdown by category."
2. **AI-Powered Suggestions** - "Receive intelligent, context-aware suggestions to improve your resume content."
3. **Section-by-Section Optimization** - "Optimize your Summary, Skills, and Experience sections independently."
4. **Privacy-First Approach** - "Your data is encrypted, never sold, and you can delete it anytime."

---

## Task Breakdown

### Task 1: Create Landing Page Structure (AC#1, AC#7)
- [x] Refactor `app/page.tsx` from client component to server component
- [x] Add authentication check and redirect logic:
  ```typescript
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect(ROUTES.APP.DASHBOARD);
  }
  ```
- [x] Create basic page layout structure
- [x] Import section components (to be created in subsequent tasks)
- [x] Add Next.js metadata for SEO:
  ```typescript
  export const metadata = {
    title: 'SubmitSmart - ATS Resume Optimizer',
    description: 'Optimize your resume for ATS systems...',
  };
  ```

### Task 2: Create HeroSection Component (AC#1)
- [x] Create `components/landing/HeroSection.tsx`
- [x] Display headline: "Land More Interviews with ATS-Optimized Resumes"
- [x] Display subheadline explaining the value proposition
- [x] Add Primary CTA Button: "Get Started Free" → `/auth/signup`
- [x] Add Secondary CTA Link: "Sign In" → `/auth/login`
- [x] Style with Tailwind:
  - Purple gradient or solid background option
  - White text on dark, dark text on light
  - Generous padding: `py-20 lg:py-32`
  - Max width container: `max-w-4xl mx-auto`
- [x] Responsive: Stack CTAs on mobile with `flex-col sm:flex-row`

### Task 3: Create FeaturesSection Component (AC#2)
- [x] Create `components/landing/FeaturesSection.tsx`
- [x] Define feature data array:
  ```typescript
  const features = [
    { icon: 'BarChart3', title: 'ATS Score Analysis', description: '...' },
    { icon: 'Sparkles', title: 'AI-Powered Suggestions', description: '...' },
    { icon: 'Layers', title: 'Section-by-Section', description: '...' },
    { icon: 'Shield', title: 'Privacy-First', description: '...' },
  ];
  ```
- [x] Create feature card with icon, title, description
- [x] Use Card component from shadcn/ui
- [x] Style cards with subtle shadow and hover effect
- [x] Grid layout: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`
- [x] Section background: Light gray `bg-gray-50`

### Task 4: Create HowItWorksSection Component (AC#3)
- [x] Create `components/landing/HowItWorksSection.tsx`
- [x] Define 3 steps:
  ```typescript
  const steps = [
    { step: 1, icon: 'Upload', title: 'Upload Resume', description: '...' },
    { step: 2, icon: 'FileText', title: 'Paste Job Description', description: '...' },
    { step: 3, icon: 'CheckCircle', title: 'Get Suggestions', description: '...' },
  ];
  ```
- [x] Display step number prominently (large, colored)
- [x] Add visual connector between steps (line or arrow)
- [x] Use consistent icon styling from lucide-react
- [x] Responsive: Vertical stack on mobile, horizontal on desktop

### Task 5: Create TestimonialsSection Component (AC#4)
- [x] Create `components/landing/TestimonialsSection.tsx`
- [x] Create placeholder testimonial data:
  ```typescript
  const testimonials = [
    { quote: 'My ATS score went from 38% to 72%!', name: 'Sarah K.', title: 'Software Engineer' },
    { quote: 'Finally understand why my resume was ignored.', name: 'Michael T.', title: 'Marketing Manager' },
    { quote: 'Landed 3 interviews in my first week.', name: 'Emily R.', title: 'Data Analyst' },
  ];
  ```
- [x] Use Card component for each testimonial
- [x] Add avatar placeholder (initials or generic icon)
- [x] Style with italic quote text, bold name
- [x] Grid layout: `grid-cols-1 md:grid-cols-3 gap-6`
- [x] Add code comment: `{/* TODO: Replace with real testimonials */}`

### Task 6: Create PricingSection Component (AC#5)
- [x] Create `components/landing/PricingSection.tsx`
- [x] Single "Free" pricing card:
  ```typescript
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
    ],
  };
  ```
- [x] Display price prominently with "Free" badge
- [x] List features with checkmark icons
- [x] CTA Button: "Get Started Free" → `/auth/signup`
- [x] Center the card on the page
- [x] Add code comment: `{/* TODO: Add paid tiers when ready */}`

### Task 7: Create Footer Component (AC#6)
- [x] Create `components/landing/Footer.tsx`
- [x] Add links section:
  - Privacy Policy → `ROUTES.PRIVACY_POLICY`
  - Terms of Service → `ROUTES.TERMS_OF_SERVICE` (add to routes)
- [x] Add copyright: `© {new Date().getFullYear()} SubmitSmart. All rights reserved.`
- [x] Optional: Social media placeholder links
- [x] Style with dark background or subtle border-top
- [x] Responsive: Stack links on mobile

### Task 8: Update Routes and Config (AC#7)
- [x] Add `TERMS_OF_SERVICE: '/terms-of-service'` to `lib/constants/routes.ts`
- [x] Verify `/privacy-policy` page exists (or create placeholder)
- [x] Create `/terms-of-service` placeholder page if needed
- [x] Test authenticated user redirect works correctly

### Task 9: Implement Mobile Responsiveness (AC#8)
- [x] Verify all sections stack properly on mobile
- [x] Test on common breakpoints: 320px, 375px, 768px, 1024px, 1440px
- [x] Ensure all touch targets are minimum 44px
- [x] Check no horizontal overflow on any section
- [x] Test CTA buttons are full-width on mobile

### Task 10: Create Tests
- [x] Unit tests:
  - HeroSection renders headline and CTAs
  - FeaturesSection renders all 4 features
  - HowItWorksSection renders 3 steps
  - Footer renders all links
- [x] Integration tests:
  - Landing page redirects authenticated users
  - Landing page renders all sections for anonymous users
  - CTA links navigate to correct routes
- [x] E2E tests:
  - Anonymous user sees landing page with all sections
  - Clicking "Get Started Free" navigates to signup
  - Clicking "Sign In" navigates to login
  - Authenticated user redirected to dashboard
  - Mobile responsive layout works correctly

### Task 11: Integration & Cleanup
- [x] Verify build succeeds: `npm run build`
- [x] Run all tests: `npm run test`
- [x] Test complete flow:
  - Anonymous user → Landing page → Signup
  - Authenticated user → Landing page → Dashboard redirect
- [x] Verify no console errors or warnings
- [x] Check performance with Lighthouse

---

## Dev Notes

### Architecture Patterns

**Server Component Pattern:**
The landing page MUST be a Server Component for optimal performance and SEO. Only use Client Components for interactive elements that absolutely require client-side JS.

```typescript
// app/page.tsx - Server Component (no "use client")
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect(ROUTES.APP.DASHBOARD);
  }

  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <Footer />
    </div>
  );
}
```

### Component Reuse

**From shadcn/ui:**
- `Button` - CTAs with variant props
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` - Feature/testimonial cards

**From lucide-react:**
- `BarChart3` - ATS Score feature
- `Sparkles` - AI Suggestions feature
- `Layers` - Section optimization feature
- `Shield` - Privacy feature
- `Upload`, `FileText`, `CheckCircle` - How It Works steps
- `ArrowRight` - CTA indicators

### Project Structure Notes

All landing components go in `/components/landing/` to keep them isolated from dashboard components.

**Do NOT:**
- Put landing components in `/components/shared/` (those are for reuse across app)
- Add `"use client"` to page.tsx (breaks SSR)
- Import dashboard-specific components into landing page

**DO:**
- Use Server Components for all static content
- Import from shadcn/ui for consistent styling
- Follow existing Tailwind patterns from dashboard pages

### References

- [Source: epics.md#story-167-create-full-marketing-landing-page]
- [Source: ux-design-specification.md#design-system-foundation]
- [Source: project-context.md#directory-structure-rules]
- [Source: routes.ts] - Route constants
- [Pattern: Story 16.1] - Dashboard layout foundation for component structure
- [Pattern: Story 16.2] - Dashboard page server component pattern

---

## Git Intelligence

**From recent commits (Stories 16.1-16.6):**

**Pattern 1: Server Component with Auth Check**
```typescript
export default async function PageName() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  // Page content...
}
```

**Pattern 2: Section Component Structure**
```typescript
export function SectionName() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Section Title</h2>
        {/* Section content */}
      </div>
    </section>
  );
}
```

**Pattern 3: Card Grid Layout**
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {items.map((item) => (
    <Card key={item.id}>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {item.description}
      </CardContent>
    </Card>
  ))}
</div>
```

**Pattern 4: Responsive Button Layout**
```typescript
<div className="flex flex-col sm:flex-row gap-4 justify-center">
  <Button size="lg" asChild>
    <Link href="/auth/signup">Get Started Free</Link>
  </Button>
  <Button variant="outline" size="lg" asChild>
    <Link href="/auth/login">Sign In</Link>
  </Button>
</div>
```

---

## Previous Story Learnings

**From Story 16.6 (Settings Page):**
- Server component loads data, passes to client components
- Use Card components for consistent section styling
- Responsive design: `w-full sm:w-auto` for buttons

**From Story 16.2 (Dashboard Home):**
- QuickActionCard pattern for feature cards
- Grid layouts: `grid-cols-1 md:grid-cols-2 gap-4`
- Use ROUTES constants for all navigation

**From Story 16.1 (Dashboard Layout):**
- Auth protection patterns
- Next.js redirect() function usage
- Layout component structure

---

## Testing Approach

**Unit Tests (Vitest):**
```typescript
// tests/unit/16-7-hero-section.test.tsx
describe('HeroSection', () => {
  it('renders headline correctly', () => {
    render(<HeroSection />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Land More Interviews');
  });

  it('renders Get Started CTA with correct link', () => {
    render(<HeroSection />);
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/auth/signup');
  });
});
```

**Integration Tests:**
```typescript
// tests/integration/16-7-landing-page.test.tsx
describe('Landing Page', () => {
  it('renders all sections for anonymous users', async () => {
    // Mock no auth
    render(<LandingPage />);
    expect(screen.getByRole('heading', { name: /land more interviews/i })).toBeInTheDocument();
    expect(screen.getByText(/ats score analysis/i)).toBeInTheDocument();
  });
});
```

**E2E Tests (Playwright):**
```typescript
// tests/e2e/16-7-landing-page.spec.ts
test('anonymous user sees landing page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
});

test('authenticated user redirected to dashboard', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/');
  await expect(authenticatedPage).toHaveURL('/app/dashboard');
});
```

---

## Potential Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Current page.tsx is complex client component | Refactor carefully; create new landing page from scratch |
| Breaking existing anonymous flow | Current flow moves to `/app/scan/new` for authenticated users |
| SEO not working | Ensure Server Component, add metadata export |
| Flash of landing for auth users | Server-side redirect before render |
| Performance regression | Keep all landing sections as Server Components |
| Inconsistent styling | Use existing Tailwind classes and shadcn components |

---

## Ready-for-Dev Checklist

- [x] Story context document created with comprehensive implementation guidance
- [x] Acceptance criteria clearly defined and testable (9 ACs)
- [x] 11 tasks broken down with clear subtasks
- [x] Component architecture documented
- [x] File structure defined (6 new components, 1 modified page)
- [x] Design tokens documented from UX spec
- [x] Content strategy outlined
- [x] Testing approach outlined (unit, integration, E2E)
- [x] Technical requirements from architecture satisfied
- [x] Previous story patterns analyzed
- [x] Git branch created: `feature/16-7-marketing-landing-page`
- [x] Risks identified with mitigations

**This story is comprehensive and ready for implementation.**

---

## Change Log

- 2026-01-29: Story implementation complete
  - Created all 6 landing page section components
  - Refactored app/page.tsx to Server Component with auth redirect
  - Added Privacy Policy and Terms of Service pages
  - Added TERMS_OF_SERVICE route constant
  - Created 24 unit tests and 9 E2E tests
  - All acceptance criteria satisfied

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Debug Log References

- Build: `npm run build` - SUCCESS
- Unit tests: 24 tests passed (tests/unit/16-7-landing-page.test.tsx)
- E2E tests: 9 tests passed (tests/e2e/16-7-landing-page.spec.ts)

### Completion Notes List

- ✅ Refactored app/page.tsx from client to server component with auth redirect
- ✅ Created HeroSection with headline, subheadline, and CTAs using Stripe color (#635BFF)
- ✅ Created FeaturesSection with 4 feature cards using shadcn/ui Card component
- ✅ Created HowItWorksSection with 3 numbered steps and visual connector
- ✅ Created TestimonialsSection with 3 placeholder testimonial cards (marked TODO)
- ✅ Created PricingSection with Free tier and feature list (marked TODO for paid tiers)
- ✅ Created Footer with Privacy Policy, Terms of Service links, and copyright
- ✅ Added TERMS_OF_SERVICE route constant
- ✅ Created /privacy-policy and /terms-of-service pages
- ✅ All sections are Server Components for optimal SEO/performance
- ✅ Mobile responsiveness tested via E2E (no horizontal overflow)
- ✅ SEO metadata added with title and description

### File List

**New Files:**
- components/landing/HeroSection.tsx
- components/landing/FeaturesSection.tsx
- components/landing/HowItWorksSection.tsx
- components/landing/TestimonialsSection.tsx
- components/landing/PricingSection.tsx
- components/landing/Footer.tsx
- app/privacy-policy/page.tsx
- app/terms-of-service/page.tsx
- tests/unit/16-7-landing-page.test.tsx
- tests/e2e/16-7-landing-page.spec.ts

**Modified Files:**
- app/page.tsx (refactored from client to server component)
- lib/constants/routes.ts (added TERMS_OF_SERVICE)
