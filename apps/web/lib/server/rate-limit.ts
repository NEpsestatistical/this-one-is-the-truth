import { createServerClient } from './auth'
import { RATE_LIMITS } from '@/lib/constants'

type RateLimitKey = keyof typeof RATE_LIMITS

export async function checkRateLimit(userId: string, key: RateLimitKey): Promise<boolean> {
  const config = RATE_LIMITS[key]
  if (!config) return false

  const supabase = await createServerClient()
  const windowStart = new Date(Date.now() - config.window * 1000).toISOString()

  const { count } = await supabase
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', key)
    .gte('created_at', windowStart)

  if (count && count >= config.limit) {
    return true
  }

  await supabase.from('rate_limits').insert({
    user_id: userId,
    endpoint: key,
  })

  return false
}
