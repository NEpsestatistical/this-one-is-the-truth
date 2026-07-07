import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: { [key: string]: unknown } }[]) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })
}

export async function getSession() {
  try {
    const supabase = await createServerClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('[auth] getSession error:', error.message)
      return null
    }
    return session
  } catch (err) {
    console.error('[auth] getSession threw:', err instanceof Error ? err.message : String(err))
    return null
  }
}

export async function getCurrentUser() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('[auth] getCurrentUser error:', error.message)
      return null
    }
    return user
  } catch (err) {
    console.error('[auth] getCurrentUser threw:', err instanceof Error ? err.message : String(err))
    return null
  }
}

export async function getCurrentProfile() {
  const user = await getCurrentUser()
  if (!user) return null

  const supabase = await createServerClient()
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('[auth] getCurrentProfile error:', error.message)
      return null
    }
    return profile
  } catch (err) {
    console.error('[auth] getCurrentProfile threw:', err instanceof Error ? err.message : String(err))
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    console.error('[auth] requireAuth: no user found')
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireProfile() {
  const profile = await getCurrentProfile()
  if (!profile) {
    throw new Error('Profile not found')
  }
  if (profile.is_banned) {
    throw new Error('Account banned')
  }
  if (profile.is_suspended) {
    throw new Error('Account suspended')
  }
  return profile
}

export async function requireAdmin() {
  const profile = await requireProfile()
  if (!['admin', 'superadmin'].includes(profile.role)) {
    throw new Error('Forbidden')
  }
  return profile
}

export async function requireModerator() {
  const profile = await requireProfile()
  if (!['moderator', 'admin', 'superadmin'].includes(profile.role)) {
    throw new Error('Forbidden')
  }
  return profile
}