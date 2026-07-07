import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/server/auth'
import { UserCard } from '@/components/profile/user-card'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Discover',
}

async function DiscoverContent() {
  const supabase = await createServerClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('follower_count', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-2">
      {profiles?.map((profile) => (
        <UserCard key={profile.id} profile={profile} />
      ))}
    </div>
  )
}

export default function DiscoverPage() {
  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Discover Analysts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Top analysts on Statistical
        </p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        }
      >
        <DiscoverContent />
      </Suspense>
    </div>
  )
}
