import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/server/auth'
import { PostList } from '@/components/post/post-list'
import { PostCardSkeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

interface TagPageProps {
  params: Promise<{ tag: string }>
}

async function TagContent({ tagSlug }: { tagSlug: string }) {
  const supabase = await createServerClient()

  const { data: tag } = await supabase
    .from('tags')
    .select('*')
    .eq('slug', tagSlug)
    .single()

  if (!tag) notFound()

  const { data: posts } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(*),
      tags:post_tags(tag:tags(*)),
      images:post_images(*)
    `)
    .eq('is_published', true)
    .eq('moderation_status', 'approved')
    .order('published_at', { ascending: false })
    .limit(20)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">#{tag.name}</h1>
        {tag.description && (
          <p className="text-sm text-muted-foreground mt-1">{tag.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          {tag.usage_count} posts
        </p>
      </div>
      <PostList posts={posts ?? []} emptyMessage={`No posts tagged #${tag.name} yet`} />
    </div>
  )
}

export default function TagPage({ params }: TagPageProps) {
  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <Suspense
        fallback={
          <div className="space-y-3">
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        }
      >
        <TagContentWithParams params={params} />
      </Suspense>
    </div>
  )
}

async function TagContentWithParams({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params
  return <TagContent tagSlug={tag} />
}
