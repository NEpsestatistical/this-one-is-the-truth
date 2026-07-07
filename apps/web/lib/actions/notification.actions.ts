'use server'

import { createServerClient, requireAuth } from '@/lib/server/auth'

export async function markNotificationRead(notificationId: string) {
  const user = await requireAuth().catch(() => null)
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to mark as read' }
  return { data: { success: true } }
}

export async function markAllNotificationsRead() {
  const user = await requireAuth().catch(() => null)
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createServerClient()
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, is_seen: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) return { error: 'Failed to mark all as read' }
  return { data: { success: true } }
}

export async function getUnreadCount() {
  const user = await requireAuth().catch(() => null)
  if (!user) return { count: 0 }

  const supabase = await createServerClient()
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return { count: count ?? 0 }
}
