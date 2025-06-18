"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { getLiveMatches, getMatchStatistics, getStandings, getMatchDetails, getUpcomingMatches, getAllLeagues } from "@/lib/football-api"
import { useTranslation } from "./language-provider"
import { cacheService as indexedCache } from "@/lib/cache-service"
import {
  Star,
  StarOff,
  Trophy,
  RefreshCw,
  Loader2,
  AlertCircle,
  Clock,
  PieChart,
  BarChart,
  Activity,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  MapPin,
  Maximize2,
  Search,
  Filter,
  SortDesc,
  Globe,
  Flag,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Heart,
  Check,
  Sparkles,
  AlarmClock,
  Bell
} from "lucide-react"
import { UpcomingMatchPrediction } from "./upcoming-match-prediction"
import { LastTenMatchAnalysis } from "./last-ten-match-analysis"
import { H2HAnalysis } from "./h2h-analysis"

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
  stats?: any
}

const CACHE_KEY = "live_matches_v1"
const AUTO_REFRESH_INTERVAL = 30000 // 30 saniye

const LiveMatchCard = ({
  match,
  isSelected,
  onSelect,
  setActiveTab,
  activeTab,
  onPredictionClick,
  onDetailsClick
}: {
  match: Match,
  isSelected: boolean,
  onSelect: (match: Match) => void,
  setActiveTab: (tab: string) => void,
  activeTab: string,
  onPredictionClick: (match: Match) => void,
  onDetailsClick: (match: Match) => void
}) => {
  const { t } = useTranslation();
  const homeScore = match.match_hometeam_score || "0";
  const awayScore = match.match_awayteam_score || "0";
  const matchStatus = match.match_status || "";
  const matchElapsed = match.match_elapsed || "";

  const getStatusText = () => {
    switch (matchStatus) {
      case "1H": return t('matchStatusDisplayFirstHalf');
      case "HT": return t('matchStatusDisplayHalfTime');
      case "2H": return t('matchStatusDisplaySecondHalf');
      case "FT": return t('matchStatusDisplayFullTime');
      case "ET": return t('matchStatusDisplayOvertime');
      case "P": return t('matchStatusDisplayPenalties');
      default: return t('matchStatusDisplayLive');
    }
  };

  return (
    <div 
      className={`relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer ${
        isSelected ? "shadow-xl ring-2 ring-emerald-500 bg-slate-800/90" : "shadow-md hover:shadow-lg bg-slate-800/70 hover:bg-slate-800/80"
      } mb-3`}
      onClick={() => onSelect(match)}
    >
      {/* Stadium background effect */}
      <div className="absolute inset-0 bg-[url('/stadium-pattern.png')] bg-repeat opacity-5 z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-slate-900/30 to-slate-900/40 z-0"></div>
      
      {/* Field lines */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/5"></div>
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5"></div>
        <div className="absolute left-1/2 top-1/2 w-10 h-10 -ml-5 -mt-5 border border-white/5 rounded-full"></div>
      </div>
      
      {/* Stadium lights glow */}
      <div className="absolute -top-2 -left-2 w-10 h-10 bg-emerald-400 rounded-full blur-xl opacity-10 z-0"></div>
      <div className="absolute -top-2 -right-2 w-10 h-10 bg-emerald-400 rounded-full blur-xl opacity-10 z-0"></div>
      
      {/* Header bar with league info */}
      <div className="relative z-10 flex items-center justify-between p-2 border-b border-slate-700/50 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80">
        <div className="flex items-center space-x-1">
          {match.league_logo && (
            <img
              src={match.league_logo || "/placeholder.svg"}
              alt={match.league_name}
              className="w-4 h-4 rounded-full"
              loading="lazy"
            />
          )}
          <span className="text-xs font-medium text-emerald-400 truncate max-w-[150px]">
            {match.league_name}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="bg-slate-900/70 px-2 py-0.5 rounded text-[10px] text-slate-300 flex items-center">
            <Clock className="w-3 h-3 mr-1 text-emerald-400" />
            <span>{match.match_date}</span>
          </div>
          <div className={`
            px-2 py-0.5 rounded text-[10px] text-white flex items-center
            ${matchStatus === 'HT' ? 'bg-amber-600/80' : 
              matchStatus === 'FT' ? 'bg-slate-600/80' : 'bg-red-600/80 animate-pulse'}
          `}>
            <span className="w-1 h-1 bg-white rounded-full mr-1"></span>
            <span>{getStatusText()} {matchElapsed && `${matchElapsed}'`}</span>
          </div>
        </div>
      </div>

      {/* Main content with arena styling */}
      <div className="relative z-10 p-4">
        <div className="flex items-center justify-between">
          {/* Home team */}
          <div className="flex flex-col items-center w-2/5 text-center">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600/30 to-emerald-800/30 rounded-full blur-sm"></div>
              <div className="w-14 h-14 mb-2 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 p-1.5 shadow-lg overflow-hidden relative">
                {match.team_home_badge ? (
                  <img
                    src={match.team_home_badge || "/placeholder.svg"}
                    alt={match.match_hometeam_name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=48&width=48"
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-lg font-bold text-white">
                    {match.match_hometeam_name.substring(0, 1)}
                  </div>
                )}
              </div>
            </div>
            <span className="text-sm font-medium text-white truncate max-w-full">
              {match.match_hometeam_name}
            </span>
          </div>

          {/* Score with arena styling */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-600/20 via-red-600/20 to-emerald-600/20 rounded-lg blur-md"></div>
              <div className="bg-gradient-to-b from-slate-800 to-slate-900 px-5 py-2 rounded-lg shadow-lg border border-slate-700/50 mb-1 relative">
                <div className="absolute inset-0 bg-[url('/stadium-pattern.png')] bg-repeat opacity-5"></div>
                <div className="flex items-center justify-center">
                  <span className="text-3xl font-bold text-emerald-400">{homeScore}</span>
                  <span className="text-xl mx-2 text-slate-400">-</span>
                  <span className="text-3xl font-bold text-emerald-400">{awayScore}</span>
                </div>
                <div className="text-[10px] text-center text-slate-400 mt-1">
                  {matchStatus === 'HT' && `(${match.match_hometeam_halftime_score || '0'} - ${match.match_awayteam_halftime_score || '0'})`}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-1"></span>
              <span className="text-xs text-red-400 font-medium">
                {matchElapsed && `${matchElapsed}'`}
              </span>
            </div>
          </div>

          {/* Deplasman takımı */}
          <div className="flex flex-col items-center w-2/5 text-center">
            <div className="w-12 h-12 mb-2 rounded-full bg-slate-700/80 p-1 shadow-inner overflow-hidden">
              {match.team_away_badge ? (
                <img
                  src={match.team_away_badge || "/placeholder.svg"}
                  alt={match.match_awayteam_name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=48&width=48"
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-lg font-bold text-white">
                  {match.match_awayteam_name.substring(0, 1)}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-white truncate max-w-full">
              {match.match_awayteam_name}
            </span>
          </div>
        </div>

        {match.match_stadium && (
          <div className="flex items-center justify-center text-xs text-slate-400 mb-3">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate">{match.match_stadium}</span>
          </div>
        )}

        {/* Butonlar */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <button 
            onClick={e => {
              e.stopPropagation();
              onDetailsClick(match);
            }}
            className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg shadow-md transition-all duration-200 text-xs"
          >
            <span className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse"></span>
            {t('watchLiveButtonText')}
          </button>
          <button 
            onClick={e => {
              e.stopPropagation();
              onPredictionClick(match);
            }}
            className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-lg shadow-md transition-all duration-200 text-xs"
          >
            <Zap className="w-3 h-3 mr-1" />
            {t('livePredictionButtonText')}
          </button>
        </div>
      </div>
    </div>
  )
}

const LiveMatchDetails = ({ match }: { match: Match }) => {
  const [stats, setStats] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch match statistics and details in parallel
        const [statsData, detailsData] = await Promise.all([
          getMatchStatistics(match.match_id),
          getMatchDetails(match.match_id),
        ]);
        setStats(statsData);
        // detailsData is usually an array, take the first element
        setDetails(Array.isArray(detailsData) ? detailsData[0] : detailsData);
      } catch (error) {
        setStats(null);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [match.match_id]);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
      </div>
    );
  }

  if (!stats && !details) {
    return (
      <div className="text-center p-4">
        <p className="text-xs text-slate-400">{t('noMatchStatsFound')}</p>
      </div>
    );
  }

  // Score information
  const homeScore = match.match_hometeam_score || details?.match_hometeam_score || "0";
  const awayScore = match.match_awayteam_score || details?.match_awayteam_score || "0";
  const homeHalfScore = match.match_hometeam_halftime_score || details?.match_hometeam_halftime_score || "0";
  const awayHalfScore = match.match_awayteam_halftime_score || details?.match_awayteam_halftime_score || "0";

  // Goals and cards (details.events or similar field)
  let goals: any[] = [];
  let yellowCards: any[] = [];
  let redCards: any[] = [];
  if (details && Array.isArray(details.goalscorer)) {
    goals = details.goalscorer.map((g: any) => ({
      minute: g.time,
      scorer: g.home_scorer !== "" ? g.home_scorer : g.away_scorer,
      team: g.home_scorer !== "" ? "home" : "away",
    }));
  }
  if (details && Array.isArray(details.cards)) {
    yellowCards = details.cards.filter((c: any) => c.card === "yellow card");
    redCards = details.cards.filter((c: any) => c.card === "red card");
  }

  return (
    <div className="space-y-3">
      {/* Match status and score */}
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
      {/* Score details */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-slate-400 mb-1">{match.match_hometeam_name}</div>
              <div className="text-2xl font-bold text-white">{homeScore}</div>
              {match.match_status !== "1H" && (
                <div className="text-xs text-slate-400">{t('firstHalf')}: {homeHalfScore}</div>
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
                <div className="text-xs text-slate-400">{t('firstHalf')}: {awayHalfScore}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Statistics */}
      {stats && (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
            <h3 className="text-sm font-medium text-center text-red-400 mb-3">{t('matchStatistics')}</h3>
            {/* Possession */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{stats.possession.home}%</span>
                <span>{t('ballPossession')}</span>
                <span>{stats.possession.away}%</span>
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
            
            {/* Shots */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{stats.shots.home}</span>
                <span>{t('shots')}</span>
                <span>{stats.shots.away}</span>
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
            
            {/* Shots on target */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{stats.shotsOnTarget.home}</span>
                <span>{t('shotsOnTarget')}</span>
                <span>{stats.shotsOnTarget.away}</span>
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
            
            {/* Other statistics */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="flex justify-between">
                  <span className="text-xs text-green-400">{stats.corners.home}</span>
                  <span className="text-xs text-slate-400">{t('corners')}</span>
                  <span className="text-xs text-yellow-400">{stats.corners.away}</span>
                </div>
              </div>
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="flex justify-between">
                  <span className="text-xs text-green-400">{stats.fouls.home}</span>
                  <span className="text-xs text-slate-400">{t('fouls')}</span>
                  <span className="text-xs text-yellow-400">{stats.fouls.away}</span>
                </div>
              </div>
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="flex justify-between">
                  <span className="text-xs text-green-400">{stats.yellowCards.home}</span>
                  <span className="text-xs text-slate-400">{t('yellowCards')}</span>
                  <span className="text-xs text-yellow-400">{stats.yellowCards.away}</span>
                </div>
              </div>
              <div className="bg-slate-700/30 p-2 rounded">
                <div className="flex justify-between">
                  <span className="text-xs text-green-400">{stats.redCards.home}</span>
                  <span className="text-xs text-slate-400">{t('redCards')}</span>
                  <span className="text-xs text-yellow-400">{stats.redCards.away}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Faktörler: Gol atanlar ve kartlar */}
      <div className="mt-4 space-y-2">
        <h4 className="text-xs font-bold text-green-400">{t('factors')}</h4>
        <div className="flex flex-wrap gap-2 text-xs">
          {goals.length > 0 && (
            <span className="bg-green-500/20 text-green-500 px-2 py-1 rounded">
              {t('goals')}: {goals.map((g) => `${g.minute}' ${g.scorer}`).join(", ")}
            </span>
          )}
          {yellowCards.length > 0 && (
            <span className="bg-yellow-400/20 text-yellow-500 px-2 py-1 rounded">
              {t('yellowCards')}: {yellowCards.map((c: any) => `${c.time}' ${c.home_fault || c.away_fault}`).join(", ")}
            </span>
          )}
          {redCards.length > 0 && (
            <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded">
              {t('redCards')}: {redCards.map((c: any) => `${c.time}' ${c.home_fault || c.away_fault}`).join(", ")}
            </span>
          )}
          {goals.length === 0 && yellowCards.length === 0 && redCards.length === 0 && (
            <span className="text-slate-400">{t('noFactorData')}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Takımı puan durumu listesinde bulmak için yardımcı fonksiyon
const findTeamInStandings = async (standings: any[], teamId: string, teamName: string) => {
  // Önce ID ile eşleşme ara
  let teamStanding = standings.find((item: any) => {
    return item.team_id === teamId || 
           item.team_id === parseInt(teamId) || 
           item.team_id === teamId.toString();
  });
  
  // ID ile bulunamadıysa, takım adı ile ara (tam veya kısmi eşleşme)
  if (!teamStanding) {
    // Takım adını küçük harfe çevir ve normalize et
    const normalizedTeamName = teamName.toLowerCase().trim();
    
    teamStanding = standings.find((item: any) => {
      // Takım adı tam eşleşme
      if (item.team_name && item.team_name.toLowerCase().trim() === normalizedTeamName) {
        return true;
      }
      
      // Kısmi eşleşme (takım adı diğerini içeriyor mu?)
      if (item.team_name && 
          (item.team_name.toLowerCase().includes(normalizedTeamName) || 
           normalizedTeamName.includes(item.team_name.toLowerCase()))) {
        return true;
      }
      
      return false;
    });
  }
  
  if (teamStanding) {
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
  
  return null;
};

// API'den takımın puan durumunu çek
const getTeamStandings = async (teamId: string, teamName: string, leagueId?: string) => {
  try {
    // Gerçek API'den takımın lig bilgilerini çek
    if (!leagueId) {
      // Takımın lig bilgisi yoksa, varsayılan bir lig ID'si kullanıyoruz
      leagueId = "148"; // Süper Lig ID'si varsayılan olarak
    }
    
    // Ligin puan durumunu çek
    const standings = await getStandings(leagueId);
    
    if (!Array.isArray(standings) || standings.length === 0) {
      // Alternatif ligler denenebilir
      const alternativeLeagueIds = ["148", "152", "302", "175", "207"];
      
      // Eğer verilen lig ID'si zaten alternatifler listesinde değilse deneme yap
      if (!alternativeLeagueIds.includes(leagueId)) {
        for (const altLeagueId of alternativeLeagueIds) {
          try {
            const altStandings = await getStandings(altLeagueId);
            if (Array.isArray(altStandings) && altStandings.length > 0) {
              return await findTeamInStandings(altStandings, teamId, teamName);
            }
          } catch (e) {
            console.log(`${altLeagueId} ID'li alternatif lig için hata:`, e);
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
  const { t } = useTranslation()
  const [homeStanding, setHomeStanding] = useState<any>(null)
  const [awayStanding, setAwayStanding] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStandings = async () => {
      try {
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
      {/* Position Comparison */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-slate-400 mb-1">{homeTeam}</div>
              <Badge
                className={`text-xs ${homeStanding.position <= awayStanding.position ? "bg-green-600" : "bg-red-600"}`}
              >
                {homeStanding.position}. sıra
              </Badge>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs text-slate-400 mb-1">Sıra Farkı</div>
              <div className="text-xs text-slate-400">{Math.abs(positionDiff)} sıra</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">{awayTeam}</div>
              <Badge
                className={`text-xs ${awayStanding.position <= homeStanding.position ? "bg-green-600" : "bg-red-600"}`}
              >
                {awayStanding.position}. sıra
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
              <div className="text-xs text-slate-400">{t('pointsLabel')}</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs text-slate-400 mb-1">{t('pointsDifference')}</div>
              <Badge variant="outline" className="text-xs">
                {Math.abs(pointsDiff)} {t('pointsLabel')}
              </Badge>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">{awayStanding.points}</div>
              <div className="text-xs text-slate-400">{t('pointsLabel')}</div>
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
                  <span className="text-slate-400">{t('matchLabel')}:</span>
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
                  <span className="text-slate-400">{t('goalsForAgainstShort')}:</span>
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
                  <span className="text-slate-400">{t('matchLabel')}:</span>
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
                  <span className="text-slate-400">{t('goalsForAgainstShort')}:</span>
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

// Ülke tipi
interface Country {
  country_id: string;
  country_name: string;
  country_logo?: string;
}

// Lig tipi
interface League {
  league_id: string;
  league_name: string;
  league_logo?: string;
  country_id: string;
  country_name: string;
  country_logo?: string; // country_logo ekledim
  has_live_match?: boolean;
}

// CSS sınıfları
const styles = {
  hideScrollbar: `
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }
  `,
};

// Favori ligler için local storage key
const FAVORITE_LEAGUES_KEY = "favorite_leagues_v1";

export function LiveMatchTracker({ initialMatchId }: { initialMatchId?: string }) {
  const { t } = useTranslation()
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState("detaylar")
  const [showPredictionModal, setShowPredictionModal] = useState(false)
  const [predictionMatch, setPredictionMatch] = useState<Match | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [detailsMatch, setDetailsMatch] = useState<Match | null>(null)
  const [detailsActiveTab, setDetailsActiveTab] = useState("detaylar")
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null) // Başlangıçta hiçbir lig seçili değil
  const [showLeaguesModal, setShowLeaguesModal] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<string>("all-countries")
  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<'all' | 'favorites'>('all')
  const [showAllLeagues, setShowAllLeagues] = useState(false)
  const [upcomingMatchesCount, setUpcomingMatchesCount] = useState(0)
  const [showLeaguesList, setShowLeaguesList] = useState(true)
  const [showLiveMatchView, setShowLiveMatchView] = useState(false)
  const [selectedLeagueMatches, setSelectedLeagueMatches] = useState<Match[]>([])
  const [selectedLeagueName, setSelectedLeagueName] = useState<string>("")
  const [allApiLeagues, setAllApiLeagues] = useState<any[]>([]) // Tüm API liglerini tutmak için state
  const [loadingLeagues, setLoadingLeagues] = useState(false) // Ligler yüklenirken gösterilecek loading state
  // 1. allMatches dizisini oluştur (canlı + yaklaşan maçlar)
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  // Ligler modalı için gösterilecek lig sayısı state'i
  const [showLeagueCount, setShowLeagueCount] = useState(30);
  // Arama metni için state ekleyelim
  const [searchText, setSearchText] = useState<string>("");
  
  // Tüm maçları çek (canlı + yaklaşan)
  const fetchAllMatches = useCallback(async (forceRefresh = false) => {
    try {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const allMatchesData = await getUpcomingMatches(
        today.toISOString().split("T")[0],
        nextWeek.toISOString().split("T")[0]
      );
      if (Array.isArray(allMatchesData)) {
        setAllMatches(allMatchesData);
      }
    } catch (error) {
      console.error("Error fetching all matches:", error);
      setAllMatches([]);
    }
  }, []);
  
  useEffect(() => {
    fetchAllMatches();
  }, [fetchAllMatches]);
  
  // API'den tüm ligleri çek
  const fetchAllLeagues = useCallback(async () => {
    try {
      setLoadingLeagues(true);
      const allLeaguesData = await getAllLeagues();
      if (Array.isArray(allLeaguesData)) {
        setAllApiLeagues(allLeaguesData);
      }
    } catch (error) {
      console.error("Error fetching all leagues:", error);
    } finally {
      setLoadingLeagues(false);
    }
  }, []);
  
  // Component mount olduğunda tüm ligleri çek
  useEffect(() => {
    fetchAllLeagues();
  }, [fetchAllLeagues]);
  
  // Canlı maç görüntüleme arayüzünü aç
  const openLiveMatchView = (leagueId: string, leagueName: string) => {
    setSelectedLeague(null); // Ana sayfada maçları gösterme
    closeLeaguesModal();
    showLeagueSelectedNotification(`${leagueName} ${t('liveMatchesBeingDisplayed')}`);
    
    // Tüm maçlar içinden filtrele
    const leagueMatches = allMatches.filter(match => match.league_id === leagueId);
    
    console.log(`Lig ID: ${leagueId}, Lig Adı: ${leagueName}, Bulunan Maç Sayısı: ${leagueMatches.length}`);
    console.log('Tüm maçlar:', allMatches.length);
    
    // Eğer hiç maç bulunamadıysa, API'den yeniden çekelim
    if (leagueMatches.length === 0) {
      console.log('Bu lig için maç bulunamadı, API\'den yeniden çekiliyor...');
      
      // Kullanıcıya bildirim göster
      showLeagueSelectedNotification(`${leagueName} için maçlar yükleniyor...`);
      
      // Önce tüm maçları yeniden çekelim
      fetchAllMatches(true).then(() => {
        // API'den çekildikten sonra tekrar filtreleyelim
        const refreshedLeagueMatches = allMatches.filter(match => match.league_id === leagueId);
        console.log(`Yeniden çekme sonrası bulunan maç sayısı: ${refreshedLeagueMatches.length}`);
        
        if (refreshedLeagueMatches.length > 0) {
          setSelectedLeagueMatches(refreshedLeagueMatches);
          showLeagueSelectedNotification(`${leagueName} için ${refreshedLeagueMatches.length} maç bulundu`);
        } else {
          console.error(`${leagueName} için hiç maç bulunamadı!`);
          showLeagueSelectedNotification(`${leagueName} için maç bulunamadı`, "error");
          // Alternatif olarak tüm maçları göster
          setSelectedLeagueMatches(allMatches);
        }
      }).catch(error => {
        console.error('Maçlar yüklenirken hata oluştu:', error);
        showLeagueSelectedNotification(`Maçlar yüklenirken hata oluştu`, "error");
        // Hata durumunda mevcut maçları göster
        setSelectedLeagueMatches([]);
      });
    } else {
      setSelectedLeagueMatches(leagueMatches);
    }
    
    setShowLiveMatchView(true);
    setSelectedLeagueName(leagueName);
  };
  
  // Favori ligleri local storage'dan yükle
  useEffect(() => {
    const storedFavorites = localStorage.getItem(FAVORITE_LEAGUES_KEY);
    if (storedFavorites) {
      try {
        setFavoriteLeagues(JSON.parse(storedFavorites));
      } catch (e) {
        console.error(t('errorLoadingFavoriteLeagues'), e);
        setFavoriteLeagues([]);
      }
    }
  }, [t]);
  
  // Favori ligleri kaydet
  const saveFavoriteLeagues = useCallback((leagueIds: string[]) => {
    setFavoriteLeagues(leagueIds);
    localStorage.setItem(FAVORITE_LEAGUES_KEY, JSON.stringify(leagueIds));
  }, []);
  
  // Lig favorilere ekle/çıkar
  const toggleFavoriteLeague = useCallback((leagueId: string) => {
    setFavoriteLeagues(prev => {
      const isAlreadyFavorite = prev.includes(leagueId);
      const newFavorites = isAlreadyFavorite 
        ? prev.filter(id => id !== leagueId)
        : [...prev, leagueId];
      
      localStorage.setItem(FAVORITE_LEAGUES_KEY, JSON.stringify(newFavorites));
      return newFavorites;
    });
  }, []);
  
  // Mevcut ligleri ve ülkeleri çıkar
  const { leagues, countries, allLeagues } = useMemo(() => {
    const leagueMap = new Map<string, League>();
    const countryMap = new Map<string, Country>();
    const allLeaguesSet = new Set<string>();
    
    // Önce canlı maçlardan ligleri topla
    matches.forEach(match => {
      // Lig bilgilerini topla
      if (match.league_id && !leagueMap.has(match.league_id)) {
        leagueMap.set(match.league_id, {
          league_id: match.league_id,
          league_name: match.league_name,
          league_logo: match.league_logo,
          country_id: match.country_name ? match.country_name : 'unknown',
          country_name: match.country_name || 'Bilinmeyen Ülke',
          country_logo: match.country_logo,
          has_live_match: true
        });
        allLeaguesSet.add(match.league_name);
      }
      
      // Ülke bilgilerini topla
      if (match.country_name && !countryMap.has(match.country_name)) {
        countryMap.set(match.country_name, {
          country_id: match.country_name,
          country_name: match.country_name,
          country_logo: match.country_logo
        });
      }
    });
    
    // API'den çekilen tüm ligleri ekle
    allApiLeagues.forEach(league => {
      if (!leagueMap.has(league.league_id)) {
        leagueMap.set(league.league_id, {
          league_id: league.league_id,
          league_name: league.league_name,
          league_logo: league.league_logo,
          country_id: league.country_id,
          country_name: league.country_name,
          country_logo: league.country_logo,
          has_live_match: false
        });
        
        // Ülke bilgilerini de ekle
        if (!countryMap.has(league.country_name)) {
          countryMap.set(league.country_name, {
            country_id: league.country_id,
            country_name: league.country_name,
            country_logo: league.country_logo
          });
        }
      }
    });
    
    return {
      leagues: Array.from(leagueMap.values()),
      countries: Array.from(countryMap.values()),
      allLeagues: Array.from(allLeaguesSet)
    };
  }, [matches, allApiLeagues]);
  
  // Ligleri maç sayısına göre sırala
  const sortedLeagues = useMemo(() => {
    return leagues
      .map(league => ({
        ...league,
        matchCount: matches.filter(match => match.league_id === league.league_id).length,
        isFavorite: favoriteLeagues.includes(league.league_id)
      }))
      // Sadece maçı olan ligleri filtrele
      .filter(league => league.matchCount > 0)
      .sort((a, b) => {
        // Önce canlı maçı olan ligler
        if (a.has_live_match && !b.has_live_match) return -1;
        if (!a.has_live_match && b.has_live_match) return 1;
        // Sonra maç sayısına göre
        return b.matchCount - a.matchCount;
      });
  }, [leagues, matches, favoriteLeagues]);
  
  // Tüm ligleri göster - API'den çekilen ve canlı maçı olmayan ligleri de içerir
  const allSortedLeagues = useMemo(() => {
    return leagues
      .map(league => ({
        ...league,
        matchCount: matches.filter(match => match.league_id === league.league_id).length,
        isFavorite: favoriteLeagues.includes(league.league_id)
      }))
      .sort((a, b) => {
        // Önce canlı maçı olan ligler
        if (a.matchCount > 0 && b.matchCount === 0) return -1;
        if (a.matchCount === 0 && b.matchCount > 0) return 1;
        // Sonra favori ligler
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        // Son olarak alfabetik sıralama
        return a.league_name.localeCompare(b.league_name);
      });
  }, [leagues, matches, favoriteLeagues]);
  
  // Favori ligler - Tüm ligler içinden favorileri filtrele
  const favoriteSortedLeagues = useMemo(() => {
    return allSortedLeagues.filter(league => league.isFavorite);
  }, [allSortedLeagues]);
  
  // Seçilen ülkeye göre filtrelenmiş ligler
  const filteredLeagues = useMemo(() => {
    let filtered = allSortedLeagues;
    
    // Önce ülke filtrelemesini yapalım
    if (selectedCountry !== "all-countries") {
      filtered = filtered.filter(league => league.country_id === selectedCountry);
    }
    
    // Sonra arama metnine göre filtreleme yapalım
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(league => 
        league.league_name.toLowerCase().includes(searchLower) || 
        league.country_name.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [allSortedLeagues, selectedCountry, searchText]);
  
  // filteredLeagues değişirse (ülke değişimi, arama vs.), gösterilen lig sayısını sıfırla
  useEffect(() => {
    setShowLeagueCount(30);
  }, [filteredLeagues]);
  
  // Ligler değiştiğinde veya seçilen lig değiştiğinde maçları filtrele
  useEffect(() => {
    // showLiveMatchView aktifse filtreleme yapma
    if (showLiveMatchView) {
      setFilteredMatches([]);
      return;
    }
    
    if (!selectedLeague) {
      // Hiçbir lig seçili değilse, filtrelenmiş maçları boşalt
      setFilteredMatches([]);
    } else if (selectedLeague === "all-leagues") {
      setFilteredMatches(matches);
    } else {
      setFilteredMatches(matches.filter(match => match.league_id === selectedLeague));
    }
  }, [matches, selectedLeague, showLiveMatchView]);
  
  // Canlı maçları çek
  const fetchLiveMatches = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      
      // Check cache first (unless forceRefresh is true)
      if (!forceRefresh) {
        const cachedData = await indexedCache.get(CACHE_KEY)
        if (cachedData) {
          setMatches(cachedData as Match[])
          setLastRefresh(new Date())
          setLoading(false)
          return
        }
      } else {
        // Clear cache if force refresh
        indexedCache.invalidate(CACHE_KEY)
      }
      
      // Fetch live matches from API
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(today.getDate() + 7)
      
      const allMatches = await getUpcomingMatches(
        today.toISOString().split("T")[0],
        nextWeek.toISOString().split("T")[0]
      )
      
      // Filter only live matches
      const liveMatches = Array.isArray(allMatches) ? allMatches.filter(match => match.match_live === "1") : []
      
      if (liveMatches.length > 0) {
        setMatches(liveMatches)
        
        // Cache to IndexedDB
        await indexedCache.set(CACHE_KEY, liveMatches)
      } else {
        setMatches([])
        setError(t('noLiveMatchesFound'))
      }
      
      setLastRefresh(new Date())
    } catch (err) {
      console.error("Error fetching live matches:", err)
      setError(t('errorLoadingLiveMatches'))
    } finally {
      setLoading(false)
    }
  }, [t])
  
  // Initial fetch
  useEffect(() => {
    fetchLiveMatches()
  }, [fetchLiveMatches])
  
  // Eğer initialMatchId verilmişse, o maçı seçili hale getir
  useEffect(() => {
    if (initialMatchId && matches.length > 0) {
      const match = matches.find(m => m.match_id === initialMatchId);
      if (match) {
        setSelectedMatch(match);
      }
    }
  }, [initialMatchId, matches]);
  
  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchLiveMatches(true)
    }, AUTO_REFRESH_INTERVAL)
    
    return () => clearInterval(interval)
  }, [autoRefresh, fetchLiveMatches])
  
  // Maç seçildiğinde grafik için de ayarla
  const handleMatchSelect = useCallback((match: Match) => {
    setSelectedMatch(prev => prev?.match_id === match.match_id ? null : match)
  }, [])
  
  const handlePredictionClick = useCallback((match: Match) => {
    setPredictionMatch(match);
    setShowPredictionModal(true);
  }, [])
  
  const handleDetailsClick = useCallback((match: Match) => {
    setDetailsMatch(match);
    setDetailsActiveTab("detaylar");
    setShowDetailsModal(true);
  }, [])
  
  const closePredictionModal = useCallback(() => {
    setShowPredictionModal(false);
    setPredictionMatch(null);
  }, [])
  
  const closeDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
    setDetailsMatch(null);
    // Detay modalı kapatıldığında mevcut görünümü korumak için hiçbir şey yapmıyoruz
    // Eğer showLiveMatchView aktifse, o görünümde kalacak
  }, [])
  
  const handleRefresh = useCallback(() => {
    fetchLiveMatches(true)
  }, [fetchLiveMatches])
  
  const closeLeaguesModal = useCallback(() => {
    setShowLeaguesModal(false);
  }, []);
  
  const handleLeagueSelect = useCallback((leagueId: string) => {
    setSelectedLeague(leagueId);
    setShowLeaguesModal(false);
  }, []);
  
  useEffect(() => {
    const currentTime = new Date();
    const upcomingCount = matches.filter(match => {
      if (match.match_live === "1") return false;
      const matchTime = new Date();
      const [hours, minutes] = (match.match_time || "").split(":").map(Number);
      matchTime.setHours(hours || 0, minutes || 0);
      return matchTime > currentTime;
    }).length;
    setUpcomingMatchesCount(upcomingCount);
  }, [matches]);
  
  // Android uyumluluğu için CSS ekleme
  useEffect(() => {
    // Android için özel stil eklemeleri
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .hide-scrollbar {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .android-scroll-container {
        -webkit-overflow-scrolling: touch;
        overflow-y: auto;
      }
      .android-scroll-content {
        padding-bottom: 60px;
      }
      .android-notification {
        animation: fadeInUp 0.3s ease-out forwards;
      }
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Infinite scroll için scroll event handler
  const handleLeaguesScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 100) {
      // Sona yaklaşıldıysa 30 daha lig yükle
      setShowLeagueCount(prevCount => prevCount + 30);
    }
  }, []);
  
  if (loading && !matches.length) {
    return (
      <div className="space-y-4 p-4 max-w-md mx-auto android-scroll-container">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-green-400">{t('liveMatchTracking')}</h2>
        </div>
        
        <div className="fixed inset-0 z-[9000] flex flex-col items-center justify-center bg-black bg-opacity-80">
          <div className="relative px-4">
            {/* Stadyum arka plan efekti */}
            <div className="absolute -inset-10 bg-gradient-to-b from-blue-900/40 to-blue-950/60 rounded-full blur-xl"></div>
            
            {/* Futbol sahası */}
            <div className="relative w-64 h-40 bg-gradient-to-b from-emerald-800 to-emerald-900 rounded-xl overflow-hidden mb-6 shadow-xl border border-emerald-700/50">
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
              
              {/* Stadyum ışıkları */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-400 rounded-full blur-xl opacity-70"></div>
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-400 rounded-full blur-xl opacity-70"></div>
              <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-blue-400 rounded-full blur-xl opacity-70"></div>
              <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-blue-400 rounded-full blur-xl opacity-70"></div>
            </div>
            
            <div className="text-center">
              <span className="text-lg text-white font-bold mb-1 block">Canlı Maçlar Yükleniyor</span>
              <div className="flex items-center justify-center gap-1 text-emerald-500">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                <span className="text-sm">CANLI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-3 max-w-md mx-auto p-4">
      {/* Futbol temalı başlık ve kontrol paneli */}
      <div className="relative rounded-xl overflow-visible mb-2 shadow-lg border border-emerald-700/30 bg-gradient-to-br from-green-900/80 to-slate-900/90">
        {/* Stadyum ışıkları ve çim efekti */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-72 h-16 bg-gradient-to-b from-yellow-300/20 to-green-500/10 blur-2xl opacity-60 z-0"></div>
        <div className="absolute inset-0 bg-[url('/grass-pattern.png')] bg-repeat opacity-10 z-0"></div>
        <div className="absolute left-1/2 top-0 w-32 h-32 -translate-x-1/2 -translate-y-1/3 bg-emerald-400 rounded-full blur-2xl opacity-10 z-0"></div>
        <div className="relative z-10 flex flex-col gap-2 p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <img src="/football.svg" alt="Futbol Topu" className="w-7 h-7 animate-bounce mr-1" />
              <h2 className="text-xl font-extrabold text-green-300 drop-shadow-lg tracking-wide uppercase flex items-center gap-2">
                Canlı Maç Takibi
                <span className="ml-2 px-3 py-1 rounded-full bg-gradient-to-r from-red-700 to-red-500 shadow-lg flex items-center gap-1 animate-pulse border-2 border-white/10">
                  <img src="/football.svg" alt="Top" className="w-4 h-4 mr-1 animate-spin-slow" />
                  <span className="font-bold text-white text-base">{matches.length}</span>
                  <span className="text-xs font-semibold text-yellow-200 ml-1">MAÇ</span>
                </span>
              </h2>
            </div>
          <Button
            variant="outline"
              size="icon"
            onClick={handleRefresh}
              className="bg-gradient-to-br from-yellow-400/80 to-red-600/80 border-0 shadow-lg hover:from-yellow-300 hover:to-red-500 transition-all duration-300 w-10 h-10 flex items-center justify-center relative"
            disabled={loading}
              aria-label="Yenile"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <img src="/football.svg" alt="Yenile Top" className={`w-6 h-6 ${loading ? 'animate-spin' : 'animate-bounce'} drop-shadow-lg`} />
              </div>
              <span className="sr-only">Yenile</span>
          </Button>
        </div>
          {/* Switch ve saatler */}
          <div className="flex flex-wrap items-center justify-between mt-2 gap-y-2 gap-x-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-300 font-semibold mr-1 flex items-center gap-1">
                  <AlarmClock className="w-4 h-4 mr-0.5 text-green-400" />
                  Otomatik Yenile
                </span>
            <Switch 
              checked={autoRefresh} 
              onCheckedChange={setAutoRefresh}
                  className="data-[state=checked]:bg-green-600 border-2 border-green-400 shadow-inner"
            />
          </div>
              <div className="flex items-center gap-1 ml-4">
                <span className="text-xs text-slate-300 font-semibold mr-1 flex items-center gap-1">
                  <Bell className="w-4 h-4 mr-0.5 text-yellow-400" />
                  Bildirimler
                </span>
            <Switch 
                  className="data-[state=checked]:bg-yellow-400 border-2 border-yellow-300 shadow-inner"
            />
          </div>
          </div>
            <div className="flex items-center bg-slate-900/80 px-3 py-1 rounded-lg shadow-inner border border-slate-700/60 min-w-[120px] justify-center">
              <Clock className="w-4 h-4 text-green-400 mr-1" />
              <span className="font-mono text-base text-green-200 tracking-widest">
                {lastRefresh ? lastRefresh.toLocaleTimeString() : "13:43:59"}
              </span>
            </div>
          </div>
      </div>
              </div>
      
      {/* Canlı Maçlar Kategorileri */}
      <div className="flex border-b border-slate-700/50 mb-2 relative z-10">
        <button 
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 relative
            ${activeCategory === 'all' ? 'text-emerald-400 bg-gradient-to-r from-green-900/60 to-emerald-800/60 shadow-lg border-b-4 border-emerald-400' : 'text-slate-400'}
          `}
          style={activeCategory === 'all' ? {boxShadow: '0 2px 16px 0 #22d3ee44'} : {}}
          onClick={() => setActiveCategory('all')}
        >
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-green-400/20 blur-md rounded-full z-0"></span>
          <Trophy className="w-4 h-4 inline mr-1 text-emerald-400" />
          Tüm Canlı Maçlar ({matches.length})
        </button>
        <button 
          className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-200 relative
            ${activeCategory === 'favorites' ? 'text-yellow-400 bg-gradient-to-r from-yellow-900/60 to-yellow-800/60 shadow-lg border-b-4 border-yellow-400' : 'text-slate-400'}
          `}
          style={activeCategory === 'favorites' ? {boxShadow: '0 2px 16px 0 #fde68a44'} : {}}
          onClick={() => setActiveCategory('favorites')}
        >
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-3 bg-yellow-400/20 blur-md rounded-full z-0"></span>
          <Star className="w-4 h-4 inline mr-1 text-yellow-400" />
          Favori Ligler
          <span className="ml-1">({favoriteSortedLeagues.reduce((total: number, league) => total + league.matchCount, 0)})</span>
        </button>
      </div>
      
      {/* Canlı Ligler Özeti */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {activeCategory === 'all' ? (
              <>
                <Sparkles className="w-4 h-4 mr-1 text-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">liveLeagues</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-1 text-yellow-400 animate-pulse" />
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wide">Favori Ligler</span>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 h-6 px-2 text-slate-400 hover:text-slate-300"
              onClick={() => setShowLeaguesList(!showLeaguesList)}
            >
              {showLeaguesList ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4 transform rotate-180" />
              )}
            </Button>
          </div>
          {activeCategory === 'all' && sortedLeagues.length > 0 && (
            <span className="text-xs text-slate-400">
              {sortedLeagues.length} lig gösteriliyor
              {upcomingMatchesCount > 0 && ` • ${upcomingMatchesCount} maç yaklaşıyor`}
            </span>
          )}
          {activeCategory === 'favorites' && (
            <span className="text-xs text-slate-400">
              {favoriteSortedLeagues.length > 0 
                ? `${favoriteSortedLeagues.length} favori lig` 
                : "Henüz favori liginiz yok"}
            </span>
          )}
        </div>
        
        {showLeaguesList && (
          <div className="grid grid-cols-2 gap-3">
            {(activeCategory === 'all' ? sortedLeagues : favoriteSortedLeagues)
              .slice(0, showAllLeagues ? undefined : 5)
              .map(league => (
              <Card 
                key={league.league_id}
                className={`cursor-pointer relative overflow-hidden bg-gradient-to-br from-green-900/60 to-slate-900/80 border-2 border-emerald-700/30 shadow-lg hover:border-emerald-400 hover:shadow-emerald-400/30 transition-all duration-300 group`}
                style={{boxShadow: '0 4px 24px 0 #22d3ee22'}}
                onClick={() => {
                  if (league.matchCount > 0) {
                    openLiveMatchView(league.league_id, league.league_name);
                  } else {
                    handleLeagueSelect(league.league_id);
                  }
                }}
              >
                <CardContent className="p-3 flex flex-col gap-2 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center w-full">
                      <div className="w-8 h-8 bg-emerald-700/80 rounded-full flex items-center justify-center mr-2 relative flex-shrink-0 border-2 border-emerald-400 group-hover:scale-110 transition-transform duration-200">
                        {league.league_logo ? (
                          <img 
                            src={league.league_logo} 
                            alt={league.league_name} 
                            className="w-6 h-6 object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <Trophy className="w-4 h-4 text-emerald-300" />
                        )}
                        {league.isFavorite && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                            <Heart className="w-2 h-2 text-white fill-white" />
                          </div>
                        )}
                        {league.matchCount > 0 && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-red-500/30">
                            <span className="text-xs font-bold text-white">{league.matchCount}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 mr-1">
                        <div className="text-[12px] font-bold text-white truncate">
                          {league.league_name}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] text-emerald-200 truncate max-w-[60px]">
                            {league.country_name}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                    <Button 
                      size="sm"
                    className="w-full mt-2 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-400 hover:to-emerald-400 text-white text-xs font-bold py-1 h-7 rounded-full shadow-lg shadow-green-500/20 border-2 border-green-400 group-hover:scale-105 transition-transform duration-200 flex items-center justify-center gap-1"
                    onClick={e => {
                        e.stopPropagation();
                        openLiveMatchView(league.league_id, league.league_name);
                      }}
                    >
                    <Trophy className="w-3 h-3 mr-1 text-yellow-200" />
                    Maçları Gör
                    </Button>
                </CardContent>
                {/* Çim ve ışık efekti */}
                <div className="absolute inset-0 bg-[url('/grass-pattern.png')] bg-repeat opacity-10 z-0"></div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-green-400/10 blur-md rounded-full z-0"></div>
                <div className="absolute -bottom-2 right-1/2 translate-x-1/2 w-16 h-4 bg-yellow-400/10 blur-md rounded-full z-0"></div>
              </Card>
            ))}
            {/* Tüm Ligleri Göster Butonu */}
            {activeCategory === 'all' && sortedLeagues.length > 5 && !showAllLeagues && (
              <Button
                className="col-span-2 bg-gradient-to-r from-green-700 via-emerald-600 to-green-700 hover:from-green-600 hover:to-emerald-500 text-white shadow-xl border-2 border-emerald-400 rounded-full py-3 mt-2 text-base font-bold flex items-center justify-center gap-2 animate-pulse"
                onClick={() => setShowAllLeagues(true)}
              >
                <Trophy className="w-5 h-5 mr-1 text-yellow-200 animate-bounce" />
                Tüm Ligleri Göster ({sortedLeagues.length - 5} daha fazla lig)
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Platform Bilgilendirme Kartı - Yeni Tasarım */}
      <div className="relative overflow-hidden rounded-xl mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 to-slate-900/30 rounded-xl blur-sm"></div>
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-900/95 border border-emerald-800/20 rounded-xl shadow-xl">
          <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-600/10 rounded-full blur-3xl"></div>
          
          <div className="p-4 relative z-10">
            <div className="flex flex-col">
              {/* Başlık ve Pro rozeti */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="relative mr-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-400 rounded-xl flex items-center justify-center rotate-3 shadow-lg transform-gpu">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                      <Trophy className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-emerald-300 to-green-400 tracking-tight">
                      {t('widestLeagueCoverage')}
                    </h3>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-slate-400">{t('poweredBy')}</span>
                      <span className="ml-1 text-xs font-bold text-emerald-400">{t('aiPredictionEngine')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white border-none px-2 py-1 rounded-md shadow-lg font-bold text-xs">
                    PRO
                  </div>
                </div>
              </div>

              {/* İstatistikler - Yeni Tasarım */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-emerald-900/20 rounded-lg p-3 backdrop-blur-sm border border-emerald-800/30 relative overflow-hidden group hover:border-emerald-700/50 transition-colors duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="text-2xl font-bold text-emerald-400">950+</div>
                    <div className="text-xs text-slate-300 flex items-center">
                      <Activity className="w-3 h-3 mr-1 text-emerald-500" />
                      {t('liveLeagueCount')}
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-900/20 rounded-lg p-3 backdrop-blur-sm border border-emerald-800/30 relative overflow-hidden group hover:border-emerald-700/50 transition-colors duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="text-2xl font-bold text-emerald-400">1500+</div>
                    <div className="text-xs text-slate-300 flex items-center">
                      <BarChart className="w-3 h-3 mr-1 text-emerald-500" />
                      {t('dailyPredictionCount')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dünyada ilk ve tek vurgusu - Yeni Tasarım */}
              <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-900/20 rounded-lg p-3 backdrop-blur-sm mb-3 border-l-4 border-emerald-500 relative overflow-hidden group hover:from-emerald-900/40 hover:to-emerald-900/30 transition-colors duration-300">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:15px_15px]"></div>
                <div className="text-center relative z-10">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">{t('worldFirst').split(' ')[0]}</span>
                  <div className="text-base font-extrabold text-white my-1 tracking-tight">{t('worldFirst').split(' ').slice(1).join(' ')}</div>
                  <span className="text-xs text-slate-300">{t('realTimeAnalysisPlatform')}</span>
                </div>
              </div>

              {/* Şeffaflık ve algoritma gücü mesajı - Yeni Tasarım */}
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-800/60 rounded-lg p-3 backdrop-blur-sm mb-3 border border-emerald-900/30 relative overflow-hidden">
                <div className="flex items-start relative z-10">
                  <div className="bg-emerald-500/20 p-1.5 rounded-md mr-2 flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <p className="text-xs text-slate-300 leading-tight">
                    {t('completelyTransparent')}
                  </p>
                </div>
              </div>

              {/* SAHTE VERİ YOK - Arena Style */}
              <div className="relative overflow-hidden rounded-lg mb-3">
                {/* Stadium background and lighting effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-900/30 via-amber-900/30 to-orange-900/30 rounded-lg"></div>
                <div className="absolute inset-0 bg-[url('/stadium-pattern.png')] bg-repeat opacity-5"></div>
                <div className="absolute -top-5 left-1/4 w-10 h-10 bg-orange-400 rounded-full blur-xl opacity-10"></div>
                <div className="absolute -top-5 right-1/4 w-10 h-10 bg-orange-400 rounded-full blur-xl opacity-10"></div>
                
                {/* Field lines */}
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                  <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-orange-500/10"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-orange-500/10"></div>
                </div>
                
                <div className="relative border border-orange-600/30 rounded-lg p-3 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative mr-2.5 flex-shrink-0">
                        <div className="absolute -inset-1 bg-orange-500/20 rounded-full blur-sm"></div>
                        <div className="bg-gradient-to-br from-orange-500/40 to-amber-600/40 p-2 rounded-full relative">
                          <AlertCircle className="w-4 h-4 text-orange-400" />
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-bold uppercase text-orange-400 tracking-wider">{t('noFakeData')}</span>
                      </div>
                    </div>
                    <div className="relative animate-pulse">
                      <div className="absolute -inset-1 bg-orange-500/20 rounded-full blur-sm"></div>
                      <div className="bg-gradient-to-br from-orange-500/30 to-amber-600/30 p-1 rounded-full">
                        <Check className="w-4 h-4 text-orange-400" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pl-8 space-y-2">
                    <div className="flex items-center bg-orange-900/30 rounded-md px-2 py-1.5">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2 flex-shrink-0"></div>
                      <span className="text-xs text-orange-100/80">{t('allPastPredictions')}</span>
                    </div>
                    <div className="flex items-center bg-orange-900/30 rounded-md px-2 py-1.5">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2 flex-shrink-0"></div>
                      <span className="text-xs text-orange-100/80">{t('allResultsShared')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Özel Geliştirilmiş Algoritma - Arena Style */}
              <div className="relative overflow-hidden rounded-lg mb-3">
                {/* Stadium background and lighting effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-indigo-900/30 to-blue-900/30 rounded-lg"></div>
                <div className="absolute inset-0 bg-[url('/stadium-pattern.png')] bg-repeat opacity-5"></div>
                <div className="absolute -top-5 left-1/4 w-10 h-10 bg-blue-400 rounded-full blur-xl opacity-10"></div>
                <div className="absolute -top-5 right-1/4 w-10 h-10 bg-blue-400 rounded-full blur-xl opacity-10"></div>
                
                {/* Field lines */}
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                  <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-blue-500/10"></div>
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-blue-500/10"></div>
                  <div className="absolute left-1/2 top-1/2 w-8 h-8 -ml-4 -mt-4 border border-blue-500/10 rounded-full"></div>
                </div>
                
                <div className="relative border border-blue-600/30 rounded-lg p-3 z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative mr-2.5 flex-shrink-0">
                        <div className="absolute -inset-1 bg-blue-500/20 rounded-full blur-sm"></div>
                        <div className="bg-gradient-to-br from-blue-500/40 to-indigo-600/40 p-2 rounded-full relative">
                          <Sparkles className="w-4 h-4 text-blue-400" />
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-bold uppercase text-blue-400 tracking-wider">{t('specialDevelopedAlgorithm')}</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute -inset-1 bg-blue-500/20 rounded-md blur-sm"></div>
                      <div className="bg-gradient-to-r from-blue-600/50 to-indigo-600/50 text-white px-2 py-1 rounded-md text-xs relative">
                        <span className="font-mono">5</span> {t('yearsOfTraining')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pl-8 space-y-2">
                    <div className="flex items-center bg-blue-900/30 rounded-md px-2 py-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
                      <span className="text-xs text-blue-100/80">{t('developedWithAI')}</span>
                    </div>
                    <div className="flex items-center bg-blue-900/30 rounded-md px-2 py-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 flex-shrink-0"></div>
                      <span className="text-xs text-blue-100/80">{t('trainedWithData')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aksiyon butonları - Yeni Tasarım */}
              <div className="flex items-center justify-between">
                <button className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white border-none text-xs px-4 py-2 rounded-lg shadow-lg flex items-center transition-all duration-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mr-1.5 animate-pulse"></span>
                  {t('predictionHistory')}
                </button>
                <div className="flex items-center space-x-2">
                  <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-md text-xs">
                    <span className="font-mono">%92</span> {t('accuracy')}
                  </div>
                  <div className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded-md text-xs">
                    <span className="font-mono">7/24</span> {t('support')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {error ? (
        <Alert variant="destructive" className="bg-red-900/20 border-red-700/50 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          {/* showLiveMatchView aktifse maçları ana sayfada gösterme */}
          {!showLiveMatchView && selectedLeague && filteredMatches.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700 border-red-700/50">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center text-red-400">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <p className="text-sm">
                    {matches.length > 0 
                      ? t('noLiveMatchesInSelectedLeague') 
                      : t('noLiveMatchesFound')}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : !showLiveMatchView && !selectedLeague ? (
            // Hiçbir lig seçili değilse bilgilendirme mesajı göster
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-4 text-center">
                <Trophy className="w-8 h-8 text-green-400/50 mx-auto mb-2" />
                <p className="text-sm text-slate-300 mb-2">{t('selectLeagueToViewMatches')}</p>
                <p className="text-xs text-slate-400">
                  {t('clickLeagueCardsToViewMatches')}
                </p>
              </CardContent>
            </Card>
          ) : !showLiveMatchView ? (
            <div className="space-y-2">
              {filteredMatches.map(match => (
                <div key={match.match_id} className="space-y-2">
                  <LiveMatchCard 
                    match={match} 
                    isSelected={selectedMatch?.match_id === match.match_id}
                    onSelect={handleMatchSelect}
                    setActiveTab={setActiveTab}
                    activeTab={activeTab}
                    onPredictionClick={handlePredictionClick}
                    onDetailsClick={handleDetailsClick}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
      
      {/* Ligler Modal - Turuncu butonlu modal */}
      {showLeaguesModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-800/50 border-b border-slate-700/50 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{t('allLeagues')}</h3>
                  <p className="text-xs text-slate-400">
                    {matches.length} {t('liveMatches')}, {leagues.length} {t('leagues')}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-full hover:bg-slate-700/50"
                onClick={closeLeaguesModal}
              >
                <X className="w-5 h-5 text-slate-400" />
              </Button>
            </div>
          </div>

          {/* Arama ve Filtreleme */}
          <div className="bg-slate-800/70 p-3 border-b border-slate-700/50">
            <div className="flex items-center space-x-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder={t('searchLeagueOrTeam')} 
                  className="pl-8 bg-slate-700 border-slate-600 text-white"
                  value={searchText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
                />
                {searchText && (
                  <button 
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    onClick={() => setSearchText("")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {searchText && (
                <div className="mt-1 text-xs text-slate-400">
                  {filteredLeagues.length > 0 
                    ? `${filteredLeagues.length} ${t('resultsFound')} "${searchText}" ${t('for')}` 
                    : `"${searchText}" ${t('noResultsFound')}`}
                </div>
              )}
            </div>
            
            {/* Ülke Seçimi - Yatay Kaydırılabilir Liste */}
            <div className="mb-2">
              <div className="flex items-center mb-2">
                <Globe className="w-4 h-4 mr-1 text-blue-400" />
                <span className="text-xs font-medium text-blue-400">{t('selectCountry')}</span>
              </div>
              
              <div className="flex overflow-x-auto pb-2 space-x-2 hide-scrollbar">
                {/* Tüm Ülkeler Seçeneği */}
                <div 
                  className={`flex-shrink-0 cursor-pointer p-2 rounded-lg flex flex-col items-center justify-center ${selectedCountry === "all-countries" ? "bg-blue-900/30 border-2 border-blue-600" : "bg-slate-800 border border-slate-700 hover:border-blue-600"}`}
                  onClick={() => setSelectedCountry("all-countries")}
                >
                  <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mb-1 relative">
                    <Globe className="w-5 h-5 text-blue-400" />
                    {selectedCountry === "all-countries" && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-white whitespace-nowrap">{t('allCountries')}</span>
                </div>
                
                {/* Ülkeler Listesi */}
                {countries.map(country => (
                  <div 
                    key={country.country_id}
                    className={`flex-shrink-0 cursor-pointer p-2 rounded-lg flex flex-col items-center justify-center ${selectedCountry === country.country_id ? "bg-blue-900/30 border-2 border-blue-600" : "bg-slate-800 border border-slate-700 hover:border-blue-600"}`}
                    onClick={() => setSelectedCountry(country.country_id)}
                  >
                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mb-1 relative">
                      {country.country_logo ? (
                        <img
                          src={country.country_logo}
                          alt={country.country_name}
                          className="w-8 h-8 object-contain rounded-full"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-sm font-bold text-white">{country.country_name.substring(0, 1)}</span>
                      )}
                      {selectedCountry === country.country_id && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-white whitespace-nowrap">{country.country_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Ligler Listesi */}
          <div 
            className="flex-1 overflow-y-auto hide-scrollbar"
            onScroll={handleLeaguesScroll}
          >
            {loadingLeagues ? (
              <div className="flex flex-col items-center justify-center p-10">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
                <p className="text-sm text-slate-300">{t('leaguesLoading')}</p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                {/* Tüm Ligler Seçeneği */}
                <Card 
                  className={`cursor-pointer ${selectedLeague === "all-leagues" ? "bg-red-900/30 border-2 border-red-600" : "bg-slate-800 border border-slate-700 hover:border-red-600"}`}
                  onClick={() => {
                    // Tüm liglere tıklandığında, tüm maçları göster
                    handleLeagueSelect("all-leagues");
                    closeLeaguesModal();
                  }}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mr-3 relative">
                        <Trophy className="w-6 h-6 text-red-400" />
                        {selectedLeague === "all-leagues" && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-white">{t('allLeagues')}</h4>
                        <p className="text-xs text-slate-400">{matches.length} {t('liveMatches')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs bg-amber-900/30 border-amber-700/30 text-amber-400 hover:bg-amber-800/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteLeague("all-leagues");
                        }}
                      >
                        <Star className={`w-3 h-3 mr-1 ${favoriteLeagues.includes("all-leagues") ? "fill-amber-400" : ""}`} />
                        {t('favoriteLeagues')} {favoriteLeagues.includes("all-leagues") ? t('remove') : t('add')}
                      </Button>
                      <Badge className="bg-red-600 text-white">
                        {matches.length}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Ligler Listesi - Maç sayısına göre sıralanmış */}
                {filteredLeagues.slice(0, showLeagueCount).map(league => {
                  const leagueMatches = allMatches.filter(m => m.league_id === league.league_id);
                  return (
                    <Card 
                      key={league.league_id}
                      className={`cursor-pointer ${selectedLeague === league.league_id ? "bg-red-900/30 border-2 border-red-600" : "bg-slate-800 border border-slate-700 hover:border-red-600"}`}
                      onClick={() => handleLeagueSelect(league.league_id)}
                    >
                      <CardContent className="p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mr-3 relative">
                              {league.league_logo ? (
                                <img 
                                  src={league.league_logo} 
                                  alt={league.league_name} 
                                  className="w-8 h-8 object-contain"
                                  loading="lazy"
                                />
                              ) : (
                                <Trophy className="w-6 h-6 text-red-400" />
                              )}
                              {selectedLeague === league.league_id && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                              {league.matchCount > 0 && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="text-base font-medium text-white">{league.league_name}</h4>
                              <div className="flex items-center">
                                {league.country_logo && (
                                  <img
                                    src={league.country_logo}
                                    alt={league.country_name}
                                    className="w-3 h-3 mr-1 rounded-full"
                                  />
                                )}
                                <p className="text-xs text-slate-400">{league.country_name}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className={`h-8 px-2 text-xs ${
                                  league.isFavorite
                                    ? "bg-amber-900/30 border-amber-700/30 text-amber-400 hover:bg-amber-800/50"
                                    : "bg-slate-700/30 border-slate-600/30 text-slate-400 hover:bg-slate-600/50"
                                }`}
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleFavoriteLeague(league.league_id);
                                  // Favori ekleme/kaldırma bildirimi göster
                                  const message = league.isFavorite 
                                    ? `${league.league_name} favorilerden kaldırıldı` 
                                    : `${league.league_name} favorilere eklendi`;
                                  showLeagueSelectedNotification(message);
                                }}
                              >
                                {league.isFavorite ? (
                                  <>
                                    <Heart className="w-3 h-3 mr-1 fill-amber-400" />
                                    {t('removeFromFavorites')}
                                  </>
                                ) : (
                                  <>
                                    <Heart className="w-3 h-3 mr-1" />
                                    {t('addToFavorites')}
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                className={`px-3 py-1 rounded-full font-bold text-sm shadow-md transition-colors duration-200 ${leagueMatches.length > 0 ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-slate-600 text-slate-300 cursor-not-allowed'}`}
                                disabled={leagueMatches.length === 0}
                                onClick={e => {
                                  e.stopPropagation();
                                  if (leagueMatches.length > 0) openLiveMatchView(league.league_id, league.league_name);
                                }}
                              >
                                {t('viewMatches')}
                              </Button>
                            </div>
                            {league.matchCount > 0 && (
                              <Badge className="bg-red-600 text-white">
                                {league.matchCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {/* Lig Maçları Önizleme - Sadece toplam maç sayısı baloncuğu */}
                        <div className="flex gap-2 py-1">
                          <div className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-sm shadow-md min-w-max">
                            {leagueMatches.length} {t('matchLabel')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {filteredLeagues.length === 0 && (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Search className="w-10 h-10 mb-3 text-slate-500" />
                      <p className="text-sm mb-2">{t('noLeaguesInSelectedCountry')}</p>
                      <Button 
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => setSelectedCountry("all-countries")}
                      >
                        {t('showAllCountries')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {showLiveMatchView && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col overflow-hidden android-scroll-container">
          {/* Header - Futbol temalı, tek ve büyük selected badge */}
          <div className="relative bg-gradient-to-br from-green-900/90 to-slate-900/90 border-b-4 border-emerald-500/40 shadow-xl overflow-visible">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-80 h-10 bg-gradient-to-b from-yellow-300/20 to-green-500/10 blur-2xl opacity-60 z-0"></div>
            <div className="absolute inset-0 bg-[url('/grass-pattern.png')] bg-repeat opacity-10 z-0"></div>
            <div className="flex items-center justify-between px-4 py-3 relative z-10">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7 p-0 rounded-full hover:bg-slate-700/50"
                  onClick={() => setShowLiveMatchView(false)}
                >
                  <ChevronDown className="w-4 h-4 text-white transform rotate-90" />
                </Button>
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-600 to-green-400 rounded-full flex items-center justify-center shadow-lg border-2 border-emerald-400">
                  <Trophy className="w-5 h-5 text-yellow-200" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-green-200 tracking-tight flex items-center gap-2">
                    {selectedLeagueName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
                    <span className="text-xs text-emerald-200 font-semibold">{selectedLeagueMatches.length} liveMatchesBeingDisplayed</span>
                    <span className="ml-2 px-3 py-1 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 shadow-lg border border-white/10 text-sm font-bold text-white animate-glow">selected</span>
                </div>
              </div>
              </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7 p-0 rounded-full hover:bg-slate-700/50"
                  onClick={() => setShowLiveMatchView(false)}
                >
                  <X className="w-4 h-4 text-white" />
                </Button>
            </div>
          </div>

          {/* Maçlar Listesi - Futbol temalı kartlar ve skorboard */}
          <div className="flex-1 overflow-y-auto hide-scrollbar android-scroll-content bg-gradient-to-br from-green-900/80 to-slate-900/80 px-2 py-1">
            <div className="space-y-4">
              {selectedLeagueMatches.length > 0 ? (
                selectedLeagueMatches.map(match => (
                  <div
                    key={match.match_id}
                    className="relative bg-gradient-to-br from-green-900/60 to-slate-900/80 border-2 border-emerald-700/30 rounded-2xl overflow-hidden shadow-xl group hover:border-emerald-400 hover:shadow-emerald-400/30 transition-all duration-300"
                  >
                    {/* Çim ve ışık efekti */}
                    <div className="absolute inset-0 bg-[url('/grass-pattern.png')] bg-repeat opacity-10 z-0"></div>
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-green-400/10 blur-md rounded-full z-0"></div>
                    <div className="absolute -bottom-2 right-1/2 translate-x-1/2 w-24 h-6 bg-yellow-400/10 blur-md rounded-full z-0"></div>
                    <div className="p-4 relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-gradient-to-r from-green-700 to-emerald-600 text-white text-xs px-2 py-0 rounded shadow-md font-bold flex items-center gap-1 animate-pulse">
                          <Trophy className="w-3 h-3 mr-1 text-yellow-200" />
                            {selectedLeagueName}
                          </Badge>
                        {match.match_live === "1" ? (
                          <Badge className="bg-gradient-to-r from-red-600 to-red-400 text-white text-xs px-2 py-0 rounded-full shadow-md animate-bounce font-bold">CANLI</Badge>
                        ) : (
                          <Badge className="bg-gradient-to-r from-slate-600 to-slate-400 text-white text-xs px-2 py-0 rounded-full shadow-md font-bold">Yaklaşan</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between my-2">
                        <div className="flex items-center space-x-2 flex-1">
                          <div className="w-10 h-10 overflow-hidden rounded-full bg-slate-700 flex-shrink-0 border-2 border-emerald-400 shadow-md">
                            {match.team_home_badge ? (
                              <img
                                src={match.team_home_badge || "/placeholder.svg"}
                                alt={match.match_hometeam_name}
                                className="object-cover w-full h-full"
                                loading="lazy"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=24&width=24"
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full text-xs font-bold text-white">
                                {match.match_hometeam_name.substring(0, 1)}
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-bold text-white truncate">{match.match_hometeam_name}</span>
                        </div>
                        <div className="flex flex-col items-center mx-2">
                          <div className="flex items-center bg-gradient-to-br from-slate-900 via-green-800 to-slate-900 px-6 py-2 rounded-2xl border-4 border-green-400 shadow-2xl font-mono text-lg text-white tracking-widest" style={{fontFamily:'"Digital-7",monospace'}}>
                            <span className="font-extrabold text-green-200 text-2xl drop-shadow-lg">{match.match_hometeam_score || "0"}</span>
                            <span className="text-xl mx-3 text-yellow-400 font-extrabold drop-shadow-lg">VS</span>
                            <span className="font-extrabold text-green-200 text-2xl drop-shadow-lg">{match.match_awayteam_score || "0"}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-1 justify-end">
                          <span className="text-sm font-bold text-white truncate text-right">{match.match_awayteam_name}</span>
                          <div className="w-10 h-10 overflow-hidden rounded-full bg-slate-700 flex-shrink-0 border-2 border-emerald-400 shadow-md">
                            {match.team_away_badge ? (
                              <img
                                src={match.team_away_badge || "/placeholder.svg"}
                                alt={match.match_awayteam_name}
                                className="object-cover w-full h-full"
                                loading="lazy"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=24&width=24"
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full text-xs font-bold text-white">
                                {match.match_awayteam_name.substring(0, 1)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {match.match_stadium && (
                        <div className="flex items-center justify-center text-xs text-emerald-200 mb-2 gap-1">
                          <MapPin className="w-4 h-4 mr-1 text-green-400" />
                          <span className="truncate">{match.match_stadium}</span>
                        </div>
                      )}
                      {/* Kompakt butonlar - futbol temalı */}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button 
                          className="bg-gradient-to-r from-orange-500 via-yellow-400 to-amber-500 hover:from-orange-400 hover:to-yellow-400 text-white text-xs font-bold py-2 h-9 rounded-xl shadow-lg shadow-yellow-500/20 border-2 border-yellow-400 flex items-center justify-center gap-1 group-hover:scale-105 transition-transform duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Analiz Et butonuna tıklandı:', match);
                            setDetailsMatch(match);
                            setDetailsActiveTab('h2h');
                            setShowDetailsModal(true);
                          }}
                        >
                          <PieChart className="w-4 h-4 mr-1 text-white" />
                          Analiz Et
                        </Button>
                        <Button 
                          className="bg-gradient-to-r from-green-600 via-emerald-500 to-green-700 hover:from-green-500 hover:to-emerald-400 text-white text-xs font-bold py-2 h-9 rounded-xl shadow-lg shadow-green-500/20 border-2 border-green-400 flex items-center justify-center gap-1 group-hover:scale-105 transition-transform duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Tahmin Et butonuna tıklandı:', match);
                            setPredictionMatch(match);
                            setShowPredictionModal(true);
                          }}
                        >
                          <Zap className="w-4 h-4 mr-1 text-yellow-200" />
                          Tahmin Et
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-center">
                  <div className="flex flex-col items-center justify-center text-red-400">
                    <AlertCircle className="w-6 h-6 mb-2" />
                    <p className="text-sm mb-2">{t('noLiveMatchesInSelectedLeague')}</p>
                    <Button 
                      className="bg-slate-700 hover:bg-slate-600 text-white text-xs"
                      onClick={() => setShowLiveMatchView(false)}
                    >
                      <ChevronDown className="w-3 h-3 mr-1 transform rotate-90" />
                      {t('back')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Maç Detayları Modal */}
      {showDetailsModal && detailsMatch && (
        <div className="fixed inset-0 z-[9000] bg-slate-900/95 flex flex-col overflow-hidden android-scroll-container pb-16">
          {/* Header */}
          <div className="bg-gradient-to-b from-slate-800 to-slate-800/50 border-b border-slate-700/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 p-0 rounded-full hover:bg-slate-700/50"
                onClick={closeDetailsModal}
              >
                <ChevronDown className="w-5 h-5 text-white transform rotate-90" />
              </Button>
              <Badge className={`text-white text-xs px-3 py-1 ${detailsMatch.match_live === "1" ? "bg-red-600" : "bg-slate-600"}`}>
                {detailsMatch.match_status === "1H" ? t('matchStatusFirstHalf') :
                 detailsMatch.match_status === "HT" ? t('matchStatusHalfTime') :
                 detailsMatch.match_status === "2H" ? t('matchStatusSecondHalf') :
                 detailsMatch.match_status === "FT" ? t('matchStatusFullTime') :
                 detailsMatch.match_live === "1" ? t('matchStatusLive') : t('upcoming')}
                {detailsMatch.match_elapsed && detailsMatch.match_live === "1" && ` ${detailsMatch.match_elapsed}'`}
              </Badge>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 p-0 rounded-full hover:bg-slate-700/50"
                onClick={closeDetailsModal}
              >
                <X className="w-5 h-5 text-white" />
              </Button>
            </div>
            
            {/* Maç Başlığı ve Skor - Değişmedi */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-12 h-12 overflow-hidden rounded-full bg-slate-700 flex-shrink-0 border-2 border-slate-600 shadow-lg">
                  {detailsMatch.team_home_badge ? (
                    <img
                      src={detailsMatch.team_home_badge || "/placeholder.svg"}
                      alt={detailsMatch.match_hometeam_name}
                      className="object-cover w-full h-full"
                      loading="lazy"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=48&width=48"
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-lg font-bold text-white">
                      {detailsMatch.match_hometeam_name.substring(0, 1)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{detailsMatch.match_hometeam_name}</span>
                  <span className="text-xs text-slate-400">{t('home')}</span>
                </div>
              </div>

              <div className="flex flex-col items-center mx-3">
                <div className="px-4 py-2 bg-slate-800/80 rounded-lg border border-slate-700/50 shadow-lg">
                  <span className="text-2xl font-bold text-white">{detailsMatch.match_hometeam_score || "0"}</span>
                  <span className="text-lg mx-2 text-red-400">-</span>
                  <span className="text-2xl font-bold text-white">{detailsMatch.match_awayteam_score || "0"}</span>
                </div>
                <span className="text-xs text-slate-400 mt-1">{detailsMatch.league_name}</span>
              </div>

              <div className="flex items-center space-x-3 flex-1 justify-end">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-white">{detailsMatch.match_awayteam_name}</span>
                  <span className="text-xs text-slate-400">{t('away')}</span>
                </div>
                <div className="w-12 h-12 overflow-hidden rounded-full bg-slate-700 flex-shrink-0 border-2 border-slate-600 shadow-lg">
                  {detailsMatch.team_away_badge ? (
                    <img
                      src={detailsMatch.team_away_badge || "/placeholder.svg"}
                      alt={detailsMatch.match_awayteam_name}
                      className="object-cover w-full h-full"
                      loading="lazy"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=48&width=48"
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-lg font-bold text-white">
                      {detailsMatch.match_awayteam_name.substring(0, 1)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stadyum bilgisi */}
            {detailsMatch.match_stadium && (
              <div className="flex items-center justify-center text-xs text-slate-400 mt-2">
                <MapPin className="w-3 h-3 mr-1" />
                <span>{detailsMatch.match_stadium}</span>
              </div>
            )}
          </div>

          {/* Sekmeler */}
          <div className="flex bg-slate-800/70 border-b border-slate-700/50 overflow-x-auto hide-scrollbar">
            <Button
              variant={detailsActiveTab === "details" ? "default" : "ghost"}
              className={`flex-1 rounded-none h-12 text-xs ${detailsActiveTab === "details" ? "bg-red-600 hover:bg-red-700" : "text-slate-400 hover:text-white"}`}
              onClick={() => setDetailsActiveTab("details")}
            >
              <div className="flex flex-col items-center">
                <span>{t('details')}</span>
                <span className="text-[10px] opacity-80">{t('statistics')}</span>
              </div>
            </Button>
            <Button
              variant={detailsActiveTab === "h2h" ? "default" : "ghost"}
              className={`flex-1 rounded-none h-12 text-xs ${detailsActiveTab === "h2h" ? "bg-amber-600 hover:bg-amber-700" : "text-slate-400 hover:text-white"}`}
              onClick={() => setDetailsActiveTab("h2h")}
            >
              <div className="flex flex-col items-center">
                <span>H2H</span>
                <span className="text-[10px] opacity-80">{t('comparison')}</span>
              </div>
            </Button>
            <Button
              variant={detailsActiveTab === "last10matches" ? "default" : "ghost"}
              className={`flex-1 rounded-none h-12 text-xs ${detailsActiveTab === "last10matches" ? "bg-purple-600 hover:bg-purple-700" : "text-slate-400 hover:text-white"}`}
              onClick={() => setDetailsActiveTab("last10matches")}
            >
              <div className="flex flex-col items-center">
                <span>{t('last10Matches')}</span>
                <span className="text-[10px] opacity-80">{t('formAnalysis')}</span>
              </div>
            </Button>
            <Button
              variant={detailsActiveTab === "standings" ? "default" : "ghost"}
              className={`flex-1 rounded-none h-12 text-xs ${detailsActiveTab === "standings" ? "bg-blue-600 hover:bg-blue-700" : "text-slate-400 hover:text-white"}`}
              onClick={() => setDetailsActiveTab("standings")}
            >
              <div className="flex flex-col items-center">
                <span>{t('standings')}</span>
                <span className="text-[10px] opacity-80">{t('comparison')}</span>
              </div>
            </Button>
            <Button
              variant={detailsActiveTab === "prediction" ? "default" : "ghost"}
              className={`flex-1 rounded-none h-12 text-xs ${detailsActiveTab === "prediction" ? "bg-emerald-600 hover:bg-emerald-700" : "text-slate-400 hover:text-white"}`}
              onClick={() => setDetailsActiveTab("prediction")}
            >
              <div className="flex flex-col items-center">
                <span>{t('prediction')}</span>
                <span className="text-[10px] opacity-80">{t('analyze')}</span>
              </div>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar android-scroll-content p-3">
            {detailsActiveTab === "details" && (
              <LiveMatchDetails match={detailsMatch} />
            )}
            {detailsActiveTab === "h2h" && (
              <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg">
                <H2HAnalysis 
                  firstTeamId={detailsMatch.match_hometeam_id}
                  secondTeamId={detailsMatch.match_awayteam_id}
                  firstTeamName={detailsMatch.match_hometeam_name}
                  secondTeamName={detailsMatch.match_awayteam_name}
                />
              </div>
            )}
            {detailsActiveTab === "last10matches" && (
              <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg space-y-4">
                <div className="p-2">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 overflow-hidden rounded-full bg-slate-700 flex-shrink-0 mr-2">
                      {detailsMatch.team_home_badge && (
                        <img
                          src={detailsMatch.team_home_badge}
                          alt={detailsMatch.match_hometeam_name}
                          className="object-cover w-full h-full"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-purple-300">{detailsMatch.match_hometeam_name}</h4>
                  </div>
                              <LastTenMatchAnalysis
                    teamId={detailsMatch.match_hometeam_id}
                    teamName={detailsMatch.match_hometeam_name}
                  />
                </div>
                <div className="p-2">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 overflow-hidden rounded-full bg-slate-700 flex-shrink-0 mr-2">
                      {detailsMatch.team_away_badge && (
                        <img
                          src={detailsMatch.team_away_badge}
                          alt={detailsMatch.match_awayteam_name}
                          className="object-cover w-full h-full"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <h4 className="text-sm font-medium text-purple-300">{detailsMatch.match_awayteam_name}</h4>
                  </div>
                              <LastTenMatchAnalysis
                    teamId={detailsMatch.match_awayteam_id}
                    teamName={detailsMatch.match_awayteam_name}
                              />
                        </div>
              </div>
            )}
            {detailsActiveTab === "standings" && (
              <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <StandingsComparison 
                  homeTeamId={detailsMatch.match_hometeam_id} 
                  awayTeamId={detailsMatch.match_awayteam_id}
                  homeTeam={detailsMatch.match_hometeam_name}
                  awayTeam={detailsMatch.match_awayteam_name}
                  leagueId={detailsMatch.league_id}
                />
              </div>
            )}
            {detailsActiveTab === "prediction" && (
              <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg">
                <UpcomingMatchPrediction 
                  homeTeam={detailsMatch.match_hometeam_name}
                  awayTeam={detailsMatch.match_awayteam_name}
                  homeTeamId={detailsMatch.match_hometeam_id}
                  awayTeamId={detailsMatch.match_awayteam_id}
                />
              </div>
            )}
          </div>
          
          {/* Alt bilgi çubuğu */}
          <div className="bg-slate-800/70 border-t border-slate-700/50 p-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Trophy className="w-4 h-4 text-amber-500 mr-1" />
                <span className="text-xs text-slate-300">{detailsMatch.league_name}</span>
              </div>
              <Badge variant="outline" className="text-xs bg-slate-700/50 border-slate-600/50">
                {t('liveAnalysis')}
              </Badge>
            </div>
          </div>
        </div>
      )}
      
      {/* Tahmin Modal */}
      {showPredictionModal && predictionMatch && (
        <div className="fixed inset-0 z-[9000] bg-slate-900/95 flex flex-col overflow-hidden android-scroll-container pb-16">
          <div className="bg-gradient-to-b from-slate-800 to-slate-800/50 border-b border-slate-700/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 p-0 rounded-full hover:bg-slate-700/50"
                onClick={closePredictionModal}
              >
                <ChevronDown className="w-5 h-5 text-white transform rotate-90" />
              </Button>
              <Badge className={`text-white text-xs px-3 py-1 ${predictionMatch.match_live === "1" ? "bg-red-600" : "bg-slate-600"}`}>
                {predictionMatch.match_live === "1" ? t('livePrediction') : t('matchPredictionTitle')}
              </Badge>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 p-0 rounded-full hover:bg-slate-700/50"
                onClick={closePredictionModal}
              >
                <X className="w-5 h-5 text-white" />
              </Button>
            </div>
            
            {/* Maç Başlığı ve Skor */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-12 h-12 overflow-hidden rounded-full bg-slate-700 flex-shrink-0 border-2 border-slate-600 shadow-lg">
                  {predictionMatch.team_home_badge ? (
                    <img
                      src={predictionMatch.team_home_badge || "/placeholder.svg"}
                      alt={predictionMatch.match_hometeam_name}
                      className="object-cover w-full h-full"
                      loading="lazy"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=48&width=48"
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-lg font-bold text-white">
                      {predictionMatch.match_hometeam_name.substring(0, 1)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{predictionMatch.match_hometeam_name}</span>
                  <span className="text-xs text-slate-400">{t('home')}</span>
                </div>
              </div>

              <div className="flex flex-col items-center mx-3">
                <div className="px-4 py-2 bg-slate-800/80 rounded-lg border border-slate-700/50 shadow-lg">
                  <span className="text-2xl font-bold text-white">{predictionMatch.match_hometeam_score || "0"}</span>
                  <span className="text-lg mx-2 text-red-400">-</span>
                  <span className="text-2xl font-bold text-white">{predictionMatch.match_awayteam_score || "0"}</span>
                </div>
                <span className="text-xs text-slate-400 mt-1">{predictionMatch.league_name}</span>
              </div>

              <div className="flex items-center space-x-3 flex-1 justify-end">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-white">{predictionMatch.match_awayteam_name}</span>
                  <span className="text-xs text-slate-400">{t('away')}</span>
                </div>
                <div className="w-12 h-12 overflow-hidden rounded-full bg-slate-700 flex-shrink-0 border-2 border-slate-600 shadow-lg">
                  {predictionMatch.team_away_badge ? (
                    <img
                      src={predictionMatch.team_away_badge || "/placeholder.svg"}
                      alt={predictionMatch.match_awayteam_name}
                      className="object-cover w-full h-full"
                      loading="lazy"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=48&width=48"
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-lg font-bold text-white">
                      {predictionMatch.match_awayteam_name.substring(0, 1)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Maç durumu */}
            <div className="flex items-center justify-center">
              <Badge className={`text-white ${predictionMatch.match_live === "1" ? "bg-red-600 animate-pulse" : "bg-slate-500"}`}>
                {predictionMatch.match_status === "1H" ? "İlk Yarı" :
                 predictionMatch.match_status === "HT" ? "Devre Arası" :
                 predictionMatch.match_status === "2H" ? "İkinci Yarı" :
                 predictionMatch.match_status === "FT" ? "Maç Sonu" :
                 predictionMatch.match_live === "1" ? "Canlı" : "Upcoming"}
                {predictionMatch.match_elapsed && predictionMatch.match_live === "1" && ` ${predictionMatch.match_elapsed}'`}
              </Badge>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto hide-scrollbar android-scroll-content p-3">
            <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg">
              <UpcomingMatchPrediction 
                homeTeam={predictionMatch.match_hometeam_name}
                awayTeam={predictionMatch.match_awayteam_name}
                homeTeamId={predictionMatch.match_hometeam_id}
                awayTeamId={predictionMatch.match_awayteam_id}
              />
            </div>
          </div>
          
          {/* Alt bilgi çubuğu */}
          <div className="bg-slate-800/70 border-t border-slate-700/50 p-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Trophy className="w-4 h-4 text-amber-500 mr-1" />
                <span className="text-xs text-slate-300">{predictionMatch.league_name}</span>
              </div>
              <Badge variant="outline" className="text-xs bg-slate-700/50 border-slate-600/50">
                Canlı Tahmin
              </Badge>
            </div>
          </div>
            </div>
      )}
    </div>
  )
}

// Lig seçildiğinde bildirim gösterme fonksiyonu
const showLeagueSelectedNotification = (message: string, type: "success" | "error" = "success") => {
  // Bildirim gösterme işlemi
  const notification = document.createElement('div');
  const bgColor = type === "success" ? "bg-green-600" : "bg-red-600";
  
  notification.className = `fixed bottom-20 left-0 right-0 mx-auto w-4/5 ${bgColor} text-white p-3 rounded-lg text-center z-[9999] android-notification`;
  notification.style.maxWidth = '300px';
  notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
  
  // Icon seçimi
  const icon = type === "success" 
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mr-2"><polyline points="20 6 9 17 4 12"></polyline></svg>' 
    : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 mr-2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
  
  notification.innerHTML = `<div class="flex items-center justify-center">
    ${icon}
    <span>${message}</span>
  </div>`;
  
  document.body.appendChild(notification);
  
  // 2 saniye sonra bildirimi kaldır
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    notification.style.transition = 'opacity 0.5s, transform 0.5s';
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 500);
  }, 2000);
};
