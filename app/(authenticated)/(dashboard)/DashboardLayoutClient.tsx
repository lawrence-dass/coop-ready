'use client';

/**
 * Dashboard Layout Client Component
 *
 * Client-side wrapper for dashboard layout that manages mobile menu state.
 * Renders Sidebar (desktop), Header, and MobileNav (mobile).
 */

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar, Header, MobileNav } from '@/components/shared';
import { NAVIGATION_ITEMS } from '@/lib/constants/routes';

export function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Get page title from navigation items (DRY - single source of truth)
  const pageTitle = NAVIGATION_ITEMS.find(item => item.href === pathname)?.label || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Navigation Drawer */}
      <MobileNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header title={pageTitle} onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
