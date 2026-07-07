import type { Metadata } from 'next'
import { AuthLayoutShell } from '@/components/auth/auth-layout-shell'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = {
  title: 'Create account',
}

export default function RegisterPage() {
  return (
    <AuthLayoutShell
      title="Join Statistical"
      subtitle="Where Elliott Wave analysts build their reputation"
    >
      <RegisterForm />
    </AuthLayoutShell>
  )
}
