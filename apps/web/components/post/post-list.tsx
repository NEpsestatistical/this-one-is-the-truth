import { PostCard } from './post-card'
import type { Post } from '@/lib/types/database'

interface PostListProps {
  posts: Post[]
  emptyMessage?: string
}

export function PostList({ posts, emptyMessage = 'No posts yet' }: PostListProps) {
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
    </div>
  )
}
