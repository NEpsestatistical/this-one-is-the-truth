import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient, getSession } from '@/lib/server/auth'
import { getProfile, getPostsByAuthor, isFollowing } from '@/lib/server/db'
import { ProfileHeader } from '@/components/profile/profile-header'
import { ProfileTabs } from '@/components/profile/profile-tabs'
import { PostList } from '@/components/post/post-list'
import { PostCardSkeleton } from '@/components/ui/skeleton'

interface ProfilePageProps {
  params: Promise<{ username: string }>
}

async function ProfileContent({ username }: { username: string }) {
  const profile = await getProfile(username)
  if (!profile) notFound()

  const session = await getSession()
  const currentUserId = session?.user?.id

  const posts = await getPostsByAuthor(profile.id)
  const following = currentUserId ? await isFollowing(currentUserId, profile.id) : false

  const tabs = [
    {
      id: 'posts',
      label: 'Analysis',
      content: <PostList posts={posts} emptyMessage="No analysis posted yet" />,
    },
    {
      id: 'likes',
      label: 'Likes',
      content: <LikesTab userId={profile.id} />,
    },
  ]

  return (
    <div>
      <ProfileHeader
        profile={profile}
        isFollowing={following}
        postCount={posts.length}
      />
      <div className="mt-6 px-4">
        <ProfileTabs tabs={tabs} defaultTab="posts" />
      </div>
    </div>
  )
}

async function LikesTab({ userId }: { userId: string }) {
  const supabase = await createServerClient()
  const { data: likes } = await supabase
    .from('likes')
    .select(`
      post:posts!post_id(
        *,
        author:profiles!author_id(*),
        tags:post_tags(tag:tags(*)),
        images:post_images(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  const posts = likes?.map((l) => l.post as never).filter(Boolean) ?? []
  return <PostList posts={posts} emptyMessage="No liked posts" />
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const profile = await getProfile(username)
  if (!profile) return { title: 'Profile not found' }

  return {
    title: `${profile.display_name ?? profile.username} (@${profile.username})`,
    description: profile.bio ?? `${profile.display_name ?? profile.username} — Elliott Wave analyst on Statistical`,
    openGraph: profile.avatar_url ? { images: [{ url: profile.avatar_url }] } : undefined,
  }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  return (
    <div className="max-w-2xl mx-auto py-4">
      <Suspense
        fallback={
          <div className="px-4 space-y-4">
            <div className="h-48 rounded-xl bg-muted animate-pulse" />
            <div className="flex items-end gap-4 -mt-12">
              <div className="h-24 w-24 rounded-full bg-muted animate-pulse border-4 border-background" />
              <div className="space-y-2 pb-2">
                <div className="h-6 w-40 bg-muted animate-pulse rounded" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </div>
        }
      >
        <ProfileContentWithParams params={params} />
      </Suspense>
    </div>
  )
}

async function ProfileContentWithParams({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <ProfileContent username={username} />
}
