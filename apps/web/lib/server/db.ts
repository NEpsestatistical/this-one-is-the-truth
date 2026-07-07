import { createServerClient } from './auth'
import type { Post, Profile, Comment, Tag, Notification, Report } from '@/lib/types/database'

export async function getProfile(username: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error) {
    console.error('[db] getProfile error:', error.message)
    return null
  }
  return data as Profile
}

export async function getProfileById(id: string) {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('[db] getProfileById error:', error.message)
    return null
  }
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

  if (error) {
    console.error('[db] getPost error:', error.message)
    return null
  }
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

  if (error) {
    console.error('[db] getPostsByAuthor error:', error.message)
    return []
  }
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

  if (error) {
    console.error('[db] getFeedPosts error:', error.message)
    return []
  }
  return data as Post[]
}

export async function getFeedPostsForUser(userId: string, page = 1, pageSize = 10) {
  const supabase = await createServerClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: following, error: followError } = await supabase
    .from('followers')
    .select('following_id')
    .eq('follower_id', userId)

  if (followError) {
    console.error('[db] getFeedPostsForUser followers error:', followError.message)
  }

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

  if (error) {
    console.error('[db] getFeedPostsForUser error:', error.message)
    return []
  }
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

  if (error) {
    console.error('[db] getComments error:', error.message)
    return []
  }
  return data as Comment[]
}

export async function getTags() {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('usage_count', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[db] getTags error:', error.message)
    return []
  }
  return data as Tag[]
}

export async function getPostsByTag(tagSlug: string, page = 1, pageSize = 20) {
  const supabase = await createServerClient()
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: tag, error: tagError } = await supabase
    .from('tags')
    .select('id')
    .eq('slug', tagSlug)
    .single()

  if (tagError) {
    console.error('[db] getPostsByTag tag lookup error:', tagError.message)
    return []
  }

  if (!tag) return []

  const { data: postTags, error: ptError } = await supabase
    .from('post_tags')
    .select('post_id')
    .eq('tag_id', tag.id)

  if (ptError) {
    console.error('[db] getPostsByTag post_tags error:', ptError.message)
    return []
  }

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

  if (error) {
    console.error('[db] getPostsByTag posts error:', error.message)
    return []
  }
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

  if (error) {
    console.error('[db] getNotifications error:', error.message)
    return []
  }
  return data as Notification[]
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = await createServerClient()
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    console.error('[db] getUnreadNotificationCount error:', error.message)
    return 0
  }
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

  if (error) {
    console.error('[db] searchPosts error:', error.message)
    return []
  }
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

  if (error) {
    console.error('[db] searchProfiles error:', error.message)
    return []
  }
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