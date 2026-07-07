'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { createServerClient, requireAuth } from '@/lib/server/auth'
import { getAdminClient } from '@/lib/server/admin'
import { CreatePostSchema, UpdatePostSchema } from '@/lib/validations'
import { markdownToHtml } from '@/lib/utils/text'
import { RATE_LIMITS } from '@/lib/constants'

export async function createPost(input: {
  title: string
  body?: string | null
  direction?: 'bullish' | 'bearish' | 'neutral' | null
  confidence?: number | null
  tags?: string[]
  images?: {
    storage_path: string
    alt_text?: string | null
    sort_order: number
    width?: number | null
    height?: number | null
    size?: number | null
    content_type?: string | null
  }[]
}) {
  const parsed = CreatePostSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Invalid input', issues: parsed.error.issues }
  }

  const user = await requireAuth().catch(() => null)
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createServerClient()
  const admin = getAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, is_banned, is_suspended')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found' }
  if (profile.is_banned) return { error: 'Account banned' }
  if (profile.is_suspended) return { error: 'Account suspended' }

  const rateKey = `rate_limit:${user.id}:post:create`
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      body_html: parsed.data.body ? markdownToHtml(parsed.data.body) : null,
      direction: parsed.data.direction,
      confidence: parsed.data.confidence,
      has_images: parsed.data.images.length > 0,
    })
    .select('id')
    .single()

  if (postError) {
    return { error: 'Failed to create post' }
  }

  if (parsed.data.tags.length > 0) {
    for (const tagName of parsed.data.tags) {
      const { data: existingTag } = await supabase
        .from('tags')
        .select('id, usage_count')
        .eq('name', tagName)
        .maybeSingle()

      let tagId: string
      if (existingTag) {
        tagId = existingTag.id
        await supabase
          .from('tags')
          .update({ usage_count: existingTag.usage_count + 1 })
          .eq('id', tagId)
      } else {
        const { data: newTag } = await supabase
          .from('tags')
          .insert({
            name: tagName,
            slug: tagName.toLowerCase().replace(/[^a-z0-9-]/g, ''),
          })
          .select('id')
          .single()
        if (!newTag) continue
        tagId = newTag.id
      }

      await supabase.from('post_tags').insert({ post_id: postData.id, tag_id: tagId })
    }
  }

  if (parsed.data.images.length > 0) {
    const imagesToInsert = parsed.data.images.map((img) => ({
      post_id: postData.id,
      storage_path: img.storage_path,
      alt_text: img.alt_text ?? null,
      sort_order: img.sort_order,
      width: img.width ?? null,
      height: img.height ?? null,
      size: img.size ?? null,
      content_type: img.content_type ?? null,
    }))
    const { error: imagesError } = await admin.from('post_images').insert(imagesToInsert as never)
    if (imagesError) {
      return { error: `Failed to save image metadata: ${imagesError.message}` }
    }
  }

  revalidatePath(`/${user.user_metadata?.username ?? 'profile'}`)
  revalidateTag('feed')
  revalidatePath('/feed')

  return { data: { id: postData.id } }
}

export async function updatePost(
  postId: string,
  input: {
    title?: string
    body?: string | null
    direction?: 'bullish' | 'bearish' | 'neutral' | null
    confidence?: number | null
    is_published?: boolean
  },
) {
  const parsed = UpdatePostSchema.safeParse(input)
  if (!parsed.success) {
    return { error: 'Invalid input', issues: parsed.error.issues }
  }

  const user = await requireAuth().catch(() => null)
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createServerClient()

  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single()

  if (!post) return { error: 'Post not found' }
  if (post.author_id !== user.id) return { error: 'Forbidden' }

  const updateData: Record<string, unknown> = {}
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title
  if (parsed.data.body !== undefined) {
    updateData.body = parsed.data.body
    updateData.body_html = parsed.data.body ? markdownToHtml(parsed.data.body) : null
  }
  if (parsed.data.direction !== undefined) updateData.direction = parsed.data.direction
  if (parsed.data.confidence !== undefined) updateData.confidence = parsed.data.confidence
  if (parsed.data.is_published !== undefined) updateData.is_published = parsed.data.is_published
  updateData.is_edited = true
  updateData.updated_at = new Date().toISOString()

  const { error } = await supabase.from('posts').update(updateData).eq('id', postId)

  if (error) return { error: 'Failed to update post' }

  revalidatePath(`/posts/${postId}`)
  revalidateTag('feed')

  return { data: { id: postId } }
}

export async function deletePost(postId: string) {
  const user = await requireAuth().catch(() => null)
  if (!user) return { error: 'Unauthorized' }

  const supabase = await createServerClient()

  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single()

  if (!post) return { error: 'Post not found' }
  if (post.author_id !== user.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
      return { error: 'Forbidden' }
    }
  }

  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) return { error: 'Failed to delete post' }

  revalidatePath(`/${user.user_metadata?.username ?? 'profile'}`)
  revalidateTag('feed')

  return { data: { id: postId } }
}

export async function uploadChartImage(formData: FormData) {
  const user = await requireAuth().catch(() => null)
  if (!user) return { error: 'Unauthorized' }

  const file = formData.get('file') as File
  if (!file) return { error: 'No file provided' }
  if (!file.type.startsWith('image/')) return { error: 'File must be an image' }
  if (file.size > 10 * 1024 * 1024) return { error: 'File too large (max 10MB)' }

  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const admin = getAdminClient()
  const { error } = await admin.storage.from('posts').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) return { error: `Upload failed: ${error.message}` }
  return { data: { path } }
}

export async function incrementViewCount(postId: string) {
  const supabase = await createServerClient()
  await supabase.rpc('increment_post_view', { post_id: postId })
}
