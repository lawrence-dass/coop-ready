/**
 * WelcomeHeader Component
 * Story 16.2: Implement Dashboard Home Page
 * Story 17.6: Dashboard UI Cleanup (removed email display)
 *
 * Displays personalized welcome message with user's first name.
 * Falls back to extracting name from email if first name not provided.
 */

interface WelcomeHeaderProps {
  firstName?: string | null;
  userEmail: string;
  showTimeGreeting?: boolean;
}

export function WelcomeHeader({
  firstName,
  userEmail,
  showTimeGreeting = false,
}: WelcomeHeaderProps) {
  // Use provided firstName, or fall back to extracting from email
  const displayName = firstName?.trim() || extractFirstName(userEmail);
  const greeting = showTimeGreeting ? getTimeBasedGreeting() : 'Welcome';

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold">
        {greeting}, {displayName}!
      </h1>
    </div>
  );
}

/**
 * Extract first name from email address
 * Handles formats like: john.doe@example.com → John
 */
function extractFirstName(email: string): string {
  const username = email.split('@')[0];
  const firstName = username.split('.')[0].split('-')[0].split('_')[0];

  // Capitalize first letter
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

/**
 * Get time-based greeting (Good morning/afternoon/evening)
 */
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
