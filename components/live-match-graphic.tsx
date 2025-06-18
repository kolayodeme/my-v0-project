"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/language-provider"
import { AlertTriangle, Flag, ShieldAlert, Goal, Clock, Loader2, Sparkles, BarChart2, Coins } from "lucide-react"
import { getMatchDetails, getMatchStatistics, getLiveMatches, getTeamLastMatches } from "@/lib/football-api"
import { UpcomingMatchPrediction } from "@/components/upcoming-match-prediction"
import { LastTenMatchAnalysis } from "@/components/last-ten-match-analysis"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCreditStore, CREDIT_COSTS } from "@/lib/credit-system"
import { CreditRequiredModal } from "@/components/ui/credit-required-modal"
import { useToast } from "@/hooks/use-toast"

// Maç olayları tipi
type MatchEvent = {
  id: string
  type: "attack" | "goal" | "yellowCard" | "redCard" | "corner" | "foul"
  team: "home" | "away"
  minute: number
  player?: string
  description: string
}

// Takım bilgisi tipi
type Team = {
  id: string
  name: string
  score: number
  logo?: string
  league?: string
  form?: string[]
  lastMatches?: any[]
  winProbability?: number
}

interface LiveMatchGraphicProps {
  matchId?: string
  homeTeamName?: string
  awayTeamName?: string
  homeTeamId?: string
  awayTeamId?: string
  homeTeamLogo?: string
  awayTeamLogo?: string
  homeScore?: string
  awayScore?: string
  matchStatus?: string
  matchElapsed?: string
  isLive?: boolean
}

