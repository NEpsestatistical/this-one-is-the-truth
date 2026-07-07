'use client'

import { useCallback, useState } from 'react'
import { MapPin, Link, Calendar, Settings, Loader2 } from 'lucide-react'
import { UserAvatar } from '@/components/shared/user-avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/providers/auth-provider'
import { formatDate, formatCount } from '@/lib/utils/date'
import { toggleFollow } from '@/lib/actions/follow.actions'
import type { Profile } from '@/lib/types/database'

interface ProfileHeaderProps {
  profile: Profile
  isFollowing?: boolean
  postCount: number
}

export function ProfileHeader({ profile, isFollowing: initialFollowing, postCount }: ProfileHeaderProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [following, setFollowing] = useState(initialFollowing ?? false)
  const [followerCount, setFollowerCount] = useState(profile.follower_count)
  const [loading, setLoading] = useState(false)

  const isOwnProfile = user?.id === profile.id

  const handleFollow = useCallback(async () => {
    if (!user) {
      toast('Sign in to follow analysts', 'info')
      return
    }

    setLoading(true)
    setFollowing((prev) => !prev)
    setFollowerCount((prev) => (following ? prev - 1 : prev + 1))

    try {
      const result = await toggleFollow(profile.id)
      if (result.error) {
        setFollowing((prev) => !prev)
        setFollowerCount((prev) => (following ? prev + 1 : prev - 1))
        toast(result.error, 'error')
      }
    } finally {
      setLoading(false)
    }
  }, [profile.id, user, following, toast])

  return (
    <div>
      <div className="h-48 rounded-xl bg-gradient-to-br from-blue-500/5 to-amber-500/5 border">
        {profile.cover_url && (
          <img
            src={profile.cover_url}
            alt=""
            className="w-full h-full object-cover rounded-xl"
          />
        )}
      </div>

      <div className="flex items-end gap-4 -mt-12 px-5">
        <UserAvatar
          username={profile.username}
          avatarUrl={profile.avatar_url}
          displayName={profile.display_name}
          size="xl"
          isVerified={profile.is_verified}
          showBadge
          linkable={false}
        />

        <div className="flex-1 min-w-0 pb-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold truncate">
              {profile.display_name ?? profile.username}
            </h1>
            {profile.is_verified && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                Verified
              </Badge>
            )}
            {profile.is_analyst && (
              <Badge variant="secondary" className="text-[10px]">
                Analyst
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>

        <div className="pb-2 shrink-0">
          {isOwnProfile ? (
            <Button variant="outline" size="sm" asChild>
              <a href="/settings">
                <Settings className="h-4 w-4 mr-1.5" />
                Edit Profile
              </a>
            </Button>
          ) : (
            <Button
              size="sm"
              variant={following ? 'outline' : 'default'}
              onClick={handleFollow}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : null}
              {following ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>
      </div>

      <div className="px-5 mt-4 space-y-3">
        {profile.bio && (
          <p className="text-sm leading-relaxed text-foreground/80">{profile.bio}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {profile.location}
            </span>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Link className="h-3.5 w-3.5" />
              {new URL(profile.website).hostname}
            </a>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Joined {formatDate(profile.created_at)}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold">{formatCount(postCount)}</span>
          <span className="text-muted-foreground">posts</span>
          <a href={`/${profile.username}/following`} className="hover:underline">
            <span className="font-semibold">{formatCount(profile.following_count)}</span>
            <span className="text-muted-foreground ml-1">following</span>
          </a>
          <a href={`/${profile.username}/followers`} className="hover:underline">
            <span className="font-semibold">{formatCount(followerCount)}</span>
            <span className="text-muted-foreground ml-1">followers</span>
          </a>
        </div>
      </div>
    </div>
  )
}
