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
    console.error('[post] createPost validation error:', parsed.error.issues)
    return { error: 'Invalid input', issues: parsed.error.issues }
  }

  const user = await requireAuth().catch(() => null)
  if (!user) {
    console.error('[post] createPost: unauthorized')
    return { error: 'Unauthorized' }
  }

  const supabase = await createServerClient()
  const admin = getAdminClient()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, is_banned, is_suspended')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('[post] createPost profile fetch error:', profileError.message)
    return { error: 'Failed to verify profile' }
  }

  if (!profile) return { error: 'Profile not found' }
  if (profile.is_banned) return { error: 'Account banned' }
  if (profile.is_suspended) return { error: 'Account suspended' }

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
    console.error('[post] createPost insert error:', postError.message)
    return { error: 'Failed to create post' }
  }

  console.log('[post] createPost created:', postData.id)

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
        const { error: updateError } = await supabase
          .from('tags')
          .update({ usage_count: existingTag.usage_count + 1 })
          .eq('id', tagId)
        if (updateError) {
          console.error('[post] createPost tag update error:', updateError.message)
        }
      } else {
        const { data: newTag, error: insertError } = await supabase
          .from('tags')
          .insert({
            name: tagName,
            slug: tagName.toLowerCase().replace(/[^a-z0-9-]/g, ''),
          })
          .select('id')
          .single()
        if (insertError) {
          console.error('[post] createPost tag insert error:', insertError.message)
          continue
        }
        if (!newTag) continue
        tagId = newTag.id
      }

      const { error: ptError } = await supabase.from('post_tags').insert({ post_id: postData.id, tag_id: tagId })
      if (ptError) {
        console.error('[post] createPost post_tags error:', ptError.message)
      }
    }
  }

  if (parsed.data.images.length > 0) {
    if (!admin) {
      console.error('[post] createPost: admin client not available for image metadata')
      return { error: 'Image metadata storage unavailable. Post created but images not attached.' }
    }

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
      console.error('[post] createPost image metadata error:', imagesError.message)
      return { error: `Failed to save image metadata: ${imagesError.message}` }
    }
  }

  revalidatePath(`/${user.user_metadata?.username ?? 'profile'}`)
  revalidateTag('feed')
  revalidatePath('/feed')

  console.log('[post] createPost success:', postData.id)
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

  if (error) {
    console.error('[post] updatePost error:', error.message)
    return { error: 'Failed to update post' }
  }

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
  if (error) {
    console.error('[post] deletePost error:', error.message)
    return { error: 'Failed to delete post' }
  }

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
  if (!admin) {
    console.error('[post] uploadChartImage: admin client not available')
    return { error: 'Upload service unavailable' }
  }

  const { error } = await admin.storage.from('posts').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    console.error('[post] uploadChartImage error:', error.message)
    return { error: `Upload failed: ${error.message}` }
  }

  return { data: { path } }
}

export async function incrementViewCount(postId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.rpc('increment_post_view', { post_id: postId })
  if (error) {
    console.error('[post] incrementViewCount error:', error.message)
  }
}