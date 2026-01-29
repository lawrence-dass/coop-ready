'use client';

/**
 * Sidebar Component
 *
 * Desktop navigation sidebar for dashboard layout.
 * Shows navigation links with active state indication and Sign Out button.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ScanLine, History, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SignOutButton } from './SignOutButton';
import { NAVIGATION_ITEMS } from '@/lib/constants/routes';

const iconMap = {
  LayoutDashboard,
  ScanLine,
  History,
  Settings,
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-background"
      aria-label="Main navigation"
    >
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">SubmitSmart</h1>
      </div>

      {/* Navigation Links */}
      <div className="flex flex-1 flex-col gap-1 p-4">
        {NAVIGATION_ITEMS.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Sign Out Button */}
      <div className="border-t p-4">
        <SignOutButton />
      </div>
    </nav>
  );
}
