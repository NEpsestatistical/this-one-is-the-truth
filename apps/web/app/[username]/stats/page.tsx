import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/server/auth'
import { getProfile } from '@/lib/server/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, TrendingUp, Users, Heart, Eye, MessageSquare, Bookmark } from 'lucide-react'

interface StatsPageProps {
  params: Promise<{ username: string }>
}

async function StatsContent({ username }: { username: string }) {
  const profile = await getProfile(username)
  if (!profile) notFound()

  const supabase = await createServerClient()
  const { data: postStats } = await supabase
    .from('posts')
    .select('like_count, comment_count, bookmark_count, view_count, confidence')
    .eq('author_id', profile.id)
    .eq('is_published', true)

  const totalLikes = postStats?.reduce((sum, p) => sum + (p.like_count ?? 0), 0) ?? 0
  const totalComments = postStats?.reduce((sum, p) => sum + (p.comment_count ?? 0), 0) ?? 0
  const totalBookmarks = postStats?.reduce((sum, p) => sum + (p.bookmark_count ?? 0), 0) ?? 0
  const totalViews = postStats?.reduce((sum, p) => sum + (p.view_count ?? 0), 0) ?? 0
  const avgConfidence = postStats && postStats.length > 0
    ? Math.round(postStats.reduce((sum, p) => sum + (p.confidence ?? 0), 0) / postStats.length * 10) / 10
    : 0
  const postCount = postStats?.length ?? 0
  const engagementRate = postCount > 0 ? ((totalLikes + totalComments) / postCount).toFixed(1) : '0'

  return (
    <div className="grid gap-4 grid-cols-2">
      <StatCard icon={BarChart3} label="Posts" value={postCount.toString()} />
      <StatCard icon={Heart} label="Likes" value={totalLikes.toLocaleString()} />
      <StatCard icon={MessageSquare} label="Comments" value={totalComments.toLocaleString()} />
      <StatCard icon={Bookmark} label="Bookmarks" value={totalBookmarks.toLocaleString()} />
      <StatCard icon={Eye} label="Views" value={totalViews.toLocaleString()} />
      <StatCard icon={TrendingUp} label="Engagement" value={engagementRate} />
      <StatCard icon={BarChart3} label="Avg. Confidence" value={avgConfidence.toString()} />
      <StatCard icon={Users} label="Followers" value={profile.follower_count.toLocaleString()} />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

export default function StatsPage({ params }: StatsPageProps) {
  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <h1 className="text-2xl font-bold mb-6">Statistics</h1>
      <Suspense
        fallback={
          <div className="grid gap-4 grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        }
      >
        <StatsContentWithParams params={params} />
      </Suspense>
    </div>
  )
}

async function StatsContentWithParams({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <StatsContent username={username} />
}
