import Link from 'next/link'
import { Verified } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface UserNameProps {
  username: string
  displayName: string | null
  isVerified?: boolean
  size?: 'sm' | 'md'
  showUsername?: boolean
  linkable?: boolean
}

export function UserName({
  username,
  displayName,
  isVerified = false,
  size = 'md',
  showUsername = true,
  linkable = true,
}: UserNameProps) {
  const nameEl = (
    <span
      className={cn(
        'font-medium truncate',
        linkable && 'group-hover:underline',
      )}
    >
      {displayName ?? username}
    </span>
  )

  const usernameEl = (
    <span className="text-muted-foreground truncate text-xs">
      @{username}
    </span>
  )

  return (
    <div className="flex flex-col">
      {linkable ? (
        <Link href={`/${username}`} className="group flex items-center gap-1">
          {nameEl}
          {isVerified && <Verified className="h-3.5 w-3.5 text-primary shrink-0" />}
        </Link>
      ) : (
        <div className="flex items-center gap-1">
          {nameEl}
          {isVerified && <Verified className="h-3.5 w-3.5 text-primary shrink-0" />}
        </div>
      )}
      {showUsername && (
        linkable ? (
          <Link href={`/${username}`}>{usernameEl}</Link>
        ) : (
          usernameEl
        )
      )}
    </div>
  )
}
