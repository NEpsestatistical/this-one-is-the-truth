'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { getImageUrl } from '@/lib/utils/image'
import type { PostImage } from '@/lib/types/database'
import { cn } from '@/lib/utils/cn'

interface PostChartProps {
  images: PostImage[]
}

export function PostChart({ images }: PostChartProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (images.length === 0) return null

  const current = images[currentIndex]

  return (
    <>
      <div className="grid gap-2 mt-4">
        {images.slice(0, 3).map((img, i) => (
          <button
            key={img.id}
            onClick={() => {
              setCurrentIndex(i)
              setLightboxOpen(true)
            }}
            className="overflow-hidden rounded-lg border bg-muted/30 hover:opacity-90 transition-opacity"
          >
            <img
              src={getImageUrl('posts', img.storage_path)}
              alt={img.alt_text ?? ''}
              className="w-full h-auto max-h-96 object-contain"
              loading="lazy"
            />
          </button>
        ))}
        {images.length > 3 && (
          <button
            onClick={() => {
              setCurrentIndex(3)
              setLightboxOpen(true)
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            +{images.length - 3} more charts
          </button>
        )}
      </div>

      {lightboxOpen && current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
                className="absolute left-4 text-white/60 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
                className="absolute right-4 text-white/60 hover:text-white transition-colors"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <img
            src={getImageUrl('posts', current.storage_path)}
            alt={current.alt_text ?? ''}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />

          <div className="absolute bottom-4 text-white/60 text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  )
}
