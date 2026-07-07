import type { Metadata } from 'next'
import { AuthLayoutShell } from '@/components/auth/auth-layout-shell'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = {
  title: 'Reset password',
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayoutShell
      title="Forgot password?"
      subtitle="We'll send you a link to reset it"
    >
      <ForgotPasswordForm />
    </AuthLayoutShell>
  )
}
