'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient, requireAuth } from '@/lib/server/auth'

export async function toggleFollow(targetUserId: string) {
  const user = await requireAuth().catch(() => null)
  if (!user) {
    console.error('[follow] toggleFollow: unauthorized')
    return { error: 'Unauthorized' }
  }

  if (user.id === targetUserId) {
    return { error: 'Cannot follow yourself' }
  }

  const supabase = await createServerClient()

  const { data: existing, error: checkError } = await supabase
    .from('followers')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .maybeSingle()

  if (checkError) {
    console.error('[follow] toggleFollow check error:', checkError.message)
    return { error: 'Failed to process follow' }
  }

  if (existing) {
    const { error } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)

    if (error) {
      console.error('[follow] toggleFollow unfollow error:', error.message)
      return { error: 'Failed to unfollow' }
    }
  } else {
    const { error } = await supabase
      .from('followers')
      .insert({ follower_id: user.id, following_id: targetUserId })

    if (error) {
      console.error('[follow] toggleFollow follow error:', error.message)
      return { error: 'Failed to follow' }
    }
  }

  revalidatePath(`/${user.user_metadata?.username}`)
  revalidatePath(`/${targetUserId}`)

  return { data: { following: !existing } }
}