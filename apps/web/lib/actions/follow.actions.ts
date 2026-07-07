'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient, requireAuth } from '@/lib/server/auth'

export async function toggleFollow(targetUserId: string) {
  const user = await requireAuth().catch(() => null)
  if (!user) return { error: 'Unauthorized' }

  if (user.id === targetUserId) {
    return { error: 'Cannot follow yourself' }
  }

  const supabase = await createServerClient()

  const { data: existing } = await supabase
    .from('followers')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)

    if (error) return { error: 'Failed to unfollow' }
  } else {
    const { error } = await supabase
      .from('followers')
      .insert({ follower_id: user.id, following_id: targetUserId })

    if (error) return { error: 'Failed to follow' }
  }

  revalidatePath(`/${user.user_metadata?.username}`)
  revalidatePath(`/${targetUserId}`)

  return { data: { following: !existing } }
}
