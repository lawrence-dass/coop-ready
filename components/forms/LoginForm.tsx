/**
 * LoginForm Component
 *
 * Email/password login form with:
 * - Email and password validation (Zod schema)
 * - Remember me checkbox (optional)
 * - Forgot password link
 * - Loading and error states
 * - ActionResponse pattern integration
 *
 * @example
 * ```tsx
 * <LoginForm onSuccess={() => router.push('/dashboard')} />
 * ```
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/actions/auth/google';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { login } from '@/actions/auth/login';
import { checkOnboarding } from '@/actions/auth/check-onboarding';

interface LoginFormProps {
  /** Callback when login succeeds */
  onSuccess?: (userId: string, email: string) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(values: LoginFormData) {
    startTransition(async () => {
      const { data, error } = await login(values.email, values.password);

      if (error) {
        toast.error(error.message);
        return;
      }

      // Success - check onboarding status before redirecting
      toast.success('Logged in successfully!');
      if (onSuccess) {
        onSuccess(data.userId, data.email);
      } else {
        // Check if user has completed onboarding
        const { data: onboardingData } = await checkOnboarding();

        // Redirect to onboarding if not complete, otherwise home
        if (onboardingData && !onboardingData.onboardingComplete) {
          window.location.href = '/auth/onboarding';
        } else {
          // Full page load so AuthProvider reinitializes with the new session cookie
          window.location.href = '/';
        }
      }
    });
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      const { data, error } = await signInWithGoogle();

      if (error) {
        toast.error(error.message);
        setIsGoogleLoading(false);
        return;
      }

      // Redirect to Google OAuth
      window.location.href = data.url;
    } catch (err) {
      toast.error('Failed to initiate Google sign-in');
      setIsGoogleLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="login-form">
        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isPending}
                  data-testid="email-input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isPending}
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    data-testid="toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Forgot Password Link */}
        <div className="flex items-center justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 hover:underline"
            data-testid="forgot-password-link"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isPending || isGoogleLoading}
          data-testid="login-button"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Signing in...' : 'Sign in'}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isPending || isGoogleLoading}
          data-testid="google-signin-button"
        >
          {isGoogleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isGoogleLoading ? 'Signing in with Google...' : (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
