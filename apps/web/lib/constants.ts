export const SITE_NAME = 'Statistical'
export const SITE_DESCRIPTION = 'Where Elliott Wave Analysts Build Their Reputation'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  FEED_PAGE_SIZE: 10,
  COMMENT_PAGE_SIZE: 25,
  NOTIFICATION_PAGE_SIZE: 30,
  SEARCH_PAGE_SIZE: 20,
  LEADERBOARD_SIZE: 100,
} as const

export const LIMITS = {
  MAX_IMAGE_SIZE: 10 * 1024 * 1024,
  MAX_IMAGES_PER_POST: 5,
  MAX_TAGS_PER_POST: 10,
  POST_TITLE_MIN: 10,
  POST_TITLE_MAX: 200,
  POST_BODY_MAX: 10000,
  COMMENT_BODY_MAX: 2000,
  BIO_MAX: 500,
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
  DISPLAY_NAME_MAX: 50,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
} as const

export const RATE_LIMITS = {
  POST_CREATE: { limit: 10, window: 3600 },
  COMMENT_CREATE: { limit: 30, window: 3600 },
  LIKE_TOGGLE: { limit: 100, window: 3600 },
  FOLLOW_TOGGLE: { limit: 50, window: 3600 },
  PROFILE_UPDATE: { limit: 5, window: 3600 },
  REPORT_CREATE: { limit: 10, window: 3600 },
  SEARCH: { limit: 60, window: 3600 },
  AUTH: { limit: 5, window: 60 },
} as const

export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const

export const STORAGE_BUCKETS = {
  AVATARS: 'avatars',
  COVERS: 'covers',
  CHARTS: 'charts',
  POSTS: 'posts',
  REPORTS: 'reports',
} as const

export const NAV_ITEMS = [
  { label: 'Feed', href: '/feed', icon: 'LayoutDashboard' },
  { label: 'Explore', href: '/explore', icon: 'Compass' },
  { label: 'Notifications', href: '/notifications', icon: 'Bell' },
  { label: 'Bookmarks', href: '/bookmarks', icon: 'Bookmark' },
] as const

export const DIRECTIONS = [
  { value: 'bullish', label: 'Bullish', icon: 'TrendingUp' },
  { value: 'bearish', label: 'Bearish', icon: 'TrendingDown' },
  { value: 'neutral', label: 'Neutral', icon: 'Minus' },
] as const
