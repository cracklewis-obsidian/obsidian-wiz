# obsidian-wiz: Obsidian 仓库 Web 预览系统 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side SPA that browses and renders an Obsidian vault through GitHub Pages, with Wiki links, callouts, and R2-hosted attachments.

**Architecture:** React 18 + Vite SPA deployed to GitHub Pages. GitHub Tree API for directory structure (cached in localStorage), Raw CDN for Markdown content, Cloudflare R2 for images/attachments. Markdown rendering via unified/remark/rehype plugin pipeline.

**Tech Stack:** React 18, TypeScript, Vite, React Router (HashRouter), Zustand, Tailwind CSS, unified/remark/rehype for Markdown, Vitest for testing.

**Plan file location:** `docs/superpowers/plans/2026-06-08-obsidian-wiz-implementation.md`

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/index.css`
- Create: `src/vite-env.d.ts`
- Create: `.gitignore`

- [ ] **Step 1: Create project and install dependencies**

```bash
cd /c/Users/DELL/Desktop/Workbench/obsidian-wiz

# Create package.json
cat > package.json << 'PKGJSON'
{
  "name": "obsidian-wiz",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
PKGJSON

# Install production dependencies
npm install react@18 react-dom@18 react-router-dom@6 zustand@4 unified remark-parse@11 remark-gfm@4 remark-rehype@11 rehype-react@8

# Install dev dependencies
npm install -D typescript @types/react @types/react-dom @vitejs/plugin-react vite tailwindcss@3 postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom jsdom @testing-library/user-event
```

- [ ] **Step 2: Create tsconfig.json**

```bash
cat > tsconfig.json << 'TSCONFIG'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
TSCONFIG
```

- [ ] **Step 3: Create tsconfig.node.json**

```bash
cat > tsconfig.node.json << 'TSCNODE'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
TSCNODE
```

- [ ] **Step 4: Create vite.config.ts**

```bash
cat > vite.config.ts << 'VITECONFIG'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/obsidian-wiz/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
  },
})
VITECONFIG
```

- [ ] **Step 5: Create PostCSS and Tailwind config**

```bash
cat > postcss.config.js << 'POSTCSS'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
POSTCSS

cat > tailwind.config.js << 'TAILWIND'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
TAILWIND
```

- [ ] **Step 6: Create .gitignore**

```bash
cat > .gitignore << 'GITIGNORE'
node_modules
dist
.DS_Store
*.local
GITIGNORE
```

- [ ] **Step 7: Create index.html**

```bash
cat > index.html << 'INDEXHTML'
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Obsidian Wiz</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
INDEXHTML
```

- [ ] **Step 8: Create entry files**

```bash
cat > src/vite-env.d.ts << 'DTS'
/// <reference types="vite/client" />
DTS

cat > src/index.css << 'INDEXCSS'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Callout styles */
.callout {
  @apply border-l-4 rounded-r-lg p-4 my-4;
}
.callout-note {
  @apply border-l-blue-500 bg-blue-50;
}
.callout-warning {
  @apply border-l-orange-500 bg-orange-50;
}
.callout-tip,
.callout-hint {
  @apply border-l-green-500 bg-green-50;
}
.callout-danger,
.callout-error {
  @apply border-l-red-500 bg-red-50;
}
.callout-unknown {
  @apply border-l-gray-400 bg-gray-50;
}
INDEXCSS

cat > src/main.tsx << 'MAINTSX'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
MAINTSX

cat > src/App.tsx << 'APPTSX'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ContentArea from './components/ContentArea'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ContentArea />} />
        <Route path="/:path+" element={<ContentArea />} />
      </Routes>
    </Layout>
  )
}
APPTSX
```

- [ ] **Step 9: Create test setup file**

```bash
mkdir -p src

cat > src/test-setup.ts << 'TESTSETUP'
import '@testing-library/jest-dom'
TESTSETUP
```

- [ ] **Step 10: Create directory structure**

```bash
mkdir -p src/components src/hooks src/lib src/markdown src/stores .github/workflows
```

- [ ] **Step 11: Verify build works**

```bash
npx tsc --noEmit
npm run build
```

Expected: Build succeeds without errors, `dist/` directory is created.

---

### Task 2: Infrastructure — Config + Cache + GitHub API

**Files:**
- Create: `src/config.ts`
- Create: `src/lib/cache.ts`
- Create: `src/lib/github.ts`
- Create: `src/lib/__tests__/cache.test.ts`
- Create: `src/lib/__tests__/github.test.ts`

- [ ] **Step 1: Write config.ts**

```bash
cat > src/config.ts << 'CONFIG'
export const CONFIG = {
  repoOwner: 'CrackLewis',
  repoName: 'obsidian',
  repoBranch: 'main',
  r2BaseUrl: 'https://obimg.cracklewis.site/',
  treeCacheTTL: 24 * 60 * 60 * 1000,   // 24 hours
  apiTimeout: 15000,                     // 15 seconds
  maxRetries: 2,
} as const
CONFIG
```

- [ ] **Step 2: Write cache.ts with full implementation**

```bash
cat > src/lib/cache.ts << 'CACHE'
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export function getFromCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null

    const entry: CacheEntry<T> = JSON.parse(raw)
    const now = Date.now()

    if (now - entry.timestamp > entry.ttl) {
      localStorage.removeItem(key)
      return null
    }

    return entry.data
  } catch {
    return null
  }
}

