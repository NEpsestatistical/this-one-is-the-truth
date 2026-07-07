'use server'

import { createServerClient, requireAuth } from '@/lib/server/auth'
import { CreateReportSchema } from '@/lib/validations'

export async function createReport(input: {
  reportable_type: 'post' | 'comment' | 'profile'
  reportable_id: string
  reason: string
  description?: string | null
}) {
  const parsed = CreateReportSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Invalid input', issues: parsed.error.issues }
  }

  const user = await requireAuth().catch(() => null)
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createServerClient()

  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('reporter_id', user.id)
    .eq('reportable_type', parsed.data.reportable_type)
    .eq('reportable_id', parsed.data.reportable_id)
    .in('status', ['open', 'investigating'])
    .maybeSingle()

  if (existing) {
    return { error: 'You have already reported this content' }
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reportable_type: parsed.data.reportable_type,
    reportable_id: parsed.data.reportable_id,
    reason: parsed.data.reason,
    description: parsed.data.description ?? null,
  })

  if (error) return { error: 'Failed to submit report' }
  return { data: { success: true } }
}
