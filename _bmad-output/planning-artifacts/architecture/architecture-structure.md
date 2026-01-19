# Architecture Structure & Boundaries

## Complete Project Directory Structure

```
coopready/
├── README.md
├── package.json
├── package-lock.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
├── components.json                 # shadcn/ui config
├── .env.local                      # Local dev (gitignored)
├── .env.example                    # Template for env vars
├── .gitignore
├── .eslintrc.json
├── .prettierrc
│
├── app/
│   ├── globals.css
│   ├── layout.tsx                  # Root layout (providers, fonts)
│   ├── page.tsx                    # Landing page (/)
│   ├── loading.tsx                 # Global loading state
│   ├── error.tsx                   # Global error boundary
│   ├── not-found.tsx               # 404 page
│   │
│   ├── (auth)/                     # Auth route group (no layout nesting)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── auth/callback/
│   │       └── route.ts            # Supabase auth callback
│   │
│   ├── (dashboard)/                # Protected route group
│   │   ├── layout.tsx              # Dashboard layout (sidebar, auth check)
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Main dashboard
│   │   ├── scan/
│   │   │   ├── new/
│   │   │   │   └── page.tsx        # New scan (upload + JD input)
│   │   │   └── [scanId]/
│   │   │       ├── page.tsx        # Scan results
│   │   │       └── loading.tsx     # Scan-specific loading
│   │   ├── settings/
│   │   │   ├── page.tsx            # User settings
│   │   │   └── subscription/
│   │   │       └── page.tsx        # Subscription management
│   │   └── onboarding/
│   │       └── page.tsx            # Profile setup (experience level, target role)
│   │
│   └── api/
│       ├── webhooks/
│       │   └── stripe/
│       │       └── route.ts        # Stripe webhook handler
│       └── upload/
│           └── route.ts            # Presigned URL generation
│
├── components/
│   ├── ui/                         # shadcn/ui primitives (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── progress.tsx
│   │   ├── skeleton.tsx
│   │   ├── sonner.tsx              # Toast notifications
│   │   ├── tabs.tsx
│   │   └── textarea.tsx
│   │
│   ├── forms/
│   │   ├── ResumeUpload.tsx        # Drag-drop file upload
│   │   ├── JDInput.tsx             # Job description textarea
│   │   ├── ProfileSetup.tsx        # Experience level + target role
│   │   └── LoginForm.tsx           # Auth form
│   │
│   ├── analysis/
│   │   ├── ScoreCard.tsx           # ATS score display (0-100)
│   │   ├── ScoreBreakdown.tsx      # Section-level scores
│   │   ├── SuggestionList.tsx      # List of suggestions
│   │   ├── SuggestionCard.tsx      # Individual before/after
│   │   ├── KeywordList.tsx         # Missing keywords
│   │   ├── TransferableSkills.tsx  # Skills mapping display
│   │   └── AcceptRejectButtons.tsx # Accept/reject controls
│   │
│   ├── layout/
│   │   ├── Header.tsx              # Main header
│   │   ├── Footer.tsx              # Landing page footer
│   │   ├── Sidebar.tsx             # Dashboard sidebar
│   │   ├── MobileNav.tsx           # Mobile navigation
│   │   └── UserMenu.tsx            # User dropdown
│   │
│   └── shared/
│       ├── LoadingSpinner.tsx
│       ├── EmptyState.tsx
│       ├── ErrorMessage.tsx
│       ├── UpgradePrompt.tsx       # Upsell to paid
│       └── ScanCounter.tsx         # "3 scans remaining"
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client (cookies)
│   │   ├── middleware.ts           # Auth middleware helper
│   │   └── types.ts                # Generated DB types
│   │
│   ├── openai/
│   │   ├── client.ts               # OpenAI client instance
│   │   ├── prompts/
│   │   │   ├── analysis.ts         # ATS analysis prompt
│   │   │   ├── suggestions.ts      # Bullet rewrite prompt
│   │   │   └── skills.ts           # Transferable skills prompt
│   │   └── parseResponse.ts        # Response parsing utilities
│   │
│   ├── stripe/
│   │   ├── client.ts               # Stripe client
│   │   ├── checkout.ts             # Create checkout session
│   │   ├── portal.ts               # Customer portal
│   │   └── webhooks.ts             # Webhook handlers
│   │
│   ├── parsers/
│   │   ├── pdf.ts                  # PDF text extraction
│   │   ├── docx.ts                 # DOCX text extraction
│   │   └── resume.ts               # Resume section parsing
│   │
│   ├── generators/
│   │   ├── pdf.ts                  # PDF resume generation
│   │   └── docx.ts                 # DOCX resume generation
│   │
│   ├── validations/
│   │   ├── auth.ts                 # Login/signup schemas
│   │   ├── profile.ts              # Profile schemas
│   │   ├── scan.ts                 # Scan input schemas
│   │   └── common.ts               # Shared schemas
│   │
│   └── utils/
│       ├── cn.ts                   # Tailwind class merge
│       ├── formatters.ts           # Date, number formatters
│       └── constants.ts            # App constants
│
├── actions/
│   ├── auth.ts                     # signUp, signIn, signOut, resetPassword
│   ├── profile.ts                  # updateProfile, getProfile
│   ├── resume.ts                   # uploadResume, getResume
│   ├── scan.ts                     # createScan, getScan, getScans
│   ├── analysis.ts                 # runAnalysis (main AI pipeline)
│   ├── suggestions.ts              # acceptSuggestion, rejectSuggestion
│   └── subscription.ts             # checkUsage, createCheckout, cancelSubscription
│
├── hooks/
│   ├── useUser.ts                  # Current user hook
│   ├── useScan.ts                  # Scan data hook
│   └── useSubscription.ts          # Subscription status hook
│
├── types/
│   ├── index.ts                    # Main type exports
│   ├── database.ts                 # Supabase generated types
│   ├── scan.ts                     # Scan-related types
│   ├── suggestion.ts               # Suggestion types
│   └── api.ts                      # API response types
│
├── config/
│   ├── site.ts                     # Site metadata
│   ├── plans.ts                    # Subscription plans
│   └── experience-levels.ts        # Student/Career Changer config
│
├── __tests__/
│   ├── setup.ts                    # Test setup
│   ├── mocks/
│   │   ├── supabase.ts
│   │   ├── openai.ts
│   │   └── stripe.ts
│   └── integration/
│       ├── analysis.test.ts
│       └── subscription.test.ts
│
└── public/
    ├── favicon.ico
    ├── logo.svg
    └── og-image.png
```

