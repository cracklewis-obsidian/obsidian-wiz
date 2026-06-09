import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

import { useOutline, buildHeadingTree } from '../useOutline'

describe('buildHeadingTree', () => {
  it('builds nested tree from flat heading list', () => {
    const headings = [
      { id: 'h1-1', text: 'Overview', level: 1 },
      { id: 'h2-1', text: 'Details', level: 2 },
      { id: 'h3-1', text: 'Sub Detail', level: 3 },
      { id: 'h2-2', text: 'Another Section', level: 2 },
    ]
    const tree = buildHeadingTree(headings)
    expect(tree).toHaveLength(1)
    expect(tree[0].id).toBe('h1-1')
    expect(tree[0].children).toHaveLength(2)
    expect(tree[0].children[0].id).toBe('h2-1')
    expect(tree[0].children[0].children).toHaveLength(1)
    expect(tree[0].children[0].children[0].id).toBe('h3-1')
    expect(tree[0].children[1].id).toBe('h2-2')
  })

  it('handles multiple top-level headings', () => {
    const headings = [
      { id: 'h1', text: 'Section 1', level: 1 },
      { id: 'h2', text: 'Section 2', level: 1 },
      { id: 'h3', text: 'Section 3', level: 1 },
    ]
    const tree = buildHeadingTree(headings)
    expect(tree).toHaveLength(3)
  })

  it('handles empty input', () => {
    expect(buildHeadingTree([])).toEqual([])
  })

  it('handles level jumps (h1 -> h3 without h2)', () => {
    const headings = [
      { id: 'h1', text: 'Top', level: 1 },
      { id: 'h3', text: 'Deep Jump', level: 3 },
      { id: 'h2', text: 'Mid', level: 2 },
    ]
    const tree = buildHeadingTree(headings)
    expect(tree).toHaveLength(1)
    // h3 becomes child of h1 since stack empties to h1
    expect(tree[0].children).toHaveLength(2)
    // h3 is first child, h2 is second child (both under h1)
    expect(tree[0].children[0].id).toBe('h3')
    expect(tree[0].children[1].id).toBe('h2')
  })
})

describe('useOutline', () => {
  function createContentRef(html: string) {
    const div = document.createElement('div')
    div.className = 'note-content'
    div.innerHTML = html
    document.body.appendChild(div)
    return { current: div }
  }

  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('returns empty headings for content with no headings', () => {
    const ref = createContentRef('<p>No headings here</p>')
    const { result } = renderHook(() => useOutline(ref))
    expect(result.current.headings).toEqual([])
    expect(result.current.activeId).toBeNull()
  })

  it('extracts headings from rendered DOM', () => {
    const ref = createContentRef(`
      <h1 id="intro">Introduction</h1>
      <p>Some text</p>
      <h2 id="details">Details</h2>
      <p>More text</p>
      <h2 id="summary">Summary</h2>
    `)
    const { result } = renderHook(() => useOutline(ref))
    expect(result.current.headings).toHaveLength(1) // one H1
    expect(result.current.headings[0].children).toHaveLength(2) // two H2 children
    expect(result.current.headings[0].children[0].text).toBe('Details')
  })

  it('handles headings without id attribute', () => {
    const ref = createContentRef(`
      <h1>No ID Here</h1>
      <h2>Another No ID</h2>
    `)
    const { result } = renderHook(() => useOutline(ref))
    expect(result.current.headings).toHaveLength(1)
    // Should generate fallback IDs
    expect(result.current.headings[0].id).toBe('heading-0')
  })

  it('filters out empty heading text', () => {
    const ref = createContentRef(`
      <h1 id="a">Valid</h1>
      <h2 id="b"> </h2>
      <h3 id="c"></h3>
    `)
    const { result } = renderHook(() => useOutline(ref))
    expect(result.current.headings).toHaveLength(1)
    expect(result.current.headings[0].children).toHaveLength(0)
  })

  it('re-extracts headings when enabled transitions from false to true', () => {
    const div = document.createElement('div')
    div.className = 'note-content'
    div.innerHTML = '<h1 id="initial">Initial</h1>'
    document.body.appendChild(div)
    const ref = { current: div }

    // Start with enabled=false
    const { result, rerender } = renderHook(
      (opts?: { enabled?: boolean }) => useOutline(ref, opts),
      { initialProps: { enabled: false } }
    )
    expect(result.current.headings).toHaveLength(0)

    // Now enable (simulating content loaded)
    rerender({ enabled: true })
    expect(result.current.headings).toHaveLength(1)
    expect(result.current.headings[0].text).toBe('Initial')
  })
})
