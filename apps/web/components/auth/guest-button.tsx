'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { createGuestAccount } from '@/lib/actions/auth.actions'

export function GuestButton() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleGuest = useCallback(async () => {
    setLoading(true)
    try {
      const result = await createGuestAccount()
      if (result.error) {
        toast(result.error, 'error')
        return
      }
      router.push('/feed')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }, [router, toast])

  return (
    <button
      type="button"
      onClick={handleGuest}
      disabled={loading}
      className="inline-flex items-center justify-center w-full rounded-lg border border-input bg-background h-9 px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Creating guest account...
        </>
      ) : (
        'Continue as guest'
      )}
    </button>
  )
}
