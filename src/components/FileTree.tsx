import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../stores/useStore'
import type { TreeNode } from '../lib/github'
import TreeFolder from './TreeFolder'
import TreeFile from './TreeFile'

interface FileTreeProps {
  nodes: TreeNode[]
}

export default function FileTree({ nodes }: FileTreeProps) {
  const expandFolder = useStore((s) => s.expandFolder)
  const { '*': currentPath } = useParams()

  // Auto-expand folders along the current path
  useEffect(() => {
    if (currentPath) {
      const parts = currentPath.split('/')
      let accumulated = ''
      for (const part of parts.slice(0, -1)) {
        accumulated = accumulated ? `${accumulated}/${part}` : part
        expandFolder(accumulated)
      }
    }
  }, [currentPath, expandFolder])

  if (nodes.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        未找到匹配的文件
      </div>
    )
  }

  return (
    <div className="py-2">
      {nodes.map((node) =>
        node.type === 'tree' ? (
          <TreeFolder key={node.path} node={node} level={0} />
        ) : (
          <div key={node.path} className="pl-3">
            <TreeFile node={node} />
          </div>
        )
      )}
    </div>
  )
}