export function setToCache<T>(key: string, data: T, ttl: number): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function removeFromCache(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // silently ignore
  }
}
CACHE
```

- [ ] **Step 3: Write cache.test.ts**

```bash
mkdir -p src/lib/__tests__

cat > src/lib/__tests__/cache.test.ts << 'CACHETEST'
import { describe, it, expect, beforeEach } from 'vitest'
import { getFromCache, setToCache, removeFromCache } from '../cache'

describe('cache', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores and retrieves a value within TTL', () => {
    setToCache('test-key', { foo: 'bar' }, 60_000)
    expect(getFromCache('test-key')).toEqual({ foo: 'bar' })
  })

  it('returns null for expired entries', () => {
    setToCache('expired-key', 'value', -1) // already expired
    expect(getFromCache('expired-key')).toBeNull()
  })

  it('returns null for missing keys', () => {
    expect(getFromCache('nonexistent')).toBeNull()
  })

  it('removes an entry from cache', () => {
    setToCache('temp', 'data', 60_000)
    removeFromCache('temp')
    expect(getFromCache('temp')).toBeNull()
  })

  it('handles corrupted JSON gracefully', () => {
    localStorage.setItem('bad-key', 'not-json')
    expect(getFromCache('bad-key')).toBeNull()
  })
})
CACHETEST
```

- [ ] **Step 4: Write github.ts with full implementation**

```bash
cat > src/lib/github.ts << 'GITHUBTS'
import { CONFIG } from '../config'
import { getFromCache, setToCache } from './cache'

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
      // Top-level item
      root.push(node)
    } else {
      // Nested item — find parent
      const parentPath = parts.slice(0, -1).join('/')
      const parent = map.get(parentPath)
      if (parent && parent.children) {
        parent.children.push(node)
      } else {
        // Parent might have been filtered out — add to root
        root.push(node)
      }
    }
  }

  return root
}

export async function fetchTree(): Promise<TreeNode[]> {
  // Check cache first
  const cached = getFromCache<TreeNode[]>(CACHE_KEY)
  if (cached) return cached

  // Determine if we need auth for private repos
  // For public repos, no token needed
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

    // Cache the result
    setToCache(CACHE_KEY, tree, CONFIG.treeCacheTTL)

    return tree
  } finally {
    clearTimeout(timeoutId)
  }
}

export function fetchNoteContent(path: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/${CONFIG.repoOwner}/${CONFIG.repoName}/${CONFIG.repoBranch}/${path}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.apiTimeout)

  return fetchWithRetry(url, controller, timeoutId, CONFIG.maxRetries)
}

