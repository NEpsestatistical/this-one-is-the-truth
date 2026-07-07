'use client'

import { useCallback, useState } from 'react'
import { Loader2, MessageSquare } from 'lucide-react'
import { UserAvatar } from '@/components/shared/user-avatar'
import { UserName } from '@/components/shared/user-name'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/providers/auth-provider'
import { formatRelativeTime } from '@/lib/utils/date'
import { createComment } from '@/lib/actions/comment.actions'
import type { Comment } from '@/lib/types/database'

interface CommentListProps {
  postId: string
  initialComments: Comment[]
}

export function CommentList({ postId, initialComments }: CommentListProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(
    async (parentId?: string) => {
      if (!user) {
        toast('Sign in to comment', 'info')
        return
      }

      const text = parentId ? replyText : newComment
      if (!text.trim()) return

      setSubmitting(true)
      try {
        const result = await createComment({
          post_id: postId,
          parent_id: parentId ?? null,
          body: text.trim(),
        })

        if (result.error) {
          toast(result.error, 'error')
          return
        }

        toast('Comment posted!', 'success')
        setNewComment('')
        setReplyText('')
        setReplyTo(null)
      } finally {
        setSubmitting(false)
      }
    },
    [user, postId, newComment, replyText, toast],
  )

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Comments
      </h3>

      {user && (
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
            />
          </div>
          <Button size="sm" onClick={() => handleSubmit()} disabled={!newComment.trim() || submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
          </Button>
        </div>
      )}

      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No comments yet. Be the first to share your thoughts.
        </p>
      )}

      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="shrink-0">
              <UserAvatar
                username={comment.author?.username ?? 'unknown'}
                avatarUrl={comment.author?.avatar_url ?? null}
                displayName={comment.author?.display_name ?? null}
                size="sm"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <UserName
                  username={comment.author?.username ?? 'unknown'}
                  displayName={comment.author?.display_name ?? null}
                  isVerified={comment.author?.is_verified ?? false}
                  size="sm"
                  showUsername={false}
                />
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(comment.created_at)}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{comment.body}</p>
              <button
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
              >
                Reply
              </button>

              {comment.replies?.map((reply) => (
                <div key={reply.id} className="flex gap-3 mt-3 ml-4">
                  <div className="shrink-0">
                    <UserAvatar
                      username={reply.author?.username ?? 'unknown'}
                      avatarUrl={reply.author?.avatar_url ?? null}
                      displayName={reply.author?.display_name ?? null}
                      size="sm"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <UserName
                        username={reply.author?.username ?? 'unknown'}
                        displayName={reply.author?.display_name ?? null}
                        isVerified={reply.author?.is_verified ?? false}
                        size="sm"
                        showUsername={false}
                      />
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(reply.created_at)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{reply.body}</p>
                  </div>
                </div>
              ))}

              {replyTo === comment.id && (
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSubmit(comment.id)}
                    disabled={!replyText.trim() || submitting}
                  >
                    Reply
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
