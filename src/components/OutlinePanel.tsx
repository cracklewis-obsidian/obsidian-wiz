import { useEffect } from 'react'
import { useStore } from '../stores/useStore'
import OutlineTree from './OutlineTree'
import type { HeadingItem } from '../hooks/useOutline'

interface OutlinePanelProps {
  headings: HeadingItem[]
  activeId: string | null
  onHeadingClick?: (id: string) => void
}

export default function OutlinePanel({
  headings,
  activeId,
  onHeadingClick,
}: OutlinePanelProps) {
  const { outlineCollapsed, _outlineAutoCollapsed, toggleOutline, setOutlineCollapsed } =
    useStore()

  // Auto show/hide based on headings
  useEffect(() => {
    if (headings.length === 0) {
      setOutlineCollapsed(true, true)
    } else if (_outlineAutoCollapsed) {
      setOutlineCollapsed(false, false)
    }
  }, [headings.length, _outlineAutoCollapsed, setOutlineCollapsed])

  // Hide completely when no headings and collapsed
  if (headings.length === 0 && outlineCollapsed) return null

  const handleHeadingClick = (id: string) => {
    onHeadingClick?.(id)
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <aside
      className={`flex-shrink-0 border-l border-gray-200 bg-gray-50/80 overflow-hidden transition-all duration-200 ease-in-out ${
        outlineCollapsed ? 'w-0 border-l-0' : 'w-56'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          大纲
        </span>
        <button
          onClick={toggleOutline}
          className="p-0.5 hover:bg-gray-200 rounded transition-colors text-gray-400 hover:text-gray-600"
          aria-label="关闭大纲面板"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="overflow-y-auto py-2" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        {headings.length > 0 ? (
          <OutlineTree
            items={headings}
            activeId={activeId}
            onHeadingClick={handleHeadingClick}
          />
        ) : (
          <p className="px-4 py-6 text-xs text-gray-400 text-center">
            笔记中无标题
          </p>
        )}
      </div>
    </aside>
  )
}
