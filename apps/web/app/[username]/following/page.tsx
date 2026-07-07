import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/server/auth'
import { getProfile } from '@/lib/server/db'
import { UserCard } from '@/components/profile/user-card'
import { Skeleton } from '@/components/ui/skeleton'

interface FollowingPageProps {
  params: Promise<{ username: string }>
}

async function FollowingContent({ username }: { username: string }) {
  const profile = await getProfile(username)
  if (!profile) notFound()

  const supabase = await createServerClient()
  const { data: following } = await supabase
    .from('followers')
    .select('following:profiles!following_id(*)')
    .eq('follower_id', profile.id)

  const profiles = following?.map((f) => f.following as never).filter(Boolean) ?? []

  return (
    <div className="space-y-2">
      {profiles.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Not following anyone yet
        </p>
      ) : (
        profiles.map((p: any) => <UserCard key={p.id} profile={p} />)
      )}
    </div>
  )
}

export default function FollowingPage({ params }: FollowingPageProps) {
  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <Suspense fallback={<div className="space-y-2"><Skeleton className="h-16 w-full" /></div>}>
        <FollowingContentWithParams params={params} />
      </Suspense>
    </div>
  )
}

async function FollowingContentWithParams({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <FollowingContent username={username} />
}
