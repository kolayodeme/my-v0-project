"use client"

import React from "react"

import { useState } from "react"

// Ultra-fast performance optimization for 2025
import { useCallback, useEffect, useMemo, useRef } from "react"

// Advanced caching with compression
class UltraCache {
  private static instance: UltraCache
  private cache = new Map<string, { data: any; timestamp: number; ttl: number; compressed?: boolean }>()
  private maxSize = 200 // Maksimum önbellek giriş sayısını artırdık (100 -> 200)
  private pendingRequests = new Map<string, Promise<any>>() // Eş zamanlı aynı istekleri birleştirmek için

  static getInstance() {
    if (!this.instance) {
      this.instance = new UltraCache()
    }
    return this.instance
  }

  compress(data: any): string {
    try {
      return btoa(JSON.stringify(data))
    } catch {
      return JSON.stringify(data)
    }
  }

  decompress(data: string): any {
    try {
      return JSON.parse(atob(data))
    } catch {
      return JSON.parse(data)
    }
  }

  set(key: string, data: any, ttl = 30000) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey)
      }
    }

    const compressed = this.compress(data)
    this.cache.set(key, {
      data: compressed,
      timestamp: Date.now(),
      ttl,
      compressed: true,
    })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.compressed ? this.decompress(item.data) : item.data
  }

  // Aynı anda gelen istekleri birleştirmek için
  async getAsync(key: string, fetchFn: () => Promise<any>, ttl = 30000) {
    // Önbellekte var mı kontrol et
    const cachedData = this.get(key)
    if (cachedData) return cachedData
    
    // Zaten devam eden bir istek var mı kontrol et
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)
    }
    
    // Yeni istek oluştur
    const promise = fetchFn().then(data => {
      this.set(key, data, ttl)
      this.pendingRequests.delete(key)
      return data
    }).catch(error => {
      this.pendingRequests.delete(key)
      throw error
    })
    
    // İsteği bekleyenler listesine ekle
    this.pendingRequests.set(key, promise)
    return promise
  }

  clear() {
    this.cache.clear()
    this.pendingRequests.clear()
  }
}

// Turbo-charged data fetching
export const ultraCache = UltraCache.getInstance()

// Performance monitoring
export function usePerformanceMonitor() {
  const renderCount = useRef(0)
  const startTime = useRef(Date.now())

  useEffect(() => {
    renderCount.current++
    const renderTime = Date.now() - startTime.current

    if (renderTime > 16) {
      // More than 16ms = less than 60fps
      console.warn(`Slow render detected: ${renderTime}ms (${renderCount.current} renders)`)
    }

    startTime.current = Date.now()
  })

  return { renderCount: renderCount.current }
}

// Ultra-fast debounce for search
export function useUltraDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  return debouncedValue
}

// Yeni: Olay işleyicilerini optimize et
export function useOptimizedEventHandler<T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList = []): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps) as T
}

// Yeni: Düğme tıklamalarını geciktirmeden hızlandır
export function useFastClick<T extends HTMLElement = HTMLButtonElement>(
  onClick: (e: React.MouseEvent<T>) => void
): React.MouseEventHandler<T> {
  return useCallback((e: React.MouseEvent<T>) => {
    // İşlevi hemen çağır
    onClick(e)
    
    // CSS animasyonunu anında görünür yap
    const target = e.currentTarget;
    target.style.transform = "scale(0.97)";
    
    // Hızlı geri dönüş
    setTimeout(() => {
      target.style.transform = "scale(1)";
    }, 50);
  }, [onClick]);
}

// Memory-efficient virtual scrolling - hızlandırılmış
export function useVirtualList<T>(items: T[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0)
  
  // Optimizasyon: Hesaplamaları memoize et
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    // Ekstra 5 öğe ekleyerek daha akıcı kaydırma
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 5
    const endIndex = Math.min(startIndex + visibleCount, items.length)
    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex).map((item, index) => ({
      item,
      index: visibleRange.startIndex + index,
    }))
  }, [items, visibleRange.startIndex, visibleRange.endIndex])

  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.startIndex * itemHeight

  // Kaydırma işleyicisini optimize et
  const onScroll = useOptimizedEventHandler((e: React.UIEvent<HTMLDivElement>) => {
    // requestAnimationFrame kullanarak tarayıcı çizim döngüsüyle senkronize et
    requestAnimationFrame(() => {
      setScrollTop(e.currentTarget.scrollTop)
    })
  }, [])

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll,
  }
}

