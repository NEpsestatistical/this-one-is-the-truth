'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createBrowserClient } from '@/lib/client/auth'

export default function CallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createBrowserClient()
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        setError('Failed to verify email. Please try again.')
        return
      }

      if (data.session) {
        router.push('/feed')
      } else {
        setError('No session found. Please sign in.')
      }
    }

    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <a href="/login" className="text-primary hover:underline text-sm">
            Back to sign in
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-muted-foreground">Verifying your email...</p>
      </div>
    </div>
  )
}
