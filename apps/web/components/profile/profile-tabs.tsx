'use client'

import { useCallback, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface ProfileTabsProps {
  tabs: Tab[]
  defaultTab?: string
}

export function ProfileTabs({ tabs, defaultTab }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? '')

  const activeContent = tabs.find((t) => t.id === activeTab)?.content

  return (
    <div>
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-3 text-sm font-medium transition-colors relative',
              activeTab === tab.id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
        ))}
      </div>
      <div className="py-4">{activeContent}</div>
    </div>
  )
}
