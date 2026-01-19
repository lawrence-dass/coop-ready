"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLogout } from "@/lib/hooks/use-logout";
import Link from "next/link";

interface HeaderProps {
  onMenuClick: () => void;
  userEmail?: string | null;
  userName?: string | null;
}

export function Header({ onMenuClick, userEmail, userName }: HeaderProps) {
  const { handleLogout, isPending } = useLogout();

  // Derive display name and initials
  const displayName = userName || userEmail?.split("@")[0] || "User";
  const displayEmail = userEmail || "user@example.com";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <header data-testid="header" className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card px-4 md:hidden">
      {/* Mobile Menu Toggle */}
      <Button
        data-testid="mobile-menu-trigger"
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="md:hidden"
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle navigation menu</span>
      </Button>

      {/* Logo */}
      <div className="flex-1">
        <Link href="/dashboard" className="text-lg font-bold">
          CoopReady
        </Link>
      </div>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            data-testid="user-menu-button"
            variant="ghost"
            size="icon"
            className="rounded-full"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-avatar.png" alt="User" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">Open user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{displayEmail}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings" data-testid="settings-link">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            data-testid="logout-button"
            onClick={handleLogout}
            disabled={isPending}
          >
            {isPending ? "Logging out..." : "Logout"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
