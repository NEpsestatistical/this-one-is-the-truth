import type { Metadata } from 'next'
import { AuthLayoutShell } from '@/components/auth/auth-layout-shell'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = {
  title: 'Reset password',
}

export default function ResetPasswordPage() {
  return (
    <AuthLayoutShell title="Reset your password" subtitle="Enter a new password for your account">
      <ResetPasswordForm />
    </AuthLayoutShell>
  )
}
