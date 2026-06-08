import { describe, it, expect, beforeEach } from 'vitest'
import { getFromCache, setToCache, removeFromCache } from '../cache'

describe('cache', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores and retrieves a value within TTL', () => {
    setToCache('test-key', { foo: 'bar' }, 60_000)
    expect(getFromCache('test-key')).toEqual({ foo: 'bar' })
  })

  it('returns null for expired entries', () => {
    setToCache('expired-key', 'value', -1)
    expect(getFromCache('expired-key')).toBeNull()
  })

  it('returns null for missing keys', () => {
    expect(getFromCache('nonexistent')).toBeNull()
  })

  it('removes an entry from cache', () => {
    setToCache('temp', 'data', 60_000)
    removeFromCache('temp')
    expect(getFromCache('temp')).toBeNull()
  })

  it('handles corrupted JSON gracefully', () => {
    localStorage.setItem('bad-key', 'not-json')
    expect(getFromCache('bad-key')).toBeNull()
  })
})
