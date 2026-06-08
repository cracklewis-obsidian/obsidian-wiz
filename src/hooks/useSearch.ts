import { useMemo } from 'react'
import { useStore } from '../stores/useStore'
import type { TreeNode } from '../lib/github'

export function useSearch() {
  const { tree, searchQuery, setSearchQuery } = useStore()

  const filteredTree = useMemo(() => {
    if (!tree || !searchQuery.trim()) return tree

    const query = searchQuery.toLowerCase().trim()
    return filterTree(tree, query)
  }, [tree, searchQuery])

  return { filteredTree, searchQuery, setSearchQuery }
}

function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  const result: TreeNode[] = []

  for (const node of nodes) {
    if (node.type === 'blob') {
      const nameWithoutExt = node.name.replace(/\.md$/i, '')
      if (nameWithoutExt.toLowerCase().includes(query)) {
        result.push(node)
      }
    } else {
      const filteredChildren = node.children ? filterTree(node.children, query) : []
      if (filteredChildren.length > 0 || node.name.toLowerCase().includes(query)) {
        result.push({
          ...node,
          children: filteredChildren,
        })
      }
    }
  }

  return result
}
