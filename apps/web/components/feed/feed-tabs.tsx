'use client'

import { cn } from '@/lib/utils/cn'

interface FeedTabsProps {
  activeTab: 'following' | 'for_you'
  onTabChange: (tab: 'following' | 'for_you') => void
}

export function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
  return (
    <div className="flex border-b">
      {[
        { id: 'for_you' as const, label: 'For You' },
        { id: 'following' as const, label: 'Following' },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'flex-1 px-4 py-3 text-sm font-medium transition-colors relative',
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
  )
}
