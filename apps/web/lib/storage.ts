import { getAdminClient } from '@/lib/server/admin'
import { STORAGE_BUCKETS } from '@/lib/constants'
import {
  validateImage,
  generateStoragePath,
  MAX_IMAGE_SIZE,
  ALLOWED_IMAGE_TYPES,
} from '@/lib/storage-utils'
import type { ImageMeta } from '@/lib/storage-utils'

export type { ImageMeta }

let bucketEnsured = false

export async function ensureBucket(): Promise<void> {
  if (bucketEnsured) return
  console.log('[storage] ensureBucket: checking bucket', STORAGE_BUCKETS.POSTS)
  const admin = getAdminClient()
  const { data: buckets, error: listError } = await admin.storage.listBuckets()
  if (listError) {
    console.warn('[storage] ensureBucket: listBuckets error', listError.message)
    throw new Error(`Failed to list buckets: ${listError.message}`)
  }
  const exists = buckets?.some((b) => b.id === STORAGE_BUCKETS.POSTS)
  if (!exists) {
    console.log('[storage] ensureBucket: creating bucket', STORAGE_BUCKETS.POSTS)
    const { error: createError } = await admin.storage.createBucket(STORAGE_BUCKETS.POSTS, {
      public: true,
      fileSizeLimit: MAX_IMAGE_SIZE,
      allowedMimeTypes: Array.from(ALLOWED_IMAGE_TYPES),
    })
    if (createError && !createError.message.includes('already exists')) {
      throw new Error(`Failed to create storage bucket: ${createError.message}`)
    }
  }
  bucketEnsured = true
  console.log('[storage] ensureBucket: done')
}

export async function uploadImage(
  userId: string,
  file: File,
): Promise<ImageMeta> {
  console.log('[storage] uploadImage: starting', { userId, name: file.name, type: file.type, size: file.size })

  const validationError = validateImage(file)
  if (validationError) {
    console.warn('[storage] uploadImage: validation failed', validationError)
    throw new Error(validationError)
  }

  const storagePath = generateStoragePath(userId, file.name)
  const admin = getAdminClient()

  console.log('[storage] uploadImage: uploading to', storagePath)
  const { error: uploadError } = await admin.storage
    .from(STORAGE_BUCKETS.POSTS)
    .upload(storagePath, file, {
      contentType: file.type || 'image/png',
      upsert: false,
    })

  if (uploadError) {
    console.error('[storage] uploadImage: upload failed', uploadError.message)
    throw new Error(`Upload failed: ${uploadError.message}`)
  }

  console.log('[storage] uploadImage: success', storagePath)

  return {
    storage_path: storagePath,
    width: 0,
    height: 0,
    size: file.size,
    content_type: file.type,
  }
}

export async function deleteImage(storagePath: string): Promise<void> {
  const admin = getAdminClient()
  const { error } = await admin.storage
    .from(STORAGE_BUCKETS.POSTS)
    .remove([storagePath])

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`)
  }
}


