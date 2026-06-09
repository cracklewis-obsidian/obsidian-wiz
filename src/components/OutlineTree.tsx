import { useState, useCallback, type MouseEvent } from 'react'
import type { HeadingItem } from '../hooks/useOutline'

interface OutlineTreeProps {
  items: HeadingItem[]
  activeId: string | null
  onHeadingClick?: (id: string) => void
  depth?: number
}

export default function OutlineTree({
  items,
  activeId,
  onHeadingClick,
  depth = 0,
}: OutlineTreeProps) {
  // If depth exceeds 6, truncate
  if (depth > 6) return null

  return (
    <ul className="list-none m-0 p-0">
      {items.map((item) => (
        <OutlineNode
          key={item.id}
          item={item}
          activeId={activeId}
          onHeadingClick={onHeadingClick}
          depth={depth}
        />
      ))}
    </ul>
  )
}

interface OutlineNodeProps {
  item: HeadingItem
  activeId: string | null
  onHeadingClick?: (id: string) => void
  depth: number
}

function OutlineNode({ item, activeId, onHeadingClick, depth }: OutlineNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = item.children.length > 0
  const isActive = activeId === item.id

  const handleToggle = useCallback((e: MouseEvent) => {
    e.stopPropagation()
    setExpanded((prev) => !prev)
  }, [])

  const handleClick = useCallback(() => {
    onHeadingClick?.(item.id)
  }, [onHeadingClick, item.id])

  return (
    <li>
      <div
        className={`flex items-center gap-1 px-3 py-1 rounded-md cursor-pointer transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px`, fontSize: `${Math.max(12, 14 - depth * 0.5)}px` }}
        onClick={handleClick}
        data-active={isActive ? 'true' : 'false'}
      >
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="w-4 h-4 flex items-center justify-center flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label={expanded ? '折叠' : '展开'}
          >
            {expanded ? '▾' : '▸'}
          </button>
        )}
        {!hasChildren && <span className="w-4 flex-shrink-0" />}
        <span className="truncate" title={item.text}>
          {item.text}
        </span>
      </div>

      {hasChildren && expanded && (
        <OutlineTree
          items={item.children}
          activeId={activeId}
          onHeadingClick={onHeadingClick}
          depth={depth + 1}
        />
      )}
    </li>
  )
}
