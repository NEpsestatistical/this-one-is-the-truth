'use server'

import { revalidateTag } from 'next/cache'
import { createServerClient, requireAuth } from '@/lib/server/auth'

export async function toggleLike(postId: string) {
  const user = await requireAuth().catch(() => null)
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createServerClient()

  const { data: existing } = await supabase
    .from('likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)

    if (error) return { error: 'Failed to unlike' }
  } else {
    const { error } = await supabase
      .from('likes')
      .insert({ user_id: user.id, post_id: postId })

    if (error) return { error: 'Failed to like' }
  }

  revalidateTag(`post-${postId}`)
  return { data: { liked: !existing } }
}
