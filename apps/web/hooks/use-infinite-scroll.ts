'use client'

import { useCallback, useRef } from 'react'
import { useIntersectionObserver } from './use-intersection-observer'

interface UseInfiniteScrollOptions {
  enabled?: boolean
  threshold?: number
}

export function useInfiniteScroll(
  onLoadMore: () => void,
  options: UseInfiniteScrollOptions = {},
) {
  const { enabled = true, threshold = 0 } = options
  const loadingRef = useRef(false)

  const handleIntersect = useCallback(() => {
    if (loadingRef.current) return
    loadingRef.current = true
    onLoadMore()
    setTimeout(() => {
      loadingRef.current = false
    }, 500)
  }, [onLoadMore])

  const [ref, isIntersecting] = useIntersectionObserver<HTMLDivElement>({
    threshold,
    enabled,
  })

  if (isIntersecting && enabled) {
    handleIntersect()
  }

  return ref
}
