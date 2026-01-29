/**
 * Dashboard Layout
 *
 * Shared layout for all authenticated dashboard routes.
 * Includes sidebar navigation, header, and auth protection.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/constants/routes';
import { DashboardLayoutClient } from './DashboardLayoutClient';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth protection - check if user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect(ROUTES.AUTH.LOGIN);
  }

  // Render dashboard layout for authenticated users
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
