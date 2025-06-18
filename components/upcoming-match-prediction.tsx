"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useTranslation } from "./language-provider"
import { useEffect, useState, useMemo } from "react"
import { getH2HMatches, getTeamLastMatches } from "@/lib/api"
import { Loader2, Sparkles, Bot, TrendingUp, ChevronRight, Coins, LightbulbIcon } from "lucide-react"
import { useCreditStore, CREDIT_COSTS } from "@/lib/credit-system"
import { CreditRequiredModal } from "@/components/ui/credit-required-modal"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth-service"

interface UpcomingMatchPredictionProps {
  homeTeam: string
  awayTeam: string
  homeTeamId: string
  awayTeamId: string
  homeScore?: string
  awayScore?: string
  matchStatus?: string
}

export function UpcomingMatchPrediction({ homeTeam, awayTeam, homeTeamId, awayTeamId, homeScore, awayScore, matchStatus }: UpcomingMatchPredictionProps) {
  const { t } = useTranslation()
  const [predictionComment, setPredictionComment] = useState("")
  const [loading, setLoading] = useState(true)
  const [showData, setShowData] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const { useCredits, hasCredits } = useCreditStore()
  const { toast } = useToast()
  const [predictions, setPredictions] = useState({
    homeWinProb: 0,
    drawProb: 0,
    awayWinProb: 0,
    over0_5Prob: 0,
    over1_5Prob: 0,
    over2_5Prob: 0,
    over3_5Prob: 0,
    over4_5Prob: 0,
    bttsProb: 0,
  })
  const [bttsStats, setBttsStats] = useState({
    h2h: { count: 0, total: 0, percent: 0 },
    home: { count: 0, total: 0, percent: 0 },
    away: { count: 0, total: 0, percent: 0 },
    average: 0,
  })

  // Check if the match is completed
  const isCompleted = matchStatus === "FT" || matchStatus === "Finished"
  
  // Auto-show data for completed matches
  useEffect(() => {
    if (isCompleted && homeScore && awayScore) {
      setShowData(true)
    }
  }, [isCompleted, homeScore, awayScore])

  useEffect(() => {
    const fetchPredictionData = async () => {
      setLoading(true)
      try {
        // Konsola ID'leri de yaz
        console.log('Tahmin için homeTeamId:', homeTeamId);
        console.log('Tahmin için awayTeamId:', awayTeamId);
        // Fetch H2H data and last matches for both teams
        const [h2hData, homeLastMatches, awayLastMatches] = await Promise.all([
          getH2HMatches(homeTeamId, awayTeamId),
          getTeamLastMatches(homeTeamId, 10),
          getTeamLastMatches(awayTeamId, 10),
        ])
        console.log('H2H DATA:', h2hData);
        console.log('Home Last Matches:', homeLastMatches);
        console.log('Away Last Matches:', awayLastMatches);
        // Detayda olduğu gibi mapping ve analiz
        // H2H KG VAR
        let h2hBttsCount = 0
        let h2hTotal = 0
        if (h2hData && h2hData.firstTeam_VS_secondTeam && Array.isArray(h2hData.firstTeam_VS_secondTeam)) {
          const h2hMatches = h2hData.firstTeam_VS_secondTeam.slice(0, 10)
          h2hTotal = h2hMatches.length
          h2hMatches.forEach((match: any) => {
            const homeScore = Number(match.match_hometeam_score) || 0
            const awayScore = Number(match.match_awayteam_score) || 0
            if (homeScore > 0 && awayScore > 0) h2hBttsCount++
          })
        }
        // Home KG VAR
        let homeBttsCount = 0
        let homeTotal = homeLastMatches.length
        homeLastMatches.slice(0, 10).forEach((match: any) => {
          const homeScore = Number(match.match_hometeam_score) || 0
          const awayScore = Number(match.match_awayteam_score) || 0
          if (homeScore > 0 && awayScore > 0) homeBttsCount++
        })
        // Away KG VAR
        let awayBttsCount = 0
        let awayTotal = awayLastMatches.length
        awayLastMatches.slice(0, 10).forEach((match: any) => {
          const homeScore = Number(match.match_hometeam_score) || 0
          const awayScore = Number(match.match_awayteam_score) || 0
          if (homeScore > 0 && awayScore > 0) awayBttsCount++
        })
        // Ortalama
        const h2hPercent = h2hTotal ? Math.round((h2hBttsCount / h2hTotal) * 100) : 0
        const homePercent = homeTotal ? Math.round((homeBttsCount / homeTotal) * 100) : 0
        const awayPercent = awayTotal ? Math.round((awayBttsCount / awayTotal) * 100) : 0
        const bttsAverage = Math.round((h2hPercent + homePercent + awayPercent) / 3)
        setBttsStats({
          h2h: { count: h2hBttsCount, total: h2hTotal, percent: h2hPercent },
          home: { count: homeBttsCount, total: homeTotal, percent: homePercent },
          away: { count: awayBttsCount, total: awayTotal, percent: awayPercent },
          average: bttsAverage,
        })
        // Calculate prediction probabilities based on real data
        const predictionData = calculatePredictions(h2hData, homeLastMatches, awayLastMatches, bttsAverage)
        setPredictions(predictionData)
        // Generate prediction comment
        const comment = generatePredictionComment(predictionData, homeTeam, awayTeam, {
          h2h: { count: h2hBttsCount, total: h2hTotal, percent: h2hPercent },
          home: { count: homeBttsCount, total: homeTotal, percent: homePercent },
          away: { count: awayBttsCount, total: awayTotal, percent: awayPercent },
          average: bttsAverage,
        }, recommendedMarket)
        setPredictionComment(comment)
      } catch (error) {
        console.error("Error fetching prediction data:", error)
        // Use fallback predictions
        const fallbackPredictions = generateFallbackPredictions()
        setPredictions(fallbackPredictions)
        setPredictionComment(generatePredictionComment(fallbackPredictions, homeTeam, awayTeam, bttsStats, recommendedMarket))
      } finally {
        setLoading(false)
      }
    }

    fetchPredictionData()
  }, [homeTeam, awayTeam, homeTeamId, awayTeamId])

  const handlePredictClick = async () => {
    if (hasCredits(CREDIT_COSTS.PREDICTION)) {
      try {
        const success = await useCredits(CREDIT_COSTS.PREDICTION);
        if (success) {
          // Sunucuda da krediyi güncelle
          try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser && typeof currentUser.credits === 'number') {
              const newCredits = currentUser.credits - CREDIT_COSTS.PREDICTION;
              authService.updateProfile({ credits: newCredits })
                .catch(error => {
                  console.error('Failed to update credits on server:', error);
                });
            }
          } catch (error) {
            console.error('Failed to get current user:', error);
          }
          
          // Kredi kullanıldı bildirimi için özel event tetikle
          if (typeof document !== 'undefined') {
            const event = new CustomEvent('creditUsed', { 
              detail: { 
                amount: CREDIT_COSTS.PREDICTION,
                reason: 'prediction',
                message: `${CREDIT_COSTS.PREDICTION} kredi tahmin için kullanıldı!`
              }
            });
            document.dispatchEvent(event);
            console.log('Credit used event dispatched for prediction:', CREDIT_COSTS.PREDICTION);
          }
          
          setShowData(true);
          // Show toast notification
          toast({
            title: "1 Kredi Kullanıldı",
            description: <div className="flex items-center"><Coins className="w-4 h-4 mr-1 text-yellow-400" /> Maç tahmini için 1 kredi kullanıldı</div>,
            variant: "default",
            duration: 1500,
            className: "bg-slate-800 border-yellow-600 text-white"
          });
        }
      } catch (error) {
        console.error('Error using credits:', error);
      }
    } else {
      setShowCreditModal(true);
    }
  };

  const handleContinueWithCredits = () => {
    // Bu fonksiyon artık kredi harcamaz, çünkü krediler direkt CreditRequiredModal içinde AdMobRewardButton tarafından kazanılır
    setShowData(true);
  };

  const calculatePredictions = (h2hData: any, homeLastMatches: any[], awayLastMatches: any[], bttsAverage?: number) => {
    // Initialize with base probabilities
    let homeWinProb = 40 // Home advantage
    let drawProb = 30
    let awayWinProb = 30
    let over0_5Prob = 90
    let over1_5Prob = 70
    let over2_5Prob = 50
    let over3_5Prob = 30
    let over4_5Prob = 15
    let bttsProb = 55

    // Son maç verileri analizi için değişkenler
    const homeStats = {
      wins: 0,
      draws: 0,
      losses: 0,
      goalsScored: 0,
      goalsConceded: 0,
      cleanSheets: 0,
      failedToScore: 0,
      totalMatches: 0
    };
    
    const awayStats = {
      wins: 0,
      draws: 0,
      losses: 0,
      goalsScored: 0,
      goalsConceded: 0,
      cleanSheets: 0,
      failedToScore: 0,
      totalMatches: 0
    };
    
    // Son 10 maç verilerini analiz et
    if (Array.isArray(homeLastMatches) && homeLastMatches.length > 0) {
      homeLastMatches.forEach((match: any) => {
        const isHome = match.match_hometeam_id === homeTeamId;
        const homeScore = Number.parseInt(match.match_hometeam_score) || 0;
        const awayScore = Number.parseInt(match.match_awayteam_score) || 0;
        
        if (isHome) {
          homeStats.goalsScored += homeScore;
          homeStats.goalsConceded += awayScore;
          if (homeScore > awayScore) homeStats.wins++;
          else if (homeScore === awayScore) homeStats.draws++;
          else homeStats.losses++;
        } else {
          homeStats.goalsScored += awayScore;
          homeStats.goalsConceded += homeScore;
          if (awayScore > homeScore) homeStats.wins++;
          else if (homeScore === awayScore) homeStats.draws++;
          else homeStats.losses++;
        }
        
        if ((isHome && awayScore === 0) || (!isHome && homeScore === 0)) homeStats.cleanSheets++;
        if ((isHome && homeScore === 0) || (!isHome && awayScore === 0)) homeStats.failedToScore++;
        
        homeStats.totalMatches++;
      });
    }
    
    if (Array.isArray(awayLastMatches) && awayLastMatches.length > 0) {
      awayLastMatches.forEach((match: any) => {
        const isHome = match.match_hometeam_id === awayTeamId;
        const homeScore = Number.parseInt(match.match_hometeam_score) || 0;
        const awayScore = Number.parseInt(match.match_awayteam_score) || 0;
        
        if (isHome) {
          awayStats.goalsScored += homeScore;
          awayStats.goalsConceded += awayScore;
          if (homeScore > awayScore) awayStats.wins++;
          else if (homeScore === awayScore) awayStats.draws++;
          else awayStats.losses++;
        } else {
          awayStats.goalsScored += awayScore;
          awayStats.goalsConceded += homeScore;
          if (awayScore > homeScore) awayStats.wins++;
          else if (homeScore === awayScore) awayStats.draws++;
          else awayStats.losses++;
        }
        
        if ((isHome && awayScore === 0) || (!isHome && homeScore === 0)) awayStats.cleanSheets++;
        if ((isHome && homeScore === 0) || (!isHome && awayScore === 0)) awayStats.failedToScore++;
        
        awayStats.totalMatches++;
      });
    }
    
    // Son 10 maç verileri temelinde olasılıkları hesapla
    if (homeStats.totalMatches > 0 && awayStats.totalMatches > 0) {
      // Ev sahibi kazanma olasılığı
      const homeWinRate = homeStats.wins / homeStats.totalMatches;
      const awayLossRate = awayStats.losses / awayStats.totalMatches;
      const homeAdvantage = 0.1; // Ev sahibi avantajı
      homeWinProb = Math.round(((homeWinRate + awayLossRate) / 2 + homeAdvantage) * 100);
      
      // Deplasman kazanma olasılığı
      const awayWinRate = awayStats.wins / awayStats.totalMatches;
      const homeLossRate = homeStats.losses / homeStats.totalMatches;
      awayWinProb = Math.round(((awayWinRate + homeLossRate) / 2) * 100);
      
      // Beraberlik olasılığı
      const homeDrawRate = homeStats.draws / homeStats.totalMatches;
      const awayDrawRate = awayStats.draws / awayStats.totalMatches;
      drawProb = Math.round(((homeDrawRate + awayDrawRate) / 2) * 100);
      
      // Toplam 100% olmasını sağla
      const total = homeWinProb + drawProb + awayWinProb;
      if (total !== 100) {
        const factor = 100 / total;
        homeWinProb = Math.round(homeWinProb * factor);
        drawProb = Math.round(drawProb * factor);
        awayWinProb = 100 - homeWinProb - drawProb;
      }
      
      // Gol bazlı tahminler
      const homeAvgScored = homeStats.goalsScored / homeStats.totalMatches;
      const homeAvgConceded = homeStats.goalsConceded / homeStats.totalMatches;
      const awayAvgScored = awayStats.goalsScored / awayStats.totalMatches;
      const awayAvgConceded = awayStats.goalsConceded / awayStats.totalMatches;
      
      const expectedGoals = (homeAvgScored + awayAvgConceded + homeAvgConceded + awayAvgScored) / 3;
      
      // Ev sahibi ve deplasman ekibinin toplam gol ortalamaları
      const homeGoalsTotal = homeAvgScored + homeAvgConceded;
      const awayGoalsTotal = awayAvgScored + awayAvgConceded;
      const combinedGoalsExpectation = (homeGoalsTotal + awayGoalsTotal) / 2;
      
      // Maçtaki toplam gol beklentisi
      console.log('Toplam Gol Beklentisi:', expectedGoals);
      console.log('Kombine Gol Beklentisi:', combinedGoalsExpectation);
      
      // Over/Under olasılıkları - daha hassas hesaplama
      over0_5Prob = Math.min(98, Math.round(90 + (expectedGoals - 2) * 5));
      over1_5Prob = Math.min(95, Math.round(70 + (expectedGoals - 2) * 10));
      over2_5Prob = Math.min(90, Math.round(50 + (expectedGoals - 2.5) * 15));
      over3_5Prob = Math.min(80, Math.round(30 + (expectedGoals - 2.5) * 15));
      over4_5Prob = Math.min(60, Math.round(15 + (expectedGoals - 2.5) * 10));
      
      // KG Var olasılığı
      const homeScoringRate = 1 - (homeStats.failedToScore / homeStats.totalMatches);
      const awayScoringRate = 1 - (awayStats.failedToScore / awayStats.totalMatches);
      const homeCleanSheetRate = homeStats.cleanSheets / homeStats.totalMatches;
      const awayCleanSheetRate = awayStats.cleanSheets / awayStats.totalMatches;
      
      bttsProb = Math.round(((homeScoringRate * awayScoringRate) + (1 - homeCleanSheetRate) * (1 - awayCleanSheetRate)) / 2 * 100);
    }

    // Process H2H data if available - H2H verisi varsa tahminleri güncelle
    if (h2hData && h2hData.firstTeam_VS_secondTeam && Array.isArray(h2hData.firstTeam_VS_secondTeam)) {
      const h2hMatches = h2hData.firstTeam_VS_secondTeam

      if (h2hMatches.length > 0) {
        let homeWins = 0
        let draws = 0
        let awayWins = 0
        let totalGoals = 0
        let bttsCount = 0
        let over0_5Count = 0
        let over1_5Count = 0
        let over2_5Count = 0
        let over3_5Count = 0
        let over4_5Count = 0
        let goalDistribution = new Array(10).fill(0); // 0-9 gol dağılımı

        h2hMatches.forEach((match: any) => {
          const homeScore = Number.parseInt(match.match_hometeam_score) || 0
          const awayScore = Number.parseInt(match.match_awayteam_score) || 0
          const totalMatchGoals = homeScore + awayScore

          totalGoals += totalMatchGoals
          
          // Toplam gol dağılımını kaydet (0-9 gol)
          if (totalMatchGoals < 10) {
            goalDistribution[totalMatchGoals]++;
          }

          if (homeScore > 0 && awayScore > 0) {
            bttsCount++
          }
          
          if (totalMatchGoals > 0) over0_5Count++;
          if (totalMatchGoals > 1) over1_5Count++;
          if (totalMatchGoals > 2) over2_5Count++;
          if (totalMatchGoals > 3) over3_5Count++;
          if (totalMatchGoals > 4) over4_5Count++;

          if (homeScore === awayScore) {
            draws++
          } else if (
            (match.match_hometeam_id === homeTeamId && homeScore > awayScore) ||
            (match.match_awayteam_id === homeTeamId && awayScore > homeScore)) {
            homeWins++
          } else {
            awayWins++
          }
        })

        const totalMatches = h2hMatches.length

        if (totalMatches > 0) {
          // Log H2H istatistikleri
          console.log('H2H Maç Sayısı:', totalMatches);
          console.log('H2H Gol Dağılımı:', goalDistribution.map((count, goals) => `${goals} gol: ${count} maç`).join(', '));
          console.log('H2H Ortalama Gol:', totalGoals / totalMatches);
          
          // H2H verisi ağırlığını yükselt - artık %50 ağırlıklı
          const h2hWeight = 0.5;
          const teamStatsWeight = 1 - h2hWeight;
          
          // H2H ve son 10 maç analizinin ağırlıklı ortalaması
          const h2hHomeWinProb = Math.round((homeWins / totalMatches) * 100)
          const h2hDrawProb = Math.round((draws / totalMatches) * 100)
          const h2hAwayWinProb = Math.round((awayWins / totalMatches) * 100)
          
          homeWinProb = Math.round(homeWinProb * teamStatsWeight + h2hHomeWinProb * h2hWeight)
          drawProb = Math.round(drawProb * teamStatsWeight + h2hDrawProb * h2hWeight)
          awayWinProb = Math.round(awayWinProb * teamStatsWeight + h2hAwayWinProb * h2hWeight)

          // Ensure probabilities sum to 100%
          const total = homeWinProb + drawProb + awayWinProb
          if (total !== 100) {
            const factor = 100 / total
            homeWinProb = Math.round(homeWinProb * factor)
            drawProb = Math.round(drawProb * factor)
            awayWinProb = 100 - homeWinProb - drawProb
          }

          // H2H based over/under probabilities
          const h2hOver0_5Prob = Math.round((over0_5Count / totalMatches) * 100)
          const h2hOver1_5Prob = Math.round((over1_5Count / totalMatches) * 100)
          const h2hOver2_5Prob = Math.round((over2_5Count / totalMatches) * 100)
          const h2hOver3_5Prob = Math.round((over3_5Count / totalMatches) * 100)
          const h2hOver4_5Prob = Math.round((over4_5Count / totalMatches) * 100)
          
          // H2H verilerinin ağırlığını artır
          over0_5Prob = Math.round(over0_5Prob * teamStatsWeight + h2hOver0_5Prob * h2hWeight)
          over1_5Prob = Math.round(over1_5Prob * teamStatsWeight + h2hOver1_5Prob * h2hWeight)
          over2_5Prob = Math.round(over2_5Prob * teamStatsWeight + h2hOver2_5Prob * h2hWeight)
          over3_5Prob = Math.round(over3_5Prob * teamStatsWeight + h2hOver3_5Prob * h2hWeight)
          over4_5Prob = Math.round(over4_5Prob * teamStatsWeight + h2hOver4_5Prob * h2hWeight)

          // H2H based BTTS probability
          const h2hBttsProb = Math.round((bttsCount / totalMatches) * 100)
          bttsProb = Math.round(bttsProb * teamStatsWeight + h2hBttsProb * h2hWeight)
        }
      }
    }

    // BTTS olasılığını bttsAverage ile güncelle (frontend'den geliyorsa)
    if (typeof bttsAverage === 'number' && !isNaN(bttsAverage)) {
      bttsProb = bttsAverage
    }

    // Ensure all probabilities are within bounds
    over0_5Prob = Math.max(30, Math.min(99, over0_5Prob))
    over1_5Prob = Math.max(10, Math.min(95, over1_5Prob))
    over2_5Prob = Math.max(10, Math.min(90, over2_5Prob))
    over3_5Prob = Math.max(5, Math.min(80, over3_5Prob))
    over4_5Prob = Math.max(2, Math.min(60, over4_5Prob))
    bttsProb = Math.max(10, Math.min(90, bttsProb))
    homeWinProb = Math.max(5, Math.min(95, homeWinProb))
    drawProb = Math.max(5, Math.min(70, drawProb))
    awayWinProb = Math.max(5, Math.min(95, awayWinProb))

    return {
      homeWinProb,
      drawProb,
      awayWinProb,
      over0_5Prob,
      over1_5Prob,
      over2_5Prob,
      over3_5Prob,
      over4_5Prob,
      bttsProb,
    }
  }

  // Helper function to calculate team form (0-100)
  const calculateTeamForm = (matches: any[], teamId: string): number => {
    if (!Array.isArray(matches) || matches.length === 0) return 50

    let points = 0
    const maxPoints = matches.length * 3

    matches.forEach((match: any) => {
      const isHome = match.match_hometeam_id === teamId
      const homeScore = Number.parseInt(match.match_hometeam_score) || 0
      const awayScore = Number.parseInt(match.match_awayteam_score) || 0

      if (homeScore === awayScore) {
        points += 1 // Draw = 1 point
      } else if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) {
        points += 3 // Win = 3 points
      }
    })

    return Math.round((points / maxPoints) * 100)
  }

  // Helper function to calculate team's average goals scored
  const calculateTeamGoalsScored = (matches: any[], teamId: string): number => {
    if (!Array.isArray(matches) || matches.length === 0) return 1.5

    let totalGoals = 0

    matches.forEach((match: any) => {
      const isHome = match.match_hometeam_id === teamId
      const homeScore = Number.parseInt(match.match_hometeam_score) || 0
      const awayScore = Number.parseInt(match.match_awayteam_score) || 0

      totalGoals += isHome ? homeScore : awayScore
    })

    return totalGoals / matches.length
  }

  // Helper function to calculate team's average goals conceded
  const calculateTeamGoalsConceded = (matches: any[], teamId: string): number => {
    if (!Array.isArray(matches) || matches.length === 0) return 1.5

    let totalGoals = 0

    matches.forEach((match: any) => {
      const isHome = match.match_hometeam_id === teamId
      const homeScore = Number.parseInt(match.match_hometeam_score) || 0
      const awayScore = Number.parseInt(match.match_awayteam_score) || 0

      totalGoals += isHome ? awayScore : homeScore
    })

    return totalGoals / matches.length
  }

  // Helper function to calculate team's scoring rate (0-1)
  const calculateTeamScoringRate = (matches: any[], teamId: string): number => {
    if (!Array.isArray(matches) || matches.length === 0) return 0.7

    let scoredCount = 0

    matches.forEach((match: any) => {
      const isHome = match.match_hometeam_id === teamId
      const homeScore = Number.parseInt(match.match_hometeam_score) || 0
      const awayScore = Number.parseInt(match.match_awayteam_score) || 0

      if ((isHome && homeScore > 0) || (!isHome && awayScore > 0)) {
        scoredCount++
      }
    })

    return scoredCount / matches.length
  }

  // Generate fallback predictions if API data is unavailable
  const generateFallbackPredictions = () => {
    // Home advantage
    const homeWinProb = 35 + Math.floor(Math.random() * 30)
    const drawProb = 20 + Math.floor(Math.random() * 20)
    const awayWinProb = 100 - homeWinProb - drawProb

    // Over/Under probabilities
    const over0_5Prob = 90 + Math.floor(Math.random() * 5)
    const over1_5Prob = 70 + Math.floor(Math.random() * 20)
    const over2_5Prob = 45 + Math.floor(Math.random() * 30)
    const over3_5Prob = 25 + Math.floor(Math.random() * 25)
    const over4_5Prob = 10 + Math.floor(Math.random() * 20)

    // BTTS probability
    const bttsProb = 50 + Math.floor(Math.random() * 30)

    return {
      homeWinProb,
      drawProb,
      awayWinProb,
      over0_5Prob,
      over1_5Prob,
      over2_5Prob,
      over3_5Prob,
      over4_5Prob,
      bttsProb,
    }
  }

  

  // Generate prediction comment based on probabilities
  const generatePredictionComment = (
    predictionData: {
      homeWinProb: number
      drawProb: number
      awayWinProb: number
      over0_5Prob: number
      over1_5Prob: number
      over2_5Prob: number
      over3_5Prob: number
      over4_5Prob: number
      bttsProb: number
    },
    homeTeamName: string,
    awayTeamName: string,
    bttsStatsObj?: any,
    recommendedMarketObj?: any
  ) => {
    // Generate human-readable comment
    let comment = "";

    // Maç sonucu tahmini
    const winner =
      predictionData.homeWinProb > predictionData.awayWinProb && predictionData.homeWinProb > predictionData.drawProb
        ? homeTeamName
        : predictionData.awayWinProb > predictionData.homeWinProb && predictionData.awayWinProb > predictionData.drawProb
        ? awayTeamName
        : "Draw";

    // Favori takım ve istatistikler
    if (winner === homeTeamName) {
      comment += t('favorite') + `: ${homeTeamName} (%${Math.round(predictionData.homeWinProb)}). `;
    } else if (winner === awayTeamName) {
      comment += t('favorite') + `: ${awayTeamName} (%${Math.round(predictionData.awayWinProb)}). `;
    } else {
      comment += t('draw') + ` (%${Math.round(predictionData.drawProb)}). `;
    }

    // Beklenen gol sayısı
    if (predictionData.over2_5Prob > 60) {
      comment += t('over25') + ` (%${predictionData.over2_5Prob}). `;
    } else {
      comment += t('under25') + ` (%${100 - predictionData.over2_5Prob}). `;
    }
    
    // KG VAR/YOK durumu
    if (predictionData.bttsProb >= 60) {
      comment += t('bttsYes') + ` (%${Math.round(predictionData.bttsProb)}). `;
    } else if (100 - predictionData.bttsProb >= 60) {
      comment += t('bttsNo') + ` (%${Math.round(100 - predictionData.bttsProb)}). `;
    }

    // Önerilen market
    if (recommendedMarketObj) {
      comment += t('recommendedBet') + `: ${recommendedMarketObj.label} (%${Math.round(recommendedMarketObj.value)})`;
    }
    
    return comment
  }

  // Risk seviyesi hesaplayan fonksiyon
  const calculateRiskLevel = (prediction: number, betType: string): { level: string, score: number } => {
    // Temel risk puanı (100'den olasılık çıkarılır - olasılık düştükçe risk artar)
    let riskScore = 100 - prediction;
    
    // Bahis türüne göre risk faktörü
    const betTypeRiskFactors: Record<string, number> = {
      'over0_5': 0.8,     // Daha düşük risk
      'over1_5': 0.9,
      'over2_5': 1.0,     // Normal risk
      'over3_5': 1.1,
      'over4_5': 1.3,     // Yüksek risk
      'under0_5': 1.3,    // Yüksek risk
      'under1_5': 1.2,
      'under2_5': 1.0,    // Normal risk
      'under3_5': 0.9,
      'under4_5': 0.8,    // Düşük risk
      'btts': 1.0,        // Normal risk
      'nobtts': 1.0,      // Normal risk
      'home': 0.9,        // Ev sahibi kazanır
      'draw': 1.3,        // Beraberlik
      'away': 1.1,        // Deplasman kazanır
      'double': 1.2,      // Çifte şans
      'handicap': 1.3,    // Handikaplı
      'combo': 1.4,       // Kombine bahisler
      'ht_ft': 1.5,       // İlk yarı/Maç sonucu
    };
    
    // Bahis türüne göre risk puanını ayarla
    let riskFactor = 1.0; // Varsayılan risk faktörü
    
    // Bahis türünü belirle
    if (betType.includes('over') || betType.includes('under')) {
      const overUnderType = betType.toLowerCase();
      riskFactor = betTypeRiskFactors[overUnderType] || 1.0;
    } else if (betType.includes('KG Var') || betType.includes('BTTS') || betType.includes('btts')) {
      riskFactor = betTypeRiskFactors['btts'];
    } else if (betType.includes('KG Yok') || betType.includes('nobtts')) {
      riskFactor = betTypeRiskFactors['nobtts'];
    } else if (betType.includes('Kazanır') && betType.includes(homeTeam)) {
      riskFactor = betTypeRiskFactors['home'];
    } else if (betType.includes('Kazanır') && betType.includes(awayTeam)) {
      riskFactor = betTypeRiskFactors['away'];
    } else if (betType.includes('Draw')) {
      riskFactor = betTypeRiskFactors['draw'];
    } else if (betType.includes('Handikap')) {
      riskFactor = betTypeRiskFactors['handicap'];
    } else if (betType.includes('İY/MS')) {
      riskFactor = betTypeRiskFactors['ht_ft'];
    } else if (betType.includes('/')) {
      riskFactor = betTypeRiskFactors['combo'];
    } else if (betType.includes('Çifte') || betType.includes('Berabere Kalır')) {
      riskFactor = betTypeRiskFactors['double'];
    }
    
    // Hesaplanan risk puanı
    riskScore = riskScore * riskFactor;
    
    // Risk puanına göre seviye belirle
    let riskLevel = '';
          if (riskScore < 20) {
      riskLevel = t('low');
    } else if (riskScore < 35) {
      riskLevel = t('lowMedium');
    } else if (riskScore < 50) {
      riskLevel = t('medium');
    } else if (riskScore < 65) {
      riskLevel = t('mediumHigh');
      } else {
      riskLevel = t('high');
    }
    
    return { level: riskLevel, score: Math.round(riskScore) };
  };

  // Trend bahisçi önerilerini oluştur
  const generateTrendBettingTips = () => {
    // Son maç verilerine dayanarak trend bahis önerileri
    interface BettingTip {
      type: string;
      label: string;
      probability: number;
      explanation: string;
      confidence?: string;  // Opsiyonel güven seviyesi
      riskLevel?: string;   // Opsiyonel risk seviyesi
      riskScore?: number;   // Opsiyonel risk puanı
    }
    
    const tips: BettingTip[] = [];
    
    // ----- MAÇ SONUCU ÖNERİLERİ -----
    // Güçlü galibiyet eğilimi (60% ve üzeri)
    if (predictions.homeWinProb >= 60) {
      tips.push({
        type: "strong",
        label: `${homeTeam} ${t('win')}`,
        probability: predictions.homeWinProb,
        explanation: `${homeTeam} ${t('lastTenMatches')} ${t('win').toLowerCase()} ${t('probability').toLowerCase()}`
      });
    } 
    
    if (predictions.awayWinProb >= 60) {
      tips.push({
        type: "strong",
        label: `${awayTeam} ${t('win')}`,
        probability: predictions.awayWinProb,
        explanation: `${awayTeam} ${t('lastTenMatches')} ${t('win').toLowerCase()} ${t('probability').toLowerCase()}`
      });
    }
    
    // Güçlü beraberlik eğilimi (40% ve üzeri)
    if (predictions.drawProb >= 40) {
      tips.push({
        type: "strong",
        label: t('draw'),
        probability: predictions.drawProb,
        explanation: t('draw') + ' ' + t('probability').toLowerCase()
      });
    }
    
    // ----- GOL BAZLI ÖNERİLER -----
    // 0.5 Üst/Alt analizi - daha detaylı analiz
    if (predictions.over0_5Prob >= 90) {
      tips.push({
        type: "strong",
        label: t('over05'),
        probability: predictions.over0_5Prob,
        explanation: t('highProbabilityAtLeastOneGoal')
      });
    } else if (predictions.over0_5Prob < 60) {
      tips.push({
        type: "medium",
        label: t('under05'),
        probability: 100 - predictions.over0_5Prob,
        explanation: t('highProbabilityNoGoals')
      });
    }
    
    // 1.5 Üst/Alt analizi - daha detaylı analiz
    if (predictions.over1_5Prob >= 85) {
      tips.push({
        type: "strong",
        label: t('over15'),
        probability: predictions.over1_5Prob,
        explanation: t('atLeastTwoGoals')
      });
    } else if (predictions.over1_5Prob >= 75) {
      tips.push({
        type: "medium",
        label: t('over15'),
        probability: predictions.over1_5Prob,
        explanation: t('expectAtLeastTwoGoals')
      });
    } else if (predictions.over1_5Prob < 60) {
      tips.push({
        type: "medium",
        label: t('under15'),
        probability: 100 - predictions.over1_5Prob,
        explanation: t('expectMaxOneGoal')
      });
    }
    
    // 2.5 Üst/Alt analizi - daha detaylı analiz
    if (predictions.over2_5Prob >= 75) {
      tips.push({
        type: "strong",
        label: t('over25'),
        probability: predictions.over2_5Prob,
        explanation: t('threeOrMoreGoals')
      });
    } else if (predictions.over2_5Prob >= 65) {
      tips.push({
        type: "medium",
        label: t('over25'),
        probability: predictions.over2_5Prob,
        explanation: t('expectThreeOrMoreGoals')
      });
    } else if (predictions.over2_5Prob >= 55 && predictions.over2_5Prob < 65) {
      // Sınırda durumlar için özel analiz
      // Her iki takımın da gol ortalaması kontrol edilebilir
      const bothTeamsScoreWell = bttsStats.home.percent > 60 && bttsStats.away.percent > 60;
      if (bothTeamsScoreWell) {
        tips.push({
          type: "medium",
          label: t('over25'),
          probability: predictions.over2_5Prob,
          explanation: t('bothTeamsHighGoalAverage')
        });
      }
    } else if (predictions.over2_5Prob < 45) {
      tips.push({
        type: "medium",
        label: t('under25'),
        probability: 100 - predictions.over2_5Prob,
        explanation: t('expectZeroToTwoGoals')
      });
    }
    
    // 3.5 Üst/Alt analizi
    if (predictions.over3_5Prob >= 65) {
      tips.push({
        type: "medium",
        label: t('over35'),
        probability: predictions.over3_5Prob,
        explanation: t('expectHighScoringMatch')
      });
    } else if (predictions.over3_5Prob < 30) {
      tips.push({
        type: "medium",
        label: t('under35'),
        probability: 100 - predictions.over3_5Prob,
        explanation: t('expectMaxThreeGoals')
      });
    }
    
    // 4.5 Üst/Alt analizi
    if (predictions.over4_5Prob >= 55) {
      tips.push({
        type: "medium",
        label: t('dortBuçukUst'),
        probability: predictions.over4_5Prob,
        explanation: t('expectManyGoals')
      });
    }
    
    // ----- KARŞILIKLI GOL ÖNERİLERİ -----
    // Karşılıklı gol (BTTS) eğilimi (60% ve üzeri)
    if (predictions.bttsProb >= 60) {
      tips.push({
        type: "strong",
        label: t('bttsYes'),
        probability: predictions.bttsProb,
        explanation: t('bothTeamsScoring')
      });
    } else if (100 - predictions.bttsProb >= 60) {
      tips.push({
        type: "medium",
        label: t('bttsNo'),
        probability: 100 - predictions.bttsProb,
        explanation: t('atLeastOneTeamNotScoring')
      });
    }
    
    // ----- KOMBİNE ÖNERİLER -----
    // KG Var & Üst kombinasyonu
    if (predictions.bttsProb >= 60 && predictions.over2_5Prob >= 65) {
      tips.push({
        type: "strong",
        label: t('bttsYesAndOver25'),
        probability: Math.min(predictions.bttsProb, predictions.over2_5Prob),
        explanation: t('bothTeamsWillScoreAndOver')
      });
    }
    
    // KG Yok & Alt kombinasyonu
    if ((100 - predictions.bttsProb >= 60) && (100 - predictions.over2_5Prob >= 60)) {
      tips.push({
        type: "strong",
        label: t('bttsNoAndUnder25'),
        probability: Math.min(100 - predictions.bttsProb, 100 - predictions.over2_5Prob),
        explanation: t('expectLowScoringNoBtts')
      });
    }
    
    // ----- MAÇ AKIŞI ÖNERİLERİ -----
    // İlk yarı / maç sonucu önerisi
    if (predictions.homeWinProb >= 60) {
      tips.push({
        type: "medium",
        label: t('htftHomeWin'),
        probability: Math.round(predictions.homeWinProb * 0.7),
        explanation: t('teamWillWinBothHalves', {teamName: homeTeam})
      });
    } else if (predictions.awayWinProb >= 60) {
      tips.push({
        type: "medium",
        label: t('htftAwayWin'),
        probability: Math.round(predictions.awayWinProb * 0.7),
        explanation: t('teamWillWinBothHalves', {teamName: awayTeam})
      });
    }
    
    // ----- HANDİKAP ÖNERİLERİ -----
    // Handikap önerileri - güçlü takım için
    if (predictions.homeWinProb >= 70) {
      tips.push({
        type: "medium",
        label: `${homeTeam} -1.5 Handikap`,
        probability: Math.round(predictions.homeWinProb * 0.6),
        explanation: t('teamWillWinByTwoGoals', {teamName: homeTeam})
      });
    } else if (predictions.awayWinProb >= 70) {
      tips.push({
        type: "medium",
        label: `${awayTeam} -1.5 Handikap`,
        probability: Math.round(predictions.awayWinProb * 0.6),
        explanation: t('teamWillWinByTwoGoals', {teamName: awayTeam})
      });
    }
    
    // ----- ÇİFTE ŞANS ÖNERİLERİ -----
    // Daha zayıf takımlar için Çifte Şans
    if (predictions.homeWinProb < 40 && predictions.drawProb >= 30) {
      tips.push({
        type: "safe",
        label: `${awayTeam} Kazanır/Berabere Kalır`,
        probability: predictions.awayWinProb + predictions.drawProb,
        explanation: t('teamHasLowWinProbability', {teamName: homeTeam})
      });
    } else if (predictions.awayWinProb < 40 && predictions.drawProb >= 30) {
      tips.push({
        type: "safe",
        label: `${homeTeam} Kazanır/Berabere Kalır`,
        probability: predictions.homeWinProb + predictions.drawProb,
        explanation: t('teamHasLowWinProbability', {teamName: awayTeam})
      });
    }
    
    // ----- VARSAYILAN ÖNERİLER -----
    // Eğer hiç öneri yoksa, varsayılan olarak en güvenli bahisleri ekle
    if (tips.length === 0) {
      tips.push({
        type: "safe",
        label: "0.5 Üst",
        probability: predictions.over0_5Prob,
        explanation: t('highProbabilityAtLeastOneGoal')
      });
      
      // En yüksek olasılıklı maç sonucu
      const maxOutcome = Math.max(predictions.homeWinProb, predictions.drawProb, predictions.awayWinProb);
      if (maxOutcome === predictions.homeWinProb) {
        tips.push({
          type: "safe",
          label: `${homeTeam} Kazanır/Berabere Kalır`,
          probability: predictions.homeWinProb + predictions.drawProb,
          explanation: t('teamHasLowWinProbability', {teamName: awayTeam})
        });
      } else if (maxOutcome === predictions.awayWinProb) {
        tips.push({
          type: "safe",
          label: `${awayTeam} Kazanır/Berabere Kalır`,
          probability: predictions.awayWinProb + predictions.drawProb,
          explanation: t('teamHasLowWinProbability', {teamName: homeTeam})
        });
      } else {
        tips.push({
          type: "safe",
          label: t('doubleChanceX'),
          probability: predictions.drawProb,
          explanation: t('highDrawProbability')
        });
      }
    }
    
    // --- İlave Kombine Öneriler ---
    // 1.5 Üst + KG Var kombinasyonu
    if (predictions.over1_5Prob >= 80 && predictions.bttsProb >= 65) {
      tips.push({
        type: "strong",
        label: "1.5 Üst & KG Var",
        probability: Math.min(predictions.over1_5Prob, predictions.bttsProb),
        explanation: t('bothTeamsWillScoreAndOver15')
      });
    }
    
    // 2.5 Üst + Ev Sahibi Kazanır/Kaybetmez
    if (predictions.over2_5Prob >= 70 && predictions.homeWinProb >= 60) {
      tips.push({
        type: "medium",
        label: `2.5 Üst & ${homeTeam} Kazanır`,
        probability: Math.min(predictions.over2_5Prob, predictions.homeWinProb),
        explanation: t('expectHighScoringWithTeamWin', {teamName: homeTeam})
      });
    } else if (predictions.over2_5Prob >= 70 && (predictions.homeWinProb + predictions.drawProb) >= 70) {
      tips.push({
        type: "medium",
        label: `2.5 Üst & ${homeTeam} Kaybetmez`,
        probability: Math.min(predictions.over2_5Prob, (predictions.homeWinProb + predictions.drawProb)),
        explanation: t('teamHasAdvantageInHighScoring', {teamName: homeTeam})
      });
    }
    
    // 2.5 Üst + Deplasman Kazanır/Kaybetmez
    if (predictions.over2_5Prob >= 70 && predictions.awayWinProb >= 60) {
      tips.push({
        type: "medium",
        label: `2.5 Üst & ${awayTeam} Kazanır`,
        probability: Math.min(predictions.over2_5Prob, predictions.awayWinProb),
        explanation: t('expectHighScoringWithTeamWin', {teamName: awayTeam})
      });
    } else if (predictions.over2_5Prob >= 70 && (predictions.awayWinProb + predictions.drawProb) >= 70) {
      tips.push({
        type: "medium",
        label: `2.5 Üst & ${awayTeam} Kaybetmez`,
        probability: Math.min(predictions.over2_5Prob, (predictions.awayWinProb + predictions.drawProb)),
        explanation: t('teamHasAdvantageInHighScoring', {teamName: awayTeam})
      });
    }
    
    // Önerilerin kalitesini ve risk seviyesini hesapla
    tips.forEach(tip => {
      // Güven seviyesi
      if (tip.probability >= 80) {
        tip.confidence = t('veryHigh');
      } else if (tip.probability >= 70) {
        tip.confidence = t('high');
      } else if (tip.probability >= 60) {
        tip.confidence = t('medium');
      } else if (tip.probability >= 50) {
        tip.confidence = t('low');
      } else {
        tip.confidence = t('veryLow');
      }
      
      // Risk seviyesi hesapla
      const riskResult = calculateRiskLevel(tip.probability, tip.label);
      tip.riskLevel = riskResult.level;
      tip.riskScore = riskResult.score;
    });
    
    // En iyi 4 öneriyi sırala - güven seviyesine göre
    return tips
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);  // En iyi 5 öneriyi göster
  }
  
  // Trend bahisçi önerilerini hesapla
  const trendBettingTips = generateTrendBettingTips();
  
  // Debug için trendBettingTips'i konsola yazdır
  useEffect(() => {
    if (!loading) {
      console.log('Trend Bahisçi Önerileri:', trendBettingTips);
      console.log('Koşullar:', {
        homeWinProb: predictions.homeWinProb >= 70,
        awayWinProb: predictions.awayWinProb >= 70,
        drawProb: predictions.drawProb >= 45,
        bttsProb: predictions.bttsProb >= 65,
        over2_5Prob: predictions.over2_5Prob >= 65,
        under2_5Prob: 100 - predictions.over2_5Prob >= 65
      });
    }
  }, [loading, trendBettingTips, predictions]);

  // --- Recommended Market Calculation ---
  const marketSuggestions = [
    { label: "0.5 ÜST", value: predictions.over0_5Prob, type: "over0_5" },
    { label: "1.5 ÜST", value: predictions.over1_5Prob, type: "over1_5" },
    { label: "2.5 ÜST", value: predictions.over2_5Prob, type: "over2_5" },
    { label: "3.5 ÜST", value: predictions.over3_5Prob, type: "over3_5" },
    { label: "4.5 ÜST", value: predictions.over4_5Prob, type: "over4_5" },
    { label: "0.5 ALT", value: 100 - predictions.over0_5Prob, type: "under0_5" },
    { label: "1.5 ALT", value: 100 - predictions.over1_5Prob, type: "under1_5" },
    { label: "2.5 ALT", value: 100 - predictions.over2_5Prob, type: "under2_5" },
    { label: "3.5 ALT", value: 100 - predictions.over3_5Prob, type: "under3_5" },
    { label: "4.5 ALT", value: 100 - predictions.over4_5Prob, type: "under4_5" },
    { label: "KG VAR", value: predictions.bttsProb, type: "btts" },
    { label: "KG YOK", value: 100 - predictions.bttsProb, type: "nobtts" },
  ];
  const recommendedMarket = useMemo(() => {
    // Return the highest probability tip
    return trendBettingTips.length > 0 ? trendBettingTips.reduce((prev, current) => 
      (prev.probability > current.probability) ? prev : current
    ) : null;
  }, [predictions, bttsStats]);

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-400 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
            Maç Tahmini
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-2">
          <Loader2 className="w-5 h-5 animate-spin text-green-500" />
          <p className="text-xs text-slate-400">Tahminler yükleniyor...</p>
        </CardContent>
      </Card>
    )
  }

  if (!showData) {
    return (
      <Card className="bg-slate-800/50 border border-slate-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-400 flex items-center">
            <LightbulbIcon className="w-4 h-4 mr-2 text-yellow-400" />
            Maç Tahmini
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-300">{homeTeam} vs {awayTeam}</p>
            <p className="text-xs text-slate-400">
              Maç tahminlerini ve en iyi bahis önerilerini görüntüleyin
            </p>
          </div>
          
          <Button 
            onClick={handlePredictClick}
            className="bg-yellow-800 hover:bg-yellow-700 text-white flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {t('predict')}
            <span className="flex items-center ml-1 bg-yellow-700/50 px-1.5 py-0.5 rounded text-xs">
              <Coins className="w-3 h-3 mr-0.5 text-yellow-400" />
              <span className="text-yellow-400">{CREDIT_COSTS.PREDICTION}</span>
            </span>
          </Button>
        </CardContent>
        
        <CreditRequiredModal
          isOpen={showCreditModal}
          onClose={() => setShowCreditModal(false)}
          requiredCredits={CREDIT_COSTS.PREDICTION}
          actionDescription="Maç tahmini görüntülemek"
          onContinue={handleContinueWithCredits}
        />
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-green-700/30 overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=400')] opacity-5"></div>
      <CardHeader className="p-3 relative z-10">
        <CardTitle className="text-base text-white flex items-center">
          <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
          <span className="text-green-400">{t('matchPredictions')}</span>
        </CardTitle>
      </CardHeader>
      
      {/* Match score display for completed matches */}
      {isCompleted && homeScore && awayScore && (
        <div className="mx-3 mb-2 p-3 bg-slate-800/80 rounded-md border border-green-700/30 relative z-10">
          <div className="flex flex-col items-center">
            <div className="text-xs text-green-400 mb-1">Maç Sonucu</div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm font-bold text-white">{homeTeam}</span>
              <div className="flex items-center">
                <span className={`text-xl font-bold ${parseInt(homeScore || "0") > parseInt(awayScore || "0") ? 'text-green-400' : 'text-white'}`}>
                  {homeScore}
                </span>
                <span className="text-slate-400 mx-1">-</span>
                <span className={`text-xl font-bold ${parseInt(awayScore || "0") > parseInt(homeScore || "0") ? 'text-green-400' : 'text-white'}`}>
                  {awayScore}
                </span>
              </div>
              <span className="text-sm font-bold text-white">{awayTeam}</span>
            </div>
            <div className="mt-1">
              <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded border border-green-700/30">
                {matchStatus === "FT" ? "Tamamlandı" : matchStatus}
              </span>
            </div>
            
            {/* Match result indicator */}
            {isCompleted && homeScore && awayScore && (
              <div className="mt-2 text-xs">
                {parseInt(homeScore || "0") > parseInt(awayScore || "0") ? (
                  <span className="text-green-400 font-medium">{homeTeam} Kazandı</span>
                ) : parseInt(awayScore || "0") > parseInt(homeScore || "0") ? (
                  <span className="text-yellow-400 font-medium">{awayTeam} Kazandı</span>
                ) : (
                  <span className="text-blue-400 font-medium">Beraberlik</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      <CardContent className="p-3 space-y-4 relative z-10">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-green-400 border-b border-green-700/30 pb-1 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1 text-yellow-400" />
            <span>{t('matchWinner')}</span>
          </h3>
          <div className="space-y-3 bg-slate-800/50 p-3 rounded-md border border-green-700/20">
            {/* Favorinin gösterildiği özel bölüm */}
            <div className="flex justify-center mb-2">
              {predictions.homeWinProb > predictions.drawProb && predictions.homeWinProb > predictions.awayWinProb ? (
                <div className="bg-green-900/30 border border-green-700/30 rounded-md px-3 py-1 text-center animate-pulse">
                  <span className="text-sm text-green-400 font-bold">{homeTeam}</span>
                  <span className="text-xs text-slate-300 ml-1">{t('favorite')} (%{Math.round(predictions.homeWinProb)})</span>
                </div>
              ) : predictions.awayWinProb > predictions.homeWinProb && predictions.awayWinProb > predictions.drawProb ? (
                <div className="bg-yellow-900/30 border border-yellow-700/30 rounded-md px-3 py-1 text-center animate-pulse">
                  <span className="text-sm text-yellow-400 font-bold">{awayTeam}</span>
                  <span className="text-xs text-slate-300 ml-1">{t('favorite')} (%{Math.round(predictions.awayWinProb)})</span>
                </div>
              ) : (
                <div className="bg-blue-900/30 border border-blue-700/30 rounded-md px-3 py-1 text-center animate-pulse">
                  <span className="text-sm text-blue-400 font-bold">{t('draw')}</span>
                  <span className="text-xs text-slate-300 ml-1">{t('probability')} (%{Math.round(predictions.drawProb)})</span>
                </div>
              )}
            </div>
            
          <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-1.5 h-6 rounded-sm ${predictions.homeWinProb >= 60 ? 'bg-green-500' : 'bg-slate-600'}`}></div>
                  <span className={`text-sm ${predictions.homeWinProb > predictions.awayWinProb && predictions.homeWinProb > predictions.drawProb ? 'text-green-400 font-bold' : 'text-slate-300'}`}>{homeTeam}</span>
                </div>
                <div className={`px-2 py-0.5 rounded-md ${
                  predictions.homeWinProb >= 70 ? 'bg-green-500/20 text-green-400 border border-green-700/30' : 
                  predictions.homeWinProb >= 60 ? 'bg-green-600/20 text-green-400 border border-green-700/30' : 
                  predictions.homeWinProb >= 50 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-700/30' :
                  'bg-slate-700/40 text-slate-300'
                }`}>
                  %{Math.round(predictions.homeWinProb)}
                </div>
            </div>
            <Progress
              value={predictions.homeWinProb}
                className="h-2 bg-slate-700 stat-bar"
              indicatorColor={
                predictions.homeWinProb >= 70 ? "bg-green-500"
                : predictions.homeWinProb >= 60 ? "bg-yellow-400"
                : predictions.homeWinProb < 50 ? "bg-red-500"
                : "bg-amber-500"
              }
            />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-1.5 h-6 rounded-sm ${predictions.drawProb >= 45 ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
                  <span className={`text-sm ${predictions.drawProb >= predictions.homeWinProb && predictions.drawProb >= predictions.awayWinProb ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>{t("draw")}</span>
                </div>
                <div className={`px-2 py-0.5 rounded-md ${
                  predictions.drawProb >= 50 ? 'bg-blue-500/20 text-blue-400 border border-blue-700/30' : 
                  predictions.drawProb >= 40 ? 'bg-blue-600/20 text-blue-400 border border-blue-700/30' : 
                  'bg-slate-700/40 text-slate-300'
                }`}>
                  %{Math.round(predictions.drawProb)}
                </div>
            </div>
            <Progress
              value={predictions.drawProb}
                className="h-2 bg-slate-700 stat-bar"
                indicatorColor="bg-blue-500"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-1.5 h-6 rounded-sm ${predictions.awayWinProb >= 60 ? 'bg-yellow-500' : 'bg-slate-600'}`}></div>
                  <span className={`text-sm ${predictions.awayWinProb > predictions.homeWinProb && predictions.awayWinProb > predictions.drawProb ? 'text-yellow-400 font-bold' : 'text-slate-300'}`}>{awayTeam}</span>
                </div>
                <div className={`px-2 py-0.5 rounded-md ${
                  predictions.awayWinProb >= 70 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-700/30' : 
                  predictions.awayWinProb >= 60 ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-700/30' : 
                  predictions.awayWinProb >= 50 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-700/30' :
                  'bg-slate-700/40 text-slate-300'
                }`}>
                  %{Math.round(predictions.awayWinProb)}
                </div>
            </div>
            <Progress
              value={predictions.awayWinProb}
                className="h-2 bg-slate-700 stat-bar"
              indicatorColor={
                predictions.awayWinProb >= 70 ? "bg-green-500"
                : predictions.awayWinProb >= 60 ? "bg-yellow-400"
                : predictions.awayWinProb < 50 ? "bg-red-500"
                : "bg-amber-500"
              }
            />
          </div>
            
          </div>
        </div>

        {/* --- Recommended Market --- */}
        <div className="mb-2">
          <div className="flex items-center justify-center">
            <div className={`inline-flex items-center px-3 py-2 rounded-md font-bold ${
              recommendedMarket?.type === 'btts' ? 'bg-green-500/20 border border-green-400/40 text-green-400' : 
              recommendedMarket?.type === 'nobtts' ? 'bg-red-500/20 border border-red-400/40 text-red-400' : 
              recommendedMarket?.type?.includes('over') ? 'bg-yellow-400/20 border border-yellow-400/40 text-yellow-400' : 
              'bg-blue-500/20 border border-blue-400/40 text-blue-400'
            }`}>
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              <div className="flex flex-col items-center">
                <span className="text-sm">{t('recommendedBet')}</span>
                <div className="flex items-center gap-1 mt-1">
                                     <span className="text-lg font-bold">{recommendedMarket?.label}</span>
                   <span className="text-sm bg-slate-800/80 px-1.5 py-0.5 rounded">%{Math.round(recommendedMarket?.probability || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- Prediction Accuracy (for completed matches) --- */}
        {isCompleted && homeScore && awayScore && (
          <div className="mb-4 p-3 bg-slate-800/50 rounded-md border border-yellow-700/30">
            <h3 className="text-sm font-medium text-yellow-400 border-b border-yellow-700/30 pb-1 mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Tahmin Doğruluğu</span>
            </h3>
            
            <div className="space-y-2">
              {/* Match Result Prediction */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300">Maç Sonucu:</span>
                <div className="flex items-center gap-2">
                  {/* Actual Result */}
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-white">
                    {parseInt(homeScore || "0") > parseInt(awayScore || "0") 
                      ? "Ev Sahibi" 
                      : parseInt(awayScore || "0") > parseInt(homeScore || "0") 
                        ? "Deplasman" 
                        : "Beraberlik"}
                  </span>
                  
                  {/* Predicted Result */}
                  <span className="text-xs">vs</span>
                  <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                    (predictions.homeWinProb > predictions.drawProb && predictions.homeWinProb > predictions.awayWinProb && parseInt(homeScore || "0") > parseInt(awayScore || "0")) ||
                    (predictions.awayWinProb > predictions.homeWinProb && predictions.awayWinProb > predictions.drawProb && parseInt(awayScore || "0") > parseInt(homeScore || "0")) ||
                    (predictions.drawProb > predictions.homeWinProb && predictions.drawProb > predictions.awayWinProb && parseInt(homeScore || "0") === parseInt(awayScore || "0"))
                      ? "bg-green-600/30 text-green-400 border border-green-700/30"
                      : "bg-red-600/30 text-red-400 border border-red-700/30"
                  }`}>
                    {(predictions.homeWinProb > predictions.drawProb && predictions.homeWinProb > predictions.awayWinProb && parseInt(homeScore || "0") > parseInt(awayScore || "0")) ||
                    (predictions.awayWinProb > predictions.homeWinProb && predictions.awayWinProb > predictions.drawProb && parseInt(awayScore || "0") > parseInt(homeScore || "0")) ||
                    (predictions.drawProb > predictions.homeWinProb && predictions.drawProb > predictions.awayWinProb && parseInt(homeScore || "0") === parseInt(awayScore || "0"))
                      ? <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      : <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    }
                    {predictions.homeWinProb > predictions.drawProb && predictions.homeWinProb > predictions.awayWinProb 
                      ? "Ev Sahibi" 
                      : predictions.awayWinProb > predictions.homeWinProb && predictions.awayWinProb > predictions.drawProb 
                        ? "Deplasman" 
                        : "Beraberlik"}
                  </span>
                </div>
              </div>
              
              {/* Draw Prediction */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300">Beraberlik:</span>
                <div className="flex items-center gap-2">
                  {/* Actual Result */}
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-white">
                    {parseInt(homeScore || "0") === parseInt(awayScore || "0") ? "Evet" : "Hayır"}
                  </span>
                  
                  {/* Predicted Result */}
                  <span className="text-xs">vs</span>
                  <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                    (predictions.drawProb >= 40 && parseInt(homeScore || "0") === parseInt(awayScore || "0")) ||
                    (predictions.drawProb < 40 && parseInt(homeScore || "0") !== parseInt(awayScore || "0"))
                      ? "bg-green-600/30 text-green-400 border border-green-700/30"
                      : "bg-red-600/30 text-red-400 border border-red-700/30"
                  }`}>
                    {(predictions.drawProb >= 40 && parseInt(homeScore || "0") === parseInt(awayScore || "0")) ||
                    (predictions.drawProb < 40 && parseInt(homeScore || "0") !== parseInt(awayScore || "0"))
                      ? <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      : <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    }
                    {predictions.drawProb >= 40 ? "Evet" : "Hayır"}
                  </span>
                </div>
              </div>
              
              {/* 0.5 Over Prediction */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300">0.5 Üst:</span>
                <div className="flex items-center gap-2">
                  {/* Actual Result */}
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-white">
                    {parseInt(homeScore || "0") + parseInt(awayScore || "0") > 0.5 ? "Evet" : "Hayır"}
                  </span>
                  
                  {/* Predicted Result */}
                  <span className="text-xs">vs</span>
                  <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                    (predictions.over0_5Prob >= 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") > 0.5) ||
                    (predictions.over0_5Prob < 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") <= 0.5)
                      ? "bg-green-600/30 text-green-400 border border-green-700/30"
                      : "bg-red-600/30 text-red-400 border border-red-700/30"
                  }`}>
                    {(predictions.over0_5Prob >= 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") > 0.5) ||
                    (predictions.over0_5Prob < 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") <= 0.5)
                      ? <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      : <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    }
                    {predictions.over0_5Prob >= 50 ? "Evet" : "Hayır"}
                  </span>
                </div>
              </div>
              
              {/* 1.5 Over Prediction */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300">1.5 Üst:</span>
                <div className="flex items-center gap-2">
                  {/* Actual Result */}
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-white">
                    {parseInt(homeScore || "0") + parseInt(awayScore || "0") > 1.5 ? "Evet" : "Hayır"}
                  </span>
                  
                  {/* Predicted Result */}
                  <span className="text-xs">vs</span>
                  <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                    (predictions.over1_5Prob >= 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") > 1.5) ||
                    (predictions.over1_5Prob < 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") <= 1.5)
                      ? "bg-green-600/30 text-green-400 border border-green-700/30"
                      : "bg-red-600/30 text-red-400 border border-red-700/30"
                  }`}>
                    {(predictions.over1_5Prob >= 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") > 1.5) ||
                    (predictions.over1_5Prob < 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") <= 1.5)
                      ? <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      : <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    }
                    {predictions.over1_5Prob >= 50 ? "Evet" : "Hayır"}
                  </span>
                </div>
              </div>
              
              {/* Over/Under 2.5 Prediction */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300">2.5 Üst:</span>
                <div className="flex items-center gap-2">
                  {/* Actual Result */}
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-white">
                    {parseInt(homeScore || "0") + parseInt(awayScore || "0") > 2.5 ? "Evet" : "Hayır"}
                  </span>
                  
                  {/* Predicted Result */}
                  <span className="text-xs">vs</span>
                  <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                    (predictions.over2_5Prob >= 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") > 2.5) ||
                    (predictions.over2_5Prob < 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") <= 2.5)
                      ? "bg-green-600/30 text-green-400 border border-green-700/30"
                      : "bg-red-600/30 text-red-400 border border-red-700/30"
                  }`}>
                    {(predictions.over2_5Prob >= 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") > 2.5) ||
                    (predictions.over2_5Prob < 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") <= 2.5)
                      ? <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      : <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    }
                    {predictions.over2_5Prob >= 50 ? "Evet" : "Hayır"}
                  </span>
                </div>
              </div>
              
              {/* BTTS Prediction */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300">KG Var:</span>
                <div className="flex items-center gap-2">
                  {/* Actual Result */}
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-white">
                    {parseInt(homeScore || "0") > 0 && parseInt(awayScore || "0") > 0 ? "Evet" : "Hayır"}
                  </span>
                  
                  {/* Predicted Result */}
                  <span className="text-xs">vs</span>
                  <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${
                    (predictions.bttsProb >= 50 && parseInt(homeScore || "0") > 0 && parseInt(awayScore || "0") > 0) ||
                    (predictions.bttsProb < 50 && (parseInt(homeScore || "0") === 0 || parseInt(awayScore || "0") === 0))
                      ? "bg-green-600/30 text-green-400 border border-green-700/30"
                      : "bg-red-600/30 text-red-400 border border-red-700/30"
                  }`}>
                    {(predictions.bttsProb >= 50 && parseInt(homeScore || "0") > 0 && parseInt(awayScore || "0") > 0) ||
                    (predictions.bttsProb < 50 && (parseInt(homeScore || "0") === 0 || parseInt(awayScore || "0") === 0))
                      ? <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      : <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    }
                    {predictions.bttsProb >= 50 ? "Evet" : "Hayır"}
                  </span>
                </div>
              </div>
              
              {/* Algorithm Won Banner - Show if at least one prediction was correct */}
              {((predictions.homeWinProb > predictions.drawProb && predictions.homeWinProb > predictions.awayWinProb && parseInt(homeScore || "0") > parseInt(awayScore || "0")) ||
                (predictions.awayWinProb > predictions.homeWinProb && predictions.awayWinProb > predictions.drawProb && parseInt(awayScore || "0") > parseInt(homeScore || "0")) ||
                (predictions.drawProb > predictions.homeWinProb && predictions.drawProb > predictions.awayWinProb && parseInt(homeScore || "0") === parseInt(awayScore || "0")) ||
                (predictions.drawProb >= 40 && parseInt(homeScore || "0") === parseInt(awayScore || "0")) ||
                (predictions.drawProb < 40 && parseInt(homeScore || "0") !== parseInt(awayScore || "0")) ||
                (predictions.over0_5Prob >= 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") > 0.5) ||
                (predictions.over0_5Prob < 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") <= 0.5) ||
                (predictions.over1_5Prob >= 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") > 1.5) ||
                (predictions.over1_5Prob < 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") <= 1.5) ||
                (predictions.over2_5Prob >= 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") > 2.5) ||
                (predictions.over2_5Prob < 50 && parseInt(homeScore || "0") + parseInt(awayScore || "0") <= 2.5) ||
                (predictions.bttsProb >= 50 && parseInt(homeScore || "0") > 0 && parseInt(awayScore || "0") > 0) ||
                (predictions.bttsProb < 50 && (parseInt(homeScore || "0") === 0 || parseInt(awayScore || "0") === 0))) && (
                <div className="mt-4 relative overflow-hidden">
                  {/* Background with animated gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-yellow-500 to-green-500 animate-pulse opacity-30 rounded-lg"></div>
                  
                  {/* Shining effect */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="w-10 h-full bg-white/30 rotate-12 transform -translate-x-20 animate-[shine_3s_ease-in-out_infinite] absolute"></div>
                  </div>
                  
                  <div className="relative p-3 flex flex-col items-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center mr-2 animate-bounce">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      <div className="text-center">
                        <h4 className="text-lg font-bold text-yellow-400 animate-pulse">Algoritma Kazandırdı!</h4>
                        <p className="text-xs text-green-400">Tahminlerimiz tuttu!</p>
                      </div>
                    </div>
                    
                    <div className="w-full p-2 bg-slate-800/80 rounded-md border border-yellow-500/50 mt-1">
                      <p className="text-xs text-center text-white">
                        <span className="font-bold text-yellow-400">PRO</span> üyelik ile her gün <span className="font-bold text-green-400">%85</span> doğrulukta tahminlere erişin!
                      </p>
                      <button className="w-full mt-2 py-1 px-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white text-xs font-medium rounded-md hover:from-yellow-500 hover:to-yellow-400 transition-all duration-300 flex items-center justify-center">
                        <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 15.5H7.5C6.10444 15.5 5.40665 15.5 4.83886 15.6722C3.56045 16.06 2.56004 17.0605 2.17224 18.3389C2 18.9067 2 19.6044 2 21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M10 12C12.4853 12 14.5 9.98528 14.5 7.5C14.5 5.01472 12.4853 3 10 3C7.51472 3 5.5 5.01472 5.5 7.5C5.5 9.98528 7.51472 12 10 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M22 21C22 19.6044 22 18.9067 21.8278 18.3389C21.44 17.0605 20.4395 16.06 19.1611 15.6722C18.5933 15.5 17.8956 15.5 16.5 15.5H16M17.5 12C19.9853 12 22 9.98528 22 7.5C22 5.01472 19.9853 3 17.5 3C15.0147 3 13 5.01472 13 7.5C13 9.98528 15.0147 12 17.5 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        PRO Üyelik Al
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- Trend Bahisçi Önerileri --- */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-green-400 border-b border-green-700/30 pb-1 flex items-center">
            <Bot className="w-4 h-4 mr-1 text-blue-400" />
            <span>{t('trendBettingTips')}</span>
          </h3>
          <div className="space-y-3 bg-slate-800/50 p-2 rounded-md border border-green-700/20">
            {trendBettingTips.length > 0 ? (
              <>
                {/* Kategori başlıkları */}
                <div className="flex flex-col space-y-1">
                  <div className="text-xs text-green-400 font-medium border-b border-green-700/30 pb-1 mb-1">
                    {t('bestBets')}
                  </div>
                  
                  {/* İlk 3 öneriyi en iyi seçimler olarak göster */}
                  {trendBettingTips.slice(0, 3).map((tip, index) => (
                    <div key={index} className="flex flex-col space-y-1 p-2 bg-slate-700/30 rounded-md hover:bg-slate-700/50 transition-colors">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            tip.type === 'strong' ? 'bg-green-500' : 
                            tip.type === 'medium' ? 'bg-yellow-500' : 
                            'bg-blue-500'}`}></span>
                          <span className="font-medium text-sm">{tip.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {tip.confidence && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${
                              tip.confidence === t('veryHigh') ? 'bg-green-600/40 text-green-400' : 
                              tip.confidence === t('high') ? 'bg-green-500/40 text-green-300' : 
                              tip.confidence === t('medium') ? 'bg-yellow-500/40 text-yellow-300' : 
                              tip.confidence === t('low') ? 'bg-orange-500/40 text-orange-300' :
                              'bg-red-500/40 text-red-300'
                            }`}>
                              {tip.confidence}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            tip.probability >= 75 ? 'bg-green-600' : 
                            tip.probability >= 60 ? 'bg-yellow-600' : 
                            tip.probability >= 50 ? 'bg-amber-600' : 
                            'bg-blue-600'}`}>
                            %{tip.probability}
            </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-400">{tip.explanation}</p>
                        {tip.riskLevel && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ml-1 flex items-center ${
                            tip.riskLevel === 'Düşük' ? 'bg-green-900/40 text-green-400 border border-green-700/30' : 
                            tip.riskLevel === 'Düşük-Orta' ? 'bg-teal-900/40 text-teal-400 border border-teal-700/30' : 
                            tip.riskLevel === 'Orta' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/30' : 
                            tip.riskLevel === 'Orta-Yüksek' ? 'bg-orange-900/40 text-orange-400 border border-orange-700/30' :
                            'bg-red-900/40 text-red-400 border border-red-700/30'
                          }`}>
                            <svg className="w-2 h-2 mr-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 9V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 17.5V17.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>{t('risk')}: {tip.riskLevel} 
                              {tip.riskScore !== undefined && (
                                <span className="ml-0.5 opacity-80">({tip.riskScore})</span>
                              )}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Alt/Üst Market Önerileri - önerilen bahisler içinde 1.5 veya 2.5 Üst/Alt varsa göster */}
                {trendBettingTips.some(tip => 
                  tip.label.includes("1.5") || 
                  tip.label.includes("2.5") || 
                  (tip.label.includes("Over") && tip.label.includes("&"))
                ) && (
                  <div className="flex flex-col space-y-1 mt-3">
                    <div className="text-xs text-yellow-400 font-medium border-b border-yellow-700/30 pb-1 mb-1">
                      {t('marketSuggestions')}
                    </div>
                    
                    {trendBettingTips
                      .filter(tip => 
                        tip.label.includes("1.5") || 
                        tip.label.includes("2.5") || 
                        (tip.label.includes("Over") && tip.label.includes("&"))
                      )
                      .map((tip, index) => (
                        <div key={index} className="flex flex-col space-y-1 p-2 bg-slate-700/30 rounded-md hover:bg-slate-700/50 transition-colors">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                tip.type === 'strong' ? 'bg-green-500' : 
                                tip.type === 'medium' ? 'bg-yellow-500' : 
                                'bg-blue-500'}`}></span>
                              <span className="font-medium text-sm">{tip.label}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {tip.confidence && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${
                                  tip.confidence === 'Çok Yüksek' ? 'bg-green-600/40 text-green-400' : 
                                  tip.confidence === 'Yüksek' ? 'bg-green-500/40 text-green-300' : 
                                  tip.confidence === 'Orta' ? 'bg-yellow-500/40 text-yellow-300' : 
                                  tip.confidence === 'Düşük' ? 'bg-orange-500/40 text-orange-300' :
                                  'bg-red-500/40 text-red-300'
                                }`}>
                                  {tip.confidence}
                                </span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                tip.probability >= 75 ? 'bg-green-600' : 
                                tip.probability >= 60 ? 'bg-yellow-600' : 
                                tip.probability >= 50 ? 'bg-amber-600' : 
                                'bg-blue-600'}`}>
                                %{tip.probability}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-slate-400">{tip.explanation}</p>
                            {tip.riskLevel && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ml-1 flex items-center ${
                                tip.riskLevel === 'Düşük' ? 'bg-green-900/40 text-green-400 border border-green-700/30' : 
                                tip.riskLevel === 'Düşük-Orta' ? 'bg-teal-900/40 text-teal-400 border border-teal-700/30' : 
                                tip.riskLevel === 'Orta' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/30' : 
                                tip.riskLevel === 'Orta-Yüksek' ? 'bg-orange-900/40 text-orange-400 border border-orange-700/30' :
                                'bg-red-900/40 text-red-400 border border-red-700/30'
                              }`}>
                                <svg className="w-2 h-2 mr-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 9V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M12 17.5V17.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>{t('risk')}: {tip.riskLevel} 
                                  {tip.riskScore !== undefined && (
                                    <span className="ml-0.5 opacity-80">({tip.riskScore})</span>
                                  )}</span>
                              </span>
                            )}
                          </div>
                        </div>
                    ))}
                  </div>
                )}
                
                {/* Diğer öneriler - en fazla 2 tane göster */}
                {trendBettingTips.length > 3 && (
                  <div className="flex flex-col space-y-1 mt-3">
                    <div className="text-xs text-blue-400 font-medium border-b border-blue-700/30 pb-1 mb-1">
                      {t('alternativeBets')}
                    </div>
                    
                    {trendBettingTips
                      .filter(tip => 
                        !trendBettingTips.slice(0, 3).includes(tip) && 
                        !(tip.label.includes("1.5") || 
                          tip.label.includes("2.5") || 
                          (tip.label.includes("Over") && tip.label.includes("&")))
                      )
                      .slice(0, 2)
                      .map((tip, index) => (
                        <div key={index} className="flex flex-col space-y-1 p-2 bg-slate-700/30 rounded-md hover:bg-slate-700/50 transition-colors">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                tip.type === 'strong' ? 'bg-green-500' : 
                                tip.type === 'medium' ? 'bg-yellow-500' : 
                                'bg-blue-500'}`}></span>
                              <span className="font-medium text-sm">{tip.label}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {tip.confidence && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${
                                  tip.confidence === 'Çok Yüksek' ? 'bg-green-600/40 text-green-400' : 
                                  tip.confidence === 'Yüksek' ? 'bg-green-500/40 text-green-300' : 
                                  tip.confidence === 'Orta' ? 'bg-yellow-500/40 text-yellow-300' : 
                                  tip.confidence === 'Düşük' ? 'bg-orange-500/40 text-orange-300' :
                                  'bg-red-500/40 text-red-300'
                                }`}>
                                  {tip.confidence}
                                </span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                tip.probability >= 75 ? 'bg-green-600' : 
                                tip.probability >= 60 ? 'bg-yellow-600' : 
                                tip.probability >= 50 ? 'bg-amber-600' : 
                                'bg-blue-600'}`}>
                                %{tip.probability}
                              </span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-slate-400">{tip.explanation}</p>
                            {tip.riskLevel && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ml-1 flex items-center ${
                                tip.riskLevel === 'Düşük' ? 'bg-green-900/40 text-green-400 border border-green-700/30' : 
                                tip.riskLevel === 'Düşük-Orta' ? 'bg-teal-900/40 text-teal-400 border border-teal-700/30' : 
                                tip.riskLevel === 'Orta' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/30' : 
                                tip.riskLevel === 'Orta-Yüksek' ? 'bg-orange-900/40 text-orange-400 border border-orange-700/30' :
                                'bg-red-900/40 text-red-400 border border-red-700/30'
                              }`}>
                                <svg className="w-2 h-2 mr-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 9V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M12 17.5V17.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>{t('risk')}: {tip.riskLevel} 
                                  {tip.riskScore !== undefined && (
                                    <span className="ml-0.5 opacity-80">({tip.riskScore})</span>
                                  )}</span>
                              </span>
                            )}
                          </div>
                        </div>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-slate-400 italic mt-1 text-center">
                  * {t('basedOnLast10MatchesAndH2H')}
                </div>
              </>
            ) : (
              <div className="text-center p-2">
                <p className="text-xs text-slate-400">{t('notEnoughDataForBets')}</p>
                <p className="text-xs text-slate-400 mt-1">{t('moreMatchesNeeded')}</p>
              </div>
            )}
          </div>
        </div>

        {/* --- Alt/Üst Marketleri --- */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-green-400 border-b border-green-700/30 pb-1 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1 text-yellow-400" />
            <span>{t('overUnderMarkets')}</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[0.5, 1.5, 2.5, 3.5, 4.5].map((val) => (
              <div key={val} className="space-y-1 p-2 bg-slate-800/50 rounded-md hover:bg-slate-800/70 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${val === 2.5 ? 'bg-green-900/40 text-green-400' : 'text-slate-300'}`}>{t('over')} {val}</span>
                  <span className={`px-1.5 py-0.5 rounded ${
                    (predictions[`over${val.toString().replace('.', '_')}Prob` as keyof typeof predictions] as number) >= 70 ? 'bg-green-900/40 text-green-400' : 
                    (predictions[`over${val.toString().replace('.', '_')}Prob` as keyof typeof predictions] as number) >= 60 ? 'bg-yellow-900/40 text-yellow-400' : 
                    'bg-slate-700/40 text-slate-300'
                  }`}>
                    %{Math.round(predictions[`over${val.toString().replace('.', '_')}Prob` as keyof typeof predictions] as number)}
                  </span>
                </div>
                <Progress
                  value={predictions[`over${val.toString().replace('.', '_')}Prob` as keyof typeof predictions] as number}
                  className="h-1.5 bg-slate-700 stat-bar"
                  indicatorColor={
                    (predictions[`over${val.toString().replace('.', '_')}Prob` as keyof typeof predictions] as number) >= 70 ? "bg-green-500"
                    : (predictions[`over${val.toString().replace('.', '_')}Prob` as keyof typeof predictions] as number) >= 60 ? "bg-yellow-400"
                    : (predictions[`over${val.toString().replace('.', '_')}Prob` as keyof typeof predictions] as number) < 50 ? "bg-red-500"
                    : "bg-amber-500"
                  }
                />
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${val === 2.5 ? 'bg-red-900/40 text-red-400' : 'text-slate-300'}`}>{t('under')} {val}</span>
                  <span className={`px-1.5 py-0.5 rounded ${
                    (100 - (predictions[`over${val.toString().replace('.', '_')}Prob` as keyof typeof predictions] as number)) >= 70 ? 'bg-green-900/40 text-green-400' : 
                    (100 - (predictions[`over${val.toString().replace('.', '_')}Prob` as keyof typeof predictions] as number)) >= 60 ? 'bg-yellow-900/40 text-yellow-400' : 
                    'bg-slate-700/40 text-slate-300'
                  }`}>
                    %{Math.round(100 - (predictions[`over${val.toString().replace('.', '_')}Prob` as keyof typeof predictions] as number))}
                  </span>
                </div>
                <Progress
                  value={100 - (predictions[`over${val.toString().replace('.', '_')}Prob` as keyof typeof predictions] as number)}
                  className="h-1.5 bg-slate-700 stat-bar"
                  indicatorColor={
                    (100 - (predictions[`over${val.toString().replace('.', '_')}Prob` as keyof typeof predictions] as number)) >= 70 ? "bg-green-500"
                    : (100 - (predictions[`over${val.toString().replace('.', '_')}Prob` as keyof typeof predictions] as number)) >= 60 ? "bg-yellow-400"
                    : (100 - (predictions[`over${val.toString().replace('.', '_')}Prob` as keyof typeof predictions] as number)) < 50 ? "bg-red-500"
                    : "bg-amber-700"
                  }
                />
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  {val === 0.5 && (
                    <span>{t('atLeastOneGoal')}: %{Math.round(predictions.over0_5Prob)}.</span>
                  )}
                  {val === 1.5 && (
                    <span>{t('atLeastTwoGoals')}: %{Math.round(predictions.over1_5Prob)}.</span>
                  )}
                  {val === 2.5 && (
                    <span>{t('threeOrMoreGoals')}: %{Math.round(predictions.over2_5Prob)}. {t('basedOnLast10MatchesAndH2H')}</span>
                  )}
                  {val === 3.5 && (
                    <span>{t('fourOrMoreGoals')}: %{Math.round(predictions.over3_5Prob)}.</span>
                  )}
                  {val === 4.5 && (
                    <span>{t('fiveOrMoreGoals')}: %{Math.round(predictions.over4_5Prob)}.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-400 italic mt-1 text-center">
            * {t('basedOnTeamsLast10MatchesAndH2H')}
          </div>
        </div>

        {/* --- Both Teams to Score (BTTS) --- */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-green-400 border-b border-green-700/30 pb-1 flex items-center">
            <Sparkles className="w-4 h-4 mr-1 text-green-400" />
            <span>{t('bttsAnalysis')}</span>
          </h3>
          <div className="p-2 bg-slate-800/50 rounded-md">
          <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="px-1.5 py-0.5 rounded bg-green-900/40 text-green-400 font-medium">{t('btts')}</span>
                <span className={`px-1.5 py-0.5 rounded ${
                  predictions.bttsProb >= 70 ? 'bg-green-900/40 text-green-400' : 
                  predictions.bttsProb >= 60 ? 'bg-yellow-900/40 text-yellow-400' : 
                  'bg-slate-700/40 text-slate-300'
                }`}>
                  %{Math.round(predictions.bttsProb)}
                </span>
            </div>
            <Progress
              value={predictions.bttsProb}
              className="h-1.5 bg-slate-700 stat-bar"
              indicatorColor={
                predictions.bttsProb >= 70 ? "bg-green-500"
                : predictions.bttsProb >= 60 ? "bg-yellow-400"
                : predictions.bttsProb < 50 ? "bg-red-500"
                : "bg-amber-500"
              }
            />
              <div className="flex flex-col gap-2 mt-2 bg-slate-700/30 p-2 rounded-md">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-medium">{t('h2h')}:</span>
                <span>{bttsStats.h2h.total > 0 ? `${bttsStats.h2h.count}/${bttsStats.h2h.total} (%${bttsStats.h2h.percent})` : t('noData')}</span>
                {bttsStats.h2h.total > 0 && <Progress value={bttsStats.h2h.percent} className="h-1 w-24" indicatorColor={bttsStats.h2h.percent >= 70 ? "bg-green-500" : bttsStats.h2h.percent >= 60 ? "bg-yellow-400" : bttsStats.h2h.percent < 50 ? "bg-red-500" : "bg-amber-500"} />}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-medium">{t('home')}:</span>
                <span>{bttsStats.home.total > 0 ? `${bttsStats.home.count}/${bttsStats.home.total} (%${bttsStats.home.percent})` : t('noData')}</span>
                {bttsStats.home.total > 0 && <Progress value={bttsStats.home.percent} className="h-1 w-24" indicatorColor={bttsStats.home.percent >= 70 ? "bg-green-500" : bttsStats.home.percent >= 60 ? "bg-yellow-400" : bttsStats.home.percent < 50 ? "bg-red-500" : "bg-amber-500"} />}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-medium">{t('away')}:</span>
                <span>{bttsStats.away.total > 0 ? `${bttsStats.away.count}/${bttsStats.away.total} (%${bttsStats.away.percent})` : t('noData')}</span>
                {bttsStats.away.total > 0 && <Progress value={bttsStats.away.percent} className="h-1 w-24" indicatorColor={bttsStats.away.percent >= 70 ? "bg-green-500" : bttsStats.away.percent >= 60 ? "bg-yellow-400" : bttsStats.away.percent < 50 ? "bg-red-500" : "bg-amber-500"} />}
              </div>
            </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-400 font-medium">{t('nobtts')}</span>
                <span className={`px-1.5 py-0.5 rounded ${
                  (100 - predictions.bttsProb) >= 70 ? 'bg-green-900/40 text-green-400' : 
                  (100 - predictions.bttsProb) >= 60 ? 'bg-yellow-900/40 text-yellow-400' : 
                  'bg-slate-700/40 text-slate-300'
                }`}>
                  %{Math.round(100 - predictions.bttsProb)}
                </span>
            </div>
            <Progress
              value={100 - predictions.bttsProb}
              className="h-1.5 bg-slate-700 stat-bar"
              indicatorColor={
                (100 - predictions.bttsProb) >= 70 ? "bg-green-500"
                : (100 - predictions.bttsProb) >= 60 ? "bg-yellow-400"
                : (100 - predictions.bttsProb) < 50 ? "bg-red-500"
                : "bg-amber-500"
              }
            />
              <div className="text-xs text-slate-400 mt-1 bg-slate-700/30 p-2 rounded-md">
                <div className="flex items-center">
                  <ChevronRight className="w-3 h-3 text-green-500 mr-1" />
                  <span>{t('average')}: %{bttsStats.average} {t('bttsProbability')}</span>
            </div>
                {bttsStats.average >= 60 && (
                  <div className="flex items-center mt-1">
                    <ChevronRight className="w-3 h-3 text-green-500 mr-1" />
                    <span className="text-green-400">{t('bothTeamsScoring')}</span>
          </div>
                )}
                {bttsStats.average < 40 && (
                  <div className="flex items-center mt-1">
                    <ChevronRight className="w-3 h-3 text-red-500 mr-1" />
                    <span className="text-red-400">{t('atLeastOneTeamNotScoring')}</span>
          </div>
        )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
