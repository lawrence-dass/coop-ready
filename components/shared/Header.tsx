'use client';

/**
 * Header Component
 *
 * Page header that displays current page title and hamburger menu on mobile.
 */

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-16 lg:px-6">
      {/* Hamburger Menu Button - Mobile Only */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page Title */}
      <h1 className="text-lg font-semibold lg:text-xl">{title}</h1>
    </header>
  );
}
