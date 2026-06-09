import '@testing-library/jest-dom'

// Mock IntersectionObserver for jsdom (used by useOutline hook)
class MockIntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []

  constructor(
    private callback: IntersectionObserverCallback,
    private _options?: IntersectionObserverInit
  ) {}

  observe(_target: Element) {
    // Immediately trigger callback with not-intersecting state
    this.callback(
      [{ isIntersecting: false, boundingClientRect: { top: 0 } as DOMRectReadOnly, target: _target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    )
  }

  unobserve(_target: Element) {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return [] }
}

Object.defineProperty(window, 'IntersectionObserver', {
  value: MockIntersectionObserver,
  writable: true,
  configurable: true,
})
