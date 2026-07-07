'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { createBrowserClient } from '@/lib/client/auth'

export function ResetPasswordForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createBrowserClient()

      const { data, error } = await supabase.auth.getSession()
      if (error) {
        setError('Invalid or expired reset link. Please request a new one.')
        return
      }

      if (!data.session) {
        const hash = window.location.hash
        if (hash && hash.includes('type=recovery')) {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
          if (sessionError || !sessionData.session) {
            setError('Invalid or expired reset link. Please request a new one.')
            return
          }
        } else {
          setError('Invalid or expired reset link. Please request a new one.')
          return
        }
      }

      setReady(true)
    }

    init()
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (password.length < 8) {
        toast('Password must be at least 8 characters', 'error')
        return
      }

      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        toast('Password must include uppercase, lowercase, and a number', 'error')
        return
      }

      if (password !== confirmPassword) {
        toast('Passwords do not match', 'error')
        return
      }

      setLoading(true)
      try {
        const supabase = createBrowserClient()
        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
          toast(error.message, 'error')
          return
        }

        setDone(true)
      } finally {
        setLoading(false)
      }
    },
    [password, confirmPassword, toast],
  )

  if (error) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <XCircle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 text-sm font-medium shadow-sm transition-colors"
        >
          Request new link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-emerald-500" />
        </div>
        <p className="text-sm text-muted-foreground">Password has been reset successfully.</p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 text-sm font-medium shadow-sm transition-colors"
        >
          Sign in with new password
        </Link>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Verifying reset link...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter your new password below.
      </p>

      <Input
        id="password"
        type="password"
        label="New password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        required
      />

      <Input
        id="confirmPassword"
        type="password"
        label="Confirm new password"
        placeholder="Repeat your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        required
      />

      <Button type="submit" className="w-full" disabled={loading || !password || !confirmPassword}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Resetting...
          </>
        ) : (
          'Reset password'
        )}
      </Button>
    </form>
  )
}