async function fetchWithRetry(
  url: string,
  controller: AbortController,
  timeoutId: ReturnType<typeof setTimeout>,
  retriesLeft: number
): Promise<string> {
  try {
    const response = await fetch(url, {
      signal: controller.signal,
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Note not found: ${url}`)
      }
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    return await response.text()
  } catch (err) {
    clearTimeout(timeoutId)

    if (retriesLeft > 0) {
      await new Promise((r) => setTimeout(r, 1000))
      const newController = new AbortController()
      const newTimeoutId = setTimeout(() => newController.abort(), CONFIG.apiTimeout)
      return fetchWithRetry(url, newController, newTimeoutId, retriesLeft - 1)
    }

    throw err
  }
}

export function clearTreeCache(): void {
  const { removeFromCache } = require('./cache')
  removeFromCache(CACHE_KEY)
}
CACHE
```

Wait, I shouldn't use `require` in ESM. Let me fix that.

```bash
cat > src/lib/github.ts << 'GITHUBTS'
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
  } catch (err) {
    clearTimeout(timeoutId)
    throw err
  }
}

export async function fetchNoteContent(path: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/${CONFIG.repoOwner}/${CONFIG.repoName}/${CONFIG.repoBranch}/${path}`
  return fetchWithRetry(url, CONFIG.maxRetries)
}

async function fetchWithRetry(url: string, retriesLeft: number): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.apiTimeout)

  try {
    const response = await fetch(url, { signal: controller.signal })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Note not found: ${url}`)
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
GITHUBTS
```

- [ ] **Step 5: Write github.test.ts**

```bash
cat > src/lib/__tests__/github.test.ts << 'GITHUBTEST'
import { describe, it, expect } from 'vitest'
import { buildNestedTree } from '../github'

describe('buildNestedTree', () => {
  const flatItems = [
    { path: 'README.md', mode: '100644', type: 'blob' as const, sha: 'a', url: '' },
    { path: '项目A', mode: '040000', type: 'tree' as const, sha: 'b', url: '' },
    { path: '项目A/需求.md', mode: '100644', type: 'blob' as const, sha: 'c', url: '' },
    { path: '项目A/方案.md', mode: '100644', type: 'blob' as const, sha: 'd', url: '' },
    { path: '项目A/子目录', mode: '040000', type: 'tree' as const, sha: 'e', url: '' },
    { path: '项目A/子目录/细节.md', mode: '100644', type: 'blob' as const, sha: 'f', url: '' },
    { path: '附件', mode: '040000', type: 'tree' as const, sha: 'g', url: '' },
    { path: '附件/diagram.png', mode: '100644', type: 'blob' as const, sha: 'h', url: '' },
  ]

  it('builds nested tree from flat GitHub API response', () => {
    const tree = buildNestedTree(flatItems)

    // Top level
    expect(tree).toHaveLength(3)
    expect(tree.map((n) => n.name)).toEqual(['README.md', '项目A', '附件'])

    // Find 项目A
    const projectA = tree.find((n) => n.name === '项目A')
    expect(projectA?.children).toHaveLength(3)
    expect(projectA?.children?.map((n) => n.name)).toEqual(['需求.md', '方案.md', '子目录'])

    // Find nested child
    const subdir = projectA?.children?.find((n) => n.name === '子目录')
    expect(subdir?.children).toHaveLength(1)
    expect(subdir?.children?.[0].name).toBe('细节.md')
  })

  it('excludes .obsidian directory', () => {
    const withObsidian = [
      ...flatItems,
      { path: '.obsidian/config', mode: '100644', type: 'blob' as const, sha: 'x', url: '' },
      { path: '.obsidian/workspace', mode: '100644', type: 'blob' as const, sha: 'y', url: '' },
    ]
    const tree = buildNestedTree(withObsidian)
    const names = tree.map((n) => n.name)
    expect(names).not.toContain('.obsidian')
  })

  it('returns empty array for empty input', () => {
    expect(buildNestedTree([])).toEqual([])
  })
})
GITHUBTEST
```

- [ ] **Step 6: Run tests**

```bash
npx vitest run
```

Expected: All tests pass. cache.test.ts: 5 passed, github.test.ts: 3 passed.

- [ ] **Step 7: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

---

### Task 3: Markdown Plugins — Wiki Link + Callout + R2 Image

**Files:**
- Create: `src/markdown/remark-wiki-link.ts`
- Create: `src/markdown/remark-callout.ts`
- Create: `src/markdown/rehype-r2-image.ts`
- Create: `src/markdown/pipeline.ts`
- Create: `src/markdown/__tests__/remark-wiki-link.test.ts`
- Create: `src/markdown/__tests__/remark-callout.test.ts`
- Create: `src/markdown/__tests__/rehype-r2-image.test.ts`

- [ ] **Step 1: Write remark-wiki-link.ts**

```bash
cat > src/markdown/remark-wiki-link.ts << 'WIKILINK'
import { visit } from 'unist-util-visit'
import type { Root, Link, Image, Text } from 'mdast'

const IMAGE_EXTENSIONS = /\.(png|jpg|jpeg|gif|svg|webp|bmp)$/i
const WIKI_LINK_PATTERN = /^\[\[(.+?)(?:\|(.+?))?\]\]$/
const ATTACHMENT_PREFIX = '附件/'

interface WikiLinkNode extends Link {
  data?: {
    hProperties?: Record<string, string>
    hName?: string
  }
}

export function remarkWikiLink() {
  return (tree: Root) => {
    visit(tree, 'paragraph', (node: any, index: number, parent: any) => {
      if (!node.children || node.children.length === 0) return

      const newChildren: any[] = []
      let modified = false

      for (const child of node.children) {
        if (child.type === 'text') {
          const text = child.value
          const parts = splitWikiLinks(text)

          for (const part of parts) {
            if (part.type === 'link') {
              modified = true
              const { target, displayText } = part

              if (isImageLink(target)) {
                // [[附件/xxx.png]] → image node
                newChildren.push({
                  type: 'image',
                  url: target,
                  alt: displayText || target.split('/').pop() || target,
                } as Image)
              } else {
                // [[笔记名]] → link node
                const linkPath = target.replace(/\.md$/i, '')
                newChildren.push({
                  type: 'link',
                  url: `#/${linkPath}`,
                  children: [{ type: 'text', value: displayText || linkPath.split('/').pop() || linkPath }],
                } as WikiLinkNode)
              }
            } else {
              newChildren.push({ type: 'text', value: part.text } as Text)
            }
          }
        } else {
          newChildren.push(child)
        }
      }

      if (modified) {
        parent.children[index] = {
          ...node,
          children: newChildren,
        }
      }
    })
  }
}

