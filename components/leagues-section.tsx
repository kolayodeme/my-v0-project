"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Search, Star, StarOff, Trophy, Calendar, ChevronRight, Zap, ChevronDown, ChevronUp, BarChart2, Sparkles, X, MapPin, Eye, Loader2, Globe } from "lucide-react"
import { getAllLeagues, getUpcomingMatches, getStandings, getTeamLastMatches } from "@/lib/football-api"
import { format, isToday, isTomorrow } from "date-fns"
import { tr } from "date-fns/locale"
import { H2HAnalysis } from "./h2h-analysis"
import { LastTenMatchAnalysis } from "./last-ten-match-analysis"
import { UpcomingMatchPrediction } from "./upcoming-match-prediction"
import { StandingsComparison } from "./standings-comparison"
import { useTranslation } from "./language-provider"
import { authService } from "@/lib/auth-service"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface League {
  league_id: string
  league_name: string
  country_name: string
  country_id: string
  league_season: string
  league_logo?: string
  country_logo?: string
}

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
  match_live?: string
  match_status?: string
  match_hometeam_score?: string
  match_awayteam_score?: string
  match_status_name?: string
}

interface LeagueWithMatches extends League {
  matches: Match[]
  matchCount: number
}

interface LeaguesSectionProps {
  onMatchSelect?: (matchId: string, homeTeamId: string, awayTeamId: string, tabType?: string) => void
}

const POPULAR_LEAGUES = [
  "152", // Premier League
  "302", // La Liga
  "207", // Serie A
  "175", // Bundesliga
  "168", // Ligue 1
  "244", // Champions League
]

