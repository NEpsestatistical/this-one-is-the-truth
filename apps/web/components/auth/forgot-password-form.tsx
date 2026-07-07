'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { sendPasswordReset } from '@/lib/actions/auth.actions'

export function ForgotPasswordForm() {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)
      try {
        const result = await sendPasswordReset({ email })
        if (result.error) {
          toast(result.error, 'error')
          return
        }
        setSent(true)
      } finally {
        setLoading(false)
      }
    },
    [email, toast],
  )

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          If an account with that email exists, we've sent a password reset link to{' '}
          <span className="font-medium text-foreground">{email}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Check your inbox and click the link to reset your password.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter your email and we'll send you a link to reset your password.
      </p>

      <Input
        id="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />

      <Button type="submit" className="w-full" disabled={loading || !email}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Sending...
          </>
        ) : (
          'Send reset link'
        )}
      </Button>

      <p className="text-sm text-muted-foreground text-center">
        Remember your password?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  )
}
