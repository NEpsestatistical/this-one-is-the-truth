'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { UserAvatar } from '@/components/shared/user-avatar'
import { UserName } from '@/components/shared/user-name'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/providers/auth-provider'
import { toggleFollow } from '@/lib/actions/follow.actions'
import { formatCount } from '@/lib/utils/date'
import type { Profile } from '@/lib/types/database'

interface UserCardProps {
  profile: Profile
}

export function UserCard({ profile }: UserCardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFollow = useCallback(async () => {
    if (!user) {
      toast('Sign in to follow analysts', 'info')
      return
    }

    setLoading(true)
    setFollowing((prev) => !prev)
    try {
      const result = await toggleFollow(profile.id)
      if (result.error) {
        setFollowing((prev) => !prev)
        toast(result.error, 'error')
      }
    } finally {
      setLoading(false)
    }
  }, [profile.id, user, toast])

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:bg-accent/50 transition-colors">
      <UserAvatar
        username={profile.username}
        avatarUrl={profile.avatar_url}
        displayName={profile.display_name}
        size="md"
        isVerified={profile.is_verified}
        showBadge
      />
      <div className="flex-1 min-w-0">
        <UserName
          username={profile.username}
          displayName={profile.display_name}
          isVerified={profile.is_verified}
          size="md"
        />
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {profile.bio ?? `${formatCount(profile.follower_count)} followers`}
        </p>
      </div>
      {user && user.id !== profile.id && (
        <Button size="sm" variant={following ? 'outline' : 'default'} onClick={handleFollow} disabled={loading}>
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : following ? 'Following' : 'Follow'}
        </Button>
      )}
    </div>
  )
}