interface LinkPart {
  type: 'text' | 'link'
  text?: string
  target?: string
  displayText?: string
}

function splitWikiLinks(text: string): LinkPart[] {
  const parts: LinkPart[] = []
  let remaining = text
  let match

  while ((match = remaining.match(WIKI_LINK_PATTERN)) !== null) {
    const startIdx = remaining.indexOf('[[')
    if (startIdx > 0) {
      parts.push({ type: 'text', text: remaining.slice(0, startIdx) })
    }

    parts.push({
      type: 'link',
      target: match[1],
      displayText: match[2],
    })

    remaining = remaining.slice(startIdx + match[0].length)
  }

  if (remaining.length > 0) {
    parts.push({ type: 'text', text: remaining })
  }

  return parts
}

function isImageLink(target: string): boolean {
  return target.startsWith(ATTACHMENT_PREFIX) || IMAGE_EXTENSIONS.test(target)
}
WIKILINK
```

- [ ] **Step 2: Write remark-callout.ts**

```bash
cat > src/markdown/remark-callout.ts << 'CALLOUT'
import { visit } from 'unist-util-visit'
import type { Root, Blockquote, Paragraph } from 'mdast'

const CALLOUT_PATTERN = /^\[!(.+?)\]\s*(.*)$/i

interface CalloutContainer extends Blockquote {
  data?: {
    hProperties?: Record<string, string>
    hName?: string
  }
}

export function remarkCallout() {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: Blockquote, index: number, parent: any) => {
      if (!node.children || node.children.length === 0) return

      const firstChild = node.children[0]

      // The first child should be a paragraph containing the [!type] marker
      if (firstChild?.type !== 'paragraph') return

      const firstText = (firstChild.children[0] as any)?.value
      if (!firstText) return

      const match = firstText.match(CALLOUT_PATTERN)
      if (!match) return

      const calloutType = match[1].toLowerCase()
      const calloutTitle = match[2]

      // Remove the [!type] text from the first paragraph
      const remainingFirstLine = firstText.replace(CALLOUT_PATTERN, '').trim()

      if (remainingFirstLine) {
        // There's text after the title on the same line
        ; (firstChild.children[0] as any).value = remainingFirstLine
      } else {
        // Remove the first paragraph if it only contained the [!type]
        node.children.shift()
      }

      // If we have a callout title, insert it as a heading
      const calloutChildren: any[] = []

      if (calloutTitle) {
        calloutChildren.push({
          type: 'paragraph',
          data: {
            hProperties: { className: 'callout-title' },
          },
          children: [{ type: 'text', value: calloutTitle, bold: true }],
        })
      }

      // Add remaining blockquote content
      calloutChildren.push(...node.children)

      // Replace the blockquote with a custom callout div
      const calloutNode: CalloutContainer = {
        type: 'blockquote',
        data: {
          hName: 'div',
          hProperties: {
            className: `callout callout-${calloutType}`,
          },
        },
        children: calloutChildren,
      }

      parent.children[index] = calloutNode
    })
  }
}
CALLOUT
```

- [ ] **Step 3: Write rehype-r2-image.ts**

```bash
cat > src/markdown/rehype-r2-image.ts << 'R2IMAGE'
import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'
import { CONFIG } from '../config'

const ATTACHMENT_PREFIX = '附件/'

export function rehypeR2Image() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (node.tagName !== 'img') return

      const src = node.properties?.src as string | undefined
      if (!src) return

      // Handle both 附件/xxx.png and ./附件/xxx.png
      const normalized = src.replace(/^\.\//, '')
      if (normalized.startsWith(ATTACHMENT_PREFIX)) {
        node.properties!.src = `${CONFIG.r2BaseUrl}${normalized}`
      }
    })
  }
}
R2IMAGE
```

- [ ] **Step 4: Write wiki-link tests**

```bash
mkdir -p src/markdown/__tests__

cat > src/markdown/__tests__/remark-wiki-link.test.ts << 'WIKILINKTEST'
import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { remarkWikiLink } from '../remark-wiki-link'

function process(text: string) {
  const result = unified()
    .use(remarkParse)
    .use(remarkWikiLink)
    .use(remarkStringify)
    .processSync(text)
  return String(result)
}

