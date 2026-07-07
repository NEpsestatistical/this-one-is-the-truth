import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient, getSession } from '@/lib/server/auth'
import { PostCard } from '@/components/post/post-card'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Moderation',
}

async function ModerationContent() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const supabase = await createServerClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || !['moderator', 'admin', 'superadmin'].includes(profile.role)) {
    redirect('/feed')
  }

  const { data: pendingPosts } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(*),
      tags:post_tags(tag:tags(*)),
      images:post_images(*)
    `)
    .eq('moderation_status', 'pending')
    .order('created_at', { ascending: false })

  const { data: flaggedPosts } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(*),
      tags:post_tags(tag:tags(*)),
      images:post_images(*)
    `)
    .eq('moderation_status', 'flagged')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-3">
          Pending Review ({pendingPosts?.length ?? 0})
        </h2>
        {(!pendingPosts || pendingPosts.length === 0) ? (
          <p className="text-sm text-muted-foreground">No pending posts</p>
        ) : (
          <div className="space-y-3">
            {pendingPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">
          Flagged ({flaggedPosts?.length ?? 0})
        </h2>
        {(!flaggedPosts || flaggedPosts.length === 0) ? (
          <p className="text-sm text-muted-foreground">No flagged posts</p>
        ) : (
          <div className="space-y-3">
            {flaggedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default function ModerationPage() {
  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <h1 className="text-2xl font-bold mb-6">Moderation Queue</h1>
      <Suspense fallback={<div className="space-y-3"><Skeleton className="h-48 w-full rounded-xl" /></div>}>
        <ModerationContent />
      </Suspense>
    </div>
  )
}
