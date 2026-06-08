import { useEffect, useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { fetchTree, clearTreeCache } from '../lib/github'

export function useTree() {
  const { tree, treeLoading, treeError, setTree, setTreeLoading, setTreeError } = useStore()

  const loadTree = useCallback(async () => {
    setTreeLoading(true)
    setTreeError(null)
    try {
      const result = await fetchTree()
      setTree(result)
    } catch (err) {
      setTreeError(err instanceof Error ? err.message : 'Failed to load directory tree')
    } finally {
      setTreeLoading(false)
    }
  }, [setTree, setTreeLoading, setTreeError])

  const refreshTree = useCallback(async () => {
    clearTreeCache()
    await loadTree()
  }, [loadTree])

  useEffect(() => {
    if (!tree && !treeLoading && !treeError) {
      loadTree()
    }
  }, [tree, treeLoading, treeError, loadTree])

  return { tree, loading: treeLoading, error: treeError, refreshTree }
}
