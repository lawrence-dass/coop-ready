/**
 * WelcomeHeader Component
 * Story 16.2: Implement Dashboard Home Page
 *
 * Displays personalized welcome message with user's name
 * Extracts first name from email address
 */

interface WelcomeHeaderProps {
  userEmail: string;
  showTimeGreeting?: boolean;
}

export function WelcomeHeader({
  userEmail,
  showTimeGreeting = false,
}: WelcomeHeaderProps) {
  const firstName = extractFirstName(userEmail);
  const greeting = showTimeGreeting ? getTimeBasedGreeting() : 'Welcome';

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold mb-1">
        {greeting}, {firstName}!
      </h1>
      <p className="text-muted-foreground">{userEmail}</p>
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
