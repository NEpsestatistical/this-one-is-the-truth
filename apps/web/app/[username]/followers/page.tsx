import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/server/auth'
import { getProfile } from '@/lib/server/db'
import { UserCard } from '@/components/profile/user-card'
import { Skeleton } from '@/components/ui/skeleton'

interface FollowersPageProps {
  params: Promise<{ username: string }>
}

async function FollowersContent({ username }: { username: string }) {
  const profile = await getProfile(username)
  if (!profile) notFound()

  const supabase = await createServerClient()
  const { data: followers } = await supabase
    .from('followers')
    .select('follower:profiles!follower_id(*)')
    .eq('following_id', profile.id)

  const profiles = followers?.map((f) => f.follower as never).filter(Boolean) ?? []

  return (
    <div className="space-y-2">
      {profiles.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No followers yet
        </p>
      ) : (
        profiles.map((p: any) => <UserCard key={p.id} profile={p} />)
      )}
    </div>
  )
}

export default function FollowersPage({ params }: FollowersPageProps) {
  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <Suspense fallback={<div className="space-y-2"><Skeleton className="h-16 w-full" /></div>}>
        <FollowersContentWithParams params={params} />
      </Suspense>
    </div>
  )
}

async function FollowersContentWithParams({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <FollowersContent username={username} />
}
