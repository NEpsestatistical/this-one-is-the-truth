'use client'

import { useCallback, useState } from 'react'
import { Heart, Bookmark, MessageSquare, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/providers/auth-provider'
import { toggleLike } from '@/lib/actions/like.actions'
import { toggleBookmark } from '@/lib/actions/bookmark.actions'

interface PostActionsProps {
  postId: string
  initialLiked: boolean
  initialLikeCount: number
  initialBookmarked: boolean
  initialBookmarkCount: number
  commentCount: number
  onCommentClick?: () => void
}

export function PostActions({
  postId,
  initialLiked,
  initialLikeCount,
  initialBookmarked,
  initialBookmarkCount,
  commentCount,
  onCommentClick,
}: PostActionsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [bookmarkCount, setBookmarkCount] = useState(initialBookmarkCount)
  const [loadingLike, setLoadingLike] = useState(false)
  const [loadingBookmark, setLoadingBookmark] = useState(false)

  const handleLike = useCallback(async () => {
    if (!user) {
      toast('Sign in to like posts', 'info')
      return
    }

    setLoadingLike(true)
    setLiked((prev) => !prev)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))

    try {
      const result = await toggleLike(postId)
      if (result.error) {
        setLiked((prev) => !prev)
        setLikeCount((prev) => (liked ? prev + 1 : prev - 1))
        toast(result.error, 'error')
      }
    } finally {
      setLoadingLike(false)
    }
  }, [postId, user, liked, toast])

  const handleBookmark = useCallback(async () => {
    if (!user) {
      toast('Sign in to bookmark posts', 'info')
      return
    }

    setLoadingBookmark(true)
    setBookmarked((prev) => !prev)
    setBookmarkCount((prev) => (bookmarked ? prev - 1 : prev + 1))

    try {
      const result = await toggleBookmark(postId)
      if (result.error) {
        setBookmarked((prev) => !prev)
        setBookmarkCount((prev) => (bookmarked ? prev + 1 : prev - 1))
        toast(result.error, 'error')
      }
    } finally {
      setLoadingBookmark(false)
    }
  }, [postId, user, bookmarked, toast])

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleLike}
        disabled={loadingLike}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
          liked
            ? 'text-red-500 hover:bg-red-500/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent',
        )}
      >
        {loadingLike ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
        )}
        <span className="text-xs font-medium">{likeCount}</span>
      </button>

      <button
        onClick={onCommentClick}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <MessageSquare className="h-4 w-4" />
        <span className="text-xs font-medium">{commentCount}</span>
      </button>

      <button
        onClick={handleBookmark}
        disabled={loadingBookmark}
        className={cn(
          'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors',
          bookmarked
            ? 'text-amber-500 hover:bg-amber-500/10'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent',
        )}
      >
        {loadingBookmark ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-current')} />
        )}
        <span className="text-xs font-medium">{bookmarkCount}</span>
      </button>
    </div>
  )
}
