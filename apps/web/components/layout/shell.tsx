'use client'

import { type ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { MobileNav } from './mobile-nav'
import { useUIStore } from '@/stores/ui-store'
import { useIsDesktop } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils/cn'

interface ShellProps {
  children: ReactNode
}

export function Shell({ children }: ShellProps) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  const isDesktop = useIsDesktop()

  return (
    <div className="flex min-h-screen">
      {isDesktop && <Sidebar />}
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          isDesktop && sidebarOpen ? 'ml-60' : 'ml-0 md:ml-16',
        )}
      >
        <Topbar />
        <main className="flex-1">{children}</main>
        <MobileNav />
      </div>
    </div>
  )
}
