import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createServerClient, getSession } from '@/lib/server/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatRelativeTime } from '@/lib/utils/date'

export const metadata: Metadata = {
  title: 'Reports',
}

async function ReportsContent() {
  const session = await getSession()
  if (!session?.user) redirect('/login')

  const supabase = await createServerClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || !['moderator', 'admin', 'superadmin'].includes(profile.role)) {
    redirect('/feed')
  }

  const { data: reports } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:profiles!reporter_id(username, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-3">
      {(!reports || reports.length === 0) ? (
        <p className="text-sm text-muted-foreground">No reports yet</p>
      ) : (
        reports.map((report: any) => (
          <Card key={report.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium capitalize">
                  {report.reportable_type} report
                </CardTitle>
                <Badge
                  variant={
                    report.status === 'open' ? 'destructive' :
                    report.status === 'investigating' ? 'neutral' :
                    'secondary'
                  }
                >
                  {report.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Reason:</span>{' '}
                <span className="capitalize">{report.reason}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Reported by:</span>{' '}
                {report.reporter?.display_name ?? report.reporter?.username}
              </p>
              {report.description && <p className="text-muted-foreground">{report.description}</p>}
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(report.created_at)}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

export default function ReportsPage() {
  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <Suspense fallback={<div className="space-y-3"><Skeleton className="h-32 w-full rounded-xl" /></div>}>
        <ReportsContent />
      </Suspense>
    </div>
  )
}
