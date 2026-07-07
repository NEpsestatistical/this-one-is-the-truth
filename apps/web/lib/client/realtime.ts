'use client'

import { useCallback, useEffect, useRef } from 'react'
import { createBrowserClient } from './auth'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface RealtimeSubscription {
  channel: string
  event: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  filter?: string
  callback: (payload: unknown) => void
}

export function useRealtimeSubscription(subscriptions: RealtimeSubscription[]) {
  const channelsRef = useRef<RealtimeChannel[]>([])

  useEffect(() => {
    const supabase = createBrowserClient()

    const channels = subscriptions.map((sub) => {
      const channelConfig: Record<string, string> = {
        event: sub.event,
        schema: 'public',
        table: sub.table,
      }
      if (sub.filter) {
        channelConfig.filter = sub.filter
      }

      return supabase
        .channel(sub.channel)
        .on(
          'postgres_changes' as never,
          channelConfig as never,
          (payload: unknown) => {
            sub.callback(payload)
          },
        )
        .subscribe()
    })

    channelsRef.current = channels

    return () => {
      for (const channel of channels) {
        supabase.removeChannel(channel)
      }
    }
  }, [subscriptions])
}

export function useNotificationSubscription(
  userId: string | undefined,
  onNewNotification: () => void,
) {
  const callbackRef = useRef(onNewNotification)
  callbackRef.current = onNewNotification

  useEffect(() => {
    if (!userId) return

    const supabase = createBrowserClient()
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          callbackRef.current()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])
}
