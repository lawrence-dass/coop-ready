# Epic 7: Subscription & Billing

Free users are limited to 3 scans/month; paid users ($5/mo) get unlimited scans with secure Stripe payment processing.

## Story 7.1: Stripe Integration Setup

As a **developer**,
I want **Stripe configured with products, prices, and webhook handling**,
So that **payment processing works securely**.

**Acceptance Criteria:**

**Given** the Stripe account is set up
**When** I configure the integration
**Then** environment variables are set: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
**And** the Stripe client is initialized in `lib/stripe/client.ts`

**Given** products need to be created
**When** I set up Stripe Dashboard
**Then** a "CoopReady Pro" product exists
**And** a $5/month recurring price is attached
**And** product and price IDs are stored in `config/plans.ts`

**Given** a webhook endpoint is needed
**When** I create the route handler
**Then** `app/api/webhooks/stripe/route.ts` handles Stripe events
**And** webhook signature is verified using `STRIPE_WEBHOOK_SECRET`
**And** invalid signatures return 400 error

**Given** a `checkout.session.completed` event is received
**When** the webhook processes it
**Then** the user's subscription status is updated in the database
**And** `user_profiles.subscription_status` is set to 'active'
**And** `user_profiles.stripe_customer_id` is stored

**Given** a `customer.subscription.deleted` event is received
**When** the webhook processes it
**Then** the user's subscription status is set to 'cancelled'
**And** the user reverts to free tier limits

**Given** a `invoice.payment_failed` event is received
**When** the webhook processes it
**Then** the user's subscription status is set to 'past_due'
**And** the user is notified (future: email notification)

**Technical Notes:**
- Create `lib/stripe/client.ts` for Stripe initialization
- Create `lib/stripe/webhooks.ts` for webhook event handlers
- Create `app/api/webhooks/stripe/route.ts`
- Add to `user_profiles`: `subscription_status` (free/active/past_due/cancelled), `stripe_customer_id`, `stripe_subscription_id`, `subscription_ends_at`
- Use idempotency keys for webhook processing
- Log all webhook events for debugging

---

## Story 7.2: Scan Usage Tracking

As a **system**,
I want **to track how many scans each user performs per month**,
So that **rate limiting can be enforced**.

**Acceptance Criteria:**

**Given** a user initiates a new scan
**When** the scan is created
**Then** the scan is counted toward their monthly usage
**And** `user_profiles.scans_this_month` is incremented

**Given** a new month begins
**When** the first scan of the month is attempted
**Then** `user_profiles.scans_this_month` is reset to 0
**And** `user_profiles.scan_reset_date` is updated to current month

**Given** a user has completed scans this month
**When** their usage is queried
**Then** the correct count is returned
**And** the count only includes scans from the current calendar month

**Given** a scan fails or is cancelled
**When** usage is tracked
**Then** failed scans do not count toward the limit
**And** only successfully completed scans are counted

**Given** usage data is needed
**When** I query the database
**Then** I can efficiently get a user's current month scan count
**And** the query uses `scan_reset_date` to determine if reset is needed

**Technical Notes:**
- Add to `user_profiles`: `scans_this_month` (integer, default 0), `scan_reset_date` (date)
- Create `actions/subscription.ts` with `checkUsage`, `incrementUsage`
- Reset logic: if `scan_reset_date` < start of current month, reset counter
- Only increment after scan status = 'completed'
- Consider timezone handling (use UTC)

---

## Story 7.3: Free Tier Rate Limiting

As a **system**,
I want **to enforce the 3 scans/month limit for free users**,
So that **the freemium model is maintained**.

**Acceptance Criteria:**

**Given** I am a free user with 0-2 scans this month
**When** I try to start a new scan
**Then** the scan is allowed to proceed
**And** my usage count is incremented

**Given** I am a free user with 3 scans this month
**When** I try to start a new scan
**Then** the scan is blocked
**And** I see a message "You've used all 3 free scans this month"
**And** I see an option to upgrade to Pro

**Given** I am a paid user (subscription_status = 'active')
**When** I try to start a new scan
**Then** the scan is always allowed
**And** no limit check is performed

**Given** I am a free user at the limit
**When** I view the new scan page
**Then** the "Start Analysis" button is disabled
**And** I see my usage: "3/3 scans used"
**And** I see upgrade CTA prominently

**Given** rate limiting is checked
**When** the check runs
**Then** it happens before any expensive operations (file processing, AI calls)
**And** the check is fast (database query only)

**Given** a user's subscription expires
**When** they try to scan
**Then** they are treated as a free user
**And** rate limiting applies if they've used 3+ scans

**Technical Notes:**
- Add rate limit check to `createScan` action (beginning of function)
- Create `checkCanScan` helper in `actions/subscription.ts`
- Return `{ canScan: boolean, remaining: number, reason?: string }`
- Check order: 1) Is paid? → allow, 2) Check usage count
- Block at UI level AND server level (defense in depth)

