import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../useStore'

describe('useStore outline state', () => {
  beforeEach(() => {
    // Reset store between tests
    useStore.setState(useStore.getInitialState())
  })

  it('starts with outline collapsed by default', () => {
    const state = useStore.getState()
    expect(state.outlineCollapsed).toBe(false)
  })

  it('toggleOutline flips the collapsed state', () => {
    const { toggleOutline } = useStore.getState()
    toggleOutline()
    expect(useStore.getState().outlineCollapsed).toBe(true)
    toggleOutline()
    expect(useStore.getState().outlineCollapsed).toBe(false)
  })

  it('setOutlineCollapsed sets state and marks auto flag', () => {
    const { setOutlineCollapsed } = useStore.getState()
    setOutlineCollapsed(true, true)
    expect(useStore.getState().outlineCollapsed).toBe(true)
    expect(useStore.getState()._outlineAutoCollapsed).toBe(true)
  })
})
