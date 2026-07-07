'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient, requireAuth } from '@/lib/server/auth'
import { CreateCommentSchema } from '@/lib/validations'
import { markdownToHtml } from '@/lib/utils/text'

export async function createComment(input: {
  post_id: string
  parent_id?: string | null
  body: string
}) {
  const parsed = CreateCommentSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Invalid input', issues: parsed.error.issues }
  }

  const user = await requireAuth().catch(() => null)
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createServerClient()

  let depth = 0
  if (parsed.data.parent_id) {
    const { data: parentComment } = await supabase
      .from('comments')
      .select('depth')
      .eq('id', parsed.data.parent_id)
      .single()

    if (parentComment) {
      depth = parentComment.depth + 1
    }
    if (depth > 2) {
      return { error: 'Maximum thread depth reached' }
    }
  }

  const { data: post } = await supabase
    .from('posts')
    .select('id')
    .eq('id', parsed.data.post_id)
    .single()

  if (!post) return { error: 'Post not found' }

  const { error } = await supabase.from('comments').insert({
    post_id: parsed.data.post_id,
    author_id: user.id,
    parent_id: parsed.data.parent_id ?? null,
    body: parsed.data.body,
    body_html: markdownToHtml(parsed.data.body),
    depth,
  })

  if (error) return { error: 'Failed to post comment' }

  revalidatePath(`/posts/${parsed.data.post_id}`)

  return { data: { success: true } }
}

export async function deleteComment(commentId: string) {
  const user = await requireAuth().catch(() => null)
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createServerClient()

  const { data: comment } = await supabase
    .from('comments')
    .select('author_id, post_id')
    .eq('id', commentId)
    .single()

  if (!comment) return { error: 'Comment not found' }
  if (comment.author_id !== user.id) return { error: 'Forbidden' }

  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) return { error: 'Failed to delete comment' }

  revalidatePath(`/posts/${comment.post_id}`)

  return { data: { success: true } }
}
