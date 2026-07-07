'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Compass,
  Bell,
  Bookmark,
  TrendingUp,
  Users,
  Hash,
  Trophy,
  Settings,
  BarChart3,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useUIStore } from '@/stores/ui-store'

const navItems = [
  { label: 'Feed', href: '/feed', icon: LayoutDashboard },
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
]

const secondaryItems = [
  { label: 'Leaderboards', href: '/leaderboards', icon: Trophy },
  { label: 'Trending Tags', href: '/tags', icon: Hash },
  { label: 'Top Analysts', href: '/discover', icon: Users },
]

const bottomItems = [
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const setComposerOpen = useUIStore((s) => s.setComposerOpen)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-30 flex h-full flex-col border-r border-border/50 bg-sidebar/95 backdrop-blur-xl transition-all duration-300',
        sidebarOpen ? 'w-60' : 'w-16',
      )}
    >
      <Link href="/" className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0">
          S
        </div>
        {sidebarOpen && (
          <span className="font-semibold text-sm truncate">Statistical</span>
        )}
      </Link>

      <div className="px-2 pt-2">
        <button
          onClick={() => setComposerOpen(true)}
          className="flex items-center justify-center gap-2 w-full rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3 text-sm font-medium shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          {sidebarOpen && <span>New Analysis</span>}
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-2 pt-2">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href || pathname.startsWith(item.href + '/')}
              collapsed={!sidebarOpen}
            />
          ))}
        </div>

        {sidebarOpen && (
          <div className="pt-3 pb-1">
            <p className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Discover
            </p>
          </div>
        )}

        <div className="space-y-0.5">
          {secondaryItems.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={pathname === item.href}
              collapsed={!sidebarOpen}
            />
          ))}
        </div>
      </nav>

      <div className="border-t p-2">
        {bottomItems.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname === item.href}
            collapsed={!sidebarOpen}
          />
        ))}
      </div>
    </aside>
  )
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  collapsed,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
  collapsed: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
        collapsed && 'justify-center px-0',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}
