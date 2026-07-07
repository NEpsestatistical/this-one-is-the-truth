import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/server/auth'
import { UserAvatar } from '@/components/shared/user-avatar'
import { UserName } from '@/components/shared/user-name'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Leaderboards',
}

async function LeaderboardsContent() {
  const supabase = await createServerClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('follower_count', { ascending: false })
    .limit(100)

  if (!profiles || profiles.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet</p>
  }

  const rankedProfiles = profiles.map((p, i) => ({
    ...p,
    rank: i + 1,
    score: p.follower_count * 1.5 + p.like_count * 2 + p.post_count * 10,
  }))

  return (
    <div className="space-y-1">
      {rankedProfiles.map((profile) => (
        <div
          key={profile.id}
          className="flex items-center gap-4 rounded-lg border bg-card p-3"
        >
          <span className="w-8 text-center text-sm font-bold text-muted-foreground">
            #{profile.rank}
          </span>
          <UserAvatar
            username={profile.username}
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name}
            size="md"
            isVerified={profile.is_verified}
            showBadge
          />
          <div className="flex-1 min-w-0">
            <UserName
              username={profile.username}
              displayName={profile.display_name}
              isVerified={profile.is_verified}
            />
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{Math.round(profile.score).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">points</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function LeaderboardsPage() {
  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Leaderboards</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Top analysts ranked by reputation
        </p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        }
      >
        <LeaderboardsContent />
      </Suspense>
    </div>
  )
}
