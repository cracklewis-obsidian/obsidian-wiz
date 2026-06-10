import { describe, it, expect } from 'vitest'
import { buildNameIndex } from '../github'
import type { TreeNode } from '../github'

describe('buildNameIndex', () => {
  const tree: TreeNode[] = [
    { name: 'README.md', path: 'README.md', type: 'blob' },
    {
      name: '项目A', path: '项目A', type: 'tree',
      children: [
        { name: '需求.md', path: '项目A/需求.md', type: 'blob' },
        { name: '方案.md', path: '项目A/方案.md', type: 'blob' },
        {
          name: '子目录', path: '项目A/子目录', type: 'tree',
          children: [
            { name: '细节.md', path: '项目A/子目录/细节.md', type: 'blob' },
          ],
        },
      ],
    },
    {
      name: 'AI', path: 'AI', type: 'tree',
      children: [
        { name: 'AI名词词典.md', path: 'AI/AI名词词典.md', type: 'blob' },
      ],
    },
    {
      name: '附件', path: '附件', type: 'tree',
      children: [
        { name: 'diagram.png', path: '附件/diagram.png', type: 'blob' },
      ],
    },
  ]

  it('builds a name-to-path map from the tree', () => {
    const index = buildNameIndex(tree)

    expect(index.get('readme')).toBe('README')
    expect(index.get('需求')).toBe('项目A/需求')
    expect(index.get('方案')).toBe('项目A/方案')
    expect(index.get('细节')).toBe('项目A/子目录/细节')
    expect(index.get('ai名词词典')).toBe('AI/AI名词词典')
  })

  it('excludes non-md files from the index', () => {
    const index = buildNameIndex(tree)

    expect(index.has('diagram')).toBe(false)
    expect(index.has('附件')).toBe(false)
  })

  it('handles duplicate names by keeping the first encountered in DFS walk', () => {
    const dupTree: TreeNode[] = [
      {
        name: '项目A', path: '项目A', type: 'tree',
        children: [
          { name: '重复笔记.md', path: '项目A/重复笔记.md', type: 'blob' },
        ],
      },
      { name: '重复笔记.md', path: '重复笔记.md', type: 'blob' },
    ]
    const index = buildNameIndex(dupTree)

    // DFS traversal visits 项目A's children before root-level 重复笔记.md
    expect(index.get('重复笔记')).toBe('项目A/重复笔记')
  })

  it('returns empty map for empty tree', () => {
    const index = buildNameIndex([])
    expect(index.size).toBe(0)
  })
})
