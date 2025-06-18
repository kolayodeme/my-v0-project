"use client"

import React from "react"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { getUpcomingMatches, getCountries, getLeagues, getTeamLastMatches, getStandings } from "@/lib/football-api"
import { indexedCache } from "@/lib/indexed-cache"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertCircle,
  RefreshCw,
  Search,
  Loader2,
  Calendar,
  BarChart2,
  StickerIcon as Stadium,
  Trophy,
  Clock,
  Database,
  HardDrive,
  Zap,
  Sparkles,
  X,
  MapPin,
  Globe,
  Bot,
  Gift,
  Coins,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "./language-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { format, isToday, isTomorrow, addDays, isWithinInterval, subDays, isAfter, isBefore } from "date-fns"
import { tr } from "date-fns/locale"
import { H2HAnalysis } from "./h2h-analysis"
import { LastTenMatchAnalysis } from "./last-ten-match-analysis"
import { UpcomingMatchPrediction } from "./upcoming-match-prediction"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LeaguesSection } from "@/components/leagues-section"
import { useToast } from "@/components/ui/use-toast"
import { CreditRequiredModal } from "@/components/ui/credit-required-modal"
import { useCreditStore, CREDIT_COSTS } from "@/lib/credit-system"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { authService } from "@/lib/auth-service"
import { useRouter } from "next/navigation"

interface Match {
  match_id: string
  match_date: string
  match_time: string
  match_hometeam_name: string
  match_awayteam_name: string
  match_hometeam_id: string
  match_awayteam_id: string
  team_home_badge: string
  team_away_badge: string
  league_name: string
  league_logo?: string
  country_name: string
  country_logo?: string
  match_stadium?: string
  league_id?: string
  match_live?: string  // "1" ise canlı yayın var
  match_status?: string // Maç durumu (1H, 2H, HT, FT vb.)
  match_hometeam_score?: string // Ev sahibi takım skoru
  match_awayteam_score?: string // Deplasman takımı skoru
  match_hometeam_halftime_score?: string // İlk yarı ev sahibi skoru
  match_awayteam_halftime_score?: string // İlk yarı deplasman skoru
  match_elapsed?: string // Geçen dakika
}

interface Country {
  country_id: string
  country_name: string
  country_logo?: string
}

interface League {
  league_id: string
  league_name: string
  league_logo?: string
  country_id: string
}

// Cache constants
const CACHE_VERSION = "v1"
const CACHE_KEYS = {
  UPCOMING: `upcoming_matches_${CACHE_VERSION}`,
  COUNTRIES: `countries_${CACHE_VERSION}`,
  LEAGUES: `leagues_${CACHE_VERSION}`,
  FINISHED: `finished_matches_${CACHE_VERSION}`
}

// Optimized cache helper
const cacheHelper = {
  async get(key: string) {
    try {
      const data = await indexedCache.get(key)
      return data || null
    } catch {
      return null
    }
  },

  async set(key: string, data: any) {
    try {
      await indexedCache.set(key, data)
      return true
    } catch {
      return false
    }
  },

  async getWithFallback<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    options = { forceRefresh: false }
  ): Promise<T | null> {
    if (!options.forceRefresh) {
      const cached = await this.get(key)
      if (cached) return cached
    }

    try {
      const data = await fetchFn()
      if (data) {
        // Cache in background
        Promise.resolve().then(() => this.set(key, data))
      }
      return data
    } catch {
      return null
    }
  }
}

// Maç durumları için global sabitler
const MATCH_STATUSES = {
  FINISHED: ["FT", "Finished", "FINISHED", "CANC", "ABD", "AWD", "WO"],
  LIVE: ["1H", "2H", "HT"],
  ONGOING: ["1H", "2H", "HT"]
};

// Takımı puan durumu listesinde bulmak için yardımcı fonksiyon
const findTeamInStandings = async (standings: any[], teamId: string, teamName: string) => {
  console.log(`Searching standings for ${teamName}, ID: ${teamId}`);
  
  // First try to match by ID
  let teamStanding = standings.find((item: any) => {
    return item.team_id === teamId || 
           item.team_id === parseInt(teamId) || 
           item.team_id === teamId.toString();
  });
  
  // If not found by ID, search by team name (exact or partial match)
  if (!teamStanding) {
    console.log(`No ID match found for ${teamName}, searching by name`);
    
    // Convert team name to lowercase and normalize
    const normalizedTeamName = teamName.toLowerCase().trim();
    
    teamStanding = standings.find((item: any) => {
      // Exact team name match
      if (item.team_name && item.team_name.toLowerCase().trim() === normalizedTeamName) {
        return true;
      }
      
      // Partial match (does one team name contain the other?)
      if (item.team_name && 
          (item.team_name.toLowerCase().includes(normalizedTeamName) || 
           normalizedTeamName.includes(item.team_name.toLowerCase()))) {
        return true;
      }
      
      return false;
    });
  }
  
  if (teamStanding) {
    console.log(`Standings found for ${teamName}:`, teamStanding.team_name);
    return {
      position: parseInt(teamStanding.overall_league_position) || 0,
      points: parseInt(teamStanding.overall_league_PTS) || 0,
      played: parseInt(teamStanding.overall_league_payed) || 0,
      won: parseInt(teamStanding.overall_league_W) || 0,
      drawn: parseInt(teamStanding.overall_league_D) || 0,
      lost: parseInt(teamStanding.overall_league_L) || 0,
      goalsFor: parseInt(teamStanding.overall_league_GF) || 0,
      goalsAgainst: parseInt(teamStanding.overall_league_GA) || 0
    };
  }
  
  console.log(`No standings found for ${teamName}`);
  // If team standings not found, return empty values
  return {
    position: 0,
    points: 0,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0
  };
};

// API'den takımın puan durumunu çek
const getTeamStandings = async (teamId: string, teamName: string, leagueId?: string) => {
  try {
    // Get team league info from API
    if (!leagueId) {
      console.log(`League ID not found for ${teamName}, using default ID`);
      // If team league info is missing, use a default league ID
      // Turkey Super League: 148, Premier League: 152, La Liga: 302, Bundesliga: 175, Serie A: 207
      leagueId = "148"; // Super League ID as default
    }
    
    // Get league standings
    console.log(`Getting standings for league ID ${leagueId}...`);
    const standings = await getStandings(leagueId);
    
    if (!Array.isArray(standings) || standings.length === 0) {
      console.log(`Failed to get standings data for league ID ${leagueId} from API or returned empty array`);
      // Try alternative leagues
      const alternativeLeagueIds = ["148", "152", "302", "175", "207"];
      
      // Try alternatives if given league ID is not already in the alternatives list
      if (!alternativeLeagueIds.includes(leagueId)) {
        for (const altLeagueId of alternativeLeagueIds) {
          console.log(`Trying alternative league ID: ${altLeagueId}`);
          try {
            const altStandings = await getStandings(altLeagueId);
            if (Array.isArray(altStandings) && altStandings.length > 0) {
              console.log(`Data found in alternative league with ID ${altLeagueId}`);
              return await findTeamInStandings(altStandings, teamId, teamName);
            }
          } catch (e) {
            console.log(`Error for alternative league ID ${altLeagueId}:`, e);
          }
        }
      }
      
      return {
        position: 0,
        points: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0
      };
    }
    // Takımı puan durumu listesinde ara
    return await findTeamInStandings(standings, teamId, teamName);
  } catch (error) {
    console.error(`Error fetching team standings for ${teamName}:`, error);
    // Hata durumunda boş değerler döndür
    return {
      position: 0,
      points: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0
    };
  }
};