## Architectural Boundaries

### API Boundaries

| Boundary | Location | Purpose |
|----------|----------|---------|
| **Auth** | `app/(auth)/*`, `actions/auth.ts` | All authentication flows |
| **Protected Routes** | `app/(dashboard)/*` | Require authenticated user |
| **Webhooks** | `app/api/webhooks/*` | External service callbacks |
| **File Upload** | `app/api/upload/route.ts` | Presigned URL generation |

### Data Access Boundaries

| Layer | Location | Access Pattern |
|-------|----------|----------------|
| **Server Actions** | `actions/*.ts` | Direct Supabase access |
| **Route Handlers** | `app/api/*/route.ts` | Webhook processing |
| **Client** | `components/*` | Via Server Actions only |

### Service Boundaries

| Service | Location | Isolation |
|---------|----------|-----------|
| **Supabase** | `lib/supabase/*` | Single point of access |
| **OpenAI** | `lib/openai/*` | Prompts isolated, client wrapped |
| **Stripe** | `lib/stripe/*` | Payment logic contained |
| **Parsers** | `lib/parsers/*` | File processing isolated |
| **Generators** | `lib/generators/*` | Document creation isolated |

## Requirements to Structure Mapping

### FR Category → Location

| FR Category | Primary Location | Related Files |
|-------------|------------------|---------------|
| **User Account (FR1-7)** | `actions/auth.ts`, `actions/profile.ts` | `app/(auth)/*`, `components/forms/LoginForm.tsx` |
| **Resume Management (FR8-12)** | `actions/resume.ts`, `lib/parsers/*` | `components/forms/ResumeUpload.tsx` |
| **Job Description (FR13-15)** | `actions/scan.ts`, `lib/validations/scan.ts` | `components/forms/JDInput.tsx` |
| **Analysis Engine (FR16-20)** | `actions/analysis.ts`, `lib/openai/*` | `components/analysis/*` |
| **Suggestions (FR21-28)** | `actions/suggestions.ts`, `lib/openai/prompts/*` | `components/analysis/SuggestionCard.tsx` |
| **Results (FR29-34)** | `app/(dashboard)/scan/[scanId]/*` | `components/analysis/*` |
| **Export (FR35-37)** | `lib/generators/*` | Download button in scan results |
| **Subscription (FR38-44)** | `actions/subscription.ts`, `lib/stripe/*` | `app/(dashboard)/settings/subscription/*` |

## Integration Points

### Internal Data Flow

```
User Action → Server Action → Supabase/OpenAI/Stripe → Response → UI Update
     ↓              ↓                    ↓                ↓
  Form Submit   Zod Validate      Service Call      Toast + Redirect
```

### External Integrations

| Service | Integration Point | Data Flow |
|---------|-------------------|-----------|
| **Supabase** | `lib/supabase/*` | Auth, DB, Storage |
| **OpenAI** | `lib/openai/*` | Analysis, suggestions |
| **Stripe** | `lib/stripe/*`, `app/api/webhooks/stripe/*` | Payments, subscriptions |

### AI Analysis Pipeline

```
Resume Upload → Text Extraction → Section Parsing → OpenAI Analysis → Suggestions → Accept/Reject → Document Generation
```

## Component Structure

```
components/
├── ui/              # shadcn/ui primitives
├── forms/           # ResumeUpload, JDInput, ProfileSetup
├── analysis/        # ScoreCard, Suggestions, KeywordList
├── layout/          # Header, Sidebar, Footer
└── shared/          # Reusable business components
```

**Test Location:** Co-located (`Component.test.tsx`) for unit tests, `__tests__/` for integration.
