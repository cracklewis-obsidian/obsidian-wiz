import { useStore } from '../stores/useStore'
import type { TreeNode } from '../lib/github'
import TreeFile from './TreeFile'

interface TreeFolderProps {
  node: TreeNode
  level: number
}

export default function TreeFolder({ node, level }: TreeFolderProps) {
  const expandedFolders = useStore((s) => s.expandedFolders)
  const toggleFolder = useStore((s) => s.toggleFolder)
  const isExpanded = expandedFolders.has(node.path)

  return (
    <div>
      <button
        onClick={() => toggleFolder(node.path)}
        className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-md transition-colors flex items-center"
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        <span className="mr-1 w-4 flex-shrink-0">
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className="mr-2">📁</span>
        {node.name}
      </button>

      {isExpanded && node.children && (
        <div>
          {node.children.map((child) =>
            child.type === 'tree' ? (
              <TreeFolder key={child.path} node={child} level={level + 1} />
            ) : (
              <div
                key={child.path}
                style={{ paddingLeft: `${12 + (level + 1) * 16}px` }}
              >
                <TreeFile node={child} />
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
