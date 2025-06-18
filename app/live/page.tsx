"use client"

import { LiveMatchTracker } from "@/components/live-match-tracker"
import { Suspense, useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useSearchParams } from "next/navigation"
import { useTranslation } from "@/components/language-provider"
import { Card } from "@/components/ui/card"
import Loading from "./loading"
import { LiveMatchGraphic } from "@/components/live-match-graphic"
import { LiveMatches } from "@/components/live-matches"
import { authService } from "@/lib/auth-service"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserIcon, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

function LivePageContent() {
  const searchParams = useSearchParams()
  const [matchId, setMatchId] = useState<string | undefined>()
  const { t } = useTranslation()
  const [isGuest, setIsGuest] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (searchParams) {
      setMatchId(searchParams.get("match") || undefined)
    }
    // Check if user is authenticated
    setIsGuest(!authService.isAuthenticated())
  }, [searchParams])

  return (
    <div className="container px-2 py-2 mx-auto">
      {isGuest && (
        <Alert className="mb-2 bg-yellow-900/30 border-yellow-700/50 text-yellow-200">
          <div className="flex items-center justify-between w-full">
            <AlertDescription className="flex items-center">
              <UserIcon className="w-4 h-4 mr-2 text-yellow-400" />
              {t('guestModeActive')}
            </AlertDescription>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 border-yellow-600 text-yellow-300 hover:bg-yellow-800/50"
              onClick={() => router.push('/login')}
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              {t('login')}
            </Button>
          </div>
        </Alert>
      )}
      {/* Arena-style header with stadium elements */}
      <div className="relative mb-6">
        {/* Stadium lights glow effect */}
        <div className="absolute -top-4 -left-10 w-20 h-20 bg-emerald-400 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -top-4 -right-10 w-20 h-20 bg-emerald-400 rounded-full blur-3xl opacity-20"></div>
        
        {/* Stadium background with texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg"></div>
        <div className="absolute inset-0 bg-[url('/stadium-pattern.png')] bg-repeat opacity-10 rounded-lg"></div>
        
        {/* Arena overlay with field lines */}
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 via-emerald-800/10 to-emerald-900/20"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/10"></div>
          <div className="absolute left-1/4 top-0 bottom-0 w-[1px] bg-white/5"></div>
          <div className="absolute left-3/4 top-0 bottom-0 w-[1px] bg-white/5"></div>
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10"></div>
          <div className="absolute left-1/2 top-1/2 w-16 h-16 -ml-8 -mt-8 border-2 border-white/5 rounded-full"></div>
        </div>
        
        <Card className="relative overflow-hidden border-none bg-transparent shadow-2xl z-10">
          <div className="p-5 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Arena-style icon */}
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/stadium-pattern.png')] bg-repeat opacity-10"></div>
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-[8px] text-white font-bold">LIVE</span>
                  </div>
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-300 tracking-tight">
                    {t('liveMatchTracking')} ARENA
                  </h1>
                  <div className="flex items-center mt-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-1.5"></span>
                    <p className="text-xs text-slate-300">
                      Gerçek Zamanlı Analiz Platformu
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-full opacity-70 blur"></div>
                  <div className="relative bg-slate-900 text-red-400 text-xs px-3 py-1 rounded-full border border-red-500/30 flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping absolute"></span>
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                    <span className="font-medium">CANLI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stadium crowd animation */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-800/0 via-emerald-500/30 to-emerald-800/0">
            <div className="absolute inset-0 bg-[url('/crowd-pattern.png')] bg-repeat-x animate-shine-slow"></div>
          </div>
        </Card>
      </div>
      
      {/* Canlı Maç Grafiği - Futbol sahası görselleştirmesi */}
      <div className="mb-6">
        <Card className="bg-slate-800/70 border-slate-700/50 overflow-hidden">
          <div className="p-3 border-b border-slate-700/50 bg-slate-800/90">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></span>
                Canlı Maç Grafiği
              </h2>
              <div className="text-xs text-slate-400">
                68:59
              </div>
            </div>
          </div>
          <div className="p-0">
            <Suspense fallback={<div className="h-48 bg-slate-800/50 animate-pulse"></div>}>
              <LiveMatchGraphic 
                homeTeamName="UQ FC U23"
                awayTeamName="Rakip Takım"
                homeScore="2"
                awayScore="1"
                isLive={true}
              />
            </Suspense>
          </div>
        </Card>
      </div>
      
      <Suspense fallback={<LiveMatchTrackerSkeleton />}>
        <LiveMatchTracker initialMatchId={matchId} />
      </Suspense>
    </div>
  )
}

export default function LivePage() {
  return (
    <Suspense fallback={<LiveMatchTrackerSkeleton />}>
      <LivePageContent />
    </Suspense>
  )
}

function LiveMatchTrackerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32 bg-emerald-900/20" />
        <Skeleton className="h-8 w-32 bg-emerald-900/20" />
      </div>
      <Skeleton className="h-1 w-full bg-emerald-900/20" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-[500px] bg-emerald-900/20 rounded-lg" />
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-40 bg-emerald-900/20 rounded-lg" />
          <Skeleton className="h-40 bg-emerald-900/20 rounded-lg" />
          <Skeleton className="h-40 bg-emerald-900/20 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
