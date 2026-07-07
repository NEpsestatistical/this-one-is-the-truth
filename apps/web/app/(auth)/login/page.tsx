import type { Metadata } from 'next'
import { AuthLayoutShell } from '@/components/auth/auth-layout-shell'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default function LoginPage() {
  return (
    <AuthLayoutShell
      title="Welcome back"
      subtitle="Sign in to continue your analysis"
    >
      <LoginForm />
    </AuthLayoutShell>
  )
}
