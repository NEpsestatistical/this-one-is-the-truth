import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

let adminClient: ReturnType<typeof createClient> | null = null

export function getAdminClient() {
  if (adminClient) return adminClient

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
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
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    email_confirm: true,
  })
  if (error) throw error
}
