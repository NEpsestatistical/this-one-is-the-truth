import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
  Bookmark,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatRelativeTime, formatCount, getImageUrl } from '@/lib/utils'
import { UserAvatar } from '@/components/shared/user-avatar'
import { UserName } from '@/components/shared/user-name'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LikeButton } from '@/components/post/like-button'
import { toggleBookmark } from '@/lib/actions/bookmark.actions'
import type { Post } from '@/lib/types/database'

interface PostCardProps {
  post: Post
  showFullContent?: boolean
}

export function PostCard({ post, showFullContent = false }: PostCardProps) {
  const directionIcon = {
    bullish: TrendingUp,
    bearish: TrendingDown,
    neutral: Minus,
  }

  const directionColor = {
    bullish: 'text-emerald-500',
    bearish: 'text-red-500',
    neutral: 'text-yellow-500',
  }

  const DirectionIcon = post.direction ? directionIcon[post.direction] : null
  const dirColor = post.direction ? directionColor[post.direction] : ''

  return (
    <article className="group glass-card rounded-xl transition-all duration-300">
      <Link href={`/posts/${post.id}`} className="block p-5">
        <div className="flex items-start gap-3">
          <UserAvatar
            username={post.author?.username ?? 'unknown'}
            avatarUrl={post.author?.avatar_url ?? null}
            displayName={post.author?.display_name ?? null}
            size="md"
            isVerified={post.author?.is_verified ?? false}
            showBadge
            linkable={false}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <UserName
                username={post.author?.username ?? 'unknown'}
                displayName={post.author?.display_name ?? null}
                isVerified={post.author?.is_verified ?? false}
                size="sm"
                linkable={false}
              />
              <span className="text-xs text-muted-foreground">·</span>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {formatRelativeTime(post.published_at)}
              </time>
            </div>

            <h2 className="font-semibold text-base leading-snug mb-1.5 group-hover:text-foreground/80 transition-colors">
              {post.title}
            </h2>

            {post.body && (
              <p
                className={cn(
                  'text-sm text-muted-foreground leading-relaxed',
                  !showFullContent && 'line-clamp-3',
                )}
              >
                {post.body}
              </p>
            )}

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {post.direction && (
                <Badge variant={post.direction === 'bullish' ? 'bullish' : post.direction === 'bearish' ? 'bearish' : 'neutral'}>
                  {DirectionIcon && <DirectionIcon className="h-3 w-3 mr-1" />}
                  {post.direction}
                </Badge>
              )}
              {post.confidence && (
                <Badge variant="outline" className="gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {post.confidence}/10
                </Badge>
              )}
              {post.tags?.slice(0, 3).map((t) => (
                <Badge key={t.tag.name} variant="secondary" className="text-xs">
                  #{t.tag.name}
                </Badge>
              ))}
            </div>

            {post.has_images && post.images && post.images.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-lg border bg-muted/30">
                <img
                  src={getImageUrl('posts', post.images[0]!.storage_path)}
                  alt={post.images[0]?.alt_text ?? ''}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </div>
      </Link>

      <div className="flex items-center gap-1 px-5 pb-3">
        <LikeButton postId={post.id} count={post.like_count} />
        <Link href={`/posts/${post.id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>{formatCount(post.comment_count)}</span>
            <span className="sr-only">Comment</span>
          </Button>
        </Link>
        <form action={toggleBookmark.bind(null, post.id) as unknown as () => Promise<void>}>
          <Button type="submit" variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Bookmark className="h-4 w-4" />
            <span>{formatCount(post.bookmark_count)}</span>
            <span className="sr-only">Bookmark</span>
          </Button>
        </form>
      </div>
    </article>
  )
}
