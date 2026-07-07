export const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024

export interface ImageMeta {
  width: number
  height: number
  size: number
  content_type: string
  storage_path: string
}

export function validateImage(file: File): string | null {
  if (file.type && !file.type.startsWith('image/')) {
    return 'File must be an image'
  }
  if (file.type && !ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Invalid file type. Only PNG, JPEG, and WebP are allowed.'
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return 'File is too large. Maximum size is 10MB.'
  }
  return null
}

export function generateStoragePath(userId: string, fileName: string): string {
  const ext = fileName.split('.').pop() ?? 'png'
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  return `${userId}/${timestamp}-${random}.${ext}`
}
