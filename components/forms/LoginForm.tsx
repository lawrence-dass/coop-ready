'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginInput } from '@/lib/validations/auth'
import { signIn } from '@/actions/auth'
import { toast } from 'sonner'

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchParams = useSearchParams()

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // Track if toast was already shown to prevent duplicates
  const toastShownRef = useRef(false)

  useEffect(() => {
    // Guard against multiple invocations
    if (toastShownRef.current) return

    const verified = searchParams.get('verified') === 'true'
    const reset = searchParams.get('reset') === 'true'
    const expired = searchParams.get('expired') === 'true'

    // Show only one toast (prioritize expired > reset > verified)
    if (expired) {
      toast.error('Your session has expired. Please log in again.')
      toastShownRef.current = true
      // Don't clear redirectTo param - user wants to return to original page
      const redirectTo = searchParams.get('redirectTo')
      const newUrl = redirectTo
        ? `/auth/login?redirectTo=${redirectTo}`
        : '/auth/login'
      router.replace(newUrl, { scroll: false })
    } else if (reset) {
      toast.success('Password updated successfully! Please log in.')
      toastShownRef.current = true
      // Clear URL params to prevent toast on refresh
      router.replace('/auth/login', { scroll: false })
    } else if (verified) {
      toast.success('Email verified successfully! You can now log in.')
      toastShownRef.current = true
      // Clear URL params to prevent toast on refresh
      router.replace('/auth/login', { scroll: false })
    }
  }, [searchParams, router])

  // Helper to prevent open redirect vulnerabilities
  function isValidRedirectUrl(url: string): boolean {
    // Only allow internal paths starting with /
    const decoded = decodeURIComponent(url)
    return decoded.startsWith('/') && !decoded.startsWith('//')
  }

  function onSubmit(data: LoginInput) {
    startTransition(async () => {
      const { error } = await signIn(data)
      if (error) {
        toast.error(error.message)
        return
      }

      // Handle redirect preservation
      const redirectTo = searchParams.get('redirectTo')
      if (redirectTo && isValidRedirectUrl(redirectTo)) {
        router.push(decodeURIComponent(redirectTo))
      } else {
        router.push('/dashboard')
      }
    })
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-primary">CoopReady</h1>
        <p className="text-sm text-muted-foreground mt-1">Your AI-powered resume coach</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  data-testid="email-input"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    data-testid="forgot-password-link"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  data-testid="password-input"
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
                data-testid="login-button"
              >
                {isPending ? 'Logging in...' : 'Login'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
