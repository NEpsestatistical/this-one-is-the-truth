import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient, getSession } from '@/lib/server/auth'
import { PostList } from '@/components/post/post-list'
import { PostCardSkeleton } from '@/components/ui/skeleton'
import type { Post } from '@/lib/types/database'

export const metadata: Metadata = {
  title: 'Bookmarks',
}

async function BookmarksContent() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const supabase = await createServerClient()
  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select(`
      post:posts!post_id(
        *,
        author:profiles!author_id(*),
        tags:post_tags(tag:tags(*)),
        images:post_images(*)
      )
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  const posts = bookmarks?.map((b) => b.post as unknown as Post) ?? []

  return (
    <PostList posts={posts} emptyMessage="You haven't bookmarked any posts yet" />
  )
}

export default function BookmarksPage() {
  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        <p className="text-sm text-muted-foreground mt-1">Saved analysis for later</p>
      </div>
      <Suspense fallback={<div className="space-y-3"><PostCardSkeleton /><PostCardSkeleton /></div>}>
        <BookmarksContent />
      </Suspense>
    </div>
  )
}
