import { useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useStore } from '../stores/useStore'
import { useNote } from '../hooks/useNote'
import { useOutline } from '../hooks/useOutline'
import { useEffect } from 'react'
import NoteContent from './NoteContent'
import OutlinePanel from './OutlinePanel'
import OutlineToggle from './OutlineToggle'
import Loading from './Loading'
import ErrorDisplay from './ErrorDisplay'
import EmptyState from './EmptyState'
import NoteNotFound from './NoteNotFound'
import OutlineTree from './OutlineTree'

export default function ContentArea() {
  const { '*': path } = useParams()
  const [searchParams] = useSearchParams()
  const resolvedPath = path || null
  const headingAnchor = searchParams.get('heading') || null

  const notePath = resolvedPath
    ? resolvedPath.endsWith('.md')
      ? resolvedPath
      : `${resolvedPath}.md`
    : null

  const { content, loading, error } = useNote(notePath)
  const setCurrentPath = useStore((s) => s.setCurrentPath)
  const outlineCollapsed = useStore((s) => s.outlineCollapsed)
  const toggleOutline = useStore((s) => s.toggleOutline)

  const contentRef = useRef<HTMLDivElement>(null)
  const { headings, activeId } = useOutline(contentRef, {
    enabled: !!content && !loading && !error,
  })

  useEffect(() => {
    setCurrentPath(resolvedPath)
  }, [resolvedPath, setCurrentPath])

  // No path selected
  if (!resolvedPath) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <EmptyState />
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <Loading message="加载笔记..." />
      </div>
    )
  }

  // Note not found
  if (error === 'NOTE_NOT_FOUND') {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <NoteNotFound path={resolvedPath} />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <ErrorDisplay message={error} />
      </div>
    )
  }

  // Success — render note with outline
  return (
    <div className="flex flex-1 min-h-0">
      <article className="flex-1 min-w-0 p-6 md:p-10">
        {/* Top bar with heading + toggle */}
        <div className="flex items-center justify-between mb-4">
          <div />
          <OutlineToggle
            visible={headings.length > 0}
            onClick={toggleOutline}
          />
        </div>

        <NoteContent
          ref={contentRef}
          content={content || ''}
          headingAnchor={headingAnchor}
        />
      </article>

      {/* Desktop outline panel */}
      <div className="hidden md:block sticky top-0 self-start h-screen">
        <OutlinePanel
          headings={headings}
          activeId={activeId}
        />
      </div>

      {/* Mobile outline overlay */}
      {!outlineCollapsed && headings.length > 0 && (
        <div className="md:hidden">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-30"
            onClick={toggleOutline}
          />
          {/* Slide-in panel from right */}
          <aside className="fixed right-0 top-0 h-full w-72 max-w-[80vw] bg-white z-40 shadow-xl border-l border-gray-200 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-sm font-semibold text-gray-600">大纲</span>
              <button
                onClick={toggleOutline}
                className="p-1 hover:bg-gray-100 rounded"
                aria-label="关闭大纲面板"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <OutlineTree
              items={headings}
              activeId={activeId}
              onHeadingClick={(id) => {
                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                toggleOutline()
              }}
            />
          </aside>
        </div>
      )}
    </div>
  )
}
