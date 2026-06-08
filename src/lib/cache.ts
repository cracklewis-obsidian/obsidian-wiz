interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export function getFromCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null

    const entry: CacheEntry<T> = JSON.parse(raw)
    const now = Date.now()

    if (now - entry.timestamp > entry.ttl) {
      localStorage.removeItem(key)
      return null
    }

    return entry.data
  } catch {
    return null
  }
}

export function setToCache<T>(key: string, data: T, ttl: number): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function removeFromCache(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // silently ignore
  }
}
