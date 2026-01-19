'use server'

import { z } from 'zod'
import { signUpSchema } from '@/lib/validations/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * Auth Server Actions
 *
 * Security Note: Rate limiting is handled by Supabase Auth at the infrastructure level.
 * Supabase applies automatic rate limits to auth endpoints (signUp, signIn, etc.).
 * For additional protection, consider adding application-level rate limiting via
 * middleware or a service like Upstash Redis in production.
 *
 * @see https://supabase.com/docs/guides/auth/rate-limits
 */

type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

export async function signUp(input: z.infer<typeof signUpSchema>): Promise<ActionResponse<{ email: string }>> {
  const parsed = signUpSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      },
    })

    if (error) {
      // Handle specific Supabase errors
      if (error.message.includes('already registered')) {
        return { data: null, error: { message: 'An account with this email already exists', code: 'DUPLICATE_EMAIL' } }
      }
      return { data: null, error: { message: error.message, code: 'AUTH_ERROR' } }
    }

    return { data: { email: parsed.data.email }, error: null }
  } catch (e) {
    console.error('[signUp]', e)
    return { data: null, error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' } }
  }
}
