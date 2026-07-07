import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthLayoutShell } from '@/components/auth/auth-layout-shell'
import { VerifyEmailForm } from '@/components/auth/verify-email-form'

export const metadata: Metadata = {
  title: 'Verify email',
}

export default async function VerifyEmailPage(props: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await props.searchParams

  if (!email) {
    redirect('/register')
  }

  return (
    <AuthLayoutShell
      title="Check your email"
      subtitle="Enter the verification code sent to your email"
    >
      <VerifyEmailForm email={decodeURIComponent(email)} />
    </AuthLayoutShell>
  )
}