export function LiveMatchGraphic({
  matchId,
  homeTeamName = "Ev Sahibi",
  awayTeamName = "Deplasman",
  homeTeamId,
  awayTeamId,
  homeTeamLogo,
  awayTeamLogo,
  homeScore = "0",
  awayScore = "0",
  matchStatus = "",
  matchElapsed = "0",
  isLive = true
}: LiveMatchGraphicProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<"field" | "stats" | "lineup" | "chat">("field")
  const [matchTime, setMatchTime] = useState(parseInt(matchElapsed) || 0)
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([])
  const [currentEvent, setCurrentEvent] = useState<MatchEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [homeTeam, setHomeTeam] = useState<Team>({
    id: homeTeamId || "1",
    name: homeTeamName || "Ev Sahibi",
    score: parseInt(homeScore) || 0,
    logo: homeTeamLogo || "/placeholder.svg",
    league: "",
    form: [],
    lastMatches: [],
    winProbability: 0
  })
  const [awayTeam, setAwayTeam] = useState<Team>({
    id: awayTeamId || "2",
    name: awayTeamName || "Deplasman",
    score: parseInt(awayScore) || 0,
    logo: awayTeamLogo || "/placeholder.svg",
    league: "",
    form: [],
    lastMatches: [],
    winProbability: 0
  })
  const [stats, setStats] = useState<any>(null)
  const [currentMatchElapsed, setCurrentMatchElapsed] = useState(matchElapsed)

  // Paslaşma ve animasyonlar için state'ler
  const [activePassing, setActivePassing] = useState<boolean>(true);
  const [passingPath, setPassingPath] = useState<{from: number, to: number, team: 'home' | 'away'}>({
    from: 0,
    to: 1,
    team: 'home'
  });
  const [showGoalEffect, setShowGoalEffect] = useState<boolean>(false);
  const [goalEffectTeam, setGoalEffectTeam] = useState<'home' | 'away'>('home');
  const [passingNotification, setPassingNotification] = useState<string>("");

  // Gol efekti için konfeti parçacıkları
  const confettiColors = ['#FFD700', '#FF0000', '#00FF00', '#0000FF', '#FF00FF'];
  const confettiCount = 50;

  const generateConfetti = () => {
    return Array.from({ length: confettiCount }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      rotation: Math.random() * 360,
      scale: Math.random() * 0.5 + 0.5,
    }));
  };

  const [confetti, setConfetti] = useState<any[]>([]);

  // Oyun durumu state'i: 'normal', 'attack-left', 'attack-right', 'pass', 'defense-left', 'defense-right'
  const [playState, setPlayState] = useState<'normal' | 'attack-left' | 'attack-right' | 'pass' | 'defense-left' | 'defense-right'>('normal');
  const [effectTeam, setEffectTeam] = useState<'home' | 'away'>('home');

  const [showPredictions, setShowPredictions] = useState(false);
  const [showLastTenMatches, setShowLastTenMatches] = useState(false);
  const [showLastTenCreditModal, setShowLastTenCreditModal] = useState(false);
  const { useCredits, hasCredits } = useCreditStore();
  const { toast } = useToast();

  // Algoritma kazandırır gösterimi için state
  const [showAlgorithmWins, setShowAlgorithmWins] = useState(false);

  // Handle Son 10 Maç credit usage
  const handleLastTenClick = async () => {
    if (hasCredits(CREDIT_COSTS.LAST_TEN)) {
      try {
        const success = await useCredits(CREDIT_COSTS.LAST_TEN);
        if (success) {
          // Kredi kullanıldı bildirimi için özel event tetikle
          if (typeof document !== 'undefined') {
            const event = new CustomEvent('creditUsed', { 
              detail: { 
                amount: CREDIT_COSTS.LAST_TEN,
                reason: 'analysis',
                message: `${CREDIT_COSTS.LAST_TEN} kredi analiz için kullanıldı!`
              }
            });
            document.dispatchEvent(event);
          }
          
          setShowLastTenMatches(true);
          // Show toast notification
          toast({
            title: "1 Kredi Kullanıldı",
            description: <div className="flex items-center"><Coins className="w-4 h-4 mr-1 text-yellow-400" /> Son 10 maç analizi için 1 kredi kullanıldı</div>,
            variant: "default",
            duration: 1500,
            className: "bg-slate-800 border-purple-600 text-white"
          });
        }
      } catch (error) {
        console.error('Error using credits:', error);
      }
    } else {
      setShowLastTenCreditModal(true);
    }
  };
  
  // Handle continue with credits for Son 10 Maç
  const handleContinueWithCredits = () => {
    setShowLastTenMatches(true);
    setShowLastTenCreditModal(false);
  };

  // Takım bilgilerini güncelle
  useEffect(() => {
    if (matchId) {
      setHomeTeam({
        id: homeTeamId || "1",
        name: homeTeamName || "Ev Sahibi",
        score: parseInt(homeScore) || 0,
        logo: homeTeamLogo || "/placeholder.svg",
        league: "",
        form: [],
        lastMatches: [],
        winProbability: 0
      })
      
      setAwayTeam({
        id: awayTeamId || "2",
        name: awayTeamName || "Deplasman",
        score: parseInt(awayScore) || 0,
        logo: awayTeamLogo || "/placeholder.svg",
        league: "",
        form: [],
        lastMatches: [],
        winProbability: 0
      })
      
      setCurrentMatchElapsed(matchElapsed)
      setMatchTime(parseInt(matchElapsed) || 0)
    }
  }, [homeTeamId, homeTeamName, homeTeamLogo, homeScore, awayTeamId, awayTeamName, awayTeamLogo, awayScore, matchElapsed, matchId])

  // Maç zamanını güncelle
  useEffect(() => {
    if (!isLive) return
    
    // API'den gelen başlangıç dakikasını ayarla
    setMatchTime(parseInt(currentMatchElapsed) || 0)
    
    const timer = setInterval(() => {
      setMatchTime(prevTime => {
        const newTime = prevTime + 1
        setCurrentMatchElapsed(newTime.toString())
        return newTime
      })
    }, 30000) // Her 30 saniyede bir arttır (gerçek maç akışına daha yakın)

    return () => clearInterval(timer)
  }, [isLive, currentMatchElapsed])

  // Maç olaylarını işleme fonksiyonu
  const processMatchEvents = useCallback((detailsData: any) => {
    if (detailsData && Array.isArray(detailsData)) {
      const details = detailsData[0]
      const events: MatchEvent[] = []
      
      // Golleri ekle
      if (details && details.goalscorer && Array.isArray(details.goalscorer)) {
        details.goalscorer.forEach((goal: any, index: number) => {
          if (goal.time && (goal.home_scorer || goal.away_scorer)) {
            events.push({
              id: `goal-${index}`,
              type: "goal",
              team: goal.home_scorer ? "home" : "away",
              minute: parseInt(goal.time),
              player: goal.home_scorer || goal.away_scorer,
              description: `Gol! ${goal.home_scorer || goal.away_scorer} (${goal.time}')`
            })
          }
        })
      }
      
      // Kartları ekle
      if (details && details.cards && Array.isArray(details.cards)) {
        details.cards.forEach((card: any, index: number) => {
          if (card.time && (card.home_fault || card.away_fault)) {
            events.push({
              id: `card-${index}`,
              type: card.card === "yellow card" ? "yellowCard" : "redCard",
              team: card.home_fault ? "home" : "away",
              minute: parseInt(card.time),
              player: card.home_fault || card.away_fault,
              description: `${card.card === "yellow card" ? "Sarı Kart" : "Kırmızı Kart"} ${card.home_fault || card.away_fault} (${card.time}')`
            })
          }
        })
      }
      
      // Tehlikeli ataklar ekle (API'den gelmiyorsa, maçın akışına göre tahmin et)
      // Maç dakikasına göre otomatik atak olayları oluştur
      const currentMinute = parseInt(currentMatchElapsed)
      
      // Her 10 dakikada bir tehlikeli atak ekle (daha gerçekçi maç akışı için)
      if (currentMinute % 10 === 5) {
        events.push({
          id: `attack-home-${currentMinute}`,
          type: "attack",
          team: "home",
          minute: currentMinute,
          description: "Tehlikeli atak"
        })
      } else if (currentMinute % 10 === 8) {
        events.push({
          id: `attack-away-${currentMinute}`,
          type: "attack",
          team: "away",
          minute: currentMinute,
          description: "Tehlikeli atak"
        })
      }
      
      // Olayları dakikaya göre sırala
      events.sort((a, b) => a.minute - b.minute)
      setMatchEvents(events)
    }
  }, [currentMatchElapsed])

  // Maç zamanı gösterimi için yeni state
  const [matchStatusBlink, setMatchStatusBlink] = useState(true);

  // Yanıp sönen efekt için useEffect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setMatchStatusBlink(prev => !prev);
    }, 800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Maç durumu gösterimi güncelleme
  const renderMatchStatus = () => {
    const isScoreless = homeTeam.score === 0 && awayTeam.score === 0;
    
    return (
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 flex items-center">
        <div className="flex items-center gap-2 bg-slate-900/70 px-2 py-0.5 rounded-full">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-white text-xs">
            {isScoreless ? "Heyecan Devam Ediyor" : "Maç Devam Ediyor"}
          </span>
        </div>
      </div>
    );
  };

  // Rastgele bir canlı maç seç ve verilerini kullan
  const fetchRandomLiveMatch = useCallback(async () => {
    if (matchId) return // Eğer matchId varsa, rastgele maç seçme

    try {
      setLoading(true)
      setError(null)
      
      // Canlı maçları çek
      const liveMatches = await getLiveMatches()
      
      if (liveMatches && Array.isArray(liveMatches) && liveMatches.length > 0) {
        console.log("Çekilen canlı maçlar:", liveMatches)
        
        // Skorlu maçları önceliklendir
        const scoredMatches = liveMatches.filter(match => 
          parseInt(match.match_hometeam_score || "0") > 0 || 
          parseInt(match.match_awayteam_score || "0") > 0
        );
        
        const matchesToUse = scoredMatches.length > 0 ? scoredMatches : liveMatches;
        const randomIndex = Math.floor(Math.random() * matchesToUse.length)
        const randomMatch = matchesToUse[randomIndex]
        
        console.log("Seçilen canlı maç:", randomMatch)
        
        // Seçilen maçın ID'sini kullanarak detay ve istatistik bilgilerini çek
        const [detailsData, statsData] = await Promise.all([
          getMatchDetails(randomMatch.match_id),
          getMatchStatistics(randomMatch.match_id)
        ])
        
        // Son 10 maç verilerini çek
        const homeLastMatches = await getTeamLastMatches(randomMatch.match_hometeam_id)
        const awayLastMatches = await getTeamLastMatches(randomMatch.match_awayteam_id)
        
        // Form durumunu hesapla
        const homeForm = calculateTeamForm(homeLastMatches)
        const awayForm = calculateTeamForm(awayLastMatches)
        
        // Kazanma olasılığını hesapla
        const { homeWinProb, awayWinProb } = calculateWinProbability(homeLastMatches, awayLastMatches)
        
        console.log("Çekilen maç detayları:", detailsData)
        
        // Takım bilgilerini güncelle - API'den gelen gerçek verilerle
        setHomeTeam({
          id: randomMatch.match_hometeam_id,
          name: randomMatch.match_hometeam_name,
          score: parseInt(randomMatch.match_hometeam_score || "0"),
          logo: randomMatch.team_home_badge,
          league: randomMatch.league_name,
          form: homeForm,
          lastMatches: homeLastMatches,
          winProbability: homeWinProb
        })
        
        setAwayTeam({
          id: randomMatch.match_awayteam_id,
          name: randomMatch.match_awayteam_name,
          score: parseInt(randomMatch.match_awayteam_score || "0"),
          logo: randomMatch.team_away_badge,
          league: randomMatch.league_name,
          form: awayForm,
          lastMatches: awayLastMatches,
          winProbability: awayWinProb
        })
        
        // Maç durumu ve geçen süreyi güncelle - API'den gelen gerçek verilerle
        const elapsed = parseInt(randomMatch.match_elapsed || "0")
        setCurrentMatchElapsed(elapsed.toString())
        setMatchTime(elapsed)
        
        // Maç olaylarını işle - API'den gelen gerçek verilerle
        if (detailsData && Array.isArray(detailsData) && detailsData.length > 0) {
          processMatchEvents(detailsData)
        } else {
          setMatchEvents([])
        }
        
        // İstatistikleri ayarla - API'den gelen gerçek verilerle
        if (statsData) {
          setStats(statsData)
        }
      } else {
        console.error("Canlı maç bulunamadı veya API yanıtı geçersiz:", liveMatches)
        setError("Canlı maç bulunamadı. Lütfen daha sonra tekrar deneyin.")
      }
    } catch (error) {
      console.error("Rastgele canlı maç yüklenirken hata:", error)
      setError("Maç verileri yüklenirken hata oluştu. Lütfen daha sonra tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }, [processMatchEvents])

  // Form durumunu hesapla
  const calculateTeamForm = (matches: any[]) => {
    return matches.slice(0, 10).map(match => {
      if (match.match_hometeam_score > match.match_awayteam_score) {
        return match.match_hometeam_id === match.team_id ? "W" : "L"
      } else if (match.match_hometeam_score < match.match_awayteam_score) {
        return match.match_hometeam_id === match.team_id ? "L" : "W"
      }
      return "D"
    })
  }

  // Kazanma olasılığını hesapla
  const calculateWinProbability = (homeMatches: any[], awayMatches: any[]) => {
    const homeWins = homeMatches.filter(m => 
      (m.match_hometeam_id === m.team_id && m.match_hometeam_score > m.match_awayteam_score) ||
      (m.match_awayteam_id === m.team_id && m.match_awayteam_score > m.match_hometeam_score)
    ).length

    const awayWins = awayMatches.filter(m => 
      (m.match_hometeam_id === m.team_id && m.match_hometeam_score > m.match_awayteam_score) ||
      (m.match_awayteam_id === m.team_id && m.match_awayteam_score > m.match_hometeam_score)
    ).length

    const homeWinProb = (homeWins / 10) * 100
    const awayWinProb = (awayWins / 10) * 100

    return { homeWinProb, awayWinProb }
  }

  // Maç detaylarını ve istatistiklerini çek
  useEffect(() => {
    const fetchMatchData = async () => {
      if (!matchId) {
        // Eğer matchId yoksa, rastgele bir canlı maç seç
        await fetchRandomLiveMatch()
        return
      }
      
      setLoading(true)
      setError(null)
      try {
        // Maç detaylarını ve istatistiklerini paralel olarak çek
        const [detailsData, statsData] = await Promise.all([
          getMatchDetails(matchId),
          getMatchStatistics(matchId)
        ])
        
        console.log("Çekilen maç detayları (ID ile):", detailsData)
        
        // İstatistikleri ayarla
        if (statsData) {
          setStats(statsData)
        }
        
        // Maç olaylarını işle
        if (detailsData && Array.isArray(detailsData) && detailsData.length > 0) {
          processMatchEvents(detailsData)
        } else {
          setMatchEvents([])
          console.error("Maç detayları bulunamadı veya geçersiz format:", detailsData)
        }
      } catch (error) {
        console.error("Maç verileri yüklenirken hata:", error)
        setError("Maç verileri yüklenirken hata oluştu. Lütfen daha sonra tekrar deneyin.")
      } finally {
        setLoading(false)
      }
    }
    
    fetchMatchData()
    
    // Düzenli aralıklarla verileri güncelle
    const intervalId = setInterval(() => {
      if (isLive) {
        fetchMatchData()
      }
    }, 60000) // Her 1 dakikada bir güncelle
    
    return () => clearInterval(intervalId)
  }, [matchId, isLive, fetchRandomLiveMatch, processMatchEvents])
  
  // Mevcut olayı ayarla
  useEffect(() => {
    // Mevcut dakikaya göre en son olayı bul
    const currentEvents = matchEvents.filter(e => e.minute <= matchTime)
    if (currentEvents.length > 0) {
      const lastEvent = currentEvents[currentEvents.length - 1]
      setCurrentEvent(lastEvent)
    } else {
      setCurrentEvent(null)
    }
  }, [matchEvents, matchTime])

  // Paslaşma animasyonunu başlat
  useEffect(() => {
    if (!activePassing) return;
    
    // Rastgele paslaşma oluştur
    const passingInterval = setInterval(() => {
      const team = Math.random() > 0.5 ? 'home' : 'away';
      const formation = team === 'home' ? homeTeamFormation : awayTeamFormation;
      
      // Rastgele iki oyuncu seç (aynı takımdan)
      const from = Math.floor(Math.random() * formation.length);
      let to = Math.floor(Math.random() * formation.length);
      
      // Aynı oyuncu olmamasını sağla
      while (to === from) {
        to = Math.floor(Math.random() * formation.length);
      }
      
      setPassingPath({from, to, team});
      
      // Paslaşma bildirimi
      const teamName = team === 'home' ? homeTeam.name : awayTeam.name;
      const actions = [
        `${teamName} paslaşıyor`,
        `${teamName} top kontrolünde`,
        `${teamName} atak organizasyonu`,
        `${teamName} ileri çıkıyor`,
        `${teamName} savunma yapıyor`
      ];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      setPassingNotification(randomAction);
      
      // 3 saniye sonra bildirimi temizle
      setTimeout(() => {
        setPassingNotification("");
      }, 3000);
      
    }, 4000); // Her 4 saniyede bir pas
    
    return () => clearInterval(passingInterval);
  }, [activePassing, homeTeam.name, awayTeam.name]);

  // Gol efekti için useEffect güncelleme
  useEffect(() => {
    // Yeni bir gol olduğunda efekti göster
    const checkForGoals = () => {
      const goalEvents = matchEvents.filter(e => e.type === "goal");
      
      // Eğer maç 0-0 ise ve yeni bir gol yoksa efekti gösterme
      if (homeTeam.score === 0 && awayTeam.score === 0) {
        setShowGoalEffect(false);
        setConfetti([]);
        return;
      }
      
      if (goalEvents.length > 0) {
        const lastGoal = goalEvents[goalEvents.length - 1];
        setGoalEffectTeam(lastGoal.team);
        setShowGoalEffect(true);
        setConfetti(generateConfetti());
        
        // 3 saniye sonra efekti kapat
        setTimeout(() => {
          setShowGoalEffect(false);
          setConfetti([]);
        }, 3000);
      }
    };
    
    checkForGoals();
  }, [matchEvents, homeTeam.score, awayTeam.score]);

  // Gollü maçlarda algoritma kazandırır gösterimini kontrol et
  useEffect(() => {
    const totalScore = homeTeam.score + awayTeam.score;
    if (totalScore > 0) {
      setShowAlgorithmWins(true);
    }
  }, [homeTeam.score, awayTeam.score]);

  // Algoritma kazandırır gösterimi
  const renderAlgorithmWins = () => {
    return (
      <div className="mt-2 px-4 py-3 bg-gradient-to-r from-green-900 to-emerald-900 border-t-2 border-b-2 border-green-500/30 relative overflow-hidden">
        {/* Arka plan efektleri */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-24 h-24 bg-yellow-400 rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-green-400 rounded-full filter blur-3xl animate-pulse delay-700"></div>
        </div>

        {/* Üst Rozetler */}
        <div className="flex justify-between items-start -mt-1 mb-2">
          <div className="bg-gradient-to-r from-purple-600/90 to-purple-800/90 px-3 py-1 rounded-br-lg shadow-lg">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-purple-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L1 12h3v9h6v-6h4v6h6v-9h3L12 2zm0 3l6 6h-4v9h-4v-9H6l6-6z"/>
              </svg>
              <span className="text-purple-200 text-xs font-semibold">Dünyada İlk ve Tek</span>
            </div>
          </div>
          <div className="bg-gradient-to-l from-blue-600/90 to-blue-800/90 px-3 py-1 rounded-bl-lg shadow-lg">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              <span className="text-blue-200 text-xs font-bold">Tüm Dünya Ligleri</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-pulse shadow-lg shadow-green-500/50">
                <img 
                  src="/football.svg" 
                  alt="Football"
                  className="w-8 h-8 animate-spin-slow"
                />
              </div>
              {/* Success Rate Badge */}
              <div className="absolute -left-2 -top-2 bg-gradient-to-r from-amber-500 to-yellow-500 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-lg transform -rotate-12 border border-yellow-400/50 flex items-center gap-1">
                <span>%92</span>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="absolute -right-1 -top-1">
                <div className="relative">
                  <img 
                    src="/money.svg" 
                    alt="Money"
                    className="w-6 h-6 animate-bounce"
                  />
                  <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-ping"></div>
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-lg font-bold tracking-wide">
                  Algoritma Motoru
                </span>
                <span className="bg-purple-600/30 text-purple-300 text-xs px-2 py-0.5 rounded-full border border-purple-500/30">
                  Premium
                </span>
              </div>
              <span className="text-emerald-300 text-sm font-medium">
                Dünya'nın En Güvenilir Tahmin Sistemi
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400/90 text-xs">
                    Patentli Özel Algoritma
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></div>
                </div>
                <div className="h-3 w-px bg-green-400/30"></div>
                <div className="flex items-center gap-1">
                  <span className="text-emerald-300/90 text-xs">
                    Global Analiz
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center border-2 border-yellow-400 shadow-lg"
                >
                  <span className="text-yellow-100 text-sm font-bold">$</span>
                </div>
              ))}
            </div>
            <a 
              href="/winners"
              className="group flex items-center gap-1 bg-gradient-to-r from-green-600/40 to-emerald-600/40 px-3 py-1.5 rounded-full border border-green-500/30 hover:from-green-600/60 hover:to-emerald-600/60 transition-all duration-300"
            >
              <span className="text-green-300 text-xs font-medium group-hover:text-green-200">Pro'ya Geç</span>
              <div className="animate-bounce">
                <svg className="w-4 h-4 text-green-400 group-hover:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </a>
          </div>
        </div>

        {/* Geçmiş Tahminler Bölümü */}
        <div className="mt-3 pt-3 border-t border-green-500/20 relative z-10">
          <div className="flex items-center justify-between bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-amber-300 text-sm font-bold tracking-wide">
                  ALGORİTMA BAŞARISINI CANLI GÖR!
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-emerald-400 text-xs font-semibold tracking-wide">
                    ÜCRETSİZ İNCELE
                  </span>
                  <svg className="w-3 h-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
            <button 
              onClick={() => window.location.href = '/winners'}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 px-4 py-2 rounded-full shadow-lg shadow-blue-500/20 transition-all duration-300 group"
            >
              <div className="flex flex-col items-end">
                <span className="text-white text-sm font-bold">GEÇMİŞ TAHMİNLER</span>
                <span className="text-blue-200 text-xs">HEMEN İNCELE</span>
              </div>
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 justify-center mt-3 bg-gradient-to-r from-green-900/40 to-emerald-900/40 p-2 rounded-lg border border-green-500/20">
            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span className="text-green-300 text-sm font-bold tracking-wide">
              TÜM GEÇMİŞ TAHMİNLERİMİZ ÜCRETSİZ!
            </span>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="flex justify-center gap-2 mt-3 pt-2">
          <div className="flex items-center gap-1.5 bg-blue-800/30 px-3 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-blue-300 text-xs font-semibold">TÜM DÜNYA LİGLERİ</span>
          </div>
          <div className="flex items-center gap-1.5 bg-purple-800/30 px-3 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></div>
            <span className="text-purple-300 text-xs font-semibold">BENZERSİZ SİSTEM</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-800/30 px-3 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></div>
            <span className="text-amber-300 text-xs font-semibold">%92 BAŞARI</span>
          </div>
        </div>
      </div>
    );
  };

  // Olay tipi simgesini göster
  const renderEventIcon = (type: MatchEvent["type"]) => {
    switch (type) {
      case "attack":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />
      case "goal":
        return <Goal className="w-4 h-4 text-green-400" />
      case "yellowCard":
        return <div className="w-3 h-4 bg-yellow-400 rounded-sm" />
      case "redCard":
        return <div className="w-3 h-4 bg-red-500 rounded-sm" />
      case "corner":
        return <Flag className="w-4 h-4 text-blue-400" />
      case "foul":
        return <ShieldAlert className="w-4 h-4 text-red-400" />
      default:
        return null
    }
  }

  // Oyuncu pozisyonları
  const homeTeamFormation = [
    { x: 5, y: 50, role: 'kaleci' }, // Kaleci
    { x: 15, y: 20, role: 'defans' }, // Defans
    { x: 15, y: 40, role: 'defans' },
    { x: 15, y: 60, role: 'defans' },
    { x: 15, y: 80, role: 'defans' },
    { x: 30, y: 30, role: 'ortasaha' }, // Orta saha
    { x: 30, y: 50, role: 'ortasaha' },
    { x: 30, y: 70, role: 'ortasaha' },
    { x: 45, y: 30, role: 'forvet' }, // Forvet
    { x: 45, y: 50, role: 'forvet' },
    { x: 45, y: 70, role: 'forvet' },
  ]

  const awayTeamFormation = [
    { x: 95, y: 50, role: 'kaleci' }, // Kaleci
    { x: 85, y: 20, role: 'defans' }, // Defans
    { x: 85, y: 40, role: 'defans' },
    { x: 85, y: 60, role: 'defans' },
    { x: 85, y: 80, role: 'defans' },
    { x: 70, y: 30, role: 'ortasaha' }, // Orta saha
    { x: 70, y: 50, role: 'ortasaha' },
    { x: 70, y: 70, role: 'ortasaha' },
    { x: 55, y: 30, role: 'forvet' }, // Forvet
    { x: 55, y: 50, role: 'forvet' },
    { x: 55, y: 70, role: 'forvet' },
  ]

  // Futbol sahası render fonksiyonu
  const renderFootballField = () => {
    return (
      <div className="relative bg-gradient-to-br from-green-800 to-green-600 aspect-[4/3] overflow-hidden">
        {/* Saha çizgileri - daha belirgin ve gerçekçi */}
        <div className="absolute inset-0">
          {/* Çim deseni */}
          <div className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 20px,
                rgba(255,255,255,0.1) 20px,
                rgba(255,255,255,0.1) 40px
              )`
            }}
          />

          {/* Orta çizgi - daha belirgin */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/60 transform -translate-x-1/2"></div>
          
          {/* Orta daire - daha belirgin */}
          <div className="absolute left-1/2 top-1/2 w-32 h-32 border-[3px] border-white/60 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white/60 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Ceza sahaları - daha belirgin */}
          {/* Sol (ev sahibi) */}
          <div className="absolute left-0 top-1/2 w-24 h-48 border-[3px] border-white/60 transform -translate-y-1/2"></div>
          <div className="absolute left-0 top-1/2 w-8 h-24 border-[3px] border-white/60 transform -translate-y-1/2"></div>
          
          {/* Sol kale - daha gerçekçi */}
          <div className="absolute left-0 top-1/2 w-2 h-16 transform -translate-y-1/2">
            <div className="absolute inset-0 border-[3px] border-white/80"></div>
            <div className="absolute inset-0 bg-white/10"></div>
            {/* Kale ağı efekti */}
            <div className="absolute left-0 w-6 h-full"
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 4px),
                                 repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 4px)`
              }}
            ></div>
          </div>
          
          {/* Sağ (deplasman) */}
          <div className="absolute right-0 top-1/2 w-24 h-48 border-[3px] border-white/60 transform -translate-y-1/2"></div>
          <div className="absolute right-0 top-1/2 w-8 h-24 border-[3px] border-white/60 transform -translate-y-1/2"></div>
          
          {/* Sağ kale - daha gerçekçi */}
          <div className="absolute right-0 top-1/2 w-2 h-16 transform -translate-y-1/2">
            <div className="absolute inset-0 border-[3px] border-white/80"></div>
            <div className="absolute inset-0 bg-white/10"></div>
            {/* Kale ağı efekti */}
            <div className="absolute right-0 w-6 h-full"
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 4px),
                                 repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 4px)`
              }}
            ></div>
          </div>
          
          {/* Köşe yayları - daha belirgin */}
          <div className="absolute left-0 top-0 w-8 h-8 border-[3px] border-t-0 border-l-0 border-white/60 rounded-br-full"></div>
          <div className="absolute left-0 bottom-0 w-8 h-8 border-[3px] border-b-0 border-l-0 border-white/60 rounded-tr-full"></div>
          <div className="absolute right-0 top-0 w-8 h-8 border-[3px] border-t-0 border-r-0 border-white/60 rounded-bl-full"></div>
          <div className="absolute right-0 bottom-0 w-8 h-8 border-[3px] border-b-0 border-r-0 border-white/60 rounded-tl-full"></div>
        </div>

        {/* Takım adları ve skorlar */}
        <div className="absolute top-2 left-2">
          <div className="flex flex-col">
            <div className="flex items-center">
              {homeTeam.logo && (
                <img 
                  src={homeTeam.logo} 
                  alt={homeTeam.name} 
                  className="w-6 h-6 mr-1 object-contain bg-white rounded-full p-0.5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              )}
              <Badge className="bg-slate-800/70 text-white text-xs">{homeTeam.name}</Badge>
            </div>
            <div className="flex mt-1 gap-0.5">
              {homeTeam.form?.map((result, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    result === "W" ? "bg-green-500" :
                    result === "L" ? "bg-red-500" :
                    "bg-yellow-500"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="absolute top-2 right-2">
          <div className="flex flex-col items-end">
            <div className="flex items-center">
              <Badge className="bg-slate-800/70 text-white text-xs mr-1">{awayTeam.name}</Badge>
              {awayTeam.logo && (
                <img 
                  src={awayTeam.logo} 
                  alt={awayTeam.name} 
                  className="w-6 h-6 object-contain bg-white rounded-full p-0.5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              )}
            </div>
            <div className="flex mt-1 gap-0.5">
              {awayTeam.form?.map((result, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    result === "W" ? "bg-green-500" :
                    result === "L" ? "bg-red-500" :
                    "bg-yellow-500"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Skor ve lig bilgisi */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <div className="bg-slate-900/70 px-3 py-1 rounded-full">
            <span className="text-white font-medium text-sm">{homeTeam.score}</span>
            <span className="text-slate-400 mx-1">-</span>
            <span className="text-white font-medium text-sm">{awayTeam.score}</span>
          </div>
          {homeTeam.league && (
            <span className="text-xs text-white/70 mt-1">{homeTeam.league}</span>
          )}
        </div>

        {/* Maç zamanı */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 flex items-center bg-slate-900/70 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3 text-red-400 mr-1" />
          <span className="text-white text-xs">{currentMatchElapsed}'</span>
        </div>

        {/* Oyuncular ve animasyonlar */}
        <div className="absolute inset-0">
          {/* Ev sahibi takım oyuncuları */}
          {homeTeamFormation.map((pos, index) => (
            <div
              key={`home-${index}`}
              className={`absolute ${index === passingPath.from && passingPath.team === 'home' ? 'z-20' : 'z-10'} ${
                pos.role === 'kaleci' ? 'animate-goalkeeper' :
                index % 2 === 0 ? 'animate-player' : 'animate-player-reverse'
              }`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="relative">
                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg"></div>
                <div className="absolute -bottom-1 left-1/2 w-4 h-4 border-2 border-blue-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          ))}

          {/* Deplasman takımı oyuncuları */}
          {awayTeamFormation.map((pos, index) => (
            <div
              key={`away-${index}`}
              className={`absolute ${index === passingPath.from && passingPath.team === 'away' ? 'z-20' : 'z-10'} ${
                pos.role === 'kaleci' ? 'animate-goalkeeper' :
                index % 2 === 0 ? 'animate-player-reverse' : 'animate-player'
              }`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
                <div className="absolute -bottom-1 left-1/2 w-4 h-4 border-2 border-red-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          ))}

          {/* Top animasyonu */}
          <div 
            className="absolute z-30 transition-all duration-1000 ease-in-out"
            style={{
              left: `${passingPath.team === 'home' ? homeTeamFormation[passingPath.from].x : awayTeamFormation[passingPath.from].x}%`,
              top: `${passingPath.team === 'home' ? homeTeamFormation[passingPath.from].y : awayTeamFormation[passingPath.from].y}%`,
              transform: 'translate(-50%, -50%)',
              '--pass-x': `${passingPath.team === 'home' ? homeTeamFormation[passingPath.to].x - homeTeamFormation[passingPath.from].x : awayTeamFormation[passingPath.to].x - awayTeamFormation[passingPath.from].x}%`,
              '--pass-y': `${passingPath.team === 'home' ? homeTeamFormation[passingPath.to].y - homeTeamFormation[passingPath.from].y : awayTeamFormation[passingPath.to].y - awayTeamFormation[passingPath.from].y}%`,
              animation: activePassing ? 'pass 2s infinite' : 'none'
            } as React.CSSProperties}
          >
            <div className="relative">
              <img 
                src="/football.svg" 
                alt="Football"
                className="w-6 h-6 object-contain"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                }}
              />
            </div>
          </div>

          {/* Paslaşma bildirimi */}
          {passingNotification && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-slate-900/80 text-white px-3 py-1.5 rounded-lg text-sm z-40 animate-fade-in-out">
              {passingNotification}
            </div>
          )}

          {/* Gol efekti - tam ekran */}
          {showGoalEffect && (
            <div className="absolute inset-0 z-50 overflow-hidden">
              {/* Konfeti efekti */}
              {confetti.map((particle) => (
                <div
                  key={particle.id}
                  className="absolute animate-confetti"
                  style={{
                    left: `${particle.x}%`,
                    top: `${particle.y}%`,
                    backgroundColor: particle.color,
                    width: '10px',
                    height: '10px',
                    transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
                    opacity: 0.8,
                  }}
                />
              ))}
              
              {/* Gol yazısı */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-8xl font-bold text-white text-shadow-lg animate-goal-text">
                  GOL!
                </div>
              </div>
              
              {/* Işık efekti */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-red-500/20 animate-flash" />
            </div>
          )}
        </div>

        {/* Field effects container */}
        <div className="absolute inset-0 z-50 pointer-events-none">
          {renderFieldEffects()}
        </div>
      </div>
    )
  }

  // Algoritma yorumu için yeni fonksiyon
  const getMatchAnalysis = () => {
    const homeScore = homeTeam.score;
    const awayScore = awayTeam.score;
    const totalScore = homeScore + awayScore;
    const scoreDiff = Math.abs(homeScore - awayScore);
    const leadingTeam = homeScore > awayScore ? homeTeam.name : awayTeam.name;
    const trailingTeam = homeScore > awayScore ? awayTeam.name : homeTeam.name;

    // 0-0 durumu
    if (totalScore === 0) {
      return "Maç henüz golsüz devam ediyor. İki takım da temkinli bir oyun sergiliyor. İlk golü bulan takım avantaj yakalayabilir.";
    }

    // Beraberlik durumları
    if (homeScore === awayScore) {
      if (homeScore === 1) {
        return "1-1'lik skorla dengeli bir maç izliyoruz. İki takım da öne geçmek için risk almaya başladı.";
      } else if (homeScore === 2) {
        return "2-2! Karşılıklı gollerle müthiş bir maç izliyoruz. Her iki takım da hücum futbolunu tercih ediyor.";
      } else if (homeScore >= 3) {
        return `${homeScore}-${awayScore}! Gol düellosu devam ediyor. Savunmalar durdurulamıyor, her an yeni goller gelebilir.`;
      }
    }

    // Tek farkla önde olma durumları
    if (scoreDiff === 1) {
      if (totalScore <= 3) {
        return `${leadingTeam} ${homeScore}-${awayScore} önde. ${trailingTeam} beraberlik için baskı kurmaya başladı.`;
      } else {
        return `${leadingTeam} ${homeScore}-${awayScore} öne geçti ama maç hala çok açık. Her iki takım da hücumu düşünüyor.`;
      }
    }

    // İki farkla önde olma durumları
    if (scoreDiff === 2) {
      if (totalScore <= 4) {
        return `${leadingTeam} ${homeScore}-${awayScore} üstünlüğünü korumaya çalışıyor. ${trailingTeam} riske girmek zorunda.`;
      } else {
        return `${homeScore}-${awayScore}! Gollü maçta ${leadingTeam} avantajlı durumda. Her atak tehlike getiriyor.`;
      }
    }

    // Üç veya daha fazla fark
    if (scoreDiff >= 3) {
      if (totalScore <= 5) {
        return `${leadingTeam} maça damgasını vurdu. ${homeScore}-${awayScore}'lik skor farkı maçın kontrolünün kimde olduğunu gösteriyor.`;
      } else {
        return `${homeScore}-${awayScore}! ${leadingTeam} gol şovuna devam ediyor. Savunmalar bugün durdurulamıyor.`;
      }
    }

    // Yüksek skorlu maçlar
    if (totalScore >= 6) {
      return `${homeScore}-${awayScore}! Müthiş bir gol düellosu izliyoruz. Her iki takım da savunmayı unutmuş durumda, sadece gol peşindeler.`;
    }

    // Genel durum
    return "Maç tüm heyecanıyla devam ediyor. Her iki takım da kazanmak için mücadele ediyor.";
  };

  // İstatistik sayfası render fonksiyonu
  const renderStatisticsPage = () => {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 overflow-auto">
        <div className="max-w-lg mx-auto p-4">
          {/* Üst Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setActiveTab("field")}
                className="text-white hover:bg-slate-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </Button>
              <h2 className="text-lg font-semibold text-white">Maç İstatistikleri</h2>
            </div>
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full">
              <span className="text-white font-medium">{homeTeam.score}</span>
              <span className="text-slate-400">-</span>
              <span className="text-white font-medium">{awayTeam.score}</span>
            </div>
          </div>

          {/* Takım Bilgileri */}
          <div className="flex justify-between items-center mb-6 bg-slate-800/50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <img 
                src={homeTeam.logo} 
                alt={homeTeam.name}
                className="w-8 h-8 object-contain bg-white rounded-full p-0.5"
              />
              <span className="text-white font-medium">{homeTeam.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{awayTeam.name}</span>
              <img 
                src={awayTeam.logo} 
                alt={awayTeam.name}
                className="w-8 h-8 object-contain bg-white rounded-full p-0.5"
              />
            </div>
          </div>

          {/* Algoritma Yorumu */}
          <div className="bg-purple-900/20 border border-purple-500/20 p-4 rounded-lg mb-6">
            <h3 className="text-purple-400 text-sm font-medium mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Algoritma Yorumu
            </h3>
            <p className="text-white text-sm">{getMatchAnalysis()}</p>
          </div>

          {/* Gol Detayları */}
          <div className="bg-slate-800/50 p-4 rounded-lg mb-4">
            <h3 className="text-white text-sm font-medium mb-3 flex items-center gap-2">
              <Goal className="w-4 h-4 text-green-400" />
              Gol Detayları
            </h3>
            <div className="space-y-2">
              {matchEvents
                .filter(event => event.type === "goal")
                .map((event, index) => (
                  <div 
                    key={`goal-${index}`}
                    className="flex items-center justify-between bg-green-900/20 p-2 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 flex items-center justify-center bg-green-900/50 rounded-full">
                        <Goal className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-white text-sm">{event.player}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-sm">{event.minute}'</span>
                      <span className="text-slate-400 text-sm">
                        {event.team === "home" ? homeTeam.name : awayTeam.name}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Kart Bilgileri */}
          <div className="bg-slate-800/50 p-4 rounded-lg mb-4">
            <h3 className="text-white text-sm font-medium mb-3">Kart Bilgileri</h3>
            <div className="space-y-2">
              {matchEvents
                .filter(event => event.type === "yellowCard" || event.type === "redCard")
                .map((event, index) => (
                  <div 
                    key={`card-${index}`}
                    className={`flex items-center justify-between ${
                      event.type === "yellowCard" ? "bg-yellow-900/20" : "bg-red-900/20"
                    } p-2 rounded`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-4 ${
                        event.type === "yellowCard" ? "bg-yellow-400" : "bg-red-500"
                      } rounded-sm`} />
                      <span className="text-white text-sm">{event.player}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`${
                        event.type === "yellowCard" ? "text-yellow-400" : "text-red-400"
                      } text-sm`}>{event.minute}'</span>
                      <span className="text-slate-400 text-sm">
                        {event.team === "home" ? homeTeam.name : awayTeam.name}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Detaylı İstatistikler */}
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <h3 className="text-white text-sm font-medium mb-3">Detaylı İstatistikler</h3>
            {stats && Object.entries(stats).map(([key, value]: [string, any]) => (
              <div key={key} className="flex justify-between items-center mb-3 last:mb-0">
                <div className="w-16 text-right">
                  <span className="text-white text-sm">{value.home || 0}</span>
                </div>
                <div className="flex-1 mx-4">
                  <div className="text-slate-400 text-xs mb-1">{key}</div>
                  <div className="h-1.5 bg-slate-700 rounded-full">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${(parseInt(value.home) / (parseInt(value.home) + parseInt(value.away))) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div className="w-16">
                  <span className="text-white text-sm">{value.away || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Oyun akışına göre efektleri tetikle (örnek: pas, atak, defans)
  useEffect(() => {
    // Her paslaşmada pas efekti
    if (passingNotification.includes('pas')) {
      setPlayState('pass');
      setTimeout(() => setPlayState('normal'), 2000);
    } else if (passingNotification.includes('atak') || passingNotification.includes('ileri çıkıyor')) {
      setPlayState(effectTeam === 'home' ? 'attack-right' : 'attack-left');
      setTimeout(() => setPlayState('normal'), 2000);
    } else if (passingNotification.includes('savunma')) {
      setPlayState(effectTeam === 'home' ? 'defense-left' : 'defense-right');
      setTimeout(() => setPlayState('normal'), 2000);
    }
  }, [passingNotification, effectTeam]);

  // Saha render fonksiyonunda efektleri ekle
  const renderFieldEffects = () => {
    // Ok SVG'si + glow trail + burst
    const Arrow = ({ direction }: { direction: 'left' | 'right' }) => (
      <div className="relative flex items-center">
        {/* Trail */}
        <div className={`absolute ${direction === 'right' ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 w-40 h-8 pointer-events-none z-0 animate-attack-trail`} style={{
          background: direction === 'right'
            ? 'linear-gradient(90deg, rgba(250,204,21,0.0) 0%, rgba(250,204,21,0.3) 60%, rgba(250,204,21,0.7) 100%)'
            : 'linear-gradient(270deg, rgba(250,204,21,0.0) 0%, rgba(250,204,21,0.3) 60%, rgba(250,204,21,0.7) 100%)',
          borderRadius: '9999px',
          filter: 'blur(2px)'
        }} />
        {/* Arrow */}
        <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
          <path d={direction === 'right' ? 'M2 12H54M54 12L44 4M54 12L44 20' : 'M58 12H6M6 12L16 4M6 12L16 20'} stroke="#facc15" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)"/>
          <defs>
            <filter id="glow" x="-10" y="-10" width="80" height="44" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
        </svg>
        {/* Burst at tip */}
        <div className={`absolute ${direction === 'right' ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 w-8 h-8 z-20 pointer-events-none animate-burst`}
          style={{filter:'blur(1px)'}}>
          <div className="w-full h-full rounded-full bg-yellow-300/70 animate-ping-fast"></div>
          <div className="w-4 h-4 rounded-full bg-yellow-200/80 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>
    );

    // Defans kalkanı
    const Shield = () => (
      <div className="relative">
        <div className="absolute -inset-2 bg-blue-500/20 rounded-full animate-pulse"></div>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="relative">
          <path d="M24 44C24 44 40 36 40 20V8L24 4L8 8V20C8 36 24 44 24 44Z" fill="#38bdf8" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="2"/>
        </svg>
      </div>
    );

    switch (playState) {
      case 'attack-left':
        return <div className="absolute left-8 top-1/2 -translate-y-1/2 z-50 animate-fade-in-out pointer-events-none">
          <Arrow direction="left" />
          <span className="text-yellow-300 font-bold text-base mt-1 animate-attack-label">Atak</span>
        </div>;
      case 'attack-right':
        return <div className="absolute right-8 top-1/2 -translate-y-1/2 z-50 animate-fade-in-out pointer-events-none">
          <Arrow direction="right" />
          <span className="text-yellow-300 font-bold text-base mt-1 animate-attack-label">Atak</span>
        </div>;
      case 'defense-left':
        return <div className="absolute left-10 top-1/2 -translate-y-1/2 z-50 animate-fade-in-out pointer-events-none">
          <Shield />
          <span className="text-sky-400 font-bold text-sm mt-1">Defans</span>
        </div>;
      case 'defense-right':
        return <div className="absolute right-10 top-1/2 -translate-y-1/2 z-50 animate-fade-in-out pointer-events-none">
          <Shield />
          <span className="text-sky-400 font-bold text-sm mt-1">Defans</span>
        </div>;
      default:
        return null;
    }
  };

  // Render Son 10 Maç dialog content
  const renderLastTenContent = () => {
    if (!showLastTenMatches) {
      return (
        <div className="py-4 px-2">
          <div className="text-center space-y-4">
            <div className="flex flex-col items-center">
              <BarChart2 className="w-10 h-10 text-purple-400 mb-2" />
              <h3 className="text-lg font-medium text-white">Son 10 Maç Analizi</h3>
              <p className="text-sm text-slate-300 mt-1">
                {homeTeam.name} ve {awayTeam.name} son 10 maç istatistikleri
              </p>
            </div>
            
            <div className="mt-2">
              <Button 
                onClick={handleLastTenClick}
                className="bg-purple-800 hover:bg-purple-700 text-white flex items-center gap-2"
              >
                <BarChart2 className="w-4 h-4" />
                Analizi Göster
                <span className="flex items-center ml-1 bg-purple-700/50 px-1.5 py-0.5 rounded text-xs">
                  <Coins className="w-3 h-3 mr-0.5 text-yellow-400" />
                  <span className="text-yellow-400">{CREDIT_COSTS.LAST_TEN}</span>
                </span>
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <Tabs defaultValue="home" className="w-full">
        <TabsList className="w-full mb-2">
          <TabsTrigger value="home" className="w-1/2">
            <div className="flex items-center gap-1 truncate">
              {homeTeam.logo && (
                <img 
                  src={homeTeam.logo} 
                  alt={homeTeam.name} 
                  className="w-4 h-4 mr-1 object-contain bg-white rounded-full p-0.5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              )}
              <span className="truncate text-xs">{homeTeam.name}</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="away" className="w-1/2">
            <div className="flex items-center gap-1 truncate">
              {awayTeam.logo && (
                <img 
                  src={awayTeam.logo} 
                  alt={awayTeam.name} 
                  className="w-4 h-4 mr-1 object-contain bg-white rounded-full p-0.5"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              )}
              <span className="truncate text-xs">{awayTeam.name}</span>
            </div>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="home">
          <LastTenMatchAnalysis 
            teamId={homeTeam.id}
            teamName={homeTeam.name}
          />
        </TabsContent>
        <TabsContent value="away">
          <LastTenMatchAnalysis 
            teamId={awayTeam.id}
            teamName={awayTeam.name}
          />
        </TabsContent>
      </Tabs>
    );
  };

  // Alt menü güncelleme
  const renderBottomNav = () => {
    return (
      <div className="flex border-t border-slate-700/50 bg-slate-800">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex-1 rounded-none h-10 text-xs ${activeTab === "field" ? "bg-slate-700" : ""}`}
          onClick={() => setActiveTab("field")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="12" y1="3" x2="12" y2="21"></line>
          </svg>
          <span className="truncate">Saha</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex-1 rounded-none h-10 text-xs ${activeTab === "stats" ? "bg-slate-700" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M3 3v18h18"></path>
            <path d="M18 12V8"></path>
            <path d="M14 12V6"></path>
            <path d="M10 12V4"></path>
            <path d="M6 12v-2"></path>
          </svg>
          <span className="truncate">İstatistik</span>
        </Button>
        
        {/* Pro Tahminler Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 rounded-none h-10 text-xs bg-gradient-to-r from-amber-700/50 to-amber-500/50 hover:from-amber-600/70 hover:to-amber-400/70"
            >
              <Sparkles className="w-3 h-3 mr-1 text-amber-300" />
              <span className="truncate">Tahmin</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[350px] p-3 rounded-lg max-h-[90vh] overflow-auto">
            <DialogHeader className="mb-2">
              <DialogTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Pro Tahminler</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {homeTeam.name} vs {awayTeam.name}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2">
              <UpcomingMatchPrediction 
                homeTeam={homeTeam.name}
                awayTeam={awayTeam.name}
                homeTeamId={homeTeam.id}
                awayTeamId={awayTeam.id}
              />
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Son 10 Maç Dialog */}
        <Dialog onOpenChange={(open) => {
          if (!open) {
            setShowLastTenMatches(false);
          }
        }}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex-1 rounded-none h-10 text-xs bg-gradient-to-r from-purple-700/50 to-purple-500/50 hover:from-purple-600/70 hover:to-purple-400/70"
            >
              <BarChart2 className="w-3 h-3 mr-1 text-purple-300" />
              <span className="truncate">Son 10</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[350px] p-3 rounded-lg max-h-[90vh] overflow-auto">
            <DialogHeader className="mb-2">
              <DialogTitle className="flex items-center gap-2 text-base">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                <span>Son 10 Maç</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {homeTeam.name} ve {awayTeam.name} son maç analizleri
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2">
              {renderLastTenContent()}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Kredi gerektiren modal */}
        <CreditRequiredModal
          isOpen={showLastTenCreditModal}
          onClose={() => setShowLastTenCreditModal(false)}
          requiredCredits={CREDIT_COSTS.LAST_TEN}
          actionDescription="Son 10 maç analizini görüntülemek"
          onContinue={handleContinueWithCredits}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="relative bg-gradient-to-br from-green-800 to-green-900 aspect-[4/3] overflow-hidden flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
          <p className="text-sm text-white">Başka Canlı Maça Geçiliyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative bg-gradient-to-br from-green-800 to-green-900 aspect-[4/3] overflow-hidden flex items-center justify-center">
        <div className="bg-slate-900/80 p-4 rounded-lg text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-white">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            onClick={() => fetchRandomLiveMatch()}
          >
            Tekrar Dene
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Futbol sahası */}
      <div className="relative">
        {renderFootballField()}
      </div>

      {/* Maç durumu gösterimi */}
      {renderMatchStatus()}

      {/* İstatistik sayfası */}
      {activeTab === "stats" && renderStatisticsPage()}

      {/* Alt menü */}
      {renderBottomNav()}

      {/* Algoritma kazandırır gösterimi */}
      <div className="relative z-10">
        {renderAlgorithmWins()}
      </div>
    </div>
  )
} 