'use client';

/**
 * Sign Out Button Component
 *
 * Button that allows authenticated users to sign out of their session.
 * Follows the ActionResponse pattern with proper error handling.
 */

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { signOut } from '@/actions/auth/sign-out';
import { useOptimizationStore } from '@/store';

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      try {
        const { error } = await signOut();

        if (error) {
          toast.error(error.message);
          return;
        }

        // Clear user-specific data from Zustand store
        useOptimizationStore.getState().reset();

        // Force server revalidation to clear cached RSC payloads
        router.refresh();
        router.push('/');
      } catch {
        // Unexpected error (should not happen with ActionResponse pattern)
        toast.error('An unexpected error occurred');
      }
    });
  };

  return (
    <Button
      onClick={handleSignOut}
      disabled={isPending}
      variant="ghost"
      size="sm"
      data-testid="sign-out-button"
      aria-label="Sign out"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sign Out
    </Button>
  );
}
