import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient, getSession } from '@/lib/server/auth'
import { getNotifications } from '@/lib/server/db'
import { NotificationList } from '@/components/notification/notification-list'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Notifications',
}

async function NotificationsContent() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const notifications = await getNotifications(session.user.id)
  return <NotificationList initialNotifications={notifications} />
}

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="mb-4 px-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>
      <Suspense fallback={<div className="space-y-2 px-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>}>
        <NotificationsContent />
      </Suspense>
    </div>
  )
}
