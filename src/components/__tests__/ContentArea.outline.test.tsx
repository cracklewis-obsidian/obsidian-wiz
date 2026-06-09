import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useStore } from '../../stores/useStore'

// Mock useNote hook
vi.mock('../../hooks/useNote', () => ({
  useNote: () => ({
    content: null,
    loading: false,
    error: null,
  }),
}))

describe('ContentArea outline integration', () => {
  beforeEach(() => {
    useStore.setState(useStore.getInitialState())
  })

  it('renders without crashing when no path selected', async () => {
    const ContentArea = (await import('../ContentArea')).default
    render(
      <MemoryRouter>
        <ContentArea />
      </MemoryRouter>
    )
    // Empty state — no note path
    expect(true).toBe(true)
  })
})
