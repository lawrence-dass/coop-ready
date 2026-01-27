/**
 * Signup Page
 *
 * Email/password registration with session migration.
 * After successful signup, redirects to onboarding flow.
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SignupForm } from '@/components/forms/SignupForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  const router = useRouter();

  /**
   * Handle successful signup - redirect to onboarding
   */
  const handleSignupSuccess = () => {
    router.push('/auth/onboarding');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm onSuccess={handleSignupSuccess} />

          <div className="mt-6 text-center text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
