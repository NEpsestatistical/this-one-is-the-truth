'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/providers/auth-provider'
import { useUIStore } from '@/stores/ui-store'
import { createPost } from '@/lib/actions/post.actions'
import { ImageUpload, type UploadedImage } from '@/components/shared/image-upload'

export function PostComposer() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const composerOpen = useUIStore((s) => s.composerOpen)
  const setComposerOpen = useUIStore((s) => s.setComposerOpen)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [direction, setDirection] = useState<'bullish' | 'bearish' | 'neutral' | null>(null)
  const [confidence, setConfidence] = useState<number>(5)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [images, setImages] = useState<UploadedImage[]>([])
  const [submitting, setSubmitting] = useState(false)

  const handleAddTag = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && tagInput.trim()) {
        e.preventDefault()
        const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
        if (tag && !tags.includes(tag) && tags.length < 10) {
          setTags((prev) => [...prev, tag])
        }
        setTagInput('')
      }
    },
    [tagInput, tags],
  )

  const handleSubmit = useCallback(async () => {
    if (!user) {
      toast('Sign in to create a post', 'info')
      return
    }

    if (!title.trim() || title.length < 10) {
      toast('Title must be at least 10 characters', 'error')
      return
    }

    const hasUploading = images.some((img) => !img.storage_path)
    if (hasUploading) {
      toast('Wait for all images to finish uploading', 'error')
      return
    }

    setSubmitting(true)

    let timeout: ReturnType<typeof setTimeout> | null = null
    try {
      const result = await Promise.race([
        createPost({
          title: title.trim(),
          body: body.trim() || null,
          direction,
          confidence,
          tags,
          images: images.map((img, i) => ({
            storage_path: img.storage_path,
            alt_text: img.alt_text || null,
            sort_order: i,
            width: img.width,
            height: img.height,
            size: img.size,
            content_type: img.content_type,
          })),
        }),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => reject(new Error('Request timed out')), 30000)
        }),
      ])

      if (result.error) {
        toast(result.error, 'error')
        return
      }

      toast('Post published!', 'success')
      setComposerOpen(false)
      setTitle('')
      setBody('')
      setDirection(null)
      setConfidence(5)
      setTags([])
      images.forEach((img) => URL.revokeObjectURL(img.preview))
      setImages([])
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create post'
      console.error('[PostComposer] submit error:', message)
      toast(message, 'error')
    } finally {
      if (timeout) clearTimeout(timeout)
      setSubmitting(false)
    }
  }, [user, title, body, direction, confidence, tags, images, toast, setComposerOpen, router])

  if (!composerOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setComposerOpen(false)} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border bg-card shadow-2xl animate-scale-in max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
          <h2 className="font-semibold">New Analysis</h2>
          <Button variant="ghost" size="icon" onClick={() => setComposerOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 p-4 overflow-y-auto flex-1">
          <Input
            placeholder="Analysis title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />

          <textarea
            placeholder="Write your analysis (optional)..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={10000}
            rows={6}
            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Direction</label>
            <div className="flex gap-2">
              {([
                { value: 'bullish' as const, icon: TrendingUp, label: 'Bullish', color: 'text-emerald-500' },
                { value: 'bearish' as const, icon: TrendingDown, label: 'Bearish', color: 'text-red-500' },
                { value: 'neutral' as const, icon: Minus, label: 'Neutral', color: 'text-yellow-500' },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDirection(direction === opt.value ? null : opt.value)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                    direction === opt.value
                      ? 'border-foreground bg-accent'
                      : 'border-input hover:bg-accent'
                  }`}
                >
                  <opt.icon className={`h-3.5 w-3.5 ${opt.color}`} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Confidence: {confidence}/10
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Tags (press Enter to add)
            </label>
            <Input
              placeholder="e.g. bitcoin, elliott-wave, analysis"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium"
                  >
                    #{tag}
                    <button onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Chart Images
            </label>
            <ImageUpload
              images={images}
              onChange={setImages}
              maxFiles={5}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t px-4 py-3 shrink-0">
          <div className="text-xs text-muted-foreground">
            {title.length}/200
          </div>
          <Button size="sm" onClick={handleSubmit} disabled={submitting || title.length < 10}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : null}
            Publish
          </Button>
        </div>
      </div>
    </div>
  )
}