describe('remarkWikiLink', () => {
  it('converts [[笔记名]] to a link', () => {
    const result = process('参考 [[设计草案]] 了解更多')
    expect(result).toContain('[设计草案](#/设计草案)')
  })

  it('converts [[路径/笔记名]] to a path link', () => {
    const result = process('详见 [[项目A/需求]]')
    expect(result).toContain('[需求](#/项目A/需求)')
  })

  it('handles pipe syntax [[目标|显示名]]', () => {
    const result = process('参考 [[设计草案|设计文档]]')
    expect(result).toContain('[设计文档](#/设计草案)')
  })

  it('converts [[附件/xxx.png]] to an image reference', () => {
    const result = process('图示：[[附件/diagram.png]]')
    // Should not be a link — should remain as image reference in the output
    // remark-stringify will render image nodes as ![]()
    expect(result).toContain('![](附件/diagram.png)')
  })

  it('handles mixed content with regular text', () => {
    const result = process('前面文字 [[链接]] 后面文字')
    expect(result).toContain('前面文字')
    expect(result).toContain('[链接](#/链接)')
    expect(result).toContain('后面文字')
  })

  it('strips .md extension from targets', () => {
    const result = process('参考 [[需求.md]]')
    expect(result).toContain('[需求](#/需求)')
  })

  it('passes through text without wiki links', () => {
    const result = process('普通文本 [外部链接](https://example.com)')
    expect(result).toContain('普通文本')
    expect(result).toContain('[外部链接](https://example.com)')
  })
})
WIKILINKTEST
```

- [ ] **Step 5: Write callout tests**

```bash
cat > src/markdown/__tests__/remark-callout.test.ts << 'CALLOUTTEST'
import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { remarkCallout } from '../remark-callout'

function process(text: string) {
  const result = unified()
    .use(remarkParse)
    .use(remarkCallout)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(text)
  return String(result)
}

describe('remarkCallout', () => {
  it('converts > [!note] to a callout div', () => {
    const result = process('> [!note]\n> 这是一个提示')
    expect(result).toContain('class="callout callout-note"')
    expect(result).toContain('这是一个提示')
  })

  it('converts > [!warning] with title', () => {
    const result = process('> [!warning] 注意\n> 请小心操作')
    expect(result).toContain('class="callout callout-warning"')
    expect(result).toContain('注意')
    expect(result).toContain('请小心操作')
  })

  it('handles [!tip] and [!hint]', () => {
    const tip = process('> [!tip]\n> 小技巧')
    const hint = process('> [!hint]\n> 小提示')
    expect(tip).toContain('callout-tip')
    expect(hint).toContain('callout-hint')
  })

  it('handles [!danger] and [!error]', () => {
    const danger = process('> [!danger]\n> 危险')
    const error = process('> [!error]\n> 错误')
    expect(danger).toContain('callout-danger')
    expect(error).toContain('callout-error')
  })

  it('handles multi-line callout content', () => {
    const result = process('> [!note] 笔记\n> 第一行\n> 第二行\n> 第三行')
    expect(result).toContain('第一行')
    expect(result).toContain('第二行')
    expect(result).toContain('第三行')
  })

  it('ignores regular blockquotes', () => {
    const result = process('> 普通引用\n> 继续引用')
    expect(result).toContain('<blockquote>')
    expect(result).not.toContain('callout')
  })
})
CALLOUTTEST
```

- [ ] **Step 6: Write R2 image tests**

```bash
cat > src/markdown/__tests__/rehype-r2-image.test.ts << 'R2IMAGETEST'
import { describe, it, expect } from 'vitest'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { rehypeR2Image } from '../rehype-r2-image'
import { CONFIG } from '../../config'

function process(text: string) {
  const result = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeR2Image)
    .use(rehypeStringify)
    .processSync(text)
  return String(result)
}

describe('rehypeR2Image', () => {
  it('rewrites 附件/ paths to R2 URL', () => {
    const result = process('![alt](附件/xxx.png)')
    expect(result).toContain(`src="${CONFIG.r2BaseUrl}附件/xxx.png"`)
  })

  it('rewrites ./附件/ paths to R2 URL', () => {
    const result = process('![alt](./附件/xxx.png)')
    expect(result).toContain(`src="${CONFIG.r2BaseUrl}附件/xxx.png"`)
  })

  it('does not rewrite absolute URLs', () => {
    const result = process('![alt](https://example.com/img.png)')
    expect(result).toContain('src="https://example.com/img.png"')
    expect(result).not.toContain(CONFIG.r2BaseUrl)
  })

  it('does not rewrite non-attachment relative paths', () => {
    const result = process('![alt](./images/xxx.png)')
    expect(result).toContain('src="./images/xxx.png"')
  })
})
R2IMAGETEST
```

- [ ] **Step 7: Write pipeline.ts**

```bash
cat > src/markdown/pipeline.ts << 'PIPELINE'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeReact from 'rehype-react'
import { createElement, type ReactElement } from 'react'
import type { Root } from 'hast'
import { remarkWikiLink } from './remark-wiki-link'
import { remarkCallout } from './remark-callout'
import { rehypeR2Image } from './rehype-r2-image'