---

## Story 7.4: Scan Counter Display

As a **user**,
I want **to see how many scans I have remaining**,
So that **I know when I need to upgrade**.

**Acceptance Criteria:**

**Given** I am a free user
**When** I view the dashboard or sidebar
**Then** I see my scan usage: "X/3 scans used this month"
**And** the display updates after each scan

**Given** I have 1 scan remaining
**When** I view the counter
**Then** it shows a warning color (yellow/orange)
**And** text says "1 scan remaining"

**Given** I have 0 scans remaining
**When** I view the counter
**Then** it shows an alert color (red)
**And** text says "No scans remaining"
**And** an "Upgrade" button is prominent

**Given** I am a paid user
**When** I view the dashboard
**Then** I see "Unlimited scans" or "Pro" badge
**And** no counter is displayed

**Given** I am on the new scan page
**When** I view the page header
**Then** my scan count is visible
**And** I understand my limits before starting

**Given** the month resets
**When** I view the counter
**Then** it shows the reset count (e.g., "0/3 scans used")
**And** the reset happens automatically

**Technical Notes:**
- Create `components/shared/ScanCounter.tsx`
- Add to sidebar and new scan page
- Fetch usage via `useSubscription` hook or server component
- Use color coding: green (0-1 used), yellow (2 used), red (3 used)
- For paid users, show "Pro" badge instead of counter

---

## Story 7.5: Upgrade to Paid Subscription

As a **free user**,
I want **to upgrade to the paid plan**,
So that **I can get unlimited scans**.

**Acceptance Criteria:**

**Given** I am a free user
**When** I click "Upgrade to Pro" from any upgrade CTA
**Then** I am redirected to Stripe Checkout
**And** the checkout shows: "CoopReady Pro - $5/month"
**And** I can enter my payment information

**Given** I complete the Stripe Checkout successfully
**When** payment is processed
**Then** I am redirected back to CoopReady
**And** I see a success message "Welcome to Pro!"
**And** my subscription status is updated to 'active'

**Given** I cancel during Stripe Checkout
**When** I return to CoopReady
**Then** I see the dashboard (no error)
**And** my subscription status remains 'free'
**And** I can try again later

**Given** payment fails during checkout
**When** Stripe shows the error
**Then** I can retry with different payment method
**And** no partial subscription is created

**Given** I view the upgrade page/modal
**When** I see the offer
**Then** I see clear pricing: "$5/month"
**And** I see benefits: "Unlimited scans", "Priority support"
**And** I see a clear CTA button

**Given** I am already a paid user
**When** I somehow reach the upgrade flow
**Then** I see "You're already on Pro!"
**And** I am redirected to subscription management

**Technical Notes:**
- Create `lib/stripe/checkout.ts` with `createCheckoutSession`
- Create `actions/subscription.ts` with `createCheckout` action
- Checkout success URL: `/settings/subscription?success=true`
- Checkout cancel URL: `/settings/subscription?cancelled=true`
- Pass `client_reference_id` = user ID for webhook correlation
- Create `components/shared/UpgradePrompt.tsx` for reusable CTA

---

## Story 7.6: Subscription Management

As a **paid user**,
I want **to view and manage my subscription**,
So that **I can cancel if needed**.

**Acceptance Criteria:**

**Given** I am a paid user
**When** I navigate to Settings > Subscription
**Then** I see my current plan: "CoopReady Pro"
**And** I see my billing cycle: "Renews on [date]"
**And** I see my payment method (last 4 digits)

**Given** I want to update my payment method
**When** I click "Manage Billing"
**Then** I am redirected to Stripe Customer Portal
**And** I can update my card or billing info
**And** changes are reflected in CoopReady

**Given** I want to cancel my subscription
**When** I click "Cancel Subscription"
**Then** I see a confirmation: "Are you sure? You'll lose unlimited scans."
**And** I must confirm to proceed

**Given** I confirm cancellation
**When** the cancellation is processed
**Then** my subscription is set to cancel at period end
**And** I see "Subscription ends on [date]"
**And** I retain Pro access until the end date

**Given** my subscription has been cancelled but not yet ended
**When** I view subscription settings
**Then** I see "Cancelling on [date]"
**And** I see a "Reactivate" option
**And** clicking reactivate restores the subscription

**Given** I am a free user
**When** I navigate to Settings > Subscription
**Then** I see "Free Plan"
**And** I see my usage this month
**And** I see an "Upgrade to Pro" button

**Technical Notes:**
- Create `app/(dashboard)/settings/subscription/page.tsx`
- Create `lib/stripe/portal.ts` with `createPortalSession`
- Add `createPortal` action to `actions/subscription.ts`
- Portal return URL: `/settings/subscription`
- Handle `customer.subscription.updated` webhook for reactivation
- Show appropriate UI based on `subscription_status`
