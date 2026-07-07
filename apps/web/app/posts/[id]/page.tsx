import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createServerClient, getSession } from '@/lib/server/auth'
import { getPost } from '@/lib/server/db'
import { isLiked, isBookmarked } from '@/lib/server/db'
import { UserAvatar } from '@/components/shared/user-avatar'
import { UserName } from '@/components/shared/user-name'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PostActions } from '@/components/post/post-actions'
import { PostChart } from '@/components/post/post-chart'
import { CommentList } from '@/components/post/comment-list'
import { getComments } from '@/lib/server/db'
import { formatRelativeTime, formatDate } from '@/lib/utils/date'
import { Skeleton } from '@/components/ui/skeleton'

interface PostPageProps {
  params: Promise<{ id: string }>
}

async function PostContent({ id }: { id: string }) {
  const post = await getPost(id)
  if (!post || !post.is_published || post.moderation_status !== 'approved') notFound()

  const session = await getSession()
  const userId = session?.user?.id

  const [liked, bookmarked, comments] = await Promise.all([
    userId ? isLiked(userId, post.id) : false,
    userId ? isBookmarked(userId, post.id) : false,
    getComments(post.id),
  ])

  return (
    <article>
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/feed">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Link>
      </Button>

      <div className="flex items-start gap-3 mb-4">
        <UserAvatar
          username={post.author?.username ?? 'unknown'}
          avatarUrl={post.author?.avatar_url ?? null}
          displayName={post.author?.display_name ?? null}
          size="lg"
          isVerified={post.author?.is_verified ?? false}
          showBadge
        />
        <div>
          <UserName
            username={post.author?.username ?? 'unknown'}
            displayName={post.author?.display_name ?? null}
            isVerified={post.author?.is_verified ?? false}
          />
          <time className="text-xs text-muted-foreground">
            {formatDate(post.published_at)} · {formatRelativeTime(post.published_at)}
          </time>
        </div>
      </div>

      <h1 className="text-2xl font-bold leading-tight mb-3">{post.title}</h1>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {post.direction && (
          <Badge
            variant={post.direction === 'bullish' ? 'bullish' : post.direction === 'bearish' ? 'bearish' : 'neutral'}
          >
            {post.direction}
          </Badge>
        )}
        {post.confidence && (
          <Badge variant="outline">{post.confidence}/10 confidence</Badge>
        )}
        {post.tags?.map((t) => (
          <Link key={t.tag.id} href={`/tags/${t.tag.slug}`}>
            <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
              #{t.tag.name}
            </Badge>
          </Link>
        ))}
      </div>

      {post.body_html && (
        <div
          className="prose prose-sm dark:prose-invert max-w-none mb-6 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.body_html }}
        />
      )}

      {post.has_images && post.images && post.images.length > 0 && (
        <PostChart images={post.images} />
      )}

      <div className="border-t pt-4 mt-6 mb-8">
        <PostActions
          postId={post.id}
          initialLiked={liked}
          initialLikeCount={post.like_count}
          initialBookmarked={bookmarked}
          initialBookmarkCount={post.bookmark_count}
          commentCount={post.comment_count}
        />
      </div>

      <div className="border-t pt-6">
        <CommentList postId={post.id} initialComments={comments} />
      </div>
    </article>
  )
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { id } = await params
  const post = await getPost(id)
  if (!post) return { title: 'Post not found' }

  return {
    title: post.title,
    description: post.body?.slice(0, 200) ?? post.title,
    openGraph: post.images?.[0]
      ? { images: [{ url: post.images[0]!.storage_path }] }
      : undefined,
  }
}

export default function PostPage({ params }: PostPageProps) {
  return (
    <div className="max-w-2xl mx-auto py-4 px-4">
      <Suspense
        fallback={
          <div className="space-y-4">
            <Skeleton className="h-8 w-24" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        }
      >
        <PostContentWithParams params={params} />
      </Suspense>
    </div>
  )
}

async function PostContentWithParams({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PostContent id={id} />
}
