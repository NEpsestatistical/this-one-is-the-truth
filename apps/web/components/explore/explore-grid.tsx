import { PostCard } from '@/components/post/post-card'
import type { Post } from '@/lib/types/database'

interface ExploreGridProps {
  posts: Post[]
  hasMore: boolean
}

export function ExploreGrid({ posts, hasMore }: ExploreGridProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">No posts found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
