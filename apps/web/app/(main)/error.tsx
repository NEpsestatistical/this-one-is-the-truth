'use client'

import { Button } from '@/components/ui/button'
import { Shell } from '@/components/layout/shell'

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <Shell>
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </Shell>
  )
}
