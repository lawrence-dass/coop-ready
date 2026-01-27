/**
 * Authentication Validation Schemas
 *
 * Zod schemas for email/password authentication.
 * Used with React Hook Form for client-side validation.
 *
 * @example
 * ```typescript
 * const form = useForm({
 *   resolver: zodResolver(signupSchema)
 * });
 * ```
 */

import { z } from 'zod';

/**
 * Password validation regex
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * - At least 1 special character (any non-alphanumeric)
 */
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

/**
 * Signup form validation schema
 */
export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        PASSWORD_REGEX,
        'Password must contain at least 1 uppercase letter, 1 number, and 1 special character'
      ),

    confirmPassword: z.string().min(1, 'Please confirm your password'),

    acceptTerms: z
      .boolean()
      .refine((val) => val === true, {
        message: 'You must accept the terms and conditions',
      }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Infer TypeScript type from signup schema
 */
export type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Login form validation schema
 * (Placeholder for Story 8.2)
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),

  password: z.string().min(1, 'Password is required'),
});

/**
 * Infer TypeScript type from login schema
 */
export type LoginFormData = z.infer<typeof loginSchema>;
