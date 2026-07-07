import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

let adminClient: ReturnType<typeof createClient> | null = null

export function getAdminClient() {
  if (adminClient) return adminClient

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.error('[admin] SUPABASE_SERVICE_ROLE_KEY is not set')
    return null
  }

  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('[admin] NEXT_PUBLIC_SUPABASE_URL is not set')
    return null
  }

  adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return adminClient
}

export async function confirmUserEmail(userId: string) {
  const supabase = getAdminClient()
  if (!supabase) {
    console.error('[admin] Cannot confirm email: admin client not available')
    return
  }
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    email_confirm: true,
  })
  if (error) {
    console.error('[admin] Failed to confirm email:', error.message)
  }
}