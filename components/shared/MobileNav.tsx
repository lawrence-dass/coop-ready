'use client';

/**
 * MobileNav Component
 *
 * Mobile navigation drawer using shadcn/ui Sheet component.
 * Displays navigation links and Sign Out button for mobile/tablet.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ScanLine, History, Settings } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { SignOutButton } from './SignOutButton';
import { NAVIGATION_ITEMS } from '@/lib/constants/routes';

const iconMap = {
  LayoutDashboard,
  ScanLine,
  History,
  Settings,
};

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    // Close drawer when link is clicked
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="flex w-64 flex-col">
        <SheetHeader>
          <SheetTitle>SubmitSmart</SheetTitle>
        </SheetHeader>

        {/* Navigation Links */}
        <nav className="flex flex-1 flex-col gap-1 py-4" aria-label="Mobile navigation">
          {NAVIGATION_ITEMS.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
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
        </nav>

        {/* Sign Out Button */}
        <div className="border-t pt-4">
          <SignOutButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}
