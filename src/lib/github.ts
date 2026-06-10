import { CONFIG } from '../config'
import { getFromCache, setToCache, removeFromCache } from './cache'

export interface TreeNode {
  name: string
  path: string
  type: 'blob' | 'tree'
  children?: TreeNode[]
}

const CACHE_KEY = 'obsidian-wiz:tree'

export async function fetchTree(): Promise<TreeNode[]> {
  const cached = getFromCache<TreeNode[]>(CACHE_KEY)
  if (cached) return cached

  const url = `${CONFIG.r2BaseUrl}tree.json`
  const text = await fetchWithRetry(url, CONFIG.maxRetries)
  const tree = JSON.parse(text) as TreeNode[]

  setToCache(CACHE_KEY, tree, CONFIG.treeCacheTTL)

  return tree
}

export async function fetchNoteContent(path: string): Promise<string> {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  const url = `${CONFIG.r2BaseUrl}${encodedPath}`
  return fetchWithRetry(url, CONFIG.maxRetries)
}

async function fetchWithRetry(url: string, retriesLeft: number): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.apiTimeout)

  try {
    const response = await fetch(url, { signal: controller.signal })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Note not found')
      }
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    return await response.text()
  } catch (err) {
    clearTimeout(timeoutId)

    // 404 不重试
    if (err instanceof Error && err.message === 'Note not found') {
      throw err
    }

    if (retriesLeft > 0) {
      await new Promise((r) => setTimeout(r, 1000))
      return fetchWithRetry(url, retriesLeft - 1)
    }

    throw err
  }
}

export function clearTreeCache(): void {
  removeFromCache(CACHE_KEY)
}

export function buildNameIndex(tree: TreeNode[]): Map<string, string> {
  const index = new Map<string, string>()

  function walk(nodes: TreeNode[]) {
    for (const node of nodes) {
      if (node.type === 'blob' && node.path.endsWith('.md')) {
        const name = node.name.replace(/\.md$/i, '').toLowerCase()
        if (!index.has(name)) {
          index.set(name, node.path.replace(/\.md$/i, ''))
        }
      }
      if (node.children) walk(node.children)
    }
  }

  walk(tree)
  return index
}
