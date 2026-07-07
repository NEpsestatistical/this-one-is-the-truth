import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient, getSession } from '@/lib/server/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, FileText, Flag, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

async function DashboardContent() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const supabase = await createServerClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    redirect('/feed')
  }

  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  const { count: postCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })

  const { count: pendingPosts } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('moderation_status', 'pending')

  const { count: openReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')

  return (
    <div className="max-w-4xl mx-auto py-4 px-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard icon={Users} label="Users" value={userCount?.toLocaleString() ?? '0'} />
        <StatCard icon={FileText} label="Posts" value={postCount?.toLocaleString() ?? '0'} />
        <StatCard icon={AlertTriangle} label="Pending" value={pendingPosts?.toString() ?? '0'} />
        <StatCard icon={Flag} label="Reports" value={openReports?.toString() ?? '0'} />
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto py-4 px-4">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-4 grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
