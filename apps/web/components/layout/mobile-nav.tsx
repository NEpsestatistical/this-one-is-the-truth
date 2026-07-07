'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Compass, Bell, Bookmark, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useUIStore } from '@/stores/ui-store'
import { useIsDesktop } from '@/hooks/use-media-query'

const navItems = [
  { href: '/feed', icon: LayoutDashboard, label: 'Feed' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/compose', icon: Plus, label: 'New', primary: true },
  { href: '/notifications', icon: Bell, label: 'Alerts' },
  { href: '/bookmarks', icon: Bookmark, label: 'Saved' },
]

export function MobileNav() {
  const pathname = usePathname()
  const isDesktop = useIsDesktop()
  const setComposerOpen = useUIStore((s) => s.setComposerOpen)

  if (isDesktop) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background md:hidden">
      <div className="flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          if (item.primary) {
            return (
              <button
                key={item.href}
                onClick={() => setComposerOpen(true)}
                className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg -mt-4"
              >
                <Plus className="h-5 w-5" />
              </button>
            )
          }

          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
