/**
 * OAuth Error Page
 *
 * Displays OAuth authentication errors
 * Provides link to try again
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  searchParams: Promise<{
    message?: string;
  }>;
}

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const { message } = await searchParams;
  const errorMessage = message || 'Authentication failed';

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Authentication Error</h1>
          <p className="text-muted-foreground">{errorMessage}</p>
        </div>

        <div className="space-y-2">
          <Button asChild className="w-full">
            <Link href="/auth/login">Try Again</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
