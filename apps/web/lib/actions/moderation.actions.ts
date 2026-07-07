'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient, requireModerator } from '@/lib/server/auth'

export async function approvePost(postId: string) {
  const moderator = await requireModerator().catch(() => null)
  if (!moderator) return { error: 'Unauthorized' }

  const supabase = await createServerClient()

  const { data: post } = await supabase
    .from('posts')
    .select('id, moderation_status')
    .eq('id', postId)
    .single()

  if (!post) return { error: 'Post not found' }
  if (post.moderation_status !== 'pending' && post.moderation_status !== 'flagged') {
    return { error: 'Post is not pending or flagged' }
  }

  const { error } = await supabase
    .from('posts')
    .update({
      moderation_status: 'approved',
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq('id', postId)

  if (error) return { error: 'Failed to approve post' }

  await supabase.from('moderation_actions').insert({
    moderator_id: moderator.id,
    action: 'approve',
    target_type: 'post',
    target_id: postId,
    reason: null,
  })

  revalidatePath('/admin/moderation')
  revalidatePath('/feed')
  revalidatePath('/explore')

  return { data: { id: postId } }
}

export async function rejectPost(postId: string, reason?: string) {
  const moderator = await requireModerator().catch(() => null)
  if (!moderator) return { error: 'Unauthorized' }

  const supabase = await createServerClient()

  const { data: post } = await supabase
    .from('posts')
    .select('id, author_id, moderation_status')
    .eq('id', postId)
    .single()

  if (!post) return { error: 'Post not found' }
  if (post.moderation_status !== 'pending' && post.moderation_status !== 'flagged') {
    return { error: 'Post is not pending or flagged' }
  }

  const { error } = await supabase
    .from('posts')
    .update({ moderation_status: 'rejected', is_published: false })
    .eq('id', postId)

  if (error) return { error: 'Failed to reject post' }

  await supabase.from('moderation_actions').insert({
    moderator_id: moderator.id,
    action: 'reject',
    target_type: 'post',
    target_id: postId,
    reason: reason ?? null,
  })

  await supabase.from('notifications').insert({
    user_id: post.author_id,
    actor_id: moderator.id,
    type: 'post_rejected',
    notifiable_type: 'post',
    notifiable_id: postId,
    message: reason ? `Your post was rejected: ${reason}` : 'Your post was rejected',
  })

  revalidatePath('/admin/moderation')

  return { data: { id: postId } }
}

export async function flagPost(postId: string) {
  const moderator = await requireModerator().catch(() => null)
  if (!moderator) return { error: 'Unauthorized' }

  const supabase = await createServerClient()

  const { data: post } = await supabase
    .from('posts')
    .select('id, moderation_status')
    .eq('id', postId)
    .single()

  if (!post) return { error: 'Post not found' }

  const { error } = await supabase
    .from('posts')
    .update({ moderation_status: 'flagged', is_published: false })
    .eq('id', postId)

  if (error) return { error: 'Failed to flag post' }

  await supabase.from('moderation_actions').insert({
    moderator_id: moderator.id,
    action: 'flag',
    target_type: 'post',
    target_id: postId,
    reason: null,
  })

  revalidatePath('/admin/moderation')
  revalidatePath('/admin/reports')

  return { data: { id: postId } }
}

export async function resolveReport(reportId: string, resolution: 'resolved' | 'dismissed', note?: string) {
  const moderator = await requireModerator().catch(() => null)
  if (!moderator) return { error: 'Unauthorized' }

  const supabase = await createServerClient()

  const { data: report } = await supabase
    .from('reports')
    .select('id, status')
    .eq('id', reportId)
    .single()

  if (!report) return { error: 'Report not found' }

  const { error } = await supabase
    .from('reports')
    .update({
      status: resolution,
      resolved_by: moderator.id,
      resolution_note: note ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', reportId)

  if (error) return { error: 'Failed to update report' }

  revalidatePath('/admin/reports')

  return { data: { id: reportId } }
}

export async function moderateComment(commentId: string, action: 'approve' | 'reject') {
  const moderator = await requireModerator().catch(() => null)
  if (!moderator) return { error: 'Unauthorized' }

  const supabase = await createServerClient()

  const moderationStatus = action === 'approve' ? 'approved' : 'rejected'

  const { error } = await supabase
    .from('comments')
    .update({ moderation_status: moderationStatus })
    .eq('id', commentId)

  if (error) return { error: `Failed to ${action} comment` }

  await supabase.from('moderation_actions').insert({
    moderator_id: moderator.id,
    action,
    target_type: 'comment',
    target_id: commentId,
    reason: null,
  })

  revalidatePath('/admin/moderation')

  return { data: { id: commentId } }
}