let processor: ReturnType<typeof createProcessor> | null = null

function createProcessor() {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkWikiLink)
    .use(remarkCallout)
    .use(remarkRehype)
    .use(rehypeR2Image)
    .use(rehypeReact, { createElement })
}

export function renderMarkdown(content: string): ReactElement | null {
  try {
    if (!processor) {
      processor = createProcessor()
    }
    const result = processor.processSync(content)
    return result.result as ReactElement
  } catch (err) {
    console.error('Markdown rendering failed:', err)
    return null
  }
}
PIPELINE
```

- [ ] **Step 8: Install additional dependencies**

```bash
npm install unist-util-visit mdast-util-from-markdown
npm install -D remark-stringify rehype-stringify @types/mdast @types/hast
```

- [ ] **Step 9: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass including the 3 new test files.

---

### Task 4: State Management — Store + Hooks

**Files:**
- Create: `src/stores/useStore.ts`
- Create: `src/hooks/useTree.ts`
- Create: `src/hooks/useNote.ts`
- Create: `src/hooks/useSearch.ts`

- [ ] **Step 1: Write Zustand store**

```bash
cat > src/stores/useStore.ts << 'STORE'
import { create } from 'zustand'
import type { TreeNode } from '../lib/github'

interface AppStore {
  // Tree state
  tree: TreeNode[] | null
  treeLoading: boolean
  treeError: string | null

  // Note state
  currentPath: string | null
  noteContent: string | null
  noteLoading: boolean
  noteError: string | null

  // UI state
  searchQuery: string
  sidebarCollapsed: boolean
  expandedFolders: Set<string>

  // Actions
  setTree: (tree: TreeNode[] | null) => void
  setTreeLoading: (loading: boolean) => void
  setTreeError: (error: string | null) => void
  setCurrentPath: (path: string | null) => void
  setNoteContent: (content: string | null) => void
  setNoteLoading: (loading: boolean) => void
  setNoteError: (error: string | null) => void
  setSearchQuery: (query: string) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleFolder: (path: string) => void
  expandFolder: (path: string) => void
}

export const useStore = create<AppStore>((set) => ({
  // Initial tree state
  tree: null,
  treeLoading: false,
  treeError: null,

  // Initial note state
  currentPath: null,
  noteContent: null,
  noteLoading: false,
  noteError: null,

  // Initial UI state
  searchQuery: '',
  sidebarCollapsed: false,
  expandedFolders: new Set<string>(),

  // Tree actions
  setTree: (tree) => set({ tree }),
  setTreeLoading: (treeLoading) => set({ treeLoading }),
  setTreeError: (treeError) => set({ treeError }),

  // Note actions
  setCurrentPath: (currentPath) => set({ currentPath }),
  setNoteContent: (noteContent) => set({ noteContent }),
  setNoteLoading: (noteLoading) => set({ noteLoading }),
  setNoteError: (noteError) => set({ noteError }),

  // UI actions
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

  toggleFolder: (path) =>
    set((state) => {
      const next = new Set(state.expandedFolders)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return { expandedFolders: next }
    }),

  expandFolder: (path) =>
    set((state) => {
      const next = new Set(state.expandedFolders)
      next.add(path)
      return { expandedFolders: next }
    }),
}))
STORE
```

- [ ] **Step 2: Write useTree hook**

```bash
cat > src/hooks/useTree.ts << 'USETREE'
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
USETREE
```

- [ ] **Step 3: Write useNote hook**

```bash
cat > src/hooks/useNote.ts << 'USENOTE'
import { useEffect, useCallback } from 'react'
import { useStore } from '../stores/useStore'
import { fetchNoteContent } from '../lib/github'

