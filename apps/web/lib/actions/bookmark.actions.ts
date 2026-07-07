'use server'

import { revalidateTag } from 'next/cache'
import { createServerClient, requireAuth } from '@/lib/server/auth'

export async function toggleBookmark(postId: string) {
  const user = await requireAuth().catch(() => null)
  if (!user) {
    console.error('[bookmark] toggleBookmark: unauthorized')
    return { error: 'Unauthorized' }
  }

  const supabase = await createServerClient()

  const { data: existing, error: checkError } = await supabase
    .from('bookmarks')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle()

  if (checkError) {
    console.error('[bookmark] toggleBookmark check error:', checkError.message)
    return { error: 'Failed to process bookmark' }
  }

  if (existing) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId)

    if (error) {
      console.error('[bookmark] toggleBookmark remove error:', error.message)
      return { error: 'Failed to remove bookmark' }
    }
  } else {
    const { error } = await supabase
      .from('bookmarks')
      .insert({ user_id: user.id, post_id: postId })

    if (error) {
      console.error('[bookmark] toggleBookmark add error:', error.message)
      return { error: 'Failed to bookmark' }
    }
  }

  revalidateTag(`post-${postId}`)
  return { data: { bookmarked: !existing } }
}