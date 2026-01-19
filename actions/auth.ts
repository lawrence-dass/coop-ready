'use server'

import { z } from 'zod'
import { signUpSchema, loginSchema, forgotPasswordSchema, updatePasswordSchema } from '@/lib/validations/auth'
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

export async function signIn(input: z.infer<typeof loginSchema>): Promise<ActionResponse<{ email: string }>> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    })

    if (error) {
      // SECURITY: Always return generic error - don't reveal if email exists
      return { data: null, error: { message: 'Invalid email or password', code: 'AUTH_ERROR' } }
    }

    return { data: { email: data.user.email ?? '' }, error: null }
  } catch (e) {
    console.error('[signIn]', e)
    return { data: null, error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' } }
  }
}

export async function signOut(): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[signOut]', error)
      return { data: null, error: { message: 'Failed to sign out', code: 'AUTH_ERROR' } }
    }

    return { data: null, error: null }
  } catch (e) {
    console.error('[signOut]', e)
    return { data: null, error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' } }
  }
}

export async function requestPasswordReset(
  input: z.infer<typeof forgotPasswordSchema>
): Promise<ActionResponse<null>> {
  const parsed = forgotPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } }
  }

  try {
    const supabase = await createClient()
    // SECURITY: Always show success - don't reveal if email exists
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
    })

    return { data: null, error: null }
  } catch (e) {
    console.error('[requestPasswordReset]', e)
    return { data: null, error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' } }
  }
}

export async function updatePassword(
  input: z.infer<typeof updatePasswordSchema>
): Promise<ActionResponse<null>> {
  const parsed = updatePasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { data: null, error: { message: 'Invalid input', code: 'VALIDATION_ERROR' } }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    })

    if (error) {
      // Handle expired link
      if (error.message.includes('expired') || error.message.includes('invalid')) {
        return { data: null, error: { message: 'This reset link has expired. Please request a new one.', code: 'LINK_EXPIRED' } }
      }
      return { data: null, error: { message: error.message, code: 'AUTH_ERROR' } }
    }

    return { data: null, error: null }
  } catch (e) {
    console.error('[updatePassword]', e)
    return { data: null, error: { message: 'Something went wrong', code: 'INTERNAL_ERROR' } }
  }
}
