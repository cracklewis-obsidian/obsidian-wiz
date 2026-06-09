import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import OutlineTree from '../OutlineTree'
import type { HeadingItem } from '../../hooks/useOutline'

const mockHeadings: HeadingItem[] = [
  {
    id: 'overview',
    text: 'Overview',
    level: 1,
    children: [
      {
        id: 'details',
        text: 'Details',
        level: 2,
        children: [],
      },
      {
        id: 'config',
        text: 'Configuration',
        level: 2,
        children: [
          { id: 'advanced', text: 'Advanced Config', level: 3, children: [] },
        ],
      },
    ],
  },
  {
    id: 'summary',
    text: 'Summary',
    level: 1,
    children: [],
  },
]

describe('OutlineTree', () => {
  it('renders all top-level headings', () => {
    render(<OutlineTree items={mockHeadings} activeId={null} />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Summary')).toBeInTheDocument()
  })

  it('highlights the active heading', () => {
    render(<OutlineTree items={mockHeadings} activeId="details" />)
    const details = screen.getByText('Details')
    expect(details.closest('[data-active="true"]')).toBeTruthy()
  })

  it('does not highlight inactive headings', () => {
    render(<OutlineTree items={mockHeadings} activeId="summary" />)
    const overview = screen.getByText('Overview')
    expect(overview.closest('[data-active="true"]')).toBeFalsy()
  })

  it('shows children when expanded, hides when collapsed', () => {
    render(<OutlineTree items={mockHeadings} activeId={null} />)
    // Initially expanded by default
    expect(screen.getByText('Details')).toBeInTheDocument()
    expect(screen.getByText('Configuration')).toBeInTheDocument()

    // Click the expand/collapse toggle button on Overview to collapse
    const collapseBtn = screen.getAllByLabelText('折叠')[0]
    fireEvent.click(collapseBtn)
    expect(screen.queryByText('Details')).not.toBeInTheDocument()
    expect(screen.queryByText('Configuration')).not.toBeInTheDocument()

    // Click again to expand
    const expandBtn = screen.getAllByLabelText('展开')[0]
    fireEvent.click(expandBtn)
    expect(screen.getByText('Details')).toBeInTheDocument()
  })

  it('calls onHeadingClick when a heading is clicked', () => {
    const onHeadingClick = vi.fn()
    render(
      <OutlineTree
        items={mockHeadings}
        activeId={null}
        onHeadingClick={onHeadingClick}
      />
    )
    fireEvent.click(screen.getByText('Summary'))
    expect(onHeadingClick).toHaveBeenCalledWith('summary')
  })
})
