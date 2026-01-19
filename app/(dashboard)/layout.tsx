import { DashboardLayout } from "@/components/layout";

// NOTE: Browser back button protection is handled by:
// 1. router.refresh() in logout handlers (clears client cache)
// 2. Middleware authentication checks (redirects unauthenticated users)
// cacheComponents: true in next.config.ts prevents using dynamic = 'force-dynamic'

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
