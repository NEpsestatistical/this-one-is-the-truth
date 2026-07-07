'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FeedTabs } from '@/components/feed/feed-tabs'

export function FeedTabsWrapper() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<'following' | 'for_you'>(
    tabFromUrl === 'following' ? 'following' : 'for_you',
  )

  const handleTabChange = useCallback(
    (tab: 'following' | 'for_you') => {
      setActiveTab(tab)
      const params = new URLSearchParams(searchParams.toString())
      if (tab === 'following') {
        params.set('tab', 'following')
      } else {
        params.delete('tab')
      }
      router.push(`/feed?${params.toString()}`)
    },
    [router, searchParams],
  )

  useEffect(() => {
    const urlTab = searchParams.get('tab')
    if (urlTab === 'following' || urlTab === 'for_you') {
      setActiveTab(urlTab as 'following' | 'for_you')
    }
  }, [searchParams])

  return <FeedTabs activeTab={activeTab} onTabChange={handleTabChange} />
}