export function useNote(path: string | null) {
  const { noteContent, noteLoading, noteError, setNoteContent, setNoteLoading, setNoteError } =
    useStore()

  const loadNote = useCallback(
    async (notePath: string) => {
      setNoteLoading(true)
      setNoteError(null)
      setNoteContent(null)
      try {
        const content = await fetchNoteContent(notePath)
        setNoteContent(content)
      } catch (err) {
        setNoteError(
          err instanceof Error
            ? err.message === 'Note not found'
              ? 'NOTE_NOT_FOUND'
              : err.message
            : 'Failed to load note'
        )
      } finally {
        setNoteLoading(false)
      }
    },
    [setNoteContent, setNoteLoading, setNoteError]
  )

  useEffect(() => {
    if (path) {
      loadNote(path)
    } else {
      setNoteContent(null)
      setNoteError(null)
      setNoteLoading(false)
    }
  }, [path, loadNote, setNoteContent, setNoteError, setNoteLoading])

  return { content: noteContent, loading: noteLoading, error: noteError }
}
USENOTE
```

- [ ] **Step 4: Write useSearch hook**

```bash
cat > src/hooks/useSearch.ts << 'USESEARCH'
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
      // Match .md files by name (without extension)
      const nameWithoutExt = node.name.replace(/\.md$/i, '')
      if (nameWithoutExt.toLowerCase().includes(query)) {
        result.push(node)
      }
    } else {
      // For folders: include if any child matches, or name matches
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
USESEARCH
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

---

### Task 5: Layout Shell — Status + Layout Components

**Files:**
- Create: `src/components/Layout.tsx`
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/ContentArea.tsx`
- Create: `src/components/Loading.tsx`
- Create: `src/components/ErrorDisplay.tsx`
- Create: `src/components/EmptyState.tsx`
- Create: `src/components/NoteNotFound.tsx`

- [ ] **Step 1: Write Loading component**

```bash
cat > src/components/Loading.tsx << 'LOADING'
interface LoadingProps {
  message?: string
}

export default function Loading({ message = '加载中...' }: LoadingProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  )
}
LOADING
```

- [ ] **Step 2: Write ErrorDisplay component**

```bash
cat > src/components/ErrorDisplay.tsx << 'ERRORDISPLAY'
interface ErrorDisplayProps {
  message: string
  onRetry?: () => void
}

export default function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center max-w-md">
        <div className="text-red-500 text-4xl mb-4">⚠</div>
        <p className="text-gray-700 mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            重试
          </button>
        )}
      </div>
    </div>
  )
}
ERRORDISPLAY
```

- [ ] **Step 3: Write EmptyState component**

```bash
cat > src/components/EmptyState.tsx << 'EMPTYSTATE'
export default function EmptyState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center max-w-md">
        <div className="text-gray-300 text-6xl mb-6">📖</div>
        <h2 className="text-xl font-semibold text-gray-600 mb-2">选择一篇笔记开始阅读</h2>
        <p className="text-gray-400 text-sm">
          从左侧的目录树中选择一篇笔记，内容将在这里显示
        </p>
      </div>
    </div>
  )
}
EMPTYSTATE
```

- [ ] **Step 4: Write NoteNotFound component**

```bash
cat > src/components/NoteNotFound.tsx << 'NOTFOUND'
interface NoteNotFoundProps {
  path: string
}

