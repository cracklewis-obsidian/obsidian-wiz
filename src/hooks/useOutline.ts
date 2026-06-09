import { useEffect, useState, useCallback, type RefObject } from 'react'

export interface RawHeading {
  id: string
  text: string
  level: number
}

export interface HeadingItem {
  id: string
  text: string
  level: number
  children: HeadingItem[]
}

export interface UseOutlineResult {
  headings: HeadingItem[]
  activeId: string | null
}

/**
 * Build a nested tree from a flat list of headings sorted by DOM order.
 * Algorithm: maintain a stack; when level <= stack top level, pop until
 * level > stack top level, then append as child of new top.
 */
export function buildHeadingTree(headings: RawHeading[]): HeadingItem[] {
  const root: HeadingItem[] = []
  const stack: HeadingItem[] = []

  for (const h of headings) {
    const node: HeadingItem = {
      id: h.id,
      text: h.text,
      level: h.level,
      children: [],
    }

    // Pop stack while top level >= current level
    while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
      stack.pop()
    }

    if (stack.length > 0) {
      stack[stack.length - 1].children.push(node)
    } else {
      root.push(node)
    }

    stack.push(node)
  }

  return root
}

/**
 * Extract heading elements from a DOM container and build a flat list.
 */
function extractHeadings(container: HTMLElement): RawHeading[] {
  const elements = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const headings: RawHeading[] = []

  elements.forEach((el, index) => {
    const text = (el.textContent || '').trim()
    if (!text) return // skip empty headings

    const id = el.id || `heading-${index}`
    const level = parseInt(el.tagName.replace('H', ''), 10)

    headings.push({ id, text, level })
  })

  return headings
}

/**
 * Hook that extracts headings from a rendered note-content container
 * and tracks which heading is currently visible via IntersectionObserver.
 *
 * @param contentRef - React ref to the note-content div
 * @param options - Optional configuration
 * @param options.enabled - When false, skip observation (e.g., note isn't loaded)
 */
export function useOutline(
  contentRef: RefObject<HTMLDivElement | null>,
  options?: { enabled?: boolean }
): UseOutlineResult {
  const [headings, setHeadings] = useState<HeadingItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  const extract = useCallback(() => {
    const el = contentRef.current
    if (!el) {
      setHeadings([])
      setActiveId(null)
      return
    }

    try {
      const raw = extractHeadings(el)
      setHeadings(buildHeadingTree(raw))
    } catch {
      // DOM parse failure — silently degrade
      setHeadings([])
      setActiveId(null)
    }
  }, [contentRef])

  useEffect(() => {
    extract()
  }, [extract])

  // IntersectionObserver for scroll tracking
  useEffect(() => {
    const el = contentRef.current
    const enabled = options?.enabled ?? true
    if (!el || !enabled) return

    const headingEls = el.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6')
    if (headingEls.length === 0) return

    const idMap = new Map<string, IntersectionObserverEntry>()
    const visibleIds = new Set<string>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id || ''
          idMap.set(id, entry)
          if (entry.isIntersecting) {
            visibleIds.add(id)
          } else {
            visibleIds.delete(id)
          }
        }

        // Pick the topmost visible heading: find the one closest to the top
        let topmostId: string | null = null
        let topmostTop = Infinity
        for (const id of visibleIds) {
          const entry = idMap.get(id)
          if (entry && entry.boundingClientRect.top < topmostTop) {
            topmostTop = entry.boundingClientRect.top
            topmostId = id
          }
        }

        setActiveId(topmostId)
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      }
    )

    headingEls.forEach((h) => observer.observe(h))

    return () => {
      observer.disconnect()
    }
  }, [contentRef, options?.enabled])

  return { headings, activeId }
}
