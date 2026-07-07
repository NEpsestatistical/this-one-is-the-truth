'use server'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/server/auth'
import { getAdminClient, confirmUserEmail } from '@/lib/server/admin'
import { LoginSchema, RegisterSchema } from '@/lib/validations'

export async function signIn(input: { email: string; password: string; returnUrl?: string }) {
  const parsed = LoginSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Invalid input', issues: parsed.error.issues }
  }

  console.log('[auth] signIn attempt:', parsed.data.email)

  const supabase = await createServerClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    console.error('[auth] signIn error:', error.message)
    if (error.message.includes('Email not confirmed')) {
      return { error: 'Please verify your email before signing in', needsVerification: true, email: parsed.data.email }
    }
    return { error: 'Invalid email or password' }
  }

  console.log('[auth] signIn success:', data.user?.id)
  redirect(parsed.data.returnUrl ?? '/feed')
}

export async function signUp(input: {
  email: string
  password: string
  confirmPassword: string
  username: string
}) {
  const parsed = RegisterSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Invalid input', issues: parsed.error.issues }
  }

  console.log('[auth] signUp attempt:', parsed.data.email)

  const supabase = await createServerClient()

  const { data: existingUsername } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', parsed.data.username)
    .maybeSingle()

  if (existingUsername) {
    return { error: 'Username is already taken' }
  }

  const adminClient = getAdminClient()
  if (!adminClient) {
    console.error('[auth] signUp: admin client not available (SUPABASE_SERVICE_ROLE_KEY missing)')
    return { error: 'Account creation is temporarily unavailable. Please try again later.' }
  }

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { username: parsed.data.username },
  })

  if (authError) {
    console.error('[auth] admin.createUser error:', authError.message)
    const msg = authError.message.toLowerCase()
    if (msg.includes('already') || msg.includes('exists')) {
      return { error: 'An account with this email already exists' }
    }
    return { error: 'Failed to create account. Please try again.' }
  }

  const userId = authData.user?.id
  if (!userId) {
    console.error('[auth] admin.createUser: no user returned')
    return { error: 'Failed to create account. Please try again.' }
  }

  console.log('[auth] signUp user created:', userId)

  redirect('/login?registered=true')
}

export async function verifyOtp(input: { email: string; token: string }) {
  if (!input.email || !input.token) {
    return { error: 'Email and verification code are required' }
  }

  if (!/^\d{6}$/.test(input.token)) {
    return { error: 'Verification code must be 6 digits' }
  }

  console.log('[auth] verifyOtp attempt:', input.email)

  const supabase = await createServerClient()

  const { data, error } = await supabase.auth.verifyOtp({
    email: input.email,
    token: input.token,
    type: 'email',
  })

  if (error) {
    console.error('[auth] verifyOtp error:', error.message)
    if (error.message.includes('Token has expired') || error.message.includes('expired')) {
      return { error: 'Code has expired. Request a new one.' }
    }
    return { error: 'Invalid verification code. Please try again.' }
  }

  const userId = data.user?.id
  if (!userId) {
    return { error: 'Verification failed. Please try again.' }
  }

  console.log('[auth] verifyOtp success, confirming email:', userId)

  try {
    await confirmUserEmail(userId)
  } catch (err) {
    console.error('[auth] Failed to confirm email via admin API:', err)
  }

  await supabase.auth.signOut()

  return { data: { userId } }
}

export async function resendOtp(email: string) {
  if (!email) return { error: 'Email is required' }

  console.log('[auth] resendOtp:', email)

  const supabase = await createServerClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false },
  })

  if (error) {
    console.error('[auth] resendOtp error:', error.message)
    return { error: 'Failed to send code. Please try again.' }
  }

  return { data: { email } }
}

export async function sendPasswordReset(input: { email: string }) {
  if (!input.email?.trim()) {
    return { error: 'Email is required' }
  }

  console.log('[auth] sendPasswordReset:', input.email)

  const supabase = await createServerClient()
  const { error } = await supabase.auth.resetPasswordForEmail(input.email.trim(), {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/reset-password`,
  })

  if (error) {
    console.error('[auth] resetPasswordForEmail error:', error.message)
    if (error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('over_email_send_rate_limit')) {
      return { error: 'Too many attempts. Please wait a minute and try again.' }
    }
    if (error.message.toLowerCase().includes('email') || error.message.toLowerCase().includes('not found')) {
      return { data: { email: input.email } }
    }
    return { error: 'Failed to send reset email. Please try again.' }
  }

  return { data: { email: input.email } }
}

export async function createGuestAccount() {
  console.log('[auth] createGuestAccount')

  const supabase = await createServerClient()
  const admin = getAdminClient()

  if (!admin) {
    console.error('[auth] createGuestAccount: admin client not available')
    return { error: 'Guest accounts are temporarily unavailable' }
  }

  const guestId = crypto.randomUUID().slice(0, 8)
  const username = `guest_${guestId}`
  const email = `${username}@guest.statistical.app`
  const password = crypto.randomUUID()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, is_guest: true },
  })

  if (authError || !authData.user) {
    console.error('[auth] createGuestAccount error:', authError?.message)
    return { error: 'Failed to create guest account' }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    console.error('[auth] createGuestAccount signIn error:', signInError.message)
    return { error: 'Failed to sign in as guest' }
  }

  return { data: { username } }
}

export async function signOut() {
  const supabase = await createServerClient()
  await supabase.auth.signOut()
}