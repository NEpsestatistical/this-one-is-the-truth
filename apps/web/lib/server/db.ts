import { createServerClient } from './auth'
import type { Post, Profile, Comment, Tag, Notification, Report } from '@/lib/types/database'

export async function getProfile(username: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error) return null
  return data as Profile
}

export async function getProfileById(id: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Profile
}

export async function getPost(id: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(*),
      tags:post_tags(tag:tags(*)),
      images:post_images(*)
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as Post
}

export async function getPostsByAuthor(authorId: string, page = 1, pageSize = 20) {
  const supabase = await createServerClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(*),
      tags:post_tags(tag:tags(*)),
      images:post_images(*)
    `)
    .eq('author_id', authorId)
    .eq('is_published', true)
    .eq('moderation_status', 'approved')
    .order('published_at', { ascending: false })
    .range(from, to)

  if (error) return []
  return data as Post[]
}

export async function getFeedPosts(page = 1, pageSize = 10) {
  const supabase = await createServerClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(*),
      tags:post_tags(tag:tags(*)),
      images:post_images(*)
    `)
    .eq('is_published', true)
    .eq('moderation_status', 'approved')
    .order('published_at', { ascending: false })
    .range(from, to)

  if (error) return []
  return data as Post[]
}

export async function getFeedPostsForUser(userId: string, page = 1, pageSize = 10) {
  const supabase = await createServerClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: following } = await supabase
    .from('followers')
    .select('following_id')
    .eq('follower_id', userId)

  const followingIds = following?.map((f) => f.following_id) ?? []
  followingIds.push(userId)

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(*),
      tags:post_tags(tag:tags(*)),
      images:post_images(*)
    `)
    .eq('is_published', true)
    .eq('moderation_status', 'approved')
    .in('author_id', followingIds)
    .order('published_at', { ascending: false })
    .range(from, to)

  if (error) return []
  return data as Post[]
}

export async function getComments(postId: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles!author_id(*),
      replies:comments!parent_id(
        *,
        author:profiles!author_id(*)
      )
    `)
    .eq('post_id', postId)
    .is('parent_id', null)
    .eq('moderation_status', 'approved')
    .order('created_at', { ascending: true })

  if (error) return []
  return data as Comment[]
}

export async function getTags() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('usage_count', { ascending: false })
    .limit(50)

  if (error) return []
  return data as Tag[]
}

export async function getPostsByTag(tagSlug: string, page = 1, pageSize = 20) {
  const supabase = await createServerClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: tag } = await supabase
    .from('tags')
    .select('id')
    .eq('slug', tagSlug)
    .single()

  if (!tag) return []

  const { data: postTags } = await supabase
    .from('post_tags')
    .select('post_id')
    .eq('tag_id', tag.id)

  if (!postTags || postTags.length === 0) return []

  const postIds = postTags.map((pt) => pt.post_id)

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(*),
      tags:post_tags(tag:tags(*)),
      images:post_images(*)
    `)
    .eq('is_published', true)
    .eq('moderation_status', 'approved')
    .in('id', postIds)
    .order('published_at', { ascending: false })
    .range(from, to)

  if (error) return []
  return data as Post[]
}

export async function getNotifications(userId: string, page = 1, pageSize = 30) {
  const supabase = await createServerClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:profiles!actor_id(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return []
  return data as Notification[]
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = await createServerClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) return 0
  return count ?? 0
}

export async function searchPosts(query: string, page = 1, pageSize = 20) {
  const supabase = await createServerClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!author_id(*),
      tags:post_tags(tag:tags(*)),
      images:post_images(*)
    `)
    .eq('is_published', true)
    .eq('moderation_status', 'approved')
    .textSearch('search_vector', query, { config: 'english' })
    .order('published_at', { ascending: false })
    .range(from, to)

  if (error) return []
  return data as Post[]
}

export async function searchProfiles(query: string, page = 1, pageSize = 20) {
  const supabase = await createServerClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .textSearch('search_vector', query, { config: 'english' })
    .range(from, to)

  if (error) return []
  return data as Profile[]
}

export async function isFollowing(followerId: string, followingId: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('followers')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single()

  return !!data
}

export async function isLiked(userId: string, postId: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('likes')
    .select('user_id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single()

  return !!data
}

export async function isBookmarked(userId: string, postId: string) {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('bookmarks')
    .select('user_id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single()

  return !!data
}
