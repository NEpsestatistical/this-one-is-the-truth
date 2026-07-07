export type Role = 'user' | 'moderator' | 'admin' | 'superadmin'

export type Direction = 'bullish' | 'bearish' | 'neutral'

export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'flagged'

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'mention'
  | 'bookmark'
  | 'repost'
  | 'admin_warning'
  | 'achievement'
  | 'verified'
  | 'post_approved'
  | 'post_rejected'
  | 'report_resolved'

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'misinformation'
  | 'impersonation'
  | 'hate_speech'
  | 'violent'
  | 'copyright'
  | 'other'

export type ReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed'

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all_time'

export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  cover_url: string | null
  website: string | null
  location: string | null
  post_count: number
  follower_count: number
  following_count: number
  like_count: number
  is_verified: boolean
  is_analyst: boolean
  is_banned: boolean
  is_suspended: boolean
  role: Role
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  author_id: string
  title: string
  body: string | null
  body_html: string | null
  direction: Direction | null
  confidence: number | null
  has_images: boolean
  like_count: number
  comment_count: number
  bookmark_count: number
  view_count: number
  is_published: boolean
  is_edited: boolean
  is_pinned: boolean
  moderation_status: ModerationStatus
  created_at: string
  updated_at: string
  published_at: string
  author?: Profile
  tags?: Tag[]
  images?: PostImage[]
}

export interface PostImage {
  id: string
  post_id: string
  storage_path: string
  alt_text: string | null
  width: number | null
  height: number | null
  size: number | null
  content_type: string | null
  sort_order: number
  created_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  description: string | null
  usage_count: number
  is_verified: boolean
  created_at: string
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  body: string
  body_html: string
  depth: number
  like_count: number
  is_edited: boolean
  moderation_status: ModerationStatus
  created_at: string
  updated_at: string
  author?: Profile
  replies?: Comment[]
}

export interface Notification {
  id: string
  user_id: string
  actor_id: string | null
  type: NotificationType
  notifiable_type: 'post' | 'comment' | 'user'
  notifiable_id: string
  message: string | null
  metadata: Record<string, unknown> | null
  is_read: boolean
  is_seen: boolean
  created_at: string
  actor?: Profile | null
}

export interface Report {
  id: string
  reporter_id: string
  reportable_type: 'post' | 'comment' | 'profile'
  reportable_id: string
  reason: ReportReason
  description: string | null
  status: ReportStatus
  resolved_by: string | null
  resolution_note: string | null
  created_at: string
  resolved_at: string | null
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  awarded_at: string
  badge?: Badge
}

export interface Badge {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  type: 'verification' | 'achievement' | 'rank'
  created_at: string
}

export interface LeaderboardEntry {
  user_id: string
  score: number
  rank: number
  post_count: number
  engagement_rate: number
  profile?: Profile
}

export interface LeaderboardSnapshot {
  id: string
  period: LeaderboardPeriod
  period_start: string
  period_end: string
  rankings: LeaderboardEntry[]
  generated_at: string
}

export interface FeedItem extends Post {
  is_liked?: boolean
  is_bookmarked?: boolean
  is_following_author?: boolean
}
