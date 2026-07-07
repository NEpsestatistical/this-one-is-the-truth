'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient, requireAuth } from '@/lib/server/auth'
import { getAdminClient } from '@/lib/server/admin'
import { UpdateProfileSchema } from '@/lib/validations'

export async function updateProfile(input: {
  display_name?: string | null
  bio?: string | null
  website?: string | null
  location?: string | null
}) {
  const parsed = UpdateProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Invalid input', issues: parsed.error.issues }
  }

  const user = await requireAuth().catch(() => null)
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createServerClient()

  const updateData: Record<string, unknown> = {}
  if (parsed.data.display_name !== undefined) updateData.display_name = parsed.data.display_name
  if (parsed.data.bio !== undefined) updateData.bio = parsed.data.bio
  if (parsed.data.website !== undefined) updateData.website = parsed.data.website || null
  if (parsed.data.location !== undefined) updateData.location = parsed.data.location
  updateData.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (error) return { error: 'Failed to update profile' }

  revalidatePath(`/${user.user_metadata?.username ?? 'profile'}`)
  revalidatePath('/settings')

  return { data: { success: true } }
}

export async function uploadAvatar(formData: FormData) {
  const user = await requireAuth().catch(() => null)
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('avatar') as File
  if (!file) return { error: 'No file provided' }

  if (!file.type.startsWith('image/')) {
    return { error: 'File must be an image' }
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: 'File too large. Maximum 2MB' }
  }

  const supabase = await createServerClient()
  const admin = getAdminClient()

  const ext = file.name.split('.').pop() ?? 'png'
  const filePath = `${user.id}/avatar-${Date.now()}.${ext}`

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadError) return { error: `Failed to upload avatar: ${uploadError.message}` }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  revalidatePath(`/${user.user_metadata?.username ?? 'profile'}`)
  revalidatePath('/settings')

  return { data: { url: publicUrl } }
}

export async function getUsernameAvailability(username: string) {
  if (!username || username.length < 3) return { available: false }

  const supabase = await createServerClient()
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle()

  return { available: !data }
}
