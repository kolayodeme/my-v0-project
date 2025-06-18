// Add a simple caching mechanism to avoid repeated API calls
type CacheItem<T> = {
  data: T
  timestamp: number
}

class CacheService {
  private cache: Record<string, CacheItem<any>> = {}
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

  get<T>(key: string): T | null {
    const item = this.cache[key]
    if (!item) return null

    const now = Date.now()
    if (now - item.timestamp > this.DEFAULT_TTL) {
      // Cache expired
      delete this.cache[key]
      return null
    }

    return item.data
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
    }

    // Set expiration
    setTimeout(() => {
      delete this.cache[key]
    }, ttl)
  }

  invalidate(key: string): void {
    delete this.cache[key]
  }

  invalidateAll(): void {
    this.cache = {}
  }
}

// Create a singleton instance
export const cacheService = new CacheService()
