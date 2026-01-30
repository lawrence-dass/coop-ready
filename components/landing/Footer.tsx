/**
 * Footer Component
 * Story 16.7: Create Full Marketing Landing Page
 *
 * Displays:
 * - Privacy Policy link
 * - Terms of Service link
 * - Copyright notice
 * - Social links placeholders (optional)
 */

import Link from 'next/link';
import { ROUTES } from '@/lib/constants/routes';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">
              SubmitSmart
            </span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href={ROUTES.PRIVACY_POLICY}
              className="text-gray-600 transition-colors hover:text-gray-900"
            >
              Privacy Policy
            </Link>
            <Link
              href={ROUTES.TERMS_OF_SERVICE}
              className="text-gray-600 transition-colors hover:text-gray-900"
            >
              Terms of Service
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-gray-500">
            © {currentYear} SubmitSmart. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
