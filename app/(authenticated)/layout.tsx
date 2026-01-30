/**
 * App Layout
 *
 * Root layout for all /app/* routes.
 * Ensures consistent structure and provides a wrapper for dashboard routes.
 * Auth protection is handled by the (dashboard)/layout.tsx for dashboard routes.
 *
 * Note: This layout exists to ensure any future /app/* routes
 * outside (dashboard) have a consistent wrapper.
 */

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
