import { Suspense } from 'react'
import type { Metadata } from 'next'
import { createServerClient, getSession } from '@/lib/server/auth'
import { getFeedPosts, getFeedPostsForUser } from '@/lib/server/db'
import { PostList } from '@/components/post/post-list'
import { PostCardSkeleton } from '@/components/ui/skeleton'
import { FeedTabsWrapper } from './feed-tabs-wrapper'

export const metadata: Metadata = {
  title: 'Feed',
}

async function FeedContent() {
  const session = await getSession()
  const userId = session?.user?.id

  let posts
  if (userId) {
    posts = await getFeedPostsForUser(userId)
  } else {
    posts = await getFeedPosts()
  }

  return <PostList posts={posts} emptyMessage="No posts in your feed yet. Follow analysts to see their analysis!" />
}

export default function FeedPage() {
  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <FeedTabsWrapper />
      <div className="mt-4">
        <Suspense fallback={<div className="space-y-3"><PostCardSkeleton /><PostCardSkeleton /><PostCardSkeleton /></div>}>
          <FeedContent />
        </Suspense>
      </div>
    </div>
  )
}
