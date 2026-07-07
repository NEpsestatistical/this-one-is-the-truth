import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface UserAvatarProps {
  username: string
  avatarUrl: string | null
  displayName: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showBadge?: boolean
  isVerified?: boolean
  linkable?: boolean
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
}

export function UserAvatar({
  username,
  avatarUrl,
  displayName,
  size = 'md',
  showBadge = false,
  isVerified = false,
  linkable = true,
}: UserAvatarProps) {
  const initials = (displayName ?? username).slice(0, 2).toUpperCase()
  const avatar = (
    <div className="relative inline-flex">
      <Avatar className={cn('ring-2 ring-background', sizeMap[size])}>
        <AvatarImage src={avatarUrl ?? undefined} alt={`@${username}`} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      {showBadge && isVerified && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground font-bold ring-2 ring-background">
          ✓
        </span>
      )}
    </div>
  )

  if (linkable) {
    return <Link href={`/${username}`}>{avatar}</Link>
  }

  return avatar
}
