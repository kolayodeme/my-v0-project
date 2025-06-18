"use client"

import { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Home, Activity, Calendar, Trophy, User } from "lucide-react"
import { useTranslation } from "./language-provider"
import { authService } from "@/lib/auth-service"
import { pb } from "@/lib/pocketbase-config"

// Loading fallback component
function NavigationLoading() {
  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-gradient-to-t from-slate-900 to-slate-800 border-t border-green-800/30">
      <div className="grid h-full grid-cols-5">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="inline-flex flex-col items-center justify-center px-1">
            <div className="w-6 h-6 bg-slate-700/50 rounded-full animate-pulse"></div>
            <div className="w-12 h-3 mt-1 bg-slate-700/50 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Main navigation component
function BottomNavigationContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const [liveMatchCount, setLiveMatchCount] = useState(32) // Set to match the UI red badge (32 matches)
  const [upcomingMatchCount, setUpcomingMatchCount] = useState(124) // Set to match the UI (124)
  const [todayMatchCount, setTodayMatchCount] = useState(124) // Today's matches count
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [previewItem, setPreviewItem] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  
  // Get the current badge count from DOM when available (for real-time sync with UI)
  useEffect(() => {
    // Function to read the badge count from the DOM
    const updateBadgeCountsFromDOM = () => {
      try {
        // Try to find the live matches badge in the DOM
        const liveBadgeElement = document.querySelector('[data-badge-id="live-matches-count"]');
        if (liveBadgeElement) {
          const liveBadgeText = liveBadgeElement.textContent?.trim();
          if (liveBadgeText) {
            const count = parseInt(liveBadgeText.replace(/\D/g, ''), 10);
            if (!isNaN(count)) {
              setLiveMatchCount(count);
            }
          }
        }
        
        // Try to find the upcoming matches badge in the DOM
        const upcomingBadgeElement = document.querySelector('[data-badge-id="upcoming-matches-count"]');
        if (upcomingBadgeElement) {
          const upcomingBadgeText = upcomingBadgeElement.textContent?.trim();
          if (upcomingBadgeText) {
            const count = parseInt(upcomingBadgeText.replace(/\D/g, ''), 10);
            if (!isNaN(count)) {
              setUpcomingMatchCount(count);
            }
          }
        }
      } catch (error) {
        console.error("Error reading badge counts from DOM:", error);
      }
    };
    
    // Update on mount and when the path changes
    updateBadgeCountsFromDOM();
    
    // Set up a mutation observer to watch for changes to the badge elements
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          updateBadgeCountsFromDOM();
        }
      }
    });
    
    // Start observing the document body for badge changes
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      characterData: true 
    });
    
    // Clean up the observer when the component unmounts
    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  // Auth state management
  useEffect(() => {
    const checkAndUpdateAuth = async () => {
      // Get current auth state
      const isValid = pb.authStore.isValid;
      const user = pb.authStore.model;
      
      setIsAuthenticated(isValid);
      setIsAdmin(user?.isAdmin || false);
      
      // If not authenticated, try to restore from storage
      if (!isValid) {
        const authData = await authService.getCurrentUser();
        if (authData) {
          setIsAuthenticated(true);
          setIsAdmin(authData.isAdmin || false);
        }
      }
    };

    // Initial check
    checkAndUpdateAuth();

    // Set up auth state listeners
    const unsubscribe = pb.authStore.onChange(() => {
      checkAndUpdateAuth();
    });

    // Listen for visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAndUpdateAuth();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for focus events
    const handleFocus = () => {
      checkAndUpdateAuth();
    };
    window.addEventListener('focus', handleFocus);

    // Periodic check every 10 seconds
    const interval = setInterval(checkAndUpdateAuth, 10000);

    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Check for active filters from URL
  useEffect(() => {
    if (pathname === '/live') {
      const filter = searchParams.get('filter');
      setActiveFilter(filter);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    // Websocket connection reference
    let wsConnection: WebSocket | null = null;
    
    // Fetch live and upcoming match counts
    const fetchMatchCounts = async () => {
      try {
        // Try to fetch from API if available
        try {
          const liveResponse = await fetch('/api/matches/live/count')
          const upcomingResponse = await fetch('/api/matches/upcoming/count')
          const todayResponse = await fetch('/api/matches/today/count')
          
          if (liveResponse.ok) {
            const liveData = await liveResponse.json()
            if (liveData && liveData.count !== undefined) {
              setLiveMatchCount(liveData.count)
            }
          }
          
          if (upcomingResponse.ok) {
            const upcomingData = await upcomingResponse.json()
            if (upcomingData && upcomingData.count !== undefined) setUpcomingMatchCount(upcomingData.count)
          }
          
          if (todayResponse.ok) {
            const todayData = await todayResponse.json()
            if (todayData && todayData.count !== undefined) setTodayMatchCount(todayData.count)
          }
        } catch (apiError) {
          console.log("API not available, using default values")
        }
      } catch (error) {
        console.error("Error updating match counts:", error)
      }
    }
    
    // Setup WebSocket listener for real-time updates
    const setupWebSocketListener = () => {
      try {
        const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || 'wss://api.example.com/ws')
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.type === 'match_count_update') {
              if (data.liveCount !== undefined) {
                setLiveMatchCount(data.liveCount)
              }
              if (data.upcomingCount !== undefined) setUpcomingMatchCount(data.upcomingCount)
              if (data.todayCount !== undefined) setTodayMatchCount(data.todayCount)
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error)
          }
        }
        
        ws.onclose = () => {
          // Try to reconnect after 5 seconds
          setTimeout(setupWebSocketListener, 5000)
        }
        
        wsConnection = ws
      } catch (error) {
        console.error("WebSocket connection failed:", error)
        // Try to reconnect after 5 seconds
        setTimeout(setupWebSocketListener, 5000)
      }
    }
    
    // Initial data fetch
    fetchMatchCounts()
    
    // Setup WebSocket for real-time updates
    setupWebSocketListener()
    
    // Set up interval to refresh counts as fallback if WebSocket fails
    const interval = setInterval(fetchMatchCounts, 30000) // refresh every 30 seconds
    
    // Cleanup function
    return () => {
      clearInterval(interval)
      if (wsConnection) wsConnection.close()
    }
  }, [])

  const navigationItems = [
    {
      href: "/",
      icon: Home,
      label: t('navHome'),
      isActive: pathname === "/",
      badgeCount: 0,
      preview: "Ana Sayfa",
      description: "Güncel maçlar ve öneriler"
    },
    {
      href: "/live",
      icon: Activity,
      label: t('navLive'),
      isActive: pathname === "/live",
      badgeCount: liveMatchCount,
      badgeLabel: liveMatchCount > 99 ? "+99" : liveMatchCount.toString(),
      preview: "Canlı Maçlar",
      description: `${liveMatchCount} canlı maç var`
    },
    {
      href: "/upcoming",
      icon: Calendar,
      label: t('upcoming'),
      isActive: pathname === "/upcoming",
      badgeCount: upcomingMatchCount,
      badgeLabel: upcomingMatchCount > 99 ? "+99" : upcomingMatchCount.toString(),
      preview: "Yaklaşan Maçlar",
      description: `${todayMatchCount} maç bugün`
    },
    {
      href: "/winners",
      icon: Trophy,
      label: t('navVip'),
      isActive: pathname === "/winners",
      badgeCount: 0,
      preview: "VIP Tahminler",
      description: "Günün öne çıkan tahminleri"
    },
    {
      href: isAuthenticated ? "/profile" : "/login",
      icon: User,
      label: isAuthenticated ? t('navProfile') : t('navLogin'),
      isActive: pathname === "/profile" || pathname.startsWith("/profile/") || (!isAuthenticated && pathname === "/login"),
      badgeCount: isAdmin ? 1 : 0,
      badgeLabel: isAdmin ? "Admin" : "",
      preview: isAuthenticated ? "Profil" : "Giriş Yap",
      description: isAuthenticated ? "Hesap bilgileriniz" : "Giriş yapın veya kaydolun"
    },
  ]

  return (
    <>
      {/* Preview tooltip */}
      {previewItem !== null && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2">
          <div className="mx-auto max-w-md bg-slate-800 rounded-lg shadow-lg border border-green-700/30 p-3 animate-fade-in">
            <div className="font-medium text-green-400">{navigationItems[parseInt(previewItem)].preview}</div>
            <div className="text-sm text-slate-300">{navigationItems[parseInt(previewItem)].description}</div>
          </div>
        </div>
      )}
      
      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-gradient-to-t from-slate-900 to-slate-800 border-t border-green-800/30">
        <div className="grid h-full grid-cols-5">
          {navigationItems.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex flex-col items-center justify-center px-1 group ${
                item.isActive
                  ? "text-green-400 border-t-2 border-green-500"
                  : "text-slate-400 hover:text-green-400"
              }`}
              onMouseEnter={() => setPreviewItem(index.toString())}
              onMouseLeave={() => setPreviewItem(null)}
              onTouchStart={() => {
                setPreviewItem(index.toString());
                setTimeout(() => setPreviewItem(null), 2000);
              }}
            >
              <div className="relative">
                <item.icon className="w-6 h-6" />
                {item.badgeCount > 0 && (
                  <div className="absolute -top-1 -right-2">
                    <span 
                      className={`bg-green-600 text-white text-xs font-medium px-1.5 py-0.5 rounded-full shadow-md shadow-green-900/40 ${item.badgeCount > 5 ? 'animate-pulse' : ''}`}
                      data-badge-id={index === 1 ? "live-matches-count" : index === 2 ? "upcoming-matches-count" : ""}
                    >
                      {item.badgeLabel || (item.badgeCount > 99 ? "+99" : item.badgeCount.toString())}
                    </span>
                    {item.badgeCount > 5 && (
                      <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
                    )}
                  </div>
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}

// Export the component wrapped in Suspense
export function BottomNavigation() {
  return (
    <Suspense fallback={<NavigationLoading />}>
      <BottomNavigationContent />
    </Suspense>
  )
}
