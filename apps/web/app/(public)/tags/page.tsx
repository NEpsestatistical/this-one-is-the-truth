import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerClient } from '@/lib/server/auth'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata: Metadata = {
  title: 'Tags',
}

async function TagsContent() {
  const supabase = await createServerClient()
  const { data: tags } = await supabase
    .from('tags')
    .select('*')
    .order('usage_count', { ascending: false })
    .limit(100)

  if (!tags || tags.length === 0) {
    return <p className="text-sm text-muted-foreground">No tags yet</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag.id}
          href={`/tags/${tag.slug}`}
          className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm hover:bg-accent transition-colors"
        >
          <span>#{tag.name}</span>
          <span className="text-xs text-muted-foreground">{tag.usage_count}</span>
        </Link>
      ))}
    </div>
  )
}

export default function TagsPage() {
  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tags</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse analysis by topic
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        }
      >
        <TagsContent />
      </Suspense>
    </div>
  )
}