const LeaguesSkeleton = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-16 bg-slate-700" />
        <Skeleton className="h-4 w-12 bg-slate-700" />
      </div>

      <Skeleton className="h-7 w-full bg-slate-700" />

      <div className="flex space-x-1">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-7 flex-1 bg-slate-700" />
        ))}
      </div>

      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1">
                  <Skeleton className="w-6 h-6 bg-slate-700 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-24 bg-slate-700 mb-1" />
                    <Skeleton className="h-2 w-16 bg-slate-700" />
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Skeleton className="w-5 h-5 bg-slate-700" />
                  <Skeleton className="w-5 h-5 bg-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export function LeaguesSection({ onMatchSelect }: LeaguesSectionProps) {
  const [leagues, setLeagues] = useState<LeagueWithMatches[]>([])
  const [visibleLeagues, setVisibleLeagues] = useState<LeagueWithMatches[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [favoriteLeagues, setFavoriteLeagues] = useState<string[]>([])
  const [selectedTab, setSelectedTab] = useState<"all" | "favorites" | "popular">("popular")
  const [expandedLeagues, setExpandedLeagues] = useState<string[]>([])
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)
  const [showMatchDetails, setShowMatchDetails] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [showLeagueMatches, setShowLeagueMatches] = useState(false)
  const [selectedLeague, setSelectedLeague] = useState<LeagueWithMatches | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [leaguesPerPage, setLeaguesPerPage] = useState(3)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const [selectedMatchTab, setSelectedMatchTab] = useState<"analysis" | "prediction">("analysis")
  const [homeLastMatches, setHomeLastMatches] = useState<any[]>([])
  const [awayLastMatches, setAwayLastMatches] = useState<any[]>([])
  const [homeStanding, setHomeStanding] = useState<any>(null)
  const [awayStanding, setAwayStanding] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [showAllLeagues, setShowAllLeagues] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [showPopularLeagues, setShowPopularLeagues] = useState(false)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [showPredictionModal, setShowPredictionModal] = useState(false)
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  const scrollStyles = `
  .mobile-scrollbar::-webkit-scrollbar {
    width: 2px;
    height: 2px;
  }

  .mobile-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(107, 114, 128, 0.5);
    border-radius: 4px;
  }

  .mobile-scrollbar::-webkit-scrollbar-track {
    background-color: rgba(15, 23, 42, 0.2);
  }

  .android-scroll-container {
    overscroll-behavior-y: contain;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
  
  .android-scroll-content {
    padding-bottom: 50px;
    min-height: 100%;
  }
  `

  useEffect(() => {
    if (!document.getElementById('mobile-scroll-styles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'mobile-scroll-styles';
      styleEl.innerHTML = scrollStyles + `
      .glow-effect {
        box-shadow: 0 0 15px rgba(74, 222, 128, 0.3);
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% {
          box-shadow: 0 0 15px rgba(74, 222, 128, 0.3);
        }
        50% {
          box-shadow: 0 0 25px rgba(74, 222, 128, 0.5);
        }
        100% {
          box-shadow: 0 0 15px rgba(74, 222, 128, 0.3);
        }
      }
      `;
      document.head.appendChild(styleEl);
    }
    
    return () => {
      const styleEl = document.getElementById('mobile-scroll-styles');
      if (styleEl) {
        styleEl.remove();
      }
    }
  }, []);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const saved = localStorage.getItem("favoriteLeagues")
    if (saved) {
      try {
        setFavoriteLeagues(JSON.parse(saved))
      } catch (error) {
        console.error("Error loading favorite leagues:", error)
      }
    }
  }, [])

  const saveFavorites = useCallback((favorites: string[]) => {
    try {
      localStorage.setItem("favoriteLeagues", JSON.stringify(favorites))
      setFavoriteLeagues(favorites)
    } catch (error) {
      console.error("Error saving favorite leagues:", error)
    }
  }, [])

  const toggleFavorite = useCallback(
    (leagueId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      const newFavorites = favoriteLeagues.includes(leagueId)
        ? favoriteLeagues.filter((id) => id !== leagueId)
        : [...favoriteLeagues, leagueId]

      saveFavorites(newFavorites)
    },
    [favoriteLeagues, saveFavorites],
  )

  const toggleLeagueExpansion = useCallback((leagueId: string) => {
    setExpandedLeagues(prev => 
      prev.includes(leagueId) 
        ? prev.filter(id => id !== leagueId) 
        : [...prev, leagueId]
    )
  }, [])

  const formatDateForDisplay = useCallback((dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) {
      return "Bugün"
    } else if (isTomorrow(date)) {
      return "Yarın"
    } else {
      return format(date, "d MMMM EEEE", { locale: tr })
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadLeagues = async () => {
      try {
        setLoading(true)
        setError(null)

        const leaguesData = await getAllLeagues()

        if (!isMounted || !Array.isArray(leaguesData)) return

        const today = new Date()
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

        const upcomingMatches = await getUpcomingMatches(
          today.toISOString().split("T")[0],
          nextWeek.toISOString().split("T")[0],
        )

        const matchesByLeague = new Map<string, Match[]>()

        if (Array.isArray(upcomingMatches)) {
          upcomingMatches.forEach((match) => {
            if (match.league_id) {
              const leagueMatches = matchesByLeague.get(match.league_id) || []
              leagueMatches.push(match)
              matchesByLeague.set(match.league_id, leagueMatches)
            }
          })
        }

        const leaguesWithMatches: LeagueWithMatches[] = leaguesData.map((league) => {
          const matches = matchesByLeague.get(league.league_id) || []
          matches.sort((a, b) => {
            const dateA = new Date(`${a.match_date}T${a.match_time}`)
            const dateB = new Date(`${b.match_date}T${b.match_time}`)
            return dateA.getTime() - dateB.getTime()
          })
          
          return {
          ...league,
            matches,
            matchCount: matches.length,
          }
        })

        leaguesWithMatches.sort((a, b) => {
          if (a.matchCount > 0 && b.matchCount === 0) return -1
          if (a.matchCount === 0 && b.matchCount > 0) return 1
          return a.league_name.localeCompare(b.league_name, "tr")
        })

        if (isMounted) {
          setLeagues(leaguesWithMatches)
          setPage(1)
          setHasMore(true)
          
          if (debouncedSearchTerm.trim()) {
            const leaguesWithMatchesIds = leaguesWithMatches
              .filter(league => league.matchCount > 0)
              .map(league => league.league_id)
            setExpandedLeagues(leaguesWithMatchesIds)
          }
        }
      } catch (error) {
        console.error("Error loading leagues:", error)
        setError("Ligler yüklenirken bir hata oluştu")
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadLeagues()

    return () => {
      isMounted = false
    }
  }, [debouncedSearchTerm, t])

  const filteredLeagues = useMemo(() => {
    let filtered = leagues

    if (debouncedSearchTerm.trim()) {
      const search = debouncedSearchTerm.toLowerCase().trim()
      filtered = filtered.filter(
        (league) =>
          league.league_name.toLowerCase().includes(search) || 
          league.country_name.toLowerCase().includes(search) ||
          league.matches.some(match => 
            match.match_hometeam_name.toLowerCase().includes(search) ||
            match.match_awayteam_name.toLowerCase().includes(search)
          )
      )
    }

    switch (selectedTab) {
      case "favorites":
        filtered = filtered.filter((league) => favoriteLeagues.includes(league.league_id))
        break
      case "popular":
        filtered = filtered.filter((league) => POPULAR_LEAGUES.includes(league.league_id))
        break
      default:
        break
    }

    return filtered
  }, [leagues, debouncedSearchTerm, selectedTab, favoriteLeagues])
  
  useEffect(() => {
    setVisibleLeagues(filteredLeagues.slice(0, page * leaguesPerPage))
    setHasMore(page * leaguesPerPage < filteredLeagues.length)
  }, [filteredLeagues, page])
  
  useEffect(() => {
    if (loading) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !loadingMore) {
        setLoadingMore(true);
        
        setTimeout(() => {
          setPage(prev => prev + 1);
          setLoadingMore(false);
        }, 300);
      }
    };

    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, hasMore, loadingMore]);

  const handleMatchSelection = (match: Match, tabType?: string) => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      // If not authenticated, redirect to login page
      router.push('/login');
      return;
    }
    
    console.log(`handleMatchSelection called with match ID: ${match.match_id}, tabType: ${tabType}`);
    
    // If authenticated, proceed with normal behavior
    if (onMatchSelect) {
      console.log(`Forwarding to onMatchSelect: ${match.match_id}, ${match.match_hometeam_id}, ${match.match_awayteam_id}, ${tabType}`);
      onMatchSelect(match.match_id, match.match_hometeam_id, match.match_awayteam_id, tabType);
    } else {
      console.log(`Showing internal match details with tab: ${tabType}`);
      setSelectedMatch(match);
      if (tabType) {
        setSelectedMatchTab(tabType as "analysis" | "prediction");
      }
      setShowMatchDetails(true);
    }
  };

  const handleAnalysisClick = async (match: Match, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    setSelectedMatch(match);
    setSelectedMatchTab("analysis");
    setShowMatchDetails(true);
    await loadMatchDetails(match);
  };

  const handlePredictionClick = async (match: Match, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      router.push('/login');
      return;
    }

    setSelectedMatch(match);
    setSelectedMatchTab("prediction");
    setShowMatchDetails(true);
    await loadMatchDetails(match);
  };

  const showLeagueMatchesHandler = useCallback((league: LeagueWithMatches, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeague(league);
    setShowLeagueMatches(true);
  }, []);
  
  const closeLeagueMatches = useCallback(() => {
    setShowLeagueMatches(false);
    setSelectedLeague(null);
  }, []);
  
  const closeMatchDetails = useCallback(() => {
    setShowMatchDetails(false);
    setSelectedMatch(null);
    setSelectedMatchId(null);
  }, []);
  
  const changeMatchTab = useCallback((tabType: "analysis" | "prediction") => {
    setSelectedMatchTab(tabType);
  }, []);
  
  const loadMatchDetails = useCallback(async (match: Match) => {
    if (!match) return;
    
    setLoadingDetails(true);
    
    try {
      const [homeMatches, awayMatches] = await Promise.all([
        getTeamLastMatches(match.match_hometeam_id, 10),
        getTeamLastMatches(match.match_awayteam_id, 10)
      ]);
      
      if (Array.isArray(homeMatches)) {
        setHomeLastMatches(homeMatches);
      }
      
      if (Array.isArray(awayMatches)) {
        setAwayLastMatches(awayMatches);
      }
      
      if (match.league_id) {
        const standings = await getStandings(match.league_id);
        
        const homeTeamStanding = standings?.find((s: any) => 
          s.team_id === match.match_hometeam_id || 
          s.team_name?.toLowerCase() === match.match_hometeam_name.toLowerCase()
        );
        
        const awayTeamStanding = standings?.find((s: any) => 
          s.team_id === match.match_awayteam_id || 
          s.team_name?.toLowerCase() === match.match_awayteam_name.toLowerCase()
        );
        
        setHomeStanding(homeTeamStanding || null);
        setAwayStanding(awayTeamStanding || null);
      }
      
    } catch (error) {
      console.error("Maç detayları yüklenirken hata:", error);
    } finally {
      setLoadingDetails(false);
    }
  }, []);
  
  const handleAnalysisOrPrediction = useCallback((match: Match, tabType: string) => {
    if (onMatchSelect) {
      console.log(`Analiz/Tahmin çağrılıyor: ${match.match_id}, ${match.match_hometeam_id}, ${match.match_awayteam_id}, ${tabType}`);
      
      onMatchSelect(match.match_id, match.match_hometeam_id, match.match_awayteam_id, tabType);
    } else {
      console.warn("onMatchSelect callback tanımlı değil!");
    }
  }, [onMatchSelect]);

  useEffect(() => {
    if (selectedMatch) {
      loadMatchDetails(selectedMatch);
    }
  }, [selectedMatch, loadMatchDetails]);

  // Tümü butonuna tıklandığında ayrı bir arayüz açacak fonksiyon
  const handleAllLeaguesClick = useCallback(() => {
    setSearchTerm(""); // Arama kutusunu temizle
    setSelectedCountry(null); // Ülke filtresini sıfırla
    setShowAllLeagues(true);
  }, []);

  // Ayrı arayüzü kapatacak fonksiyon
  const closeAllLeagues = useCallback(() => {
    setShowAllLeagues(false);
    // Aramayı sıfırla, böylece bir sonraki açılışta tekrar yüklenmesin
    setSearchTerm("");
  }, []);

  // Ülkelerin listesini almak için
  const countries = useMemo(() => {
    const uniqueCountries = new Set<string>();
    leagues.forEach(league => {
      if (league.country_name) {
        uniqueCountries.add(league.country_name);
      }
    });
    return Array.from(uniqueCountries).sort();
  }, [leagues]);

  // Ülkeye göre ligleri filtrelemek için
  const filterLeaguesByCountry = useCallback((country: string | null) => {
    // Önceki aramaları temizle, bu performansı artırır
    setSearchTerm("");
    setSelectedCountry(country);
  }, []);

  // Tüm ligler filtreleme - Memoize ile optimize edildi
  const filteredAllLeagues = useMemo(() => {
    // Performans optimizasyonu: Çok kısa aramalar için filtrelemeyi atla
    if (searchTerm.trim().length === 1) {
      return leagues.slice(0, 20); // Sadece ilk 20 sonucu göster
    }
    
    let filtered = leagues;
    
    if (searchTerm.trim().length > 1) {
      const search = searchTerm.toLowerCase().trim();
      
      // Önce lig isimlerine göre filtreleme yap (daha az sayıda karşılaştırma)
      const leagueNameMatches = filtered.filter(league => 
        league.league_name.toLowerCase().includes(search)
      );
      
      // Eğer yeterli sonuç varsa sadece bunları göster
      if (leagueNameMatches.length >= 10) {
        return leagueNameMatches;
      }
      
      // Değilse, ülke isimlerine göre de filtrele
      filtered = filtered.filter(
        (league) =>
          league.league_name.toLowerCase().includes(search) || 
          league.country_name.toLowerCase().includes(search)
      );
    }
    
    if (selectedCountry) {
      filtered = filtered.filter(league => league.country_name === selectedCountry);
    }
    
    return filtered;
  }, [leagues, searchTerm, selectedCountry]);
  
  // Ligleri ülkelere göre gruplandır
  const leaguesByCountry = useMemo(() => {
    const grouped = new Map<string, LeagueWithMatches[]>();
    
    filteredAllLeagues.forEach(league => {
      const country = league.country_name;
      if (!grouped.has(country)) {
        grouped.set(country, []);
      }
      grouped.get(country)?.push(league);
    });
    
    // Ülke adına göre sırala
    return new Map([...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [filteredAllLeagues]);

  // Add refresh event listener
  useEffect(() => {
    const handleRefresh = (event: CustomEvent) => {
      const { forceRefresh } = event.detail;
      fetchLeagues(forceRefresh);
    };

    window.addEventListener('refreshLeagues', handleRefresh as EventListener);
    return () => {
      window.removeEventListener('refreshLeagues', handleRefresh as EventListener);
    };
  }, []);

  const fetchLeagues = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllLeagues()
      if (Array.isArray(data)) {
        setLeagues(data)
      }
    } catch (err) {
      console.error("Error fetching leagues:", err)
      setError("")
    } finally {
      setLoading(false)
    }
  }

  // Popüler ligler gösterildiğinde daha fazla lig yükle
  useEffect(() => {
    if (showPopularLeagues) {
      setLeaguesPerPage(10);  // Daha fazla lig göster
    } else {
      setLeaguesPerPage(3);   // Varsayılan değere dön
    }
  }, [showPopularLeagues]);
  
  // Popüler liglerde maç olup olmadığını kontrol et
  const popularLeaguesWithMatches = useMemo(() => {
    return leagues
      .filter(league => POPULAR_LEAGUES.includes(league.league_id))
      .filter(league => league.matchCount > 0);
  }, [leagues]);
  
  const hasPopularLeaguesWithMatches = useMemo(() => {
    return popularLeaguesWithMatches.length > 0;
  }, [popularLeaguesWithMatches]);

  if (loading) {
    return <LeaguesSkeleton />
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">{t('ligler')}</h2>
        <Badge variant="outline" className="text-[10px] py-0 px-1 bg-green-900/30 text-green-400 border-green-700/50">
          <Trophy className="w-2 h-2 mr-1" />
          {filteredLeagues.length}
        </Badge>
      </div>

      <div className="flex flex-col items-center space-y-2 bg-gradient-to-br from-green-900/50 to-green-800/50 rounded-lg p-3 border border-green-700/30">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400/30 to-green-900/30 flex items-center justify-center border border-green-400/40 shadow-lg glow-effect">
          <Globe className="w-9 h-9 text-green-400" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-white">956 Lig</h3>
          <p className="text-sm text-green-300 mt-1">Dünyadaki tüm lig maçları burada!</p>
          <p className="text-xs font-medium text-yellow-400 mt-1 bg-yellow-900/20 py-1 px-2 rounded-full border border-yellow-700/30">
            Algoritma tahmini ile kazan
          </p>
        </div>
        <Button 
          variant="outline" 
          className="mt-2 h-10 text-sm bg-gradient-to-r from-yellow-700/50 to-yellow-800/50 hover:from-yellow-600/50 hover:to-yellow-700/50 text-yellow-300 border-yellow-700/50 w-full shadow-lg transition-all duration-300"
          onClick={handleAllLeaguesClick}
        >
          <Trophy className="w-4 h-4 mr-2 text-yellow-400" />
          Ligini Seç
        </Button>
      </div>

      {!showPopularLeagues ? (
        hasPopularLeaguesWithMatches ? (
          <Button 
            variant="outline" 
            className="h-9 text-sm bg-gradient-to-r from-green-800/40 to-green-900/40 hover:from-green-700/40 hover:to-green-800/40 text-green-300 border-green-700/50 transition-all duration-300 w-full mt-2 shadow-md"
            onClick={() => setShowPopularLeagues(true)}
          >
            <Zap className="w-4 h-4 mr-2 text-green-400" />
            Popüler Ligleri Göster ({popularLeaguesWithMatches.length})
          </Button>
        ) : null
      ) : (
        <Button 
          variant="outline" 
          className="h-8 text-xs bg-gradient-to-r from-slate-800/40 to-slate-900/40 hover:from-slate-700/40 hover:to-slate-800/40 text-slate-300 border-slate-700/50 transition-all duration-300 w-full mt-2"
          onClick={() => setShowPopularLeagues(false)}
        >
          <X className="w-3 h-3 mr-1 text-slate-400" />
          Ligleri Gizle
        </Button>
      )}

      <ScrollArea className={`${showPopularLeagues ? 'h-[350px]' : 'h-[0px] opacity-0'} pr-2 mobile-scrollbar transition-all duration-300`}>
        <div className="space-y-1 league-card compact-ui">
          {showPopularLeagues && (
            popularLeaguesWithMatches.length === 0 ? (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardContent className="p-2 text-center">
                  <Trophy className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <h3 className="text-xs font-medium text-white mb-1">
                    Bugün Popüler Liglerde Maç Yok
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Daha sonra tekrar kontrol edin
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {popularLeaguesWithMatches.map((league) => (
                  <Card
                    key={league.league_id}
                    className={`bg-slate-800/50 border-slate-700/50 hover:border-green-500/50 transition-all duration-200 group ${
                      expandedLeagues.includes(league.league_id) ? "border-green-500/50" : ""
                    }`}
                  >
                    <CardContent 
                      className="p-1 cursor-pointer android-touch" 
                      onClick={() => toggleLeagueExpansion(league.league_id)}
                    >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 flex-1 min-w-0">
                          <div className="w-4 h-4 bg-slate-700/50 rounded-full flex items-center justify-center flex-shrink-0">
                          {league.league_logo ? (
                            <img
                              src={league.league_logo || "/placeholder.svg"}
                              alt={league.league_name}
                                className="w-3 h-3 object-contain fallback-optim"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display = "none"
                              }}
                            />
                          ) : (
                              <Trophy className="w-2 h-2 text-slate-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1">
                              <h3 className="font-medium text-[10px] text-white truncate">{league.league_name}</h3>
                            {POPULAR_LEAGUES.includes(league.league_id) && (
                              <Badge
                                variant="outline"
                                  className="bg-yellow-900/30 text-yellow-400 border-yellow-700/50 text-[8px] py-0 px-0.5"
                              >
                                  P
                              </Badge>
                            )}
                          </div>

                            <div className="flex items-center space-x-1 text-[8px] text-slate-400">
                              <span className="truncate">{league.country_name}</span>

                              {league.matchCount > 0 && (
                                <span className="flex items-center text-green-400">
                                  <Calendar className="w-2 h-2 mr-0.5" />
                                  {league.matchCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => toggleFavorite(league.league_id, e)}
                            className="p-0.5 hover:bg-slate-700/50 rounded android-touch"
                          >
                            {favoriteLeagues.includes(league.league_id) ? (
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            ) : (
                              <StarOff className="w-3 h-3 text-slate-400" />
                            )}
                          </button>

                          {league.matchCount > 0 && (
                            <div className="flex items-center space-x-1">
                              <button 
                                className="p-0.5 hover:bg-slate-700/50 rounded android-touch"
                                onClick={(e) => showLeagueMatchesHandler(league, e)}
                                title={t('viewMatches')}
                              >
                                <Eye className="w-3 h-3 text-green-400" />
                              </button>
                              <button 
                                className="text-[8px] bg-green-600 hover:bg-green-500 text-white px-1 py-0.5 rounded android-touch"
                                onClick={(e) => showLeagueMatchesHandler(league, e)}
                              >
                                {t('viewMatches')}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )
          )}
        </div>
      </ScrollArea>

      {showLeagueMatches && selectedLeague && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm overscroll-none">
          <Card className="w-full max-w-md mx-auto bg-slate-800/90 border-slate-700/50">
            <CardContent className="p-0">
              <div className="sticky top-0 z-10 bg-gradient-to-b from-slate-800 to-slate-700 p-2 sm:p-3 flex justify-between items-center border-b border-slate-600/50">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                  {selectedLeague.league_logo ? (
                    <img 
                      src={selectedLeague.league_logo} 
                      alt={selectedLeague.league_name}
                      className="w-6 h-6 sm:w-8 sm:h-8 object-contain flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate">{selectedLeague.league_name}</h3>
                    <p className="text-[10px] sm:text-xs text-slate-400 truncate">{selectedLeague.country_name}</p>
                  </div>
                  <Badge className="bg-green-600/80 text-white border-green-500/50 ml-1 flex-shrink-0 text-[10px] sm:text-xs">
                    <Calendar className="w-3 h-3 mr-1" />
                    {selectedLeague.matchCount}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-slate-700/50 rounded-full ml-2 flex-shrink-0" 
                  onClick={closeLeagueMatches}
                >
                  <X className="w-4 h-4 text-slate-400" />
                </Button>
              </div>
              
              <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden overscroll-contain will-change-scroll">
                <div className="space-y-1 p-2">
                  {selectedLeague.matches.map(match => (
                    <div 
                      key={match.match_id} 
                      className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden transform-gpu"
                    >
                      <div className="p-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex flex-col items-start flex-shrink-0">
                            <span className="text-[10px] sm:text-[11px] text-slate-400">
                              {formatDateForDisplay(match.match_date)}
                            </span>
                            <span className="text-[11px] sm:text-[13px] text-yellow-400 font-medium">
                              {match.match_time}
                            </span>
                          </div>

                          <div className="flex-1 flex items-center min-w-0 px-1 sm:px-2">
                            <div className="flex items-center space-x-1 sm:space-x-2 flex-1 min-w-0">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                {match.team_home_badge ? (
                                  <img 
                                    src={match.team_home_badge} 
                                    alt={match.match_hometeam_name} 
                                    className="w-4 h-4 sm:w-5 sm:h-5 object-contain" 
                                    loading="lazy"
                                  />
                                ) : (
                                  <span className="text-[10px] font-bold">{match.match_hometeam_name.substring(0, 1)}</span>
                                )}
                              </div>
                              <span className="text-[11px] sm:text-[12px] text-white truncate font-medium">{match.match_hometeam_name}</span>
                            </div>
                            
                            <div className="flex items-center mx-2 flex-shrink-0">
                              {match.match_status === "Finished" ? (
                                <div className="flex items-center space-x-2">
                                  <span className="text-[12px] sm:text-[13px] font-bold text-white">{match.match_hometeam_score}</span>
                                  <span className="text-[10px] sm:text-[11px] text-slate-400">-</span>
                                  <span className="text-[12px] sm:text-[13px] font-bold text-white">{match.match_awayteam_score}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] sm:text-[11px] font-bold text-yellow-500">VS</span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-1 sm:space-x-2 flex-1 min-w-0 justify-end">
                              <span className="text-[11px] sm:text-[12px] text-white truncate font-medium">{match.match_awayteam_name}</span>
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                {match.team_away_badge ? (
                                  <img 
                                    src={match.team_away_badge} 
                                    alt={match.match_awayteam_name} 
                                    className="w-4 h-4 sm:w-5 sm:h-5 object-contain" 
                                    loading="lazy"
                                  />
                                ) : (
                                  <span className="text-[10px] font-bold">{match.match_awayteam_name.substring(0, 1)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {match.match_stadium && (
                          <div className="mt-1 text-center text-[9px] sm:text-[10px] text-slate-400 truncate">
                            <MapPin className="w-2.5 h-2.5 inline mr-1" />
                            {match.match_stadium}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-px bg-slate-700/50">
                        <Button 
                          className="h-7 sm:h-8 rounded-none bg-amber-500 hover:bg-amber-400 text-white text-[10px] sm:text-[11px] transform-gpu"
                          onClick={(e) => handleAnalysisClick(match, e)}
                        >
                          <BarChart2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5" />
                          {t('analyze')}
                        </Button>
                        <Button 
                          className="h-7 sm:h-8 rounded-none bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] sm:text-[11px] transform-gpu"
                          onClick={(e) => handlePredictionClick(match, e)}
                        >
                          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5" />
                          {t('predict')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showMatchDetails && selectedMatch && (
        <Card className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-auto">
          <div className="relative min-h-screen flex flex-col">
            <div className="sticky top-0 z-10 bg-gradient-to-b from-black to-transparent p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedMatch.match_hometeam_name} vs {selectedMatch.match_awayteam_name}</h2>
                  <p className="text-sm text-slate-400">{selectedMatch.league_name}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-slate-400 hover:text-white"
                  onClick={() => {
                    setShowMatchDetails(false);
                    setSelectedMatch(null);
                  }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 p-4">
              <Tabs 
                defaultValue={selectedMatchTab} 
                value={selectedMatchTab}
                onValueChange={(value) => setSelectedMatchTab(value as "analysis" | "prediction")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4 bg-slate-800/50">
                  <TabsTrigger value="standings" className="text-xs">
                    <Trophy className="w-3 h-3 mr-1" />
                    {t('standings')}
                  </TabsTrigger>
                  <TabsTrigger value="h2h" className="text-xs">
                    <BarChart2 className="w-3 h-3 mr-1" />
                    {t('h2h')}
                  </TabsTrigger>
                  <TabsTrigger value="last10" className="text-xs">
                    <BarChart2 className="w-3 h-3 mr-1" />
                    {t('last10Matches')}
                  </TabsTrigger>
                  <TabsTrigger value="prediction" className="text-xs">
                    <Sparkles className="w-3 h-3 mr-1" />
                    {t('prediction')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="standings" className="mt-4">
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                    <StandingsComparison
                      homeTeamId={selectedMatch.match_hometeam_id}
                      awayTeamId={selectedMatch.match_awayteam_id}
                      homeTeam={selectedMatch.match_hometeam_name}
                      awayTeam={selectedMatch.match_awayteam_name}
                      leagueId={selectedMatch.league_id}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="h2h" className="mt-4">
                  <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4">
                    <H2HAnalysis
                      firstTeamId={selectedMatch.match_hometeam_id}
                      secondTeamId={selectedMatch.match_awayteam_id}
                      firstTeamName={selectedMatch.match_hometeam_name}
                      secondTeamName={selectedMatch.match_awayteam_name}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="last10" className="mt-4">
                  <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-4 space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-purple-300 mb-2">{selectedMatch.match_hometeam_name}</h4>
                      <LastTenMatchAnalysis
                        teamId={selectedMatch.match_hometeam_id}
                        teamName={selectedMatch.match_hometeam_name}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-purple-300 mb-2">{selectedMatch.match_awayteam_name}</h4>
                      <LastTenMatchAnalysis
                        teamId={selectedMatch.match_awayteam_id}
                        teamName={selectedMatch.match_awayteam_name}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="prediction" className="mt-4">
                  <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-4">
                    <UpcomingMatchPrediction
                      homeTeam={selectedMatch.match_hometeam_name}
                      awayTeam={selectedMatch.match_awayteam_name}
                      homeTeamId={selectedMatch.match_hometeam_id}
                      awayTeamId={selectedMatch.match_awayteam_id}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </Card>
      )}

      {/* Tüm ligler için tamamen yeni arayüz */}
      {showAllLeagues && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-3 flex justify-between items-center border-b border-slate-600/50">
            <div className="flex items-center space-x-3">
              <Trophy className="w-6 h-6 text-blue-400" />
              <div>
                <h3 className="text-sm font-bold text-white">{t('allLeagues')}</h3>
                <p className="text-xs text-slate-400">{filteredAllLeagues.length} {t('leagues')}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-slate-700/50 rounded-full" 
              onClick={closeAllLeagues}
            >
              <X className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
          
          <div className="p-2 border-b border-slate-700/50">
            <div className="relative mb-2">
              <Search className="absolute left-2 top-2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t('searchLeagueOrTeam')}
                className="pl-8 py-1 h-8 text-sm bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-400"
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
                autoComplete="off"
              />
              {searchTerm && (
                <button 
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-300"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex space-x-1 overflow-x-auto py-1 no-scrollbar">
              <Button 
                variant="outline" 
                size="sm"
                className={`text-[10px] ${selectedCountry === null ? 'bg-green-800/20 text-green-300 border-green-700/50' : 'bg-slate-800/50 text-slate-300 border-slate-700/50'} whitespace-nowrap`}
                onClick={() => filterLeaguesByCountry(null)}
              >
                {t('allCountries')}
              </Button>
              {countries.map(country => (
                <Button 
                  key={country}
                  variant="outline" 
                  size="sm"
                  className={`text-[10px] ${selectedCountry === country ? 'bg-green-800/20 text-green-300 border-green-700/50' : 'bg-slate-800/50 text-slate-300 border-slate-700/50'} whitespace-nowrap`}
                  onClick={() => filterLeaguesByCountry(country)}
                >
                  {country}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <div className="p-2">
              <h4 className="text-xs font-medium text-green-400 mb-2 flex items-center">
                <Zap className="w-3 h-3 mr-1" />
                {t('populer')}
              </h4>
              
              <div className="grid grid-cols-1 gap-1 mb-4">
                {leagues
                  .filter(league => POPULAR_LEAGUES.includes(league.league_id))
                  .filter(league => !selectedCountry || league.country_name === selectedCountry)
                  .map(league => (
                    <Card
                      key={league.league_id}
                      className="bg-slate-800/50 border-slate-700/50 hover:border-green-500/50"
                    >
                      <CardContent className="p-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-slate-700/50 rounded-full flex items-center justify-center">
                            {league.league_logo ? (
                              <img
                                src={league.league_logo}
                                alt={league.league_name}
                                className="w-4 h-4 object-contain"
                              />
                            ) : (
                              <Trophy className="w-3 h-3 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-white">{league.league_name}</h4>
                            <p className="text-[10px] text-slate-400">{league.country_name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => toggleFavorite(league.league_id, e)}
                            className="p-0.5 hover:bg-slate-700/50 rounded"
                          >
                            {favoriteLeagues.includes(league.league_id) ? (
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            ) : (
                              <StarOff className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          
                          {league.matchCount > 0 && (
                            <Button 
                              size="sm"
                              className="h-6 text-[10px] bg-green-600 hover:bg-green-500 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                showLeagueMatchesHandler(league, e);
                                closeAllLeagues();
                              }}
                            >
                              <Calendar className="w-2 h-2 mr-1" />
                              {league.matchCount} {t('matchesCount')}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </div>
              
              <h4 className="text-xs font-medium text-blue-400 mb-2 flex items-center">
                <Trophy className="w-3 h-3 mr-1" />
                {t('allLeagues')}
              </h4>
              
              {selectedCountry ? (
                <div className="grid grid-cols-1 gap-1">
                  {filteredAllLeagues.slice(0, 100).map(league => (
                    <Card
                      key={league.league_id}
                      className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50"
                    >
                      <CardContent className="p-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-slate-700/50 rounded-full flex items-center justify-center">
                            {league.league_logo ? (
                              <img
                                src={league.league_logo}
                                alt={league.league_name}
                                className="w-4 h-4 object-contain"
                              />
                            ) : (
                              <Trophy className="w-3 h-3 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-white">{league.league_name}</h4>
                            <p className="text-[10px] text-slate-400">{league.country_name}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => toggleFavorite(league.league_id, e)}
                            className="p-0.5 hover:bg-slate-700/50 rounded"
                          >
                            {favoriteLeagues.includes(league.league_id) ? (
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            ) : (
                              <StarOff className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                          
                          {league.matchCount > 0 && (
                            <Button 
                              size="sm"
                              className="h-6 text-[10px] bg-blue-600 hover:bg-blue-500 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                showLeagueMatchesHandler(league, e);
                                closeAllLeagues();
                              }}
                            >
                              <Calendar className="w-2 h-2 mr-1" />
                              {league.matchCount} {t('matchesCount')}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from(leaguesByCountry.entries()).slice(0, 50).map(([country, leagues]) => (
                    <div key={country} className="space-y-1">
                      <h5 className="text-[11px] font-medium text-slate-300 bg-slate-800/80 p-1.5 rounded flex items-center">
                        <MapPin className="w-2.5 h-2.5 mr-1.5 text-blue-400" />
                        {country} <span className="text-[9px] text-slate-400 ml-1">({leagues.length})</span>
                      </h5>
                      
                      <div className="grid grid-cols-1 gap-1 pl-2">
                        {leagues.map(league => (
                          <Card
                            key={league.league_id}
                            className="bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50"
                          >
                            <CardContent className="p-2 flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-slate-700/50 rounded-full flex items-center justify-center">
                                  {league.league_logo ? (
                                    <img
                                      src={league.league_logo}
                                      alt={league.league_name}
                                      className="w-4 h-4 object-contain"
                                    />
                                  ) : (
                                    <Trophy className="w-3 h-3 text-slate-400" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-xs font-medium text-white">{league.league_name}</h4>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => toggleFavorite(league.league_id, e)}
                                  className="p-0.5 hover:bg-slate-700/50 rounded"
                                >
                                  {favoriteLeagues.includes(league.league_id) ? (
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  ) : (
                                    <StarOff className="w-4 h-4 text-slate-400" />
                                  )}
                                </button>
                                
                                {league.matchCount > 0 && (
                                  <Button 
                                    size="sm"
                                    className="h-6 text-[10px] bg-blue-600 hover:bg-blue-500 text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      showLeagueMatchesHandler(league, e);
                                      closeAllLeagues();
                                    }}
                                  >
                                    <Calendar className="w-2 h-2 mr-1" />
                                    {league.matchCount} {t('matchesCount')}
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
