import { PostCard } from '@/components/post/post-card'
import { UserCard } from '@/components/profile/user-card'
import { Badge } from '@/components/ui/badge'
import type { Post, Profile, Tag } from '@/lib/types/database'

interface SearchResultsProps {
  query: string
  type: 'posts' | 'profiles' | 'tags'
  posts?: Post[]
  profiles?: Profile[]
  tags?: Tag[]
}

export function SearchResults({ query, type, posts, profiles, tags }: SearchResultsProps) {
  if (type === 'profiles' && profiles) {
    if (profiles.length === 0) {
      return <p className="text-sm text-muted-foreground py-8 text-center">No analysts found for "{query}"</p>
    }
    return (
      <div className="space-y-2">
        {profiles.map((profile) => (
          <UserCard key={profile.id} profile={profile} />
        ))}
      </div>
    )
  }

  if (type === 'tags' && tags) {
    if (tags.length === 0) {
      return <p className="text-sm text-muted-foreground py-8 text-center">No tags found for "{query}"</p>
    }
    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <a
            key={tag.id}
            href={`/tags/${tag.slug}`}
            className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            <span>#{tag.name}</span>
            <span className="text-xs text-muted-foreground">{tag.usage_count} posts</span>
          </a>
        ))}
      </div>
    )
  }

  if (posts && posts.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No posts found for "{query}"</p>
  }

  return (
    <div className="space-y-3">
      {posts?.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
