import { describe, it, expect } from 'vitest'
import { buildNestedTree, buildNameIndex } from '../github'

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

    expect(tree).toHaveLength(3)
    expect(tree.map((n) => n.name)).toEqual(['README.md', '项目A', '附件'])

    const projectA = tree.find((n) => n.name === '项目A')
    expect(projectA?.children).toHaveLength(3)
    expect(projectA?.children?.map((n) => n.name)).toEqual(['需求.md', '方案.md', '子目录'])

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

  it('handles duplicate names by keeping the first encountered in DFS walk', () => {
    const items = [
      ...flatItems,
      { path: '项目A/重复笔记.md', mode: '100644', type: 'blob' as const, sha: 'y', url: '' },
      { path: '重复笔记.md', mode: '100644', type: 'blob' as const, sha: 'x', url: '' },
    ]
    const tree = buildNestedTree(items)
    const index = buildNameIndex(tree)

    // DFS traversal visits 项目A's children before root-level 重复笔记.md,
    // so 项目A/重复笔记 is encountered first
    expect(index.get('重复笔记')).toBe('项目A/重复笔记')
  })

  it('returns empty map for empty tree', () => {
    const index = buildNameIndex([])
    expect(index.size).toBe(0)
  })
})
