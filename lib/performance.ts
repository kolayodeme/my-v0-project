"use client"

import { useMemo } from "react"

import { useCallback } from "react"

import { useEffect } from "react"

import React from "react"

import { useState } from "react"

// Performance optimization utilities for 60fps smooth operation

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Virtual scrolling for large lists
export function useVirtualScroll(items: any[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(visibleStart + Math.ceil(containerHeight / itemHeight) + 1, items.length)

  const visibleItems = items.slice(visibleStart, visibleEnd)

  return {
    visibleItems,
    visibleStart,
    totalHeight: items.length * itemHeight,
    offsetY: visibleStart * itemHeight,
    onScroll: throttle((e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop)
    }, 16), // 60fps
  }
}

// Memory management for components
export function useMemoryOptimization() {
  useEffect(() => {
    // Clear unused caches periodically
    const interval = setInterval(
      () => {
        if ("caches" in window) {
          caches.keys().then((names) => {
            names.forEach((name) => {
              if (name.includes("old-") || name.includes("temp-")) {
                caches.delete(name)
              }
            })
          })
        }
      },
      5 * 60 * 1000,
    ) // Every 5 minutes

    return () => clearInterval(interval)
  }, [])
}

// Preload critical resources
export function preloadCriticalResources() {
  if (typeof window !== "undefined") {
    // Preload critical API endpoints
    const criticalEndpoints = ["/api/live-matches", "/api/upcoming-matches", "/api/leagues"]

    criticalEndpoints.forEach((endpoint) => {
      const link = document.createElement("link")
      link.rel = "prefetch"
      link.href = endpoint
      document.head.appendChild(link)
    })
  }
}

// Optimize images for better performance
export function optimizeImage(src: string, width?: number, height?: number): string {
  if (!src || src.includes("placeholder.svg")) {
    return `/placeholder.svg?height=${height || 64}&width=${width || 64}`
  }

  // Add image optimization parameters if using a CDN
  if (src.includes("cloudinary") || src.includes("imagekit")) {
    const params = []
    if (width) params.push(`w_${width}`)
    if (height) params.push(`h_${height}`)
    params.push("f_auto", "q_auto")

    return `${src}?${params.join(",")}`
  }

  return src
}

// React performance hooks
export function useMemoizedCallback<T extends (...args: any[]) => any>(callback: T, deps: React.DependencyList): T {
  return useCallback(callback, deps)
}

export function useMemoizedValue<T>(factory: () => T, deps: React.DependencyList): T {
  return useMemo(factory, deps)
}

// Component performance wrapper
export function withPerformance<P extends object>(Component: React.ComponentType<P>): React.ComponentType<P> {
  return React.memo(Component, (prevProps, nextProps) => {
    // Custom comparison logic for better performance
    return JSON.stringify(prevProps) === JSON.stringify(nextProps)
  })
}
