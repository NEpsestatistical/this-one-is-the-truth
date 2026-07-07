'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { signIn } from '@/lib/actions/auth.actions'
import { GuestButton } from '@/components/auth/guest-button'

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setNeedsVerification(false)
      setLoading(true)

      try {
        const result = await signIn({ email, password, returnUrl: '/feed' })
        if (result?.error) {
          setError(result.error)
          if (result.needsVerification) {
            setNeedsVerification(true)
          }
          toast(result.error, 'error')
        }
      } finally {
        setLoading(false)
      }
    },
    [email, password, router, toast],
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
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
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-sm font-medium leading-none">Password</label>
          <Link
            href="/forgot-password"
            className="text-xs text-muted-foreground hover:text-primary hover:underline"
          >
            Forgot?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      {error && !needsVerification && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {needsVerification && (
        <div className="rounded-lg border bg-card p-3 text-sm space-y-2">
          <p className="text-muted-foreground">
            Your email hasn't been verified yet.
          </p>
          <Link
            href={`/verify-email?email=${encodeURIComponent(email)}`}
            className="text-primary hover:underline font-medium"
          >
            Verify your email
          </Link>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading || !email || !password}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <GuestButton />

      <p className="text-sm text-muted-foreground text-center">
        Don't have an account?{' '}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Create one
        </Link>
      </p>
    </form>
  )
}
