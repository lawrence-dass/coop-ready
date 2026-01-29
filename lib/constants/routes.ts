/**
 * Route Constants
 *
 * Centralized route definitions for the application.
 * Used by navigation components and routing logic.
 */

/**
 * Navigation item type for sidebar and mobile menu
 */
export interface NavigationItem {
  label: string;
  href: string;
  icon: 'LayoutDashboard' | 'ScanLine' | 'History' | 'Settings';
}

export const ROUTES = {
  // Public routes
  HOME: '/',
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    ONBOARDING: '/auth/onboarding',
    CALLBACK: '/auth/callback',
    ERROR: '/auth/error',
  },

  // Dashboard routes
  APP: {
    DASHBOARD: '/app/dashboard',
    SCAN: {
      NEW: '/app/scan/new',
      SESSION: (id: string) => `/app/scan/${id}` as const,
    },
    HISTORY: '/app/history',
    SETTINGS: '/app/settings',
  },
} as const;

/**
 * Navigation items for sidebar and mobile menu
 */
export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: ROUTES.APP.DASHBOARD,
    icon: 'LayoutDashboard',
  },
  {
    label: 'New Scan',
    href: ROUTES.APP.SCAN.NEW,
    icon: 'ScanLine',
  },
  {
    label: 'History',
    href: ROUTES.APP.HISTORY,
    icon: 'History',
  },
  {
    label: 'Settings',
    href: ROUTES.APP.SETTINGS,
    icon: 'Settings',
  },
] as const;
