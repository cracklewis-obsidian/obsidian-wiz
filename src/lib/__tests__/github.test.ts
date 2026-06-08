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
