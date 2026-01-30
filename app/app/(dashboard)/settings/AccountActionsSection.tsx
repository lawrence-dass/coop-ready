/**
 * AccountActionsSection Component
 * Story 16.6: Migrate History and Settings - Task 6
 *
 * Account actions: Sign out and Delete account (placeholder).
 */

'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogOut, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { signOut } from '@/actions/auth/sign-out';
import { ROUTES } from '@/lib/constants/routes';

export function AccountActionsSection() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Handle sign out
  const handleSignOut = () => {
    startTransition(async () => {
      const { error } = await signOut();

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success('Signed out successfully');
      router.push(ROUTES.AUTH.LOGIN);
    });
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-xl">Account Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sign Out */}
        <div>
          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Signing out...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </>
            )}
          </Button>
        </div>

        {/* Delete Account (Placeholder) */}
        <div className="pt-4 border-t border-destructive/20">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Deleting your account is permanent and cannot be undone.
            </AlertDescription>
          </Alert>

          <Button
            variant="destructive"
            disabled
            className="w-full sm:w-auto"
            title="Coming soon - contact support to delete account"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Coming soon - contact support to delete your account
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
