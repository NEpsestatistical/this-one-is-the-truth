'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { verifyOtp, resendOtp } from '@/lib/actions/auth.actions'

interface VerifyEmailFormProps {
  email: string
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
    return
  }, [cooldown])

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return
      const newCode = [...code]
      newCode[index] = value.slice(0, 1)
      setCode(newCode)

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus()
      }
    },
    [code],
  )

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    },
    [code],
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const token = code.join('')
      if (token.length !== 6) {
        toast('Please enter the full 6-digit code', 'error')
        return
      }

      setLoading(true)
      try {
        const result = await verifyOtp({ email, token })
        if (result.error) {
          toast(result.error, 'error')
          setCode(['', '', '', '', '', ''])
          inputRefs.current[0]?.focus()
          return
        }
        toast('Email verified! You can now sign in.', 'success')
        router.push('/login')
      } finally {
        setLoading(false)
      }
    },
    [email, code, router, toast],
  )

  const handleResend = useCallback(async () => {
    setResending(true)
    try {
      const result = await resendOtp(email)
      if (result.error) {
        toast(result.error, 'error')
        return
      }
      toast('New code sent to your email', 'success')
      setCooldown(60)
    } finally {
      setResending(false)
    }
  }, [email, toast])

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit verification code to
        </p>
        <p className="text-sm font-medium mt-1">{email}</p>
      </div>

      <div className="flex justify-center gap-2">
        {code.map((digit, index) => (
          <Input
            key={index}
            ref={(el) => { inputRefs.current[index] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="w-12 h-14 text-center text-lg font-bold"
            autoComplete="one-time-code"
            autoFocus={index === 0}
          />
        ))}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading || code.join('').length !== 6}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Verifying...
          </>
        ) : (
          'Verify email'
        )}
      </Button>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="text-primary hover:underline font-medium disabled:opacity-50 disabled:no-underline"
          >
            {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend'}
          </button>
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to sign in
        </Link>
      </div>
    </form>
  )
}