const StandingsComparison = ({
  homeTeamId,
  awayTeamId,
  homeTeam,
  awayTeam,
  leagueId,
}: {
  homeTeamId: string
  awayTeamId: string
  homeTeam: string
  awayTeam: string
  leagueId?: string
}) => {
  const { t } = useTranslation();
  const [homeStanding, setHomeStanding] = useState<any>(null)
  const [awayStanding, setAwayStanding] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        console.log(`Puan durumu çekiliyor - Lig ID: ${leagueId}, Ev sahibi: ${homeTeam}, Deplasman: ${awayTeam}`);
        const [homeData, awayData] = await Promise.all([
          getTeamStandings(homeTeamId, homeTeam, leagueId), 
          getTeamStandings(awayTeamId, awayTeam, leagueId)
        ]);
        
        setHomeStanding(homeData)
        setAwayStanding(awayData)
      } catch (error) {
        console.error("Error fetching standings:", error)
        setError("Puan durumu bilgisi alınırken bir hata oluştu");
      } finally {
        setLoading(false)
      }
    }

    fetchStandings()
  }, [homeTeamId, awayTeamId, homeTeam, awayTeam, leagueId])

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-green-500" />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-xs text-red-400">{error}</p>
      </div>
    )
  }

  if (!homeStanding || !awayStanding) {
    return (
      <div className="text-center p-4">
        <p className="text-xs text-slate-400">Puan durumu bilgisi bulunamadı</p>
      </div>
    )
  }

  const positionDiff = homeStanding.position - awayStanding.position
  const pointsDiff = homeStanding.points - awayStanding.points

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center mb-3">
        <Trophy className="w-4 h-4 text-yellow-500 mr-2" />
        <h3 className="text-sm font-medium text-green-400">{t('standingsComparison')}</h3>
      </div>

      {/* Position Comparison */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-slate-400 mb-1">{homeTeam}</div>
              <Badge
                className={`text-xs ${homeStanding.position <= awayStanding.position ? "bg-green-600" : "bg-red-600"}`}
              >
                {homeStanding.position}. {t('positionRank')}
              </Badge>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs text-slate-400 mb-1">{t('standingsPositionDifference')}</div>
              <div className="text-xs text-slate-400">{Math.abs(positionDiff)} {t('positionRank')}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">{awayTeam}</div>
              <Badge
                className={`text-xs ${awayStanding.position <= homeStanding.position ? "bg-green-600" : "bg-red-600"}`}
              >
                {awayStanding.position}. {t('positionRank')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points Comparison */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-green-400">{homeStanding.points}</div>
              <div className="text-xs text-slate-400">puan</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs text-slate-400 mb-1">{t('pointsDifference')}</div>
              <Badge variant="outline" className="text-xs">
                {Math.abs(pointsDiff)} {t('pointsCount')}
              </Badge>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">{awayStanding.points}</div>
              <div className="text-xs text-slate-400">puan</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-2">
            <div className="text-xs text-center">
              <div className="font-medium text-green-400 mb-1">{homeTeam}</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('matchesPlayed')}:</span>
                  <span className="text-white">{homeStanding.played}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('winsShort')}:</span>
                  <span className="text-green-400">{homeStanding.won}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('drawsShort')}:</span>
                  <span className="text-yellow-400">{homeStanding.drawn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('lossesShort')}:</span>
                  <span className="text-red-400">{homeStanding.lost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('goalsForShort')}/{t('goalsAgainstShort')}:</span>
                  <span className="text-white">
                    {homeStanding.goalsFor}/{homeStanding.goalsAgainst}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-2">
            <div className="text-xs text-center">
              <div className="font-medium text-yellow-400 mb-1">{awayTeam}</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('matchesPlayed')}:</span>
                  <span className="text-white">{awayStanding.played}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('winsShort')}:</span>
                  <span className="text-green-400">{awayStanding.won}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('drawsShort')}:</span>
                  <span className="text-yellow-400">{awayStanding.drawn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('lossesShort')}:</span>
                  <span className="text-red-400">{awayStanding.lost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('goalsForShort')}/{t('goalsAgainstShort')}:</span>
                  <span className="text-white">
                    {awayStanding.goalsFor}/{awayStanding.goalsAgainst}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Memoized match card component
