'use client'

import { useCallback, useRef, useState } from 'react'
import { ImageIcon, Upload, X, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { validateImage } from '@/lib/storage-utils'
import { uploadPostImage } from '@/lib/actions/storage.actions'
import type { ImageMeta } from '@/lib/storage-utils'

export interface UploadedImage extends ImageMeta {
  preview: string
  alt_text: string
}

interface ImageUploadProps {
  images: UploadedImage[]
  onChange: (images: UploadedImage[]) => void
  maxFiles?: number
}

export function ImageUpload({
  images,
  onChange,
  maxFiles = 5,
}: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const imagesRef = useRef(images)
  imagesRef.current = images

  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const addImages = useCallback(async (files: FileList | File[]) => {
    setError(null)
    const fileArray = Array.from(files)
    const currentImages = imagesRef.current
    const remaining = maxFiles - currentImages.length

    if (fileArray.length > remaining) {
      setError(`Maximum ${maxFiles} images allowed. ${remaining} slot(s) remaining.`)
      return
    }

    for (const file of fileArray) {
      const validationError = validateImage(file)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    const added: UploadedImage[] = fileArray.map((file) => ({
      storage_path: '',
      width: 0,
      height: 0,
      size: file.size,
      content_type: file.type,
      preview: URL.createObjectURL(file),
      alt_text: '',
    }))

    const startIndex = currentImages.length
    onChange([...currentImages, ...added])

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]!
      const idx = startIndex + i
      setUploadingIndex(idx)
      setUploadProgress(0)

      const fd = new FormData()
      fd.set('file', file)

      try {
        const result = await uploadPostImage(fd)

        if (result.error) {
          setError(`Image ${i + 1}: ${result.error}`)
          const reverted = [...imagesRef.current]
          onChange(reverted)
          setUploadingIndex(null)
          return
        }

        if (!result.data) {
          setError(`Image ${i + 1}: upload returned no data`)
          const reverted = [...imagesRef.current]
          onChange(reverted)
          setUploadingIndex(null)
          return
        }

        setUploadProgress(100)

        const meta = result.data
        const updated = [...imagesRef.current]
        updated[idx] = {
          ...updated[idx]!,
          storage_path: meta.storage_path,
          width: meta.width,
          height: meta.height,
        }
        onChange(updated)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setError(`Image ${i + 1}: ${message}`)
        const reverted = [...imagesRef.current]
        onChange(reverted)
        setUploadingIndex(null)
        return
      }
    }

    setUploadingIndex(null)
    setUploadProgress(0)
    if (fileRef.current) fileRef.current.value = ''
  }, [onChange, maxFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addImages(e.target.files)
    }
  }, [addImages])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      addImages(e.dataTransfer.files)
    }
  }, [addImages])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const removeImage = useCallback((index: number) => {
    const img = images[index]
    if (img) URL.revokeObjectURL(img.preview)
    onChange(images.filter((_, i) => i !== index))
  }, [images, onChange])

  const updateAltText = useCallback((index: number, alt: string) => {
    const updated = images.map((img, i) =>
      i === index ? { ...img, alt_text: alt } : img,
    )
    onChange(updated)
  }, [images, onChange])

  const canAddMore = images.length < maxFiles

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-500">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {images.map((img, i) => (
            <div
              key={i}
              className={cn(
                'group relative overflow-hidden rounded-lg border bg-muted/30 transition-all',
                uploadingIndex === i && 'ring-2 ring-blue-500/50',
              )}
            >
              <div className="relative">
                <img
                  src={img.preview}
                  alt={img.alt_text || ''}
                  className="w-full h-28 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  disabled={uploadingIndex === i}
                  className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                >
                  <X className="h-3 w-3" />
                </button>
                {img.width !== 0 && img.height !== 0 && (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/80 font-mono">
                    {img.width}x{img.height}
                  </span>
                )}
              </div>

              {uploadingIndex === i && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-400 mb-1" />
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {uploadProgress}%
                  </span>
                </div>
              )}

              {uploadingIndex !== i && (
                <div className="px-2 py-1.5">
                  <input
                    type="text"
                    placeholder="Alt text (optional)"
                    value={img.alt_text}
                    onChange={(e) => updateAltText(i, e.target.value)}
                    maxLength={200}
                    className="w-full bg-transparent text-[11px] text-muted-foreground placeholder:text-muted-foreground/40 border-0 outline-none focus:ring-0 p-0"
                  />
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground/60">
                    <span>{(img.size / 1024).toFixed(0)} KB</span>
                    <span>{img.content_type?.split('/')[1]?.toUpperCase()}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition-colors',
            isDragOver
              ? 'border-blue-500 bg-blue-500/5'
              : 'border-border hover:border-muted-foreground/30 hover:bg-accent/30',
          )}
        >
          {isDragOver ? (
            <Upload className="h-6 w-6 text-blue-400 mb-2" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground/60 mb-2" />
          )}
          <p className="text-xs text-muted-foreground">
            {isDragOver
              ? 'Drop images here'
              : `Drag & drop or click to upload (${images.length}/${maxFiles})`}
          </p>
          <p className="text-[10px] text-muted-foreground/50 mt-1">
            PNG, JPEG, WebP — max 10MB each
          </p>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  )
}