// Yeni: DOM güncellemelerini optimize et
export function useDeferredUpdate<T>(value: T, delay = 0): T {
  const [deferredValue, setDeferredValue] = useState<T>(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDeferredValue(value);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return deferredValue;
}

// Preload critical resources - geliştirilmiş
export function preloadResources() {
  if (typeof window !== "undefined") {
    // Preload critical images
    const criticalImages = [
      "/placeholder.svg?height=24&width=24", 
      "/placeholder.svg?height=64&width=64",
      "/placeholder-logo.svg"
    ]

    criticalImages.forEach((src) => {
      const img = new Image()
      img.src = src
    })

    // Preload critical API endpoints
    const criticalEndpoints = ["/api/live-matches", "/api/upcoming-matches", "/api/leagues"]

    criticalEndpoints.forEach((endpoint) => {
      fetch(endpoint, { method: "HEAD", priority: "high" }).catch(() => {
        // Ignore errors, this is just preloading
      })
    })
    
    // Yeni: CSS Animasyonları İçin GPU Hızlandırma
    document.documentElement.style.setProperty('--fast-transition', '100ms');
    
    // Yeni: İnteraktif elementler için hızlı CSS sınıfı
    const style = document.createElement('style');
    style.textContent = `
      .fast-button {
        will-change: transform;
        transition: transform 100ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }
      .fast-button:active {
        transform: scale(0.97);
      }
    `;
    document.head.appendChild(style);
  }
}

// Component performance wrapper - geliştirilmiş
export function withUltraPerformance<P extends object>(Component: React.ComponentType<P>): React.ComponentType<P> {
  const OptimizedComponent = React.memo(Component, (prevProps, nextProps) => {
    // Ultra-fast shallow comparison
    const prevKeys = Object.keys(prevProps)
    const nextKeys = Object.keys(nextProps)

    if (prevKeys.length !== nextKeys.length) return false

    for (const key of prevKeys) {
      if (prevProps[key as keyof P] !== nextProps[key as keyof P]) {
        return false
      }
    }

    return true
  })
  
  // Yeni: Trace bileşen oluşturma performansını
  const TracedComponent = function(props: P) {
    const componentName = Component.displayName || Component.name || 'Component';
    
    useEffect(() => {
      performance.mark(`${componentName}:start`);
      
      return () => {
        performance.mark(`${componentName}:end`);
        performance.measure(
          `${componentName} render time`,
          `${componentName}:start`,
          `${componentName}:end`
        );
      };
    }, []);
    
    return React.createElement(OptimizedComponent, props);
  };
  
  return TracedComponent;
}

// Initialize performance optimizations - geliştirilmiş
export function initializePerformanceOptimizations() {
  if (typeof window !== "undefined") {
    // Enable hardware acceleration
    document.documentElement.style.transform = "translateZ(0)"

    // Optimize scrolling
    document.documentElement.style.scrollBehavior = "smooth"
    
    // Yeni: Touch hareketleri optimizasyonu
    document.documentElement.style.touchAction = "manipulation"
    
    // Yeni: Animasyon optimizasyonu
    document.documentElement.style.backfaceVisibility = "hidden"
    
    // Yeni: Yavaşlayan düğmeleri hızlandır
    document.querySelectorAll('button, a').forEach(el => {
      el.classList.add('fast-button');
    });

    // Preload resources
    preloadResources()

    // Clear cache periodically - daha akıllı
    let lastClearTime = Date.now();
    setInterval(
      () => {
        // Sadece kullanıcı aktif değilse temizle
        if (document.hidden && Date.now() - lastClearTime > 10 * 60 * 1000) {
          ultraCache.clear();
          lastClearTime = Date.now();
        }
      },
      60 * 1000, // Her dakika kontrol et
    )
    
    // Yeni: İnaktif sekmelerde animasyonları duraklat
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        document.body.classList.add('performance-mode');
      } else {
        document.body.classList.remove('performance-mode');
      }
    });
    
    // Yeni: Sayfa geçişlerini hızlandır
    document.querySelectorAll('a').forEach(link => {
      if (link.hostname === window.location.hostname) {
        link.addEventListener('mouseenter', () => {
          const href = link.getAttribute('href');
          if (href && href.startsWith('/')) {
            const prefetchLink = document.createElement('link');
            prefetchLink.rel = 'prefetch';
            prefetchLink.href = href;
            document.head.appendChild(prefetchLink);
          }
        });
      }
    });
  }
}
