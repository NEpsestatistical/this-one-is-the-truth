'use client'

import { useCallback, useState } from 'react'
import { PostCard } from '@/components/post/post-card'
import { PostCardSkeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import type { Post } from '@/lib/types/database'

interface InfinitePostListProps {
  initialPosts: Post[]
  loadMore: (page: number) => Promise<Post[]>
  emptyMessage?: string
}

export function InfinitePostList({
  initialPosts,
  loadMore,
  emptyMessage = 'No posts yet',
}: InfinitePostListProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    try {
      const nextPage = page + 1
      const newPosts = await loadMore(nextPage)
      if (newPosts.length === 0) {
        setHasMore(false)
      } else {
        setPosts((prev) => [...prev, ...newPosts])
        setPage(nextPage)
      }
    } finally {
      setLoading(false)
    }
  }, [page, loading, hasMore, loadMore])

  const sentinelRef = useInfiniteScroll(handleLoadMore, {
    enabled: hasMore && !loading,
  })

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {loading && (
        <>
          <PostCardSkeleton />
          <PostCardSkeleton />
        </>
      )}
      {hasMore && <div ref={sentinelRef} className="h-4" />}
    </div>
  )
}
