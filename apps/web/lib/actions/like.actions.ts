'use server'

import { revalidateTag } from 'next/cache'
import { createServerClient, requireAuth } from '@/lib/server/auth'

export async function toggleLike(postId: string) {
  const user = await requireAuth().catch(() => null)
  if (!user) {
    console.error('[like] toggleLike: unauthorized')
    return { error: 'Unauthorized' }
  }

  const supabase = await createServerClient()

  const { data: existing, error: checkError } = await supabase
    .from('likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle()

  if (checkError) {
    console.error('[like] toggleLike check error:', checkError.message)
    return { error: 'Failed to process like' }
  }

  if (existing) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)

    if (error) {
      console.error('[like] toggleLike unlike error:', error.message)
      return { error: 'Failed to unlike' }
    }
  } else {
    const { error } = await supabase
      .from('likes')
      .insert({ user_id: user.id, post_id: postId })

    if (error) {
      console.error('[like] toggleLike like error:', error.message)
      return { error: 'Failed to like' }
    }
  }

  revalidateTag(`post-${postId}`)
  return { data: { liked: !existing } }
}