# Wiki 链接路径解析修复 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `[[笔记名]]` Wiki links to resolve to the full path within the repo tree instead of always pointing to the root.

**Architecture:** Build a name-to-path index from the cached directory tree, inject it into the remark-wiki-link plugin through the markdown pipeline, so `[[AI名词词典]]` generates `#/AI/AI名词词典` instead of `#/AI名词词典`.

**Tech Stack:** TypeScript, Zustand, unified/remark/rehype, Vitest

**Plan file location:** `docs/superpowers/plans/2026-06-09-wiki-link-path-resolution-plan.md`

---

### Task 1: Add `buildNameIndex` helper to github.ts

**Files:**
- Modify: `src/lib/github.ts` (add `buildNameIndex` export)
- Test: `src/lib/__tests__/github.test.ts` (add test cases)

- [ ] **Step 1: Write the failing test for buildNameIndex**

Add to `src/lib/__tests__/github.test.ts`:

```typescript
import { buildNestedTree, buildNameIndex } from '../github'

// ... existing tests ...

describe('buildNameIndex', () => {
  const flatItems = [
    { path: 'README.md', mode: '100644', type: 'blob' as const, sha: 'a', url: '' },
    { path: '项目A', mode: '040000', type: 'tree' as const, sha: 'b', url: '' },
    { path: '项目A/需求.md', mode: '100644', type: 'blob' as const, sha: 'c', url: '' },
    { path: '项目A/方案.md', mode: '100644', type: 'blob' as const, sha: 'd', url: '' },
    { path: '项目A/子目录', mode: '040000', type: 'tree' as const, sha: 'e', url: '' },
    { path: '项目A/子目录/细节.md', mode: '100644', type: 'blob' as const, sha: 'f', url: '' },
    { path: 'AI', mode: '040000', type: 'tree' as const, sha: 'g', url: '' },
    { path: 'AI/AI名词词典.md', mode: '100644', type: 'blob' as const, sha: 'h', url: '' },
    { path: '附件/diagram.png', mode: '100644', type: 'blob' as const, sha: 'i', url: '' },
  ]

  it('builds a name-to-path map from the tree', () => {
    const tree = buildNestedTree(flatItems)
    const index = buildNameIndex(tree)

    expect(index.get('readme')).toBe('README')
    expect(index.get('需求')).toBe('项目A/需求')
    expect(index.get('方案')).toBe('项目A/方案')
    expect(index.get('细节')).toBe('项目A/子目录/细节')
    expect(index.get('ai名词词典')).toBe('AI/AI名词词典')
  })

  it('excludes non-md files from the index', () => {
    const tree = buildNestedTree(flatItems)
    const index = buildNameIndex(tree)

    expect(index.has('diagram')).toBe(false)
    expect(index.has('附件')).toBe(false)
  })

  it('handles duplicate names by keeping the first', () => {
    const items = [
      ...flatItems,
      { path: '重复笔记.md', mode: '100644', type: 'blob' as const, sha: 'x', url: '' },
      { path: '项目A/重复笔记.md', mode: '100644', type: 'blob' as const, sha: 'y', url: '' },
    ]
    const tree = buildNestedTree(items)
    const index = buildNameIndex(tree)

    // 重复笔记.md appears first at root level
    expect(index.get('重复笔记')).toBe('重复笔记')
  })

  it('returns empty map for empty tree', () => {
    const index = buildNameIndex([])
    expect(index.size).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/github.test.ts`
Expected: FAIL — `buildNameIndex` not defined (import error)

- [ ] **Step 3: Implement buildNameIndex**

Add at the end of `src/lib/github.ts` (before the last line, after `clearTreeCache`):

```typescript
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/github.test.ts`
Expected: PASS (all 7 tests — 3 existing + 4 new)

