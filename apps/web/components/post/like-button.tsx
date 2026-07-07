'use client'

import { useCallback, useState } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toggleLike } from '@/lib/actions/like.actions'
import { formatCount } from '@/lib/utils'

export function LikeButton({ postId, count }: { postId: string; count: number }) {
  const [liked, setLiked] = useState(false)
  const [optimisticCount, setOptimisticCount] = useState(count)
  const [pending, setPending] = useState(false)

  const handleClick = useCallback(async () => {
    if (pending) return
    setPending(true)

    const newLiked = !liked
    setLiked(newLiked)
    setOptimisticCount((c) => c + (newLiked ? 1 : -1))

    const result = await toggleLike(postId)
    if (result?.error) {
      setLiked(!newLiked)
      setOptimisticCount((c) => c + (newLiked ? -1 : 1))
    }
    setPending(false)
  }, [postId, liked, pending])

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={pending}
      className={`gap-1.5 text-xs transition-colors ${liked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={`h-4 w-4 transition-all ${liked ? 'fill-current scale-110' : ''}`} />
      )}
      <span>{formatCount(optimisticCount)}</span>
      <span className="sr-only">Like</span>
    </Button>
  )
}
