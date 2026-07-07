'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { Heart, MessageSquare, UserPlus, Bookmark, Award, AlertTriangle, CheckCircle, XCircle, Bell } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatRelativeTime } from '@/lib/utils/date'
import { UserAvatar } from '@/components/shared/user-avatar'
import { useToast } from '@/components/ui/toast'
import { markNotificationRead } from '@/lib/actions/notification.actions'
import type { Notification } from '@/lib/types/database'

const notificationConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  like: { icon: Heart, color: 'text-red-500' },
  comment: { icon: MessageSquare, color: 'text-blue-500' },
  follow: { icon: UserPlus, color: 'text-emerald-500' },
  bookmark: { icon: Bookmark, color: 'text-amber-500' },
  achievement: { icon: Award, color: 'text-purple-500' },
  admin_warning: { icon: AlertTriangle, color: 'text-orange-500' },
  verified: { icon: CheckCircle, color: 'text-primary' },
  post_approved: { icon: CheckCircle, color: 'text-emerald-500' },
  post_rejected: { icon: XCircle, color: 'text-red-500' },
  mention: { icon: Bell, color: 'text-blue-500' },
}

interface NotificationListProps {
  initialNotifications: Notification[]
}

export function NotificationList({ initialNotifications }: NotificationListProps) {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState(initialNotifications)

  const handleClick = useCallback(
    async (notif: Notification) => {
      if (!notif.is_read) {
        const result = await markNotificationRead(notif.id)
        if (result.error) {
          toast(result.error, 'error')
          return
        }
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
        )
      }
    },
    [toast],
  )

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Bell className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No notifications yet</p>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {notifications.map((notif) => {
        const config = notificationConfig[notif.type] ?? { icon: Bell, color: 'text-muted-foreground' }
        const Icon = config.icon

        return (
          <button
            key={notif.id}
            onClick={() => handleClick(notif)}
            className={cn(
              'flex items-start gap-3 w-full text-left px-4 py-3 transition-colors hover:bg-accent/50',
              !notif.is_read && 'bg-accent/30',
            )}
          >
            <div className="shrink-0 mt-0.5">
              {notif.actor ? (
                <UserAvatar
                  username={notif.actor.username}
                  avatarUrl={notif.actor.avatar_url}
                  displayName={notif.actor.display_name}
                  size="sm"
                  linkable={false}
                />
              ) : (
                <div className={cn('h-8 w-8 rounded-full bg-muted flex items-center justify-center', config.color)}>
                  <Icon className="h-4 w-4" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed">
                {notif.actor && (
                  <span className="font-medium">{notif.actor.display_name ?? notif.actor.username}</span>
                )}{' '}
                {notif.message}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatRelativeTime(notif.created_at)}
              </p>
            </div>
            {!notif.is_read && (
              <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
            )}
          </button>
        )
      })}
    </div>
  )
}
