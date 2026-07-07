'use client'

import { useState } from 'react'
import { FeedTabs } from '@/components/feed/feed-tabs'

export function FeedTabsWrapper() {
  const [activeTab, setActiveTab] = useState<'following' | 'for_you'>('for_you')

  return <FeedTabs activeTab={activeTab} onTabChange={setActiveTab} />
}