- [ ] **Step 5: Run full TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/github.ts src/lib/__tests__/github.test.ts
git commit -m "feat: add buildNameIndex helper for wiki link resolution"
```

---

### Task 2: Modify remark-wiki-link to accept nameIndex

**Files:**
- Modify: `src/markdown/remark-wiki-link.ts`
- Test: `src/markdown/__tests__/remark-wiki-link.test.ts`

- [ ] **Step 1: Write failing test for nameIndex resolution**

Add to `src/markdown/__tests__/remark-wiki-link.test.ts`:

```typescript
describe('remarkWikiLink with nameIndex', () => {
  const nameIndex = new Map<string, string>([
    ['ai名词词典', 'AI/AI名词词典'],
    ['需求', '项目A/需求'],
    ['重复笔记', '项目A/重复笔记'],
  ])

  function processWithIndex(text: string) {
    const result = unified()
      .use(remarkParse)
      .use(remarkWikiLink, nameIndex)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(text)
    return String(result)
  }

  it('resolves [[笔记名]] using nameIndex', () => {
    const result = processWithIndex('参考 [[AI名词词典]]')
    expect(result).toContain(encodeURI('#/AI/AI名词词典'))
  })

  it('falls back to direct path when name is not in index', () => {
    const result = processWithIndex('参考 [[不存在的笔记]]')
    expect(result).toContain(encodeURI('#/不存在的笔记'))
  })

  it('resolves [[目标|显示名]] with nameIndex', () => {
    const result = processWithIndex('参考 [[AI名词词典|AI词典]]')
    expect(result).toContain(encodeURI('#/AI/AI名词词典'))
    expect(result).toContain('>AI词典<')
  })

  it('does not affect image wiki links', () => {
    const result = processWithIndex('图示 [[附件/diagram.png]]')
    expect(result).toContain('<img')
    expect(result).not.toContain(encodeURI('#/'))
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/markdown/__tests__/remark-wiki-link.test.ts`
Expected: FAIL — `remarkWikiLink` no longer accepts 0 arguments (the new 4 tests fail)

- [ ] **Step 3: Modify remarkWikiLink to accept nameIndex**

Replace the function signature and update the link generation logic in `src/markdown/remark-wiki-link.ts`:

```typescript
export function remarkWikiLink(nameIndex?: Map<string, string>) {
  return (tree: Root) => {
    visit(tree, 'paragraph', (
      node: Paragraph,
      index: number | undefined,
      parent: any
    ) => {
      if (index === undefined || !parent) return
      if (!node.children || node.children.length === 0) return

      const newChildren: any[] = []
      let modified = false

      for (const child of node.children) {
        if (child.type === 'text') {
          const text = (child as Text).value
          const parts = splitWikiLinks(text)

          for (const part of parts) {
            if (part.type === 'link') {
              modified = true
              const target = part.target || ''
              const displayText = part.displayText

              if (isImageLink(target)) {
                // Bare image filename (no directory) → assume it's in 附件/
                const imageUrl = target.startsWith(ATTACHMENT_PREFIX) || target.includes('/')
                  ? target
                  : `${ATTACHMENT_PREFIX}${target}`
                newChildren.push({
                  type: 'image',
                  url: imageUrl,
                  alt: displayText || target.split('/').pop() || target,
                } as Image)
              } else {
                // Resolve using nameIndex if available
                const resolvedPath = resolveWikiLink(target, nameIndex)
                newChildren.push({
                  type: 'link',
                  url: `#/${resolvedPath}`,
                  children: [{ type: 'text', value: displayText || resolvedPath.split('/').pop() || resolvedPath }],
                })
              }
            } else {
              if (part.text !== undefined) {
                newChildren.push({ type: 'text', value: part.text })
              }
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

function resolveWikiLink(target: string, nameIndex?: Map<string, string>): string {
  if (!nameIndex) return target.replace(/\.md$/i, '')

  const lookup = target.toLowerCase().replace(/\.md$/i, '')
  const resolved = nameIndex.get(lookup)
  if (resolved) return resolved

  // Fall back to direct path
  return target.replace(/\.md$/i, '')
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/markdown/__tests__/remark-wiki-link.test.ts`
Expected: PASS (13 tests — 9 existing + 4 new)

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/markdown/remark-wiki-link.ts src/markdown/__tests__/remark-wiki-link.test.ts
git commit -m "feat: pass nameIndex to remark-wiki-link for path resolution"
```

---

### Task 3: Update pipeline.ts to pass nameIndex through

**Files:**
- Modify: `src/markdown/pipeline.ts`

- [ ] **Step 1: Modify pipeline to accept and pass nameIndex**

Replace the file content of `src/markdown/pipeline.ts`:

```typescript
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import rehypeReact from 'rehype-react'
import { Fragment, type ReactElement } from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import { remarkWikiLink } from './remark-wiki-link'
import { remarkCallout } from './remark-callout'
import { rehypeR2Image } from './rehype-r2-image'

export function renderMarkdown(
  content: string,
  nameIndex?: Map<string, string>
): ReactElement | null {
  try {
    const result = unified()
      .use(remarkParse)
      .use(remarkMath)
      .use(remarkGfm)
      .use(remarkWikiLink, nameIndex)
      .use(remarkCallout)
      .use(remarkRehype)
      .use(rehypeHighlight)
      .use(rehypeR2Image)
      .use(rehypeKatex)
      .use(rehypeReact, {
        Fragment,
        jsx: jsxRuntime.jsx,
        jsxs: jsxRuntime.jsxs,
      })
      .processSync(content)

    return result.result as ReactElement
  } catch (err) {
    console.error('Markdown rendering failed:', err)
    return null
  }
}
```

> **Note:** The `processor` singleton is removed. Each render call creates a fresh processor because `nameIndex` can change between renders. Unified processor creation is lightweight — this is not a performance concern for note rendering which happens on user interaction.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Run tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/markdown/pipeline.ts
git commit -m "refactor: remove processor singleton, pass nameIndex through pipeline"
```

---

### Task 4: Update NoteContent to build and pass nameIndex

**Files:**
- Modify: `src/components/NoteContent.tsx`

- [ ] **Step 1: Modify NoteContent to use nameIndex from store**

Replace `src/components/NoteContent.tsx`:

```typescript
import { useMemo } from 'react'
import { useStore } from '../stores/useStore'
import { renderMarkdown } from '../markdown/pipeline'
import { buildNameIndex } from '../lib/github'

interface NoteContentProps {
  content: string
}

export default function NoteContent({ content }: NoteContentProps) {
  const tree = useStore((s) => s.tree)

  const nameIndex = useMemo(() => {
    return tree ? buildNameIndex(tree) : new Map<string, string>()
  }, [tree])

  const rendered = useMemo(
    () => renderMarkdown(content, nameIndex),
    [content, nameIndex]
  )

  if (!rendered) {
    return (
      <div className="text-red-500 text-sm">
        笔记渲染失败，内容可能包含不支持的语法
      </div>
    )
  }

  return (
    <div className="note-content max-w-none">
      {rendered}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Run tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 4: Verify full build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/components/NoteContent.tsx
git commit -m "feat: build nameIndex from tree and pass to markdown renderer"
```

---

### Task 5: Verify end-to-end

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (18+ tests depending on count)

- [ ] **Step 2: Run full type check and build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Test in dev server (manual)**

Run: `npm run dev`
Expected: Dev server starts. Navigate to a note with `[[AI名词词典]]` wiki links, verify the generated link is `#/AI/AI名词词典` in the rendered HTML.