export default function NoteNotFound({ path }: NoteNotFoundProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center max-w-md">
        <div className="text-gray-300 text-6xl mb-6">🔍</div>
        <h2 className="text-xl font-semibold text-gray-600 mb-2">笔记不存在</h2>
        <p className="text-gray-400 text-sm mb-4">
          笔记「{path}」在当前仓库中未找到
        </p>
        <p className="text-gray-400 text-xs">
          它可能在仓库的其他位置，或尚未创建
        </p>
      </div>
    </div>
  )
}
NOTFOUND
```

- [ ] **Step 5: Write Layout component**

```bash
cat > src/components/Layout.tsx << 'LAYOUT'
import { type ReactNode } from 'react'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  )
}
LAYOUT
```

- [ ] **Step 6: Write Sidebar component (with SearchBar + FileTree stubs)**

```bash
cat > src/components/Sidebar.tsx << 'SIDEBAR'
import { useEffect } from 'react'
import { useStore } from '../stores/useStore'
import { useTree } from '../hooks/useTree'
import { useSearch } from '../hooks/useSearch'
import SearchBar from './SearchBar'
import FileTree from './FileTree'
import Loading from './Loading'
import ErrorDisplay from './ErrorDisplay'

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useStore()
  const { tree, loading, error, refreshTree } = useTree()
  const { filteredTree } = useSearch()

  useEffect(() => {
    // Close sidebar on small screens after navigation
    const handleResize = () => {
      if (window.innerWidth < 768) {
        useStore.getState().setSidebarCollapsed(true)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (sidebarCollapsed) {
    return (
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 border"
        aria-label="打开侧边栏"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-30 md:hidden"
        onClick={toggleSidebar}
      />

      <aside className="w-72 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col h-full z-40 md:relative fixed">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-800">Obsidian Wiz</h1>
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="关闭侧边栏"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-200">
          <SearchBar />
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto">
          {loading && <Loading message="加载目录树..." />}
          {error && <ErrorDisplay message={error} onRetry={refreshTree} />}
          {tree && <FileTree nodes={filteredTree || tree} />}
        </div>
      </aside>
    </>
  )
}
SIDEBAR
```

- [ ] **Step 7: Write ContentArea component**

```bash
cat > src/components/ContentArea.tsx << 'CONTENTAREA'
import { useParams } from 'react-router-dom'
import { useStore } from '../stores/useStore'
import { useNote } from '../hooks/useNote'
import { useEffect } from 'react'
import NoteContent from './NoteContent'
import Loading from './Loading'
import ErrorDisplay from './ErrorDisplay'
import EmptyState from './EmptyState'
import NoteNotFound from './NoteNotFound'

export default function ContentArea() {
  const { '*': path } = useParams()
  const resolvedPath = path || null

  // Build the full path (with .md extension if not present)
  const notePath = resolvedPath
    ? resolvedPath.endsWith('.md')
      ? resolvedPath
      : `${resolvedPath}.md`
    : null

  const { content, loading, error } = useNote(notePath)
  const setCurrentPath = useStore((s) => s.setCurrentPath)

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

  // Success — render note
  return (
    <article className="max-w-4xl mx-auto p-6 md:p-10">
      <NoteContent content={content || ''} />
    </article>
  )
}
CONTENTAREA
```

---

### Task 6: FileTree + SearchBar Components

**Files:**
- Create: `src/components/FileTree.tsx`
- Create: `src/components/TreeFolder.tsx`
- Create: `src/components/TreeFile.tsx`
- Create: `src/components/SearchBar.tsx`

- [ ] **Step 1: Write TreeFile component**

```bash
cat > src/components/TreeFile.tsx << 'TREEFILE'
import { useNavigate, useParams } from 'react-router-dom'
import type { TreeNode } from '../lib/github'

interface TreeFileProps {
  node: TreeNode
}

export default function TreeFile({ node }: TreeFileProps) {
  const navigate = useNavigate()
  const { '*': currentPath } = useParams()

  const linkPath = node.path.replace(/\.md$/i, '')
  const isActive = currentPath === linkPath

  const handleClick = () => {
    navigate(`/${linkPath}`)
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700 font-medium'
          : 'text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span className="mr-2">
        {node.name.endsWith('.md') ? '📄' : '📎'}
      </span>
      {node.name.replace(/\.md$/i, '')}
    </button>
  )
}
TREEFILE
```

- [ ] **Step 2: Write TreeFolder component**

```bash
cat > src/components/TreeFolder.tsx << 'TREEFOLDER'
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
TREEFOLDER
```

- [ ] **Step 3: Write FileTree component**

```bash
cat > src/components/FileTree.tsx << 'FILETREE'
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
FILETREE
```

- [ ] **Step 4: Write SearchBar component**

```bash
cat > src/components/SearchBar.tsx << 'SEARCHBAR'
import { useStore } from '../stores/useStore'
import { useSearch } from '../hooks/useSearch'

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useSearch()

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="搜索笔记..."
        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  )
}
SEARCHBAR
```

---

### Task 7: NoteContent + App Integration

**Files:**
- Create: `src/components/NoteContent.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write NoteContent component**

```bash
cat > src/components/NoteContent.tsx << 'NOTECONTENT'
import { useMemo } from 'react'
import { renderMarkdown } from '../markdown/pipeline'

interface NoteContentProps {
  content: string
}

export default function NoteContent({ content }: NoteContentProps) {
  const rendered = useMemo(() => renderMarkdown(content), [content])

  if (!rendered) {
    return (
      <div className="text-red-500 text-sm">
        笔记渲染失败，内容可能包含不支持的语法
      </div>
    )
  }

  return (
    <div className="prose prose-gray max-w-none">
      {rendered}
    </div>
  )
}
NOTECONTENT
```

- [ ] **Step 2: Update App.tsx to handle note navigation properly**

```bash
cat > src/App.tsx << 'APPFINAL'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ContentArea from './components/ContentArea'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ContentArea />} />
        <Route path="/:path*" element={<ContentArea />} />
      </Routes>
    </Layout>
  )
}
APPFINAL
```

- [ ] **Step 3: Verify everything compiles**

```bash
npx tsc --noEmit
npm run build
```

Expected: No errors, build completes successfully.

---

### Task 8: Deployment Pipeline

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write deploy.yml**

```bash
mkdir -p .github/workflows

cat > .github/workflows/deploy.yml << 'DEPLOY'
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - run: npm run build

      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          cname: # optional: if you have a custom domain
DEPLOY
```

- [ ] **Step 2: Final verification**

```bash
npx vitest run
npm run build
```

Expected: All tests pass, build succeeds.
