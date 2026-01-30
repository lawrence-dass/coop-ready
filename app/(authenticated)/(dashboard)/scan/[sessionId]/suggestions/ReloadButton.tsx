'use client';

/**
 * Reload Button - Client Component
 *
 * Simple button to reload the current page.
 * Extracted as client component because onClick handlers
 * cannot be used in Server Components.
 */

export function ReloadButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
    >
      Reload Page
    </button>
  );
}
