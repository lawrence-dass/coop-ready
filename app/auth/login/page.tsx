/**
 * Login Page
 *
 * Email/password login for existing users.
 * Features:
 * - LoginForm component with validation
 * - Link to signup page for new users
 * - Redirect to /optimize after successful login
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/forms/LoginForm';

export const metadata = {
  title: 'Login | SubmitSmart',
  description: 'Sign in to your account',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your SubmitSmart account
          </p>
        </div>

        {/* Login Form */}
        <div className="rounded-lg bg-white px-8 py-10 shadow">
          <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
          </Suspense>

          {/* Divider */}
          <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">New to SubmitSmart?</span>
            </div>
          </div>

          {/* Sign up link */}
          <div className="mt-4 text-center">
            <Link
              href="/auth/signup"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
              data-testid="signup-link"
            >
              Create an account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-gray-700">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-gray-700">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
