import { CONFIG } from '../config'
import { getFromCache, setToCache, removeFromCache } from './cache'

export interface TreeNode {
  name: string
  path: string
  type: 'blob' | 'tree'
  children?: TreeNode[]
}

interface GithubTreeItem {
  path: string
  mode: string
  type: 'blob' | 'tree'
  sha: string
  size?: number
  url: string
}

const CACHE_KEY = 'obsidian-wiz:tree'

export function buildNestedTree(items: GithubTreeItem[]): TreeNode[] {
  const root: TreeNode[] = []
  const map = new Map<string, TreeNode>()

  // Filter out .obsidian config directory
  const filtered = items.filter((item) => !item.path.startsWith('.obsidian'))

  // First pass: create all nodes
  for (const item of filtered) {
    const node: TreeNode = {
      name: item.path.split('/').pop() || item.path,
      path: item.path,
      type: item.type,
    }
    if (item.type === 'tree') {
      node.children = []
    }
    map.set(item.path, node)
  }

  // Second pass: build tree structure
  for (const item of filtered) {
    const node = map.get(item.path)!
    const parts = item.path.split('/')

    if (parts.length === 1) {
      root.push(node)
    } else {
      const parentPath = parts.slice(0, -1).join('/')
      const parent = map.get(parentPath)
      if (parent && parent.children) {
        parent.children.push(node)
      } else {
        root.push(node)
      }
    }
  }

  return root
}

export async function fetchTree(): Promise<TreeNode[]> {
  const cached = getFromCache<TreeNode[]>(CACHE_KEY)
  if (cached) return cached

  const url = `https://api.github.com/repos/${CONFIG.repoOwner}/${CONFIG.repoName}/git/trees/HEAD?recursive=1`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.apiTimeout)

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal,
    })

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('API rate limit exceeded. Please try again later.')
      }
      throw new Error(`GitHub API error: ${response.status}`)
    }

    const data = await response.json()
    const tree = buildNestedTree(data.tree as GithubTreeItem[])

    setToCache(CACHE_KEY, tree, CONFIG.treeCacheTTL)

    return tree
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function fetchNoteContent(path: string): Promise<string> {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  const url = `https://raw.githubusercontent.com/${CONFIG.repoOwner}/${CONFIG.repoName}/${CONFIG.repoBranch}/${encodedPath}`
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
