import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OutlinePanel from '../OutlinePanel'
import { useStore } from '../../stores/useStore'
import type { HeadingItem } from '../../hooks/useOutline'

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

const mockHeadings: HeadingItem[] = [
  {
    id: 'intro',
    text: 'Introduction',
    level: 1,
    children: [],
  },
]

describe('OutlinePanel', () => {
  beforeEach(() => {
    //@ts-expect-error: reset for testing
    useStore.setState(useStore.getInitialState())
  })

  it('renders null when headings empty and collapsed', () => {
    useStore.getState().setOutlineCollapsed(true)
    const { container } = render(
      <OutlinePanel headings={[]} activeId={null} />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders panel with heading tree when expanded', () => {
    render(
      <OutlinePanel headings={mockHeadings} activeId={null} />
    )
    expect(screen.getByText('大纲')).toBeInTheDocument()
    expect(screen.getByText('Introduction')).toBeInTheDocument()
  })

  it('toggles collapsed state when close button is clicked', () => {
    render(
      <OutlinePanel headings={mockHeadings} activeId={null} />
    )
    const closeBtn = screen.getByLabelText('关闭大纲面板')
    fireEvent.click(closeBtn)
    expect(useStore.getState().outlineCollapsed).toBe(true)
  })

  it('calls onHeadingClick when heading is clicked', () => {
    const onHeadingClick = vi.fn()
    render(
      <OutlinePanel
        headings={mockHeadings}
        activeId={null}
        onHeadingClick={onHeadingClick}
      />
    )
    fireEvent.click(screen.getByText('Introduction'))
    expect(onHeadingClick).toHaveBeenCalledWith('intro')
  })
})
