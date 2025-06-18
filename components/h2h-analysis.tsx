"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getHeadToHead } from "@/lib/football-api"
import { RefreshCw, Loader2, BarChart3, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "./language-provider"
import { useCreditStore, CREDIT_COSTS } from "@/lib/credit-system"
import { CreditRequiredModal } from "@/components/ui/credit-required-modal"
import { useToast } from "@/hooks/use-toast"

interface H2HAnalysisProps {
  firstTeamId: string
  secondTeamId: string
  firstTeamName: string
  secondTeamName: string
  h2hData?: any // optional, if provided, use this data instead of fetching
}

interface Match {
  id: number | string
  homeTeam: { id: number | string; name: string }
  awayTeam: { id: number | string; name: string }
  score: { fullTime: { home: number; away: number } }
  utcDate: string
  status: string
}

interface H2HStats {
  team1Wins: number
  team2Wins: number
  draws: number
  team1Goals: number
  team2Goals: number
  totalMatches: number
  avgGoalsPerMatch: number
  team1WinPercentage: number
  team2WinPercentage: number
  drawPercentage: number
  bttsPercentage: number
  over2_5Percentage: number
  recentForm: {
    team1: string[]
    team2: string[]
  }
}

function hasMatches(obj: any): obj is { matches: any[] } {
  return obj && typeof obj === 'object' && Array.isArray(obj.matches);
}

export function H2HAnalysis({ firstTeamId, secondTeamId, firstTeamName, secondTeamName, h2hData }: H2HAnalysisProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [stats, setStats] = useState<H2HStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showData, setShowData] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const { t } = useTranslation()
  const { useCredits, hasCredits } = useCreditStore()
  const { toast } = useToast()

  const fetchH2H = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    else setRefreshing(true)

    setError(null)

    try {
      // H2H verilerini çek
      const data = await getHeadToHead(firstTeamId, secondTeamId)

      if (hasMatches(data) && data.matches.length > 0) {
        setMatches(data.matches)
        calculateAdvancedStats(data.matches)
      } else {
        setError(t('noH2HData'))
      }
    } catch (err) {
      console.error(t('h2hLoadError'), err)
      setError(t('h2hLoadError'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleAnalyzeClick = async () => {
    if (hasCredits(CREDIT_COSTS.ANALYSIS)) {
      try {
        const success = await useCredits(CREDIT_COSTS.ANALYSIS);
        if (success) {
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
          }
          
          setShowData(true);
          
          // Show toast notification
          toast({
            title: "1 Kredi Kullanıldı",
            description: <div className="flex items-center"><Coins className="w-4 h-4 mr-1 text-yellow-400" /> H2H analizi için 1 kredi kullanıldı</div>,
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
    // This function is no longer needed for H2H analysis
    setShowData(true);
  };

  const calculateAdvancedStats = (matches: Match[]) => {
    let team1Wins = 0
    let team2Wins = 0
    let draws = 0
    let team1Goals = 0
    let team2Goals = 0
    let bttsCount = 0
    let over2_5Count = 0
    const team1Form: string[] = []
    const team2Form: string[] = []

    // Sort matches by date (most recent first)
    const sortedMatches = [...matches].sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())

    sortedMatches.forEach((match, index) => {
      const isTeam1Home = match.homeTeam.id.toString() === firstTeamId
      const team1Score = isTeam1Home ? match.score.fullTime.home : match.score.fullTime.away
      const team2Score = isTeam1Home ? match.score.fullTime.away : match.score.fullTime.home

      team1Goals += team1Score
      team2Goals += team2Score

      // Calculate match result
      let team1Result = ""
      let team2Result = ""

      if (team1Score > team2Score) {
        team1Wins++
        team1Result = "W"
        team2Result = "L"
      } else if (team2Score > team1Score) {
        team2Wins++
        team1Result = "L"
        team2Result = "W"
      } else {
        draws++
        team1Result = "D"
        team2Result = "D"
      }

      // Store recent form (last 10 matches)
      if (index < 10) {
        team1Form.push(team1Result)
        team2Form.push(team2Result)
      }

      // BTTS calculation
      if (team1Score > 0 && team2Score > 0) {
        bttsCount++
      }

      // Over 2.5 goals calculation
      if (team1Score + team2Score > 2.5) {
        over2_5Count++
      }
    })

    const totalMatches = matches.length
    const avgGoalsPerMatch = (team1Goals + team2Goals) / totalMatches

    setStats({
      team1Wins,
      team2Wins,
      draws,
      team1Goals,
      team2Goals,
      totalMatches,
      avgGoalsPerMatch,
      team1WinPercentage: (team1Wins / totalMatches) * 100,
      team2WinPercentage: (team2Wins / totalMatches) * 100,
      drawPercentage: (draws / totalMatches) * 100,
      bttsPercentage: (bttsCount / totalMatches) * 100,
      over2_5Percentage: (over2_5Count / totalMatches) * 100,
      recentForm: {
        team1: team1Form,
        team2: team2Form,
      },
    })
  }

  useEffect(() => {
    if (hasMatches(h2hData)) {
      setMatches(h2hData.matches)
      calculateAdvancedStats(h2hData.matches)
      setLoading(false)
    } else if (firstTeamId && secondTeamId) {
      fetchH2H()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstTeamId, secondTeamId, h2hData])

  const getFormBadge = (result: string) => {
    const baseClass = "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
    switch (result) {
      case "W":
        return <div className={`${baseClass} bg-green-500`}>G</div>
      case "D":
        return <div className={`${baseClass} bg-yellow-500`}>B</div>
      case "L":
        return <div className={`${baseClass} bg-red-500`}>M</div>
      default:
        return <div className={`${baseClass} bg-gray-500`}>?</div>
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-green-500" />
        <p className="text-xs text-slate-400 mt-2">{t('loadingH2H')}</p>
      </div>
    )
  }

  if (error && (!matches.length || !stats)) {
    return (
      <div className="text-center p-4 bg-slate-800/50 border border-slate-700 rounded">
        <p className="text-sm text-red-400 mb-2">{error}</p>
        <Button variant="outline" size="sm" onClick={() => fetchH2H()} className="border-red-700/50 text-red-400">
          <RefreshCw className="w-4 h-4 mr-2" />
          {t('retry')}
        </Button>
      </div>
    )
  }

  if (!stats || matches.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-green-400">{t('h2hAnalysis')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground text-xs">{t('noH2HData')}</p>
        </CardContent>
      </Card>
    )
  }

  if (!showData) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-green-400 flex items-center">
            <BarChart3 className="w-4 h-4 mr-2" />
            {t('h2hAnalysis')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-slate-300">{firstTeamName} vs {secondTeamName}</p>
            <p className="text-xs text-slate-400">
              H2H maç analizi ve istatistikler
            </p>
          </div>
          
          <Button 
            onClick={handleAnalyzeClick}
            className="bg-green-800 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            {t('analyze')}
            <span className="flex items-center ml-1 bg-green-700/50 px-1.5 py-0.5 rounded text-xs">
              <Coins className="w-3 h-3 mr-0.5 text-yellow-400" />
              <span className="text-yellow-400">{CREDIT_COSTS.ANALYSIS}</span>
            </span>
          </Button>
        </CardContent>
        
        <CreditRequiredModal
          isOpen={showCreditModal}
          onClose={() => setShowCreditModal(false)}
          requiredCredits={CREDIT_COSTS.ANALYSIS}
          actionDescription="H2H Analizi görüntülemek"
          onContinue={handleContinueWithCredits}
        />
      </Card>
    );
  }

  const recentMatches = matches.slice(0, 3).map((match) => {
    const isTeam1Home = match.homeTeam.id.toString() === firstTeamId
    const team1Score = isTeam1Home ? match.score.fullTime.home : match.score.fullTime.away
    const team2Score = isTeam1Home ? match.score.fullTime.away : match.score.fullTime.home
    const date = new Date(match.utcDate).toLocaleDateString("tr-TR")

    return {
      date,
      result: `${firstTeamName} ${team1Score} - ${team2Score} ${secondTeamName}`,
      team1Score,
      team2Score,
    }
  })

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-bold text-green-400 flex items-center">
          <BarChart3 className="w-4 h-4 mr-2" />
          {t('h2hAnalysis')}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchH2H(false)}
          disabled={refreshing}
          className="h-6 text-xs"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          {t('refreshButton')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics Overview */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-700/30 p-2 rounded text-center">
            <h3 className="text-xs font-semibold mb-1 text-green-400">{firstTeamName}</h3>
            <p className="text-lg font-bold text-green-500">{stats.team1Wins}</p>
            <p className="text-xs text-muted-foreground">{stats.team1WinPercentage.toFixed(0)}%</p>
            <div className="mt-1 flex justify-center space-x-1">
              {stats.recentForm.team1.slice(0, 3).map((result, index) => (
                <div key={index}>{getFormBadge(result)}</div>
              ))}
            </div>
          </div>

          <div className="bg-slate-700/30 p-2 rounded text-center">
            <h3 className="text-xs font-semibold mb-1 text-yellow-400">{t('draw')}</h3>
            <p className="text-lg font-bold text-amber-500">{stats.draws}</p>
            <p className="text-xs text-muted-foreground">{stats.drawPercentage.toFixed(0)}%</p>
            <div className="mt-1">
              <Badge variant="outline" className="text-xs bg-yellow-900/30 border-yellow-700/50">
                {stats.avgGoalsPerMatch.toFixed(1)} {t('goals')}
              </Badge>
            </div>
          </div>

          <div className="bg-slate-700/30 p-2 rounded text-center">
            <h3 className="text-xs font-semibold mb-1 text-blue-400">{secondTeamName}</h3>
            <p className="text-lg font-bold text-blue-500">{stats.team2Wins}</p>
            <p className="text-xs text-muted-foreground">{stats.team2WinPercentage.toFixed(0)}%</p>
            <div className="mt-1 flex justify-center space-x-1">
              {stats.recentForm.team2.slice(0, 3).map((result, index) => (
                <div key={index}>{getFormBadge(result)}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Statistics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-700/30 p-2 rounded">
            <h3 className="text-xs font-semibold mb-2 text-green-400">{t('statistics')}</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>BTTS:</span>
                <span className="font-bold text-green-400">{stats.bttsPercentage.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>{t('over25')}:</span>
                <span className="font-bold text-blue-400">{stats.over2_5Percentage.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>{t('totalMatches')}:</span>
                <span className="font-bold">{stats.totalMatches}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/30 p-2 rounded">
            <h3 className="text-xs font-semibold mb-2 text-green-400">{t('goalAnalysis')}</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{firstTeamName}:</span>
                <span className="font-bold text-green-400">{stats.team1Goals}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>{secondTeamName}:</span>
                <span className="font-bold text-blue-400">{stats.team2Goals}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>{t('average')}:</span>
                <span className="font-bold text-yellow-400">{stats.avgGoalsPerMatch.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Matches */}
        <div className="bg-slate-700/30 p-2 rounded">
          <h3 className="text-xs font-semibold mb-2 text-green-400">{t('recentMatches')}</h3>
          <div className="space-y-1">
            {recentMatches.map((match, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-slate-400">{match.date}</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{match.result}</span>
                  <div>
                    {match.team1Score > match.team2Score && (
                      <Badge className="bg-green-600 text-white text-xs">{t('win').charAt(0)}</Badge>
                    )}
                    {match.team1Score === match.team2Score && (
                      <Badge className="bg-yellow-600 text-white text-xs">{t('draw').charAt(0)}</Badge>
                    )}
                    {match.team1Score < match.team2Score && <Badge className="bg-red-600 text-white text-xs">{t('loss').charAt(0)}</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
