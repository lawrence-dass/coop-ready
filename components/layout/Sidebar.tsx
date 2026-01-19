"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Home, FileText, Clock, Settings, ChevronLeft, ChevronRight } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/scan/new", label: "New Scan", icon: FileText },
  { href: "/history", label: "History", icon: Clock },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  userEmail?: string | null;
  userName?: string | null;
}

export function Sidebar({
  isOpen,
  onClose,
  isMobile = false,
  isCollapsed = false,
  onToggleCollapse,
  userEmail,
  userName,
}: SidebarProps) {
  const pathname = usePathname();

  // Derive display name and initials
  const displayName = userName || userEmail?.split("@")[0] || "User";
  const displayEmail = userEmail || "user@example.com";
  const initials = displayName.charAt(0).toUpperCase();

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center px-4">
        {!isCollapsed && (
          <h1 className="text-xl font-bold">CoopReady</h1>
        )}
        {isCollapsed && (
          <h1 className="text-xl font-bold">CR</h1>
        )}
      </div>

      <Separator className="bg-sidebar-foreground/20" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        <TooltipProvider>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            const buttonContent = (
              <Button
                asChild
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
                  !isActive && "text-sidebar-foreground hover:bg-sidebar-foreground/10",
                  isCollapsed && "justify-center px-2"
                )}
                onClick={() => isMobile && onClose()}
                data-testid={item.href === "/settings" ? "settings-nav-link" : undefined}
              >
                <Link href={item.href}>
                  <Icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              </Button>
            );

            if (isCollapsed && !isMobile) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    {buttonContent}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{buttonContent}</div>;
          })}
        </TooltipProvider>
      </nav>

      <Separator className="bg-sidebar-foreground/20" />

      {/* User Info */}
      <div className="p-4">
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder-avatar.png" alt="User" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-sidebar-foreground/70">
                {displayEmail}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle (Desktop only) */}
      {!isMobile && onToggleCollapse && (
        <>
          <Separator className="bg-sidebar-foreground/20" />
          <div className="p-2">
            <Button
              data-testid="sidebar-toggle"
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="w-full text-sidebar-foreground hover:bg-sidebar-foreground/10"
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <>
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  // Mobile: render as Sheet (overlay)
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="w-64 p-0" data-testid="mobile-menu">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: render as fixed sidebar
  return (
    <aside
      data-testid="sidebar"
      data-collapsed={isCollapsed}
      className={cn(
        "hidden md:flex h-screen flex-col border-r border-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <SidebarContent />
    </aside>
  );
}
