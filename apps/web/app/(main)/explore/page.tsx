import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getFeedPosts, searchPosts, searchProfiles } from '@/lib/server/db'
import { ExploreGrid } from '@/components/explore/explore-grid'
import { SearchResults } from '@/components/search/search-results'
import { PostCardSkeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Explore',
}

async function ExploreContent({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { q, type } = await searchParams

  if (q) {
    const searchType = type ?? 'posts'
    if (searchType === 'profiles') {
      const profiles = await searchProfiles(q)
      return (
        <div>
          <h2 className="text-lg font-semibold mb-4">Analysts matching "{q}"</h2>
          <SearchResults query={q} type="profiles" profiles={profiles} />
        </div>
      )
    }
    const posts = await searchPosts(q)
    return (
      <div>
        <h2 className="text-lg font-semibold mb-4">Posts matching "{q}"</h2>
        <SearchResults query={q} type="posts" posts={posts} />
      </div>
    )
  }

  const posts = await getFeedPosts(1, 30)
  return <ExploreGrid posts={posts} hasMore={posts.length === 30} />
}

export default function ExplorePage(props: { searchParams: Promise<{ q?: string; type?: string }> }) {
  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Explore</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Discover analysis from the community
        </p>
      </div>
      <Suspense fallback={<div className="space-y-3"><PostCardSkeleton /><PostCardSkeleton /><PostCardSkeleton /></div>}>
        <ExploreContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  )
}
