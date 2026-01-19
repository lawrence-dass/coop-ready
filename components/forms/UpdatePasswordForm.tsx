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
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updatePasswordSchema, UpdatePasswordInput } from '@/lib/validations/auth'
import { updatePassword } from '@/actions/auth'
import { toast } from 'sonner'

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const form = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  function onSubmit(data: UpdatePasswordInput) {
    startTransition(async () => {
      const { error } = await updatePassword(data)
      if (error) {
        toast.error(error.message)
        return
      }
      router.push('/auth/login?reset=true')
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
          <CardTitle className="text-2xl">Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 8 characters"
                  data-testid="new-password-input"
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500" role="alert" aria-live="polite">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  data-testid="confirm-password-input"
                  {...form.register('confirmPassword')}
                />
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500" role="alert" aria-live="polite">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
                data-testid="update-password-button"
              >
                {isPending ? 'Updating...' : 'Update password'}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              <Link
                href="/auth/forgot-password"
                className="underline underline-offset-4"
              >
                Request a new reset email
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
