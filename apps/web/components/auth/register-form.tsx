'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { signUp } from '@/lib/actions/auth.actions'
import { GuestButton } from '@/components/auth/guest-button'

export function RegisterForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setErrors({})

      if (password !== confirmPassword) {
        setErrors({ confirmPassword: 'Passwords do not match' })
        return
      }

      setLoading(true)
      try {
        const result = await signUp({ email, password, confirmPassword, username })
        if (result.error) {
          if (result.issues) {
            const fieldErrors: Record<string, string> = {}
            for (const issue of result.issues) {
              const field = issue.path?.[0] as string
              if (field) fieldErrors[field] = issue.message
            }
            setErrors(fieldErrors)
          }
          toast(result.error, 'error')
          return
        }
        toast('Account created! Check your email for the verification code.', 'success')
        router.push(`/verify-email?email=${encodeURIComponent(email)}`)
      } finally {
        setLoading(false)
      }
    },
    [email, username, password, confirmPassword, router, toast],
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="email"
        type="email"
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        autoComplete="email"
        required
      />
      <Input
        id="username"
        label="Username"
        placeholder="your-username"
        value={username}
        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
        error={errors.username}
        autoComplete="username"
        required
      />
      <Input
        id="password"
        type="password"
        label="Password"
        placeholder="At least 8 characters"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        autoComplete="new-password"
        required
      />
      <Input
        id="confirmPassword"
        type="password"
        label="Confirm Password"
        placeholder="Repeat your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
        autoComplete="new-password"
        required
      />

      <Button type="submit" className="w-full" disabled={loading || !email || !password || !username}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Creating account...
          </>
        ) : (
          'Create account'
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
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </form>
  )
}
