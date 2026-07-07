import { ALLOWED_IMAGE_TYPES, LIMITS } from '@/lib/constants'
import { env } from '@/lib/env'

export interface ImageValidationResult {
  valid: boolean
  error?: string
}

export function validateImageFile(file: File): ImageValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return { valid: false, error: 'Invalid file type. Only PNG, JPEG, and WebP are allowed.' }
  }

  if (file.size > LIMITS.MAX_IMAGE_SIZE) {
    return { valid: false, error: 'File is too large. Maximum size is 10MB.' }
  }

  return { valid: true }
}

export function getImageUrl(bucket: string, path: string): string {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    console.warn('[image] NEXT_PUBLIC_SUPABASE_URL not available, cannot generate image URL')
    return ''
  }
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}

export function getImageTransformUrl(
  bucket: string,
  path: string,
  transform: { width?: number; height?: number; quality?: number },
): string {
  const base = getImageUrl(bucket, path)
  if (!base) return ''
  const params = new URLSearchParams()
  if (transform.width) params.set('width', transform.width.toString())
  if (transform.height) params.set('height', transform.height.toString())
  if (transform.quality) params.set('quality', transform.quality.toString())
  return `${base}?${params.toString()}`
}