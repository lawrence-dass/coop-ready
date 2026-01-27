/**
 * SignupForm Component
 *
 * Email/password registration form with:
 * - Email and password validation (Zod schema)
 * - Password strength indicator
 * - Terms/privacy checkbox
 * - Loading and error states
 * - ActionResponse pattern integration
 *
 * @example
 * ```tsx
 * <SignupForm onSuccess={() => router.push('/dashboard')} />
 * ```
 */

'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { signupSchema, type SignupFormData } from '@/lib/validations/auth';
import { signup } from '@/actions/auth/signup';

interface SignupFormProps {
  /** Callback when signup succeeds */
  onSuccess?: (userId: string, email: string) => void;

  /** Callback when email verification is required */
  onVerificationRequired?: (email: string) => void;
}

/**
 * Calculate password strength (0-4)
 * 0 = very weak, 4 = very strong
 */
function calculatePasswordStrength(password: string): number {
  if (!password) return 0;

  let strength = 0;

  // Length
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[@$!%*?&]/.test(password)) strength++;

  return Math.min(strength, 4);
}

/**
 * Get password strength label and color
 */
function getPasswordStrengthInfo(strength: number): {
  label: string;
  color: string;
} {
  switch (strength) {
    case 0:
    case 1:
      return { label: 'Weak', color: 'bg-red-500' };
    case 2:
      return { label: 'Fair', color: 'bg-orange-500' };
    case 3:
      return { label: 'Good', color: 'bg-yellow-500' };
    case 4:
      return { label: 'Strong', color: 'bg-green-500' };
    default:
      return { label: '', color: '' };
  }
}

export function SignupForm({ onSuccess, onVerificationRequired }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const password = form.watch('password');
  const passwordStrength = calculatePasswordStrength(password);
  const strengthInfo = getPasswordStrengthInfo(passwordStrength);

  function onSubmit(values: SignupFormData) {
    startTransition(async () => {
      const { data, error } = await signup(values.email, values.password);

      if (error) {
        toast.error(error.message);
        return;
      }

      // Success
      if (data.requiresVerification) {
        toast.success('Verification email sent! Please check your inbox.');
        onVerificationRequired?.(data.email);
      } else {
        toast.success('Account created successfully!');
        onSuccess?.(data.userId, data.email);
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="signup-form">
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
                    autoComplete="new-password"
                    disabled={isPending}
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
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

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i < passwordStrength ? strengthInfo.color : 'bg-gray-200'
                        }`}
                        data-testid={`strength-bar-${i}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-600" data-testid="strength-label">
                    Strength: {strengthInfo.label}
                  </p>
                </div>
              )}
            </FormItem>
          )}
        />

        {/* Confirm Password Field */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...field}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isPending}
                    data-testid="confirm-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                    data-testid="toggle-confirm-password"
                  >
                    {showConfirmPassword ? (
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

        {/* Terms Checkbox */}
        <FormField
          control={form.control}
          name="acceptTerms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isPending}
                  data-testid="terms-checkbox"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I accept the{' '}
                  <a href="/terms" className="text-blue-600 hover:underline">
                    terms and conditions
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-blue-600 hover:underline">
                    privacy policy
                  </a>
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isPending}
          data-testid="signup-button"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </Form>
  );
}
