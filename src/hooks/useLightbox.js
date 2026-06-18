import { useState, useEffect, useCallback } from 'react'

export function useLightbox(items = []) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const open = useCallback((index) => {
    setCurrentIndex(Math.max(0, Math.min(index, items.length - 1)))
    setIsOpen(true)
  }, [items.length])

  const close = useCallback(() => setIsOpen(false), [])

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % items.length)
  }, [items.length])

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length)
  }, [items.length])

  useEffect(() => {
    if (!isOpen) return

    const handleKey = (e) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }

    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, close, next, prev])

  return {
    isOpen,
    currentIndex,
    current: items[currentIndex] || null,
    open,
    close,
    next,
    prev,
  }
}