const UpcomingMatchCard = React.memo(
  ({
    match,
    isSelected,
    onMatchClick,
    onAnalysisClick,
    onPredictionClick,
    formatDateForDisplay,
  }: {
    match: Match
    isSelected: boolean
    onMatchClick: (matchId: string, homeTeamId: string, awayTeamId: string, tabType?: string) => void
    onAnalysisClick: () => void
    onPredictionClick: () => void
    formatDateForDisplay: (date: string) => string
  }) => {
    const { t } = useTranslation()
    const { useCredits, hasCredits } = useCreditStore()
    const { toast } = useToast()
    const router = useRouter()
    const [showCreditModal, setShowCreditModal] = useState(false)
    const isLive = match.match_live === "1" || match.match_status === "1H" || match.match_status === "2H" || match.match_status === "HT"
    const isFinished = match.match_status === "FT" || match.match_status === "Finished"
    const homeScore = match.match_hometeam_score || "0"
    const awayScore = match.match_awayteam_score || "0"
    
    // Handle analysis button click with credit check
    const handleAnalysisClick = async (e: React.MouseEvent) => {
      e.stopPropagation()
      
      // Check if user is authenticated first
      if (!authService.isAuthenticated()) {
        // If not authenticated, redirect to login page
        router.push('/login');
        return;
      }
      
      if (hasCredits(CREDIT_COSTS.ANALYSIS)) {
        try {
          const success = await useCredits(CREDIT_COSTS.ANALYSIS);
          if (success) {
            // Sunucuda da krediyi güncelle
            authService.syncCredits().catch(error => {
              console.error('Failed to sync credits with server:', error);
            });
            
            // Kredi kullanıldı bildirimi için özel event tetikle
            if (typeof document !== 'undefined') {
              const event = new CustomEvent('creditUsed', { 
                detail: { 
                  amount: CREDIT_COSTS.ANALYSIS,
                  reason: 'analysis',
                  message: `${CREDIT_COSTS.ANALYSIS} kredi analiz için kullanıldı!`
                }
              });
              document.dispatchEvent(event);
              console.log('Credit used event dispatched for analysis:', CREDIT_COSTS.ANALYSIS);
            }
            
            toast({
              title: "1 Kredi Kullanıldı",
              description: <div className="flex items-center"><Coins className="w-4 h-4 mr-1 text-yellow-400" /> Maç analizi için 1 kredi kullanıldı</div>,
              variant: "default",
              duration: 3000,
              className: "bg-slate-800 border-green-600 border-2 text-white"
            });
            onAnalysisClick();
          }
        } catch (error) {
          console.error('Error using credits:', error);
        }
      } else {
        setShowCreditModal(true);
      }
    }

    return (
      <>
        <Card
          className={cn(
            "relative overflow-hidden transition-all duration-300 cursor-pointer",
            "bg-gradient-to-br from-slate-900/95 to-green-900/95 border-green-600/30",
            "hover:border-yellow-400/50 hover:shadow-[0_0_15px_rgba(234,179,8,0.3)]",
            "rounded-xl shadow-lg",
            isSelected && "ring-2 ring-yellow-400/70 shadow-[0_0_20px_rgba(234,179,8,0.4)] scale-[1.02]"
          )}
          onClick={() => onMatchClick(match.match_id, match.match_hometeam_id, match.match_awayteam_id)}
        >
          {/* Stadium atmosphere effects */}
          <div className="absolute inset-0 bg-[url('/grass-pattern.png')] bg-repeat opacity-5"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          <div className="absolute -top-24 left-1/4 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -top-24 right-1/4 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl"></div>
          
          <CardContent className="relative p-3 flex flex-col gap-2">
            {/* League info with arena style */}
            <div className="flex items-center gap-1 mb-1">
              <Trophy className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] font-medium text-green-300">{match.league_name}</span>
              {isLive && (
                <Badge variant="outline" className="ml-auto py-0 h-4 text-[10px] border-red-500 text-red-400 bg-red-500/10">
                  CANLI
                </Badge>
              )}
            </div>

            {/* Teams section with enhanced visuals */}
            <div className="flex items-center justify-between gap-3">
              {/* Home team */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-12 h-12 relative mb-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-green-900/20 rounded-full"></div>
                  <Image
                    src={match.team_home_badge || '/football.svg'}
                    alt={match.match_hometeam_name}
                    width={48}
                    height={48}
                    className="rounded-full object-contain relative z-10"
                    loading="eager"
                    priority={true}
                  />
                </div>
                <span className="text-sm font-bold text-white text-center leading-tight">
                  {match.match_hometeam_name}
                </span>
              </div>

              {/* Match time/score */}
              <div className="flex flex-col items-center justify-center">
                {isFinished ? (
                  <>
                    <div className="flex items-center gap-1 mb-1">
                      <span className="text-xl font-bold">
                        <span className={`${parseInt(homeScore) > parseInt(awayScore) ? 'text-green-400' : 'text-white'}`}>{homeScore}</span>
                        <span className="text-slate-400 mx-1">-</span>
                        <span className={`${parseInt(awayScore) > parseInt(homeScore) ? 'text-green-400' : 'text-white'}`}>{awayScore}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge 
                        className={`h-5 px-2 text-[10px] font-medium flex items-center gap-1
                          ${match.match_status === "FT" 
                            ? "bg-green-600/20 text-green-400 border-green-500/30" 
                            : match.match_status === "Cancelled" || match.match_status === "Postponed"
                            ? "bg-red-600/20 text-red-400 border-red-500/30"
                            : "bg-yellow-600/20 text-yellow-400 border-yellow-500/30"
                          }`}
                      >
                        {match.match_status === "FT" && <Check className="w-3 h-3" />}
                        {(match.match_status === "Cancelled" || match.match_status === "Postponed") && <X className="w-3 h-3" />}
                        {match.match_status === "FT" ? "Tamamlandı" : match.match_status}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-bold text-yellow-400 tracking-wider mb-1">
                      VS
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-green-300">{match.match_time}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Away team */}
              <div className="flex flex-col items-center flex-1">
                <div className="w-12 h-12 relative mb-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-green-900/20 rounded-full"></div>
                  <Image
                    src={match.team_away_badge || '/football.svg'}
                    alt={match.match_awayteam_name}
                    width={48}
                    height={48}
                    className="rounded-full object-contain relative z-10"
                    loading="eager"
                    priority={true}
                  />
                </div>
                <span className="text-sm font-bold text-white text-center leading-tight">
                  {match.match_awayteam_name}
                </span>
              </div>
            </div>

            {/* Stadium info with icon */}
            {match.match_stadium && (
              <div className="flex items-center gap-1 mt-1 justify-center">
                <Stadium className="w-3 h-3 text-green-400" />
                <span className="text-[10px] text-green-300">{match.match_stadium}</span>
              </div>
            )}

            {/* Action buttons with enhanced styling */}
            <div className="flex items-center gap-2 mt-2">
              <Button
                size="sm"
                className="flex-1 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-bold border-0 shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/40 transition-all duration-300"
                onClick={handleAnalysisClick}
              >
                <BarChart2 className="w-4 h-4 mr-1" />
                Analiz
              </Button>
              <Button
                size="sm"
                className="flex-1 h-8 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white font-bold border-0 shadow-lg shadow-green-400/20 hover:shadow-green-400/40 transition-all duration-300"
                onClick={(e) => {
                  e.stopPropagation()
                  // Check if user is authenticated first
                  if (!authService.isAuthenticated()) {
                    // If not authenticated, redirect to login page
                    router.push('/login');
                    return;
                  }
                  onPredictionClick()
                }}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Tahmin
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <CreditRequiredModal
          isOpen={showCreditModal}
          onClose={() => setShowCreditModal(false)}
          requiredCredits={CREDIT_COSTS.ANALYSIS}
          actionDescription="Maç analizi yapmak için"
          onContinue={() => {
            onAnalysisClick()
            setShowCreditModal(false)
          }}
        />
      </>
    )
  }
)

UpcomingMatchCard.displayName = "UpcomingMatchCard"

// Canlı maç detayları bileşeni
const LiveMatchDetails = React.memo(({ 
  match 
}: { 
  match: Match 
}) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchStats = async () => {
      try {
        // Burada gerçek API'den maç istatistiklerini çekebilirsiniz
        // Örnek: const data = await getMatchStats(match.match_id);
        
        // Şimdilik örnek veri gösteriyoruz
        const demoStats = {
          possession: {
            home: 55,
            away: 45
          },
          shots: {
            home: 12,
            away: 8
          },
          shotsOnTarget: {
            home: 5,
            away: 3
          },
          corners: {
            home: 6,
            away: 4
          },
          fouls: {
            home: 10,
            away: 12
          },
          yellowCards: {
            home: 2,
            away: 3
          },
          redCards: {
            home: 0,
            away: 0
          }
        };
        
        setStats(demoStats);
      } catch (error) {
        console.error("Error fetching match stats:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatchStats();
  }, [match.match_id]);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-4">
        <p className="text-xs text-slate-400">{t('noMatchStatsFound')}</p>
      </div>
    );
  }

  // Skor bilgisi
  const homeScore = match.match_hometeam_score || "0";
  const awayScore = match.match_awayteam_score || "0";
  const homeHalfScore = match.match_hometeam_halftime_score || "0";
  const awayHalfScore = match.match_awayteam_halftime_score || "0";

  return (
    <div className="space-y-3">
      {/* Maç durumu ve skor */}
      <div className="flex items-center justify-center mb-3">
        <Badge className="bg-red-600 text-white">
          {match.match_status === "1H" ? t('matchStatusDisplayFirstHalf') :
           match.match_status === "HT" ? t('matchStatusDisplayHalfTime') :
           match.match_status === "2H" ? t('matchStatusDisplaySecondHalf') :
           match.match_status === "FT" ? t('matchStatusDisplayFullTime') :
           t('matchStatusDisplayLive')}
          {match.match_elapsed && ` ${match.match_elapsed}'`}
        </Badge>
      </div>

      {/* Skor detayları */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-slate-400 mb-1">{match.match_hometeam_name}</div>
              <div className="text-2xl font-bold text-white">{homeScore}</div>
              {match.match_status !== "1H" && (
                <div className="text-xs text-slate-400">{t('matchStatusDisplayHalfTime')}: {homeHalfScore}</div>
              )}
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs text-slate-400 mb-1">{t('score')}</div>
              <div className="text-xs text-yellow-400">{t('vs')}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">{match.match_awayteam_name}</div>
              <div className="text-2xl font-bold text-white">{awayScore}</div>
              {match.match_status !== "1H" && (
                <div className="text-xs text-slate-400">{t('matchStatusDisplayHalfTime')}: {awayHalfScore}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* İstatistikler */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-3">
          <h3 className="text-sm font-medium text-center text-red-400 mb-3">{t('matchStatistics')}</h3>
          
          {/* Top hakimiyeti */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{t('ballPossession')}: {stats.possession.home}%</span>
              <span>{t('factors')}</span>
              <span>{t('ballPossession')}: {stats.possession.away}%</span>
            </div>
            <div className="flex h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="bg-green-500" 
                style={{ width: `${stats.possession.home}%` }} 
              />
              <div 
                className="bg-yellow-500" 
                style={{ width: `${stats.possession.away}%` }} 
              />
            </div>
          </div>
          
          {/* Şutlar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{t('shots')}: {stats.shots.home}</span>
              <span>{t('shots')}</span>
              <span>{t('shots')}: {stats.shots.away}</span>
            </div>
            <div className="flex h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="bg-green-500" 
                style={{ width: `${(stats.shots.home / (stats.shots.home + stats.shots.away)) * 100}%` }} 
              />
              <div 
                className="bg-yellow-500" 
                style={{ width: `${(stats.shots.away / (stats.shots.home + stats.shots.away)) * 100}%` }} 
              />
            </div>
          </div>
          
          {/* İsabetli şutlar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{t('shotsOnTarget')}: {stats.shotsOnTarget.home}</span>
              <span>{t('shotsOnTarget')}</span>
              <span>{t('shotsOnTarget')}: {stats.shotsOnTarget.away}</span>
            </div>
            <div className="flex h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="bg-green-500" 
                style={{ 
                  width: `${stats.shotsOnTarget.home + stats.shotsOnTarget.away > 0 ? 
                    (stats.shotsOnTarget.home / (stats.shotsOnTarget.home + stats.shotsOnTarget.away)) * 100 : 50}%` 
                }} 
              />
              <div 
                className="bg-yellow-500" 
                style={{ 
                  width: `${stats.shotsOnTarget.home + stats.shotsOnTarget.away > 0 ? 
                    (stats.shotsOnTarget.away / (stats.shotsOnTarget.home + stats.shotsOnTarget.away)) * 100 : 50}%` 
                }} 
              />
            </div>
          </div>
          
          {/* Diğer istatistikler */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-slate-700/30 p-2 rounded">
              <div className="flex justify-between">
                <span className="text-xs text-green-400">{t('corners')}: {stats.corners.home}</span>
                <span className="text-xs text-slate-400">{t('corners')}</span>
                <span className="text-xs text-yellow-400">{t('corners')}: {stats.corners.away}</span>
              </div>
            </div>
            <div className="bg-slate-700/30 p-2 rounded">
              <div className="flex justify-between">
                <span className="text-xs text-green-400">{t('fouls')}: {stats.fouls.home}</span>
                <span className="text-xs text-slate-400">{t('fouls')}</span>
                <span className="text-xs text-yellow-400">{t('fouls')}: {stats.fouls.away}</span>
              </div>
            </div>
            <div className="bg-slate-700/30 p-2 rounded">
              <div className="flex justify-between">
                <span className="text-xs text-green-400">{t('yellowCards')}: {stats.yellowCards.home}</span>
                <span className="text-xs text-slate-400">{t('yellowCards')}</span>
                <span className="text-xs text-yellow-400">{t('yellowCards')}: {stats.yellowCards.away}</span>
              </div>
            </div>
            <div className="bg-slate-700/30 p-2 rounded">
              <div className="flex justify-between">
                <span className="text-xs text-green-400">{t('redCards')}: {stats.redCards.home}</span>
                <span className="text-xs text-slate-400">{t('redCards')}</span>
                <span className="text-xs text-yellow-400">{t('redCards')}: {stats.redCards.away}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

LiveMatchDetails.displayName = "LiveMatchDetails";

// Lazy load component for performance optimization
const LazyMatchList = ({ 
  matches, 
  selectedMatchId, 
  handleMatchClick, 
  isLoadingDetails, 
  activeTab, 
  setActiveTab,
  homeLastMatches,
  awayLastMatches,
  formatDateForDisplay,
  selectedMatchRef
}: {
  matches: [string, Match[]][]
  selectedMatchId: string | null
  handleMatchClick: (matchId: string, homeTeamId: string, awayTeamId: string, tabType?: string) => void
  isLoadingDetails: boolean
  activeTab: string
  setActiveTab: (tab: string) => void
  homeLastMatches: any[]
  awayLastMatches: any[]
  formatDateForDisplay: (date: string) => string
  selectedMatchRef: React.RefObject<HTMLDivElement | null>
}) => {
  const { t } = useTranslation();
  const [visibleGroups, setVisibleGroups] = useState(3);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedMatchTab, setSelectedMatchTab] = useState<"standings" | "h2h" | "last10" | "prediction">("standings");
  
  const loadMoreGroups = useCallback(() => {
    setVisibleGroups(prev => prev + 3);
  }, []);

  const openMatchModal = useCallback((match: Match, tabType: "standings" | "h2h" | "last10" | "prediction" = "standings") => {
    setSelectedMatch(match);
    setSelectedMatchTab(tabType);
    setShowMatchDetails(true);
  }, []);

  const closeMatchDetails = useCallback(() => {
    setShowMatchDetails(false);
    setSelectedMatch(null);
  }, []);
  
  return (
    <>
      {matches.slice(0, visibleGroups).map(([date, dateMatches]) => (
        <div key={date} className="space-y-2">
          {/* Arena style date header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-900 to-green-800 p-3 rounded-lg border border-green-600/30 shadow-lg">
            {/* Stadium light effects */}
            <div className="absolute -top-10 left-1/4 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -top-10 right-1/4 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl"></div>
            
            {/* Grass pattern background */}
            <div className="absolute inset-0 bg-[url('/grass-pattern.png')] bg-repeat opacity-10"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-green-400" />
                <h3 className="text-sm font-bold text-green-100">{formatDateForDisplay(date)}</h3>
              </div>
              <Badge className="bg-green-700/50 text-white border border-green-500/30">
                {dateMatches.length} {t('matchesCount')}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            {dateMatches.map((match) => (
              <div
                key={match.match_id}
                className="space-y-2"
                ref={match.match_id === selectedMatchId ? selectedMatchRef : null}
              >
                <UpcomingMatchCard
                  match={match}
                  isSelected={selectedMatchId === match.match_id}
                  onMatchClick={handleMatchClick}
                  onAnalysisClick={() => openMatchModal(match, "standings")}
                  onPredictionClick={() => openMatchModal(match, "prediction")}
                  formatDateForDisplay={formatDateForDisplay}
                />

                {selectedMatchId === match.match_id && (
                  <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-green-700/30 shadow-xl">
                    {/* Existing content */}
                  </Card>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Yeni Modal - Leagues Section Benzeri */}
      {showMatchDetails && selectedMatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-800/50 border-b border-slate-700/50 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
                  {selectedMatch.league_logo ? (
                    <img src={selectedMatch.league_logo} alt={selectedMatch.league_name} className="w-4 h-4 object-contain" />
                  ) : (
                    <Trophy className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">{selectedMatch.league_name}</h3>
                  <p className="text-[10px] text-slate-400">{formatDateForDisplay(selectedMatch.match_date)} - {selectedMatch.match_time}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 rounded-full hover:bg-slate-700/50"
                onClick={closeMatchDetails}
              >
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            </div>

            {/* Teams */}
            <div className="flex items-center justify-center mt-3 space-x-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mb-1">
                  {selectedMatch.team_home_badge ? (
                    <img src={selectedMatch.team_home_badge} alt={selectedMatch.match_hometeam_name} className="w-7 h-7 object-contain" />
                  ) : (
                    <span className="text-sm font-bold text-white">{selectedMatch.match_hometeam_name.substring(0, 1)}</span>
                  )}
                </div>
                <span className="text-[11px] text-white text-center font-medium max-w-[80px] truncate">{selectedMatch.match_hometeam_name}</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-sm font-bold text-yellow-500 mb-1">{t('vs')}</span>
                {selectedMatch.match_stadium && (
                  <span className="text-[9px] text-slate-400">
                    <MapPin className="w-2 h-2 inline mr-0.5" />
                    {selectedMatch.match_stadium}
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mb-1">
                  {selectedMatch.team_away_badge ? (
                    <img src={selectedMatch.team_away_badge} alt={selectedMatch.match_awayteam_name} className="w-7 h-7 object-contain" />
                  ) : (
                    <span className="text-sm font-bold text-white">{selectedMatch.match_awayteam_name.substring(0, 1)}</span>
                  )}
                </div>
                <span className="text-[11px] text-white text-center font-medium max-w-[80px] truncate">{selectedMatch.match_awayteam_name}</span>
              </div>
            </div>
          </div>

          {/* Analysis Tabs */}
          <Tabs 
            defaultValue={selectedMatchTab} 
            value={selectedMatchTab}
            onValueChange={(value: string) => setSelectedMatchTab(value as "standings" | "h2h" | "last10" | "prediction")}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="flex p-0.5 bg-slate-800/50 border-b border-slate-700/50">
              <TabsTrigger
                value="standings"
                className="flex-1 h-7 text-[9px] data-[state=active]:bg-blue-500 data-[state=active]:text-white px-0.5"
              >
                <Trophy className="w-2.5 h-2.5 mr-0.5" />
                <span className="truncate">{t('standings')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="h2h"
                className="flex-1 h-7 text-[9px] data-[state=active]:bg-amber-500 data-[state=active]:text-white px-0.5"
              >
                <BarChart2 className="w-2.5 h-2.5 mr-0.5" />
                <span className="truncate">{t('h2h')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="last10"
                className="flex-1 h-7 text-[9px] data-[state=active]:bg-purple-500 data-[state=active]:text-white px-0.5"
              >
                <BarChart2 className="w-2.5 h-2.5 mr-0.5" />
                <span className="truncate">Son 10</span>
              </TabsTrigger>
              <TabsTrigger
                value="prediction"
                className="flex-1 h-7 text-[9px] data-[state=active]:bg-emerald-500 data-[state=active]:text-white px-0.5"
              >
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                <span className="truncate">{t('prediction')}</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mobile-scrollbar android-scroll-container">
              <div className="android-scroll-content">
                <TabsContent value="standings" className="mt-0 p-2">
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg">
                    <StandingsComparison
                      homeTeamId={selectedMatch.match_hometeam_id}
                      awayTeamId={selectedMatch.match_awayteam_id}
                      homeTeam={selectedMatch.match_hometeam_name}
                      awayTeam={selectedMatch.match_awayteam_name}
                      leagueId={selectedMatch.league_id}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="h2h" className="mt-0 p-2">
                  <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg">
                    <H2HAnalysis
                      firstTeamId={selectedMatch.match_hometeam_id}
                      secondTeamId={selectedMatch.match_awayteam_id}
                      firstTeamName={selectedMatch.match_hometeam_name}
                      secondTeamName={selectedMatch.match_awayteam_name}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="last10" className="mt-0 p-2">
                  <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg space-y-2">
                    <div>
                      <h4 className="text-[11px] font-medium text-purple-300 mb-1">{selectedMatch.match_hometeam_name}</h4>
                      <LastTenMatchAnalysis
                        teamId={selectedMatch.match_hometeam_id}
                        teamName={selectedMatch.match_hometeam_name}
                      />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-medium text-purple-300 mb-1">{selectedMatch.match_awayteam_name}</h4>
                      <LastTenMatchAnalysis
                        teamId={selectedMatch.match_awayteam_id}
                        teamName={selectedMatch.match_awayteam_name}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="prediction" className="mt-0 p-2">
                  <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg">
                    <UpcomingMatchPrediction
                      homeTeam={selectedMatch.match_hometeam_name}
                      awayTeam={selectedMatch.match_awayteam_name}
                      homeTeamId={selectedMatch.match_hometeam_id}
                      awayTeamId={selectedMatch.match_awayteam_id}
                      homeScore={selectedMatch.match_hometeam_score}
                      awayScore={selectedMatch.match_awayteam_score}
                      matchStatus={selectedMatch.match_status}
                    />
                  </div>
                </TabsContent>
              </div>
          </div>
          </Tabs>
        </div>
      )}
      
      {visibleGroups < matches.length && (
        <div className="flex justify-center mt-2 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-[10px] h-7 py-0 px-2 bg-slate-800/80 border-slate-700/50 text-yellow-400 hover:bg-slate-700/80 hover:text-amber-300 hover:border-amber-500/50 transition-all shadow-sm"
            onClick={loadMoreGroups}
          >
            <span className="relative z-10 flex items-center">
              <RefreshCw className="w-3 h-3 mr-1" />
              {t('loadMoreMatches')}
            </span>
          </Button>
        </div>
      )}
    </>
  );
};

async function fetchYesterdayFinishedMatches(forceRefresh = false): Promise<{yesterdayFinished: Match[], todayFinished: Match[]}> {
  const FINISHED_MATCHES_CACHE_KEY = "finished_matches_yesterday_today_v2";

  // Önce cache'den kontrol et
  if (!forceRefresh) {
    const cachedData = await indexedCache.get(FINISHED_MATCHES_CACHE_KEY);
    if (cachedData) {
      console.log("Tamamlanan maçlar IndexedDB'den yüklendi");
      return cachedData;
    }
  }

  try {
    const yesterday = subDays(new Date(), 1);
    const today = new Date();
    const yesterdayStr = format(yesterday, "yyyy-MM-dd");
    const todayStr = format(today, "yyyy-MM-dd");

    console.log(`Tamamlanan maçlar çekiliyor - Dün: ${yesterdayStr}, Bugün: ${todayStr}`);

    // Dün ve bugünün maçlarını ayrı ayrı getir
    const yesterdayMatches = await getUpcomingMatches(yesterdayStr, yesterdayStr);
    const todayMatches = await getUpcomingMatches(todayStr, todayStr);

    const yesterdayFinished = Array.isArray(yesterdayMatches)
      ? yesterdayMatches.filter(
          (match) => MATCH_STATUSES.FINISHED.includes(match.match_status)
        )
      : [];

    const todayFinished = Array.isArray(todayMatches)
      ? todayMatches.filter(
          (match) => 
            MATCH_STATUSES.FINISHED.includes(match.match_status) || 
            (match.match_live === "1" && MATCH_STATUSES.LIVE.includes(match.match_status))
        )
      : [];

    // Eğer bugünün maçları boşsa, biraz daha geniş bir aralıkta ara
    if (todayFinished.length === 0) {
      const expandedTodayMatches = await getUpcomingMatches(
        format(subDays(today, 1), "yyyy-MM-dd"), 
        format(addDays(today, 1), "yyyy-MM-dd")
      );

      const expandedTodayFinished = Array.isArray(expandedTodayMatches)
        ? expandedTodayMatches.filter(
            (match) => 
              (MATCH_STATUSES.FINISHED.includes(match.match_status) || 
              (match.match_live === "1" && MATCH_STATUSES.LIVE.includes(match.match_status))) &&
              new Date(match.match_date).toDateString() === today.toDateString()
          )
        : [];

      todayFinished.push(...expandedTodayFinished);
    }

    const result = { yesterdayFinished, todayFinished };

    // Cache'le (24 saat boyunca)
    await indexedCache.set(FINISHED_MATCHES_CACHE_KEY, result, 24 * 60 * 60 * 1000);

    console.log(`Tamamlanan maçlar IndexedDB'ye kaydedildi - Dün: ${yesterdayFinished.length}, Bugün: ${todayFinished.length}`);

    return result;
  } catch (error) {
    console.error("Tamamlanan maçlar çekilirken hata oluştu:", error);
    return { yesterdayFinished: [], todayFinished: [] };
  }
}

// Lazy load components
const LazyH2HAnalysis = React.lazy(() => import('./h2h-analysis').then(mod => ({ default: mod.H2HAnalysis })))
const LazyLastTenMatchAnalysis = React.lazy(() => import('./last-ten-match-analysis').then(mod => ({ default: mod.LastTenMatchAnalysis })))
const LazyUpcomingMatchPrediction = React.lazy(() => import('./upcoming-match-prediction').then(mod => ({ default: mod.UpcomingMatchPrediction })))
const LazyLeaguesSection = React.lazy(() => import('./leagues-section').then(mod => ({ default: mod.LeaguesSection })))

// Suspense wrapper component
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <React.Suspense
    fallback={
      <div className="flex justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-green-500" />
      </div>
    }
  >
    {children}
  </React.Suspense>
)

export function UpcomingMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("")
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("standings")
  const [selectedDate, setSelectedDate] = useState<string>("today")
  const [cacheStatus, setCacheStatus] = useState<string | null>(null)
  const [storageInfo, setStorageInfo] = useState<any>(null)
  const { t } = useTranslation()
  const selectedMatchRef = useRef<HTMLDivElement | null>(null)
  const [homeLastMatches, setHomeLastMatches] = useState<any[]>([])
  const [awayLastMatches, setAwayLastMatches] = useState<any[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false)
  const [yesterdayFinished, setYesterdayFinished] = useState<Match[]>([])
  const [todayFinished, setTodayFinished] = useState<Match[]>([])
  const [loadingFinished, setLoadingFinished] = useState(false)
  const [isDateLoading, setIsDateLoading] = useState(false)
  const [selectedFinishedDate, setSelectedFinishedDate] = useState<"yesterday" | "today">("yesterday")
  const { toast } = useToast()
  const [finishedMatchError, setFinishedMatchError] = useState<string | null>(null)
  const router = useRouter()

  // Memoize dates to prevent infinite loops
  const dateRange = useMemo(() => {
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    return { today, nextWeek }
  }, [])

  const formatDateForApi = useCallback((date: Date) => {
    return format(date, "yyyy-MM-dd")
  }, [])

  const formatDateForDisplay = useCallback((dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isToday(date)) {
        return t('todayLabel');
      } else if (isTomorrow(date)) {
        return t('tomorrowLabel');
      } else {
        // Türkçe için özel format
        return format(date, "dd.MM.yyyy", { locale: tr });
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  }, [t]);

  const formatStorageSize = useCallback((bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }, [])

  const fetchUpcomingMatches = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      // Clear all relevant caches when force refreshing
      if (forceRefresh) {
        await indexedCache.delete(CACHE_KEYS.UPCOMING);
        await indexedCache.delete(CACHE_KEYS.LEAGUES);
        await indexedCache.delete(CACHE_KEYS.COUNTRIES);
      }

      const data = await cacheHelper.getWithFallback(
        CACHE_KEYS.UPCOMING,
        () => getUpcomingMatches(
          formatDateForApi(dateRange.today), 
          formatDateForApi(dateRange.nextWeek)
        ),
        { forceRefresh }
      )

      if (Array.isArray(data) && data.length > 0) {
        setMatches(data)
        // Force refresh leagues section
        const leaguesEvent = new CustomEvent('refreshLeagues', { detail: { forceRefresh: true } });
        window.dispatchEvent(leaguesEvent);
      } else {
        setError(t('upcomingMatchNotFound'))
      }
    } catch (err) {
      console.error("Error fetching upcoming matches:", err)
      setError(t('upcomingMatchLoadError'))
    } finally {
      setLoading(false)
    }
  }, [formatDateForApi, dateRange, t])

  const fetchMatchDetails = useCallback(async (matchId: string, homeTeamId: string, awayTeamId: string) => {
    setIsLoadingDetails(true)
    try {
      const [homeMatches, awayMatches] = await Promise.all([
        getTeamLastMatches(homeTeamId, 10),
        getTeamLastMatches(awayTeamId, 10),
      ])

      if (Array.isArray(homeMatches)) {
        setHomeLastMatches(homeMatches)
      }

      if (Array.isArray(awayMatches)) {
        setAwayLastMatches(awayMatches)
      }
    } catch (error) {
      console.error("Error fetching match details:", error)
    } finally {
      setIsLoadingDetails(false)
    }
  }, [])

  const clearCache = useCallback(async () => {
    try {
      setCacheStatus("Cache temizleniyor...")
      const success = await indexedCache.clear()
      const newStorage = await indexedCache.getStorageInfo()
      setStorageInfo(newStorage)
      setCacheStatus(success ? "Cache temizlendi" : "Cache temizleme başarısız")
    } catch (error) {
      setCacheStatus("Cache temizleme hatası")
    }
  }, [])

  // Use a memoized version of matches for better performance
  const memoizedMatches = useMemo(() => matches, [matches]);
  
  // Filtreleme fonksiyonu - takım ismine göre filtreleme eklenmiş
  const filterMatches = useCallback((matches: Match[], searchTerm: string) => {
    return matches.filter(match => {
      return searchTerm === "" || 
        match.match_hometeam_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.match_awayteam_name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, []);

  // Arama terimi değiştiğinde filtreleme yapılıyor
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Filtreleme değişikliklerini artık useMemo ile yapıyoruz
  // useEffect(() => {
  //   if (matches.length > 0) {
  //     const filtered = filterMatches(matches, debouncedSearchTerm);
  //     setFilteredMatches(filtered);
  //   }
  // }, [matches, debouncedSearchTerm, filterMatches]);
  
  // Fetch yesterday's and today's finished matches for the "Tamamlanan" tab
  useEffect(() => {
    let isMounted = true;

    const fetchFinishedMatches = async () => {
      // Her "Tamamlanan" sekmesine geçişte ve her iki alt sekme değişiminde çalış
      if (selectedDate === "finished") {
        try {
          setLoadingFinished(true);
          setFinishedMatchError(null); // Önceki hataları temizle
          const result = await fetchYesterdayFinishedMatches(true); // Force refresh
          const yesterdayFinishedData = result.yesterdayFinished;
          const todayFinishedData = result.todayFinished;
          
          if (isMounted) {
            setYesterdayFinished(yesterdayFinishedData);
            setTodayFinished(todayFinishedData);
            setLoadingFinished(false);

            // Eğer bugünün maçları yoksa, kullanıcıya bildirim göster
            if (todayFinishedData.length === 0) {
              setFinishedMatchError(t('noFinishedMatchToday'))
            }
          }
        } catch (error) {
          console.error("Error in fetching finished matches:", error);
          if (isMounted) {
            setLoadingFinished(false);
            setFinishedMatchError(t('finishedMatchLoadError'))
          }
        }
      }
    };

    fetchFinishedMatches();

    return () => {
      isMounted = false;
    };
  }, [selectedDate, selectedFinishedDate, t]);
  
  // Memoize edilmiş tarih filtreleme fonksiyonu
  const filteredMatches = useMemo(() => {
    let result: Match[] = [];
    
    if (selectedDate === "finished") {
      // Dün ve bugünün maçlarını seçilen tarihe göre filtrele
      const matches = selectedFinishedDate === "yesterday" ? yesterdayFinished : todayFinished;
      result = matches;
    } else {
      // Diğer tarih seçenekleri için normal maçları filtrele
      result = matches.filter(match => {
        const matchDate = new Date(match.match_date);
        
        switch (selectedDate) {
          case "today":
            // Today sekmesinde sadece tamamlanmamış maçları göster
            return isToday(matchDate) && !MATCH_STATUSES.FINISHED.includes(match.match_status || "");
          case "tomorrow":
            return isTomorrow(matchDate);
          case "week":
            return isAfter(matchDate, dateRange.today) && 
                   isBefore(matchDate, dateRange.nextWeek);
          default:
            return true;
        }
      });
    }
    
    // Takım adına göre filtreleme
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      result = result.filter(match => 
        match.match_hometeam_name.toLowerCase().includes(searchLower) || 
        match.match_awayteam_name.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  }, [
    selectedDate, 
    selectedFinishedDate, 
    yesterdayFinished, 
    todayFinished, 
    matches, 
    dateRange, 
    debouncedSearchTerm
  ]);

  // Bu useEffect zaten yukarıda tanımlandığı için kaldırıyoruz
  
  // Tarihe göre gruplandırma işlemini de memoize et
  const matchesByDate = useMemo(() => {
    return filteredMatches.reduce(
      (acc, match) => {
        if (!acc[match.match_date]) {
          acc[match.match_date] = []
        }
        acc[match.match_date].push(match)
        return acc
      },
      {} as Record<string, Match[]>
    )
  }, [filteredMatches]);

  useEffect(() => {
    fetchUpcomingMatches(false)
  }, [fetchUpcomingMatches])

  const handleMatchClick = useCallback(
    (matchId: string, homeTeamId: string, awayTeamId: string, tabType?: string) => {
      // Check if user is authenticated when trying to access analysis or prediction tabs
      if (tabType && (tabType === "analysis" || tabType === "prediction") && !authService.isAuthenticated()) {
        // If not authenticated, redirect to login page
        router.push('/login');
        return;
      }
      
      console.log(`handleMatchClick called with matchId: ${matchId}, homeTeamId: ${homeTeamId}, awayTeamId: ${awayTeamId}, tabType: ${tabType || 'undefined'}`);
      
      if (selectedMatchId === matchId) {
        // If clicking the same match but with a different tab, just change the tab
        if (tabType && activeTab !== tabType) {
          console.log(`Changing tab from ${activeTab} to ${tabType} for match ${matchId}`);
          setActiveTab(tabType);
        } else {
          // Otherwise, close the match details
          console.log(`Closing match details for ${matchId}`);
          setSelectedMatchId(null);
          setHomeLastMatches([]);
          setAwayLastMatches([]);
        }
      } else {
        // Maçı bul
        const selectedMatch = memoizedMatches.find(match => match.match_id === matchId);
        
        console.log(`Opening match details for ${matchId}`);
        setSelectedMatchId(matchId);
        
        // Canlı maç ise "live" sekmesini, değilse "standings" sekmesini seç
        if (selectedMatch && selectedMatch.match_live === "1") {
          console.log(`Match ${matchId} is live, setting tab to "live"`);
          setActiveTab("live");
        } else if (tabType) {
          // Eğer tabType parametre olarak geldiyse, o sekmeyi seç
          console.log(`Setting tab to ${tabType} as specified`);
          setActiveTab(tabType);
        } else {
          console.log(`Setting default tab "standings" for match ${matchId}`);
          setActiveTab("standings");
        }
        
        fetchMatchDetails(matchId, homeTeamId, awayTeamId);
      }
    },
    [selectedMatchId, activeTab, fetchMatchDetails, memoizedMatches, router]
  );

  // Seçilen maça otomatik kaydırma efekti için useEffect - hem seçildiğinde hem de yükleme tamamlandığında
  useEffect(() => {
    // İki durumda otomatik kaydırma yap:
    // 1. Yeni bir maç seçildiğinde (selectedMatchId değiştiğinde)
    // 2. Maç detayları yüklenmeyi tamamladığında (isLoadingDetails false olduğunda)
    if (selectedMatchId && selectedMatchRef.current) {
      // Scroll işlemi için uygun zamanlama
      const scrollDelay = isLoadingDetails ? 50 : 200; // Yükleme bittiyse biraz daha bekle

      const scrollTimer = setTimeout(() => {
        if (selectedMatchRef.current) {
          // Tüm sayfa durumlarında çalışacak şekilde scroll işlemi yap
          selectedMatchRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, scrollDelay);

      return () => clearTimeout(scrollTimer);
    }
  }, [selectedMatchId, isLoadingDetails]);
  
  // Aktif tab değiştiğinde scroll işlemini tekrarla - özellikle 'prediction' sekmesine geçildiğinde
  useEffect(() => {
    if (selectedMatchId && selectedMatchRef.current && activeTab === 'prediction') {
      // Tahmin sekmesine geçildiğinde otomatik kaydırma yap
      setTimeout(() => {
        if (selectedMatchRef.current) {
          selectedMatchRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center', // Tahmin için merkeze kaydır
          });
        }
      }, 100);
    }
  }, [activeTab, selectedMatchId]);

  const handleDateChange = useCallback((newDate: string) => {
    // Eğer zaten aynı tarih seçilmişse işlem yapma
    if (newDate === selectedDate) return;

    // Yükleme durumunu aktif et
    setIsDateLoading(true);

    // Kısa bir gecikme ekleyelim (gerçek yükleme simülasyonu için)
    setTimeout(() => {
      setSelectedDate(newDate);
      
      // Yükleme durumunu kapat
      setIsDateLoading(false);
    }, 300); // Hafif bir gecikme performans hissi verir
  }, [selectedDate]);

  const handlePredictionClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    const matchId = (e.currentTarget.dataset.matchId || '') as string
    if (matchId) {
      setSelectedMatchId(matchId)
      setActiveTab("prediction")
    }
  }, [])

  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Eğer arama yapılırsa ve seçili bir maç varsa, seçimi temizle
    if (e.target.value && selectedMatchId) {
      setSelectedMatchId(null);
    }
  }, [selectedMatchId]);

  const loadingMessage = (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="w-5 h-5 animate-spin mr-2" />
      <span>{t('loadingLiveMatchesStatus')}</span>
    </div>
  );

  const filterByTeamPlaceholder = t('filterByTeamName');
  const filterByLeaguePlaceholder = t('filterByLeagueName');
  const filterByCountryPlaceholder = t('filterByCountryName');

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="fixed inset-0 z-[9000] flex flex-col items-center justify-center bg-black bg-opacity-90">
          {/* Pulsing stadium lights */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-green-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-green-500/20 rounded-full blur-3xl animate-pulse-slow delay-75"></div>
            <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-green-500/20 rounded-full blur-3xl animate-pulse-slow delay-100"></div>
            <div className="absolute bottom-1/4 right-1/3 w-32 h-32 bg-green-500/20 rounded-full blur-3xl animate-pulse-slow delay-150"></div>
          </div>
          
          <div className="relative px-4 flex flex-col items-center">
            {/* Futbol sahası */}
            <div className="relative w-64 h-40 bg-gradient-to-b from-green-800 to-green-900 rounded-xl overflow-hidden mb-6 shadow-xl border border-green-700/50">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 border-2 border-white/30 rounded-full"></div>
                <div className="absolute w-40 h-[1px] bg-white/30"></div>
                <div className="absolute w-[1px] h-40 bg-white/30"></div>
              </div>
              
              {/* Dönen top */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-10 h-10 animate-spin-slow">
                  <div className="absolute inset-0 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <div className="w-9 h-9 rounded-full bg-[url('/ball.png')] bg-cover bg-center"></div>
                  </div>
                </div>
              </div>
              
              {/* Çim deseni */}
              <div className="absolute inset-0 bg-[url('/grass-pattern.png')] bg-repeat opacity-10"></div>
            </div>

            {/* Yükleme metni */}
            <div className="text-center space-y-4">
              <div className="relative">
                <h2 className="text-xl font-bold text-white relative transition-all duration-500 transform">
                  <span className="absolute -left-6 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="inline-block min-w-[300px]">Maçlar Yükleniyor...</span>
                  <span className="absolute -right-6 top-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full animate-pulse delay-75"></span>
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>{error}</AlertDescription>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => fetchUpcomingMatches(true)}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('tryAgain')}
        </Button>
      </Alert>
    )
  }

  if (selectedDate === "finished" && loadingFinished) {
    return (
      <div className="space-y-2 max-w-md mx-auto p-1">
        {/* Arena style header ve Ligler bölümü görünmeye devam edecek */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-3 rounded-lg border border-green-600/30 shadow-lg">
          {/* ... header içeriği ... */}
        </div>

        {/* Date filter tabs */}
        <div className="mb-2 relative">
          <Tabs defaultValue="today" value={selectedDate} onValueChange={handleDateChange} className="w-full">
            {/* ... tabs içeriği ... */}
          </Tabs>

          {/* Tamamlanan alt sekmeler */}
          <div className="mt-1 grid grid-cols-2 gap-1">
            {/* ... alt sekmeler içeriği ... */}
          </div>
        </div>

        {/* Ligler Bölümü */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-900 rounded-lg border border-green-600/30 p-2 shadow-lg">
          <SuspenseWrapper>
            <LazyLeaguesSection onMatchSelect={handleMatchClick} />
          </SuspenseWrapper>
        </div>

        {/* Kısmi yükleme efekti */}
        <div className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-900 rounded-lg border border-green-600/30 p-4 shadow-lg">
          <div className="absolute inset-0 bg-[url('/grass-pattern.png')] bg-repeat opacity-5"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          
          <div className="relative flex flex-col items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400/20 to-green-900/20 flex items-center justify-center border border-green-400/30 shadow-lg mb-2">
              <Loader2 className="w-5 h-5 animate-spin text-green-400" />
            </div>
            <p className="text-sm font-medium text-green-400 mb-2">
              {selectedFinishedDate === "yesterday" ? "Dünün Maçları" : "Bugünün Maçları"} Yükleniyor
            </p>
            <div className="w-full max-w-xs">
              <div className="h-1 bg-green-900/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                  style={{ width: '50%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tamamlanan maçlar için boş liste kontrolü
  if (selectedDate === "finished" && 
      ((selectedFinishedDate === "yesterday" && yesterdayFinished.length === 0) || 
       (selectedFinishedDate === "today" && todayFinished.length === 0))) {
    return (
      <div className="flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-8 h-8 text-yellow-500 mb-2" />
        <p className="text-xs text-slate-400 text-center">
          {selectedFinishedDate === "yesterday" 
            ? t('noFinishedMatchesYesterday') 
            : t('noFinishedMatchesToday')}
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          {t('matchesWillAppear')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-w-md mx-auto p-1 pb-16">
      {/* Arena style header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-3 rounded-lg border border-green-600/30 shadow-lg">
        {/* Stadium light effects */}
        <div className="absolute -top-10 left-1/4 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -top-10 right-1/4 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl"></div>
        
        {/* Grass pattern background */}
        <div className="absolute inset-0 bg-[url('/grass-pattern.png')] bg-repeat opacity-10"></div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400/20 to-green-900/20 flex items-center justify-center border border-green-400/30 shadow-lg">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="text-base font-bold text-white drop-shadow-lg">Yaklaşan Maçlar</h2>
          </div>
          <div className="flex items-center space-x-1">
            <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white text-xs py-0 px-2 shadow-[0_0_8px_rgba(34,197,94,0.3)] border-green-500/30">
              <Calendar className="w-3 h-3 mr-1" />
              {filteredMatches.length}
            </Badge>
            {cacheStatus && (
              <Badge variant="outline" className="text-[10px] py-0 px-2 border-emerald-600/30 text-emerald-400 bg-emerald-950/20">
                <Database className="w-2 h-2 mr-1" />
                {cacheStatus.includes("IndexedDB") ? "IDB" : "Cache"}
              </Badge>
            )}
            <Button
              size="sm"
              onClick={() => fetchUpcomingMatches(true)}
              className="bg-black text-white border-green-500/30
                hover:bg-slate-900 hover:border-green-400/50 h-7 min-w-[32px] text-xs px-2
                transition-all duration-300 relative overflow-hidden group shadow-lg"
              disabled={loading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Yenileniyor
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Yenile
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Date filter tabs with arena style */}
      <div className="mb-2 relative">
        <Tabs 
          defaultValue="today" 
          value={selectedDate} 
          onValueChange={handleDateChange}
          className="w-full"
        >
          <TabsList className="w-full relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-900 border border-green-600/30 h-10 p-1 shadow-lg">
            {/* Grass pattern and lighting effects */}
            <div className="absolute inset-0 bg-[url('/grass-pattern.png')] bg-repeat opacity-5"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            
            {/* Loading overlay */}
            {isDateLoading && (
              <div className="absolute inset-0 bg-green-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-green-400" />
                  <span className="text-xs text-green-400">Yükleniyor...</span>
                </div>
              </div>
            )}

            <TabsTrigger
              value="finished"
              className="relative flex-1 text-[11px] data-[state=active]:bg-black data-[state=active]:text-white h-8 transition-all duration-300 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Trophy className="w-3 h-3 mr-1 text-yellow-400" />
              <span className="truncate">Tamamlanan</span>
            </TabsTrigger>
            <TabsTrigger
              value="today"
              className="relative flex-1 text-[11px] data-[state=active]:bg-black data-[state=active]:text-white h-8 transition-all duration-300 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Calendar className="w-3 h-3 mr-1 text-green-400" />
              <span className="truncate">Bugün</span>
            </TabsTrigger>
            <TabsTrigger
              value="tomorrow"
              className="relative flex-1 text-[11px] data-[state=active]:bg-black data-[state=active]:text-white h-8 transition-all duration-300 overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="truncate">Yarın</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tamamlanan sekmesi alt sekmeler */}
        {selectedDate === "finished" && (
          <div className="mt-1 grid grid-cols-2 gap-1">
            <Button 
              variant={selectedFinishedDate === "yesterday" ? "default" : "outline"}
              size="sm" 
              className={`relative text-[11px] h-10 py-0 px-1 transition-all duration-300 overflow-hidden ${
                selectedFinishedDate === "yesterday" 
                  ? "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white shadow-[0_0_10px_rgba(234,179,8,0.3)]" 
                  : "bg-gradient-to-br from-green-900/90 to-green-800/90 text-green-400 border-green-700/50"
              }`}
              onClick={() => setSelectedFinishedDate("yesterday")}
            >
              <div className="absolute inset-0 bg-[url('/grass-pattern.png')] bg-repeat opacity-5"></div>
              <div className="relative flex flex-col items-center w-full">
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-400" />
                  <span>Dün</span>
                </div>
                <span className="text-[9px] opacity-80">({yesterdayFinished.length} Tamamlanan)</span>
              </div>
            </Button>
            <Button 
              variant={selectedFinishedDate === "today" ? "default" : "outline"}
              size="sm" 
              className={`relative text-[11px] h-10 py-0 px-1 transition-all duration-300 overflow-hidden ${
                selectedFinishedDate === "today" 
                  ? "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white shadow-[0_0_10px_rgba(234,179,8,0.3)]" 
                  : "bg-gradient-to-br from-green-900/90 to-green-800/90 text-green-400 border-green-700/50"
              }`}
              onClick={() => {
                if (todayFinished.length === 0) {
                  toast({
                    title: "Bugün Tamamlanan Maç Yok",
                    description: "Maçlar henüz tamamlanmadı",
                    variant: "destructive",
                    duration: 2000
                  });
                  return;
                }
                setSelectedFinishedDate("today")
              }}
            >
              <div className="absolute inset-0 bg-[url('/grass-pattern.png')] bg-repeat opacity-5"></div>
              <div className="relative flex flex-col items-center w-full">
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-green-400" />
                  <span>Bugün</span>
                </div>
                <span className="text-[9px] opacity-80">({todayFinished.length} Tamamlanan)</span>
              </div>
            </Button>
          </div>
        )}
      </div>

      {/* Ligler Bölümü - Arena stili */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-900 rounded-lg border border-green-600/30 p-2 shadow-lg">
        {/* Stadium effects */}
        <div className="absolute inset-0 bg-[url('/grass-pattern.png')] bg-repeat opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        <div className="absolute -top-10 left-1/4 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -top-10 right-1/4 w-32 h-32 bg-yellow-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative">
          <SuspenseWrapper>
            <LazyLeaguesSection onMatchSelect={handleMatchClick} />
          </SuspenseWrapper>
        </div>
      </div>

      {/* Arama ve Filtreler - Arena stili */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-900 rounded-lg border border-green-600/30 p-3 shadow-lg">
        {/* Stadium effects */}
        <div className="absolute inset-0 bg-[url('/grass-pattern.png')] bg-repeat opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        
        <div className="relative">
          {/* Takım arama */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-green-400" />
            <Input
              type="text"
              placeholder="Takım Ara..."
              className="pl-7 pr-7 text-xs bg-gradient-to-br from-green-800/50 to-green-900/50 border-green-600/30 text-white h-8 focus:ring-2 focus:ring-green-500/20 transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:text-red-400 transition-colors duration-300"
                onClick={() => setSearchTerm("")}
                aria-label="Aramayı Temizle"
              >
                <X className="h-3 w-3 text-green-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtreleme sonuçları - Arena stili */}
      {debouncedSearchTerm && (
        <div className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-900 rounded-lg border border-green-600/30 p-2 shadow-lg">
          <div className="absolute inset-0 bg-[url('/grass-pattern.png')] bg-repeat opacity-5"></div>
          <div className="relative text-xs text-green-300">
            {filteredMatches.length > 0 ? (
              <span>
                <span className="text-yellow-400 font-bold">{filteredMatches.length}</span> maç bulundu: "{debouncedSearchTerm}"
              </span>
            ) : (
              <span className="text-red-400">
                "{debouncedSearchTerm}" için sonuç bulunamadı
              </span>
            )}
          </div>
        </div>
      )}

      {/* Maç listesi - mevcut haliyle devam */}
      <div className="space-y-2">
        {isDateLoading ? (
          <div className="flex flex-col items-center justify-center p-6">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
            <p className="mt-2 text-xs text-green-400">Yükleniyor...</p>
            <Progress 
              value={50} 
              className="w-full max-w-xs mt-2 h-1"
              indicatorColor="bg-green-500"
            />
          </div>
        ) : selectedDate === "finished" && filteredMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-4 text-center bg-slate-800/50 rounded border border-slate-700">
            <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">
              {selectedFinishedDate === "today" 
                ? "Bugün Tamamlanan Maç Yok" 
                : "Dün Tamamlanan Maç Yok"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Maçlar henüz tamamlanmadı
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchYesterdayFinishedMatches(true)}
              className="bg-green-900/30 border-green-700/50 text-green-400 hover:bg-green-800/50"
            >
              Tekrar Dene
            </Button>
          </div>
        ) : (
          <div className="match-card mobile-scrollbar">
            <LazyMatchList
              matches={Object.entries(matchesByDate)
                .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())}
              selectedMatchId={selectedMatchId}
              handleMatchClick={handleMatchClick}
              isLoadingDetails={isLoadingDetails}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              homeLastMatches={homeLastMatches}
              awayLastMatches={awayLastMatches}
              formatDateForDisplay={formatDateForDisplay}
              selectedMatchRef={selectedMatchRef}
            />
          </div>
        )}
      </div>
    </div>
  )
}


