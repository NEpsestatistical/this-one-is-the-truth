'use server'

import { requireAuth } from '@/lib/server/auth'
import { uploadImage, deleteImage, ensureBucket } from '@/lib/storage'
import type { ImageMeta } from '@/lib/storage'

export type UploadResult =
  | { data: ImageMeta; error?: never }
  | { data?: never; error: string }

export async function uploadPostImage(formData: FormData): Promise<UploadResult> {
  const user = await requireAuth().catch(() => null)
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }

  if (file.size === 0) return { error: 'File is empty' }

  console.log('[uploadPostImage] starting upload', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  })

  try {
    await ensureBucket()
    const meta = await uploadImage(user.id, file)
    console.log('[uploadPostImage] success', meta.storage_path)
    return { data: meta }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    console.error('[uploadPostImage] error', message)
    return { error: message }
  }
}

export async function deletePostImage(storagePath: string): Promise<{ error?: string }> {
  const user = await requireAuth().catch(() => null)
  if (!user) return { error: 'Unauthorized' }

  try {
    await deleteImage(storagePath)
    return {}
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Delete failed'
    return { error: message }
  }
}
