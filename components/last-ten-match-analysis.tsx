"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "./language-provider"
import { Loader2, BarChart2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { getTeamLastMatches } from "@/lib/football-api"
import { Button } from "@/components/ui/button"

interface MatchResult {
  date: string
  homeTeam: string
  awayTeam: string
  score: string
  result: "W" | "D" | "L"
}

interface LastTenMatchAnalysisProps {
  teamId: string
  teamName: string
  matches?: any[]
}

interface AnalysisData {
  wins: number
  draws: number
  losses: number
  goalsScored: number
  goalsConceded: number
  cleanSheets: number
  failedToScore: number
  form: number // 0-100 scale
  trend: "up" | "down" | "stable"
  averageGoalsScored: number
  averageGoalsConceded: number
}

export function LastTenMatchAnalysis({ teamId, teamName, matches: providedMatches }: LastTenMatchAnalysisProps) {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    const fetchAndProcessMatches = async () => {
      try {
        setLoading(true)
        setError(null)

        if (providedMatches && providedMatches.length > 0) {
          processMatchData(providedMatches)
        } else {
          // Fetch from API if not provided
          try {
            const data = await getTeamLastMatches(teamId, 10)
            if (Array.isArray(data)) {
              processMatchData(data)
            } else {
              setError(t('sonMacYok'))
              setLoading(false)
            }
          } catch (err) {
            console.error("Error fetching last matches:", err)
            setError(t('sonMaclarHata'))
            setLoading(false)
          }
        }
      } catch (err) {
        console.error("Error in fetch and process:", err)
        setError(t('error'))
        setLoading(false)
      }
    }

    const processMatchData = (matchData: any[]) => {
      try {
        if (Array.isArray(matchData) && matchData.length > 0) {
          // Process API data to our format
          const processedMatches = matchData.map((match) => {
            const isHome = match.match_hometeam_id === teamId
            const homeScore = Number.parseInt(match.match_hometeam_score) || 0
            const awayScore = Number.parseInt(match.match_awayteam_score) || 0

            let result: "W" | "D" | "L" = "D"
            if (homeScore === awayScore) {
              result = "D"
            } else if (isHome) {
              result = homeScore > awayScore ? "W" : "L"
            } else {
              result = awayScore > homeScore ? "W" : "L"
            }

            return {
              date: match.match_date,
              homeTeam: match.match_hometeam_name,
              awayTeam: match.match_awayteam_name,
              score: `${match.match_hometeam_score} - ${match.match_awayteam_score}`,
              result,
            }
          })

          setMatches(processedMatches)
          setAnalysis(analyzeMatches(processedMatches))
        } else {
          setError(t('sonMacYok'))
        }
      } catch (err) {
        console.error("Error processing match data:", err)
        setError(t('error'))
      } finally {
        setLoading(false)
      }
    }

    fetchAndProcessMatches()
  }, [teamId, providedMatches, t])

  const analyzeMatches = (matches: MatchResult[]) => {
    if (matches.length === 0) return null

    let wins = 0
    let draws = 0
    let losses = 0
    let goalsScored = 0
    let goalsConceded = 0
    let cleanSheets = 0
    let failedToScore = 0

    matches.forEach((match) => {
      const isHome = match.homeTeam === teamName
      const [homeGoals, awayGoals] = match.score.split(" - ").map(Number)

      const teamGoals = isHome ? homeGoals : awayGoals
      const opponentGoals = isHome ? awayGoals : homeGoals

      goalsScored += teamGoals
      goalsConceded += opponentGoals

      if (teamGoals === 0) failedToScore++
      if (opponentGoals === 0) cleanSheets++

      if (match.result === "W") wins++
      else if (match.result === "D") draws++
      else losses++
    })

    // Calculate form (0-100 scale)
    // Win = 3 points, Draw = 1 point, Loss = 0 points
    // Max possible points = 30 (10 wins)
    const points = wins * 3 + draws * 1
    const form = (points / 30) * 100

    // Determine trend based on most recent matches
    const recentResults = matches.slice(0, 3).map((m) => m.result)
    let trend: "up" | "down" | "stable" = "stable"

    const recentWins = recentResults.filter((r) => r === "W").length
    const recentLosses = recentResults.filter((r) => r === "L").length

    if (recentWins >= 2) trend = "up"
    else if (recentLosses >= 2) trend = "down"

    return {
      wins,
      draws,
      losses,
      goalsScored,
      goalsConceded,
      cleanSheets,
      failedToScore,
      form,
      trend,
      averageGoalsScored: goalsScored / matches.length,
      averageGoalsConceded: goalsConceded / matches.length,
    }
  }

  const handleRetry = () => {
    setMatches([])
    setAnalysis(null)
    setLoading(true)
    setError(null)

    // Trigger a new fetch
    getTeamLastMatches(teamId, 10)
      .then((matchData) => {
        if (Array.isArray(matchData) && matchData.length > 0) {
          // Process API data to our format
          const processedMatches = matchData.map((match) => {
            const isHome = match.match_hometeam_id === teamId
            const homeScore = Number.parseInt(match.match_hometeam_score) || 0
            const awayScore = Number.parseInt(match.match_awayteam_score) || 0

            let result: "W" | "D" | "L" = "D"
            if (homeScore === awayScore) {
              result = "D"
            } else if (isHome) {
              result = homeScore > awayScore ? "W" : "L"
            } else {
              result = awayScore > homeScore ? "W" : "L"
            }

            return {
              date: match.match_date,
              homeTeam: match.match_hometeam_name,
              awayTeam: match.match_awayteam_name,
              score: `${match.match_hometeam_score} - ${match.match_awayteam_score}`,
              result,
            }
          })

          setMatches(processedMatches)
          setAnalysis(analyzeMatches(processedMatches))
        } else {
          setError(t('sonMacYok'))
        }
      })
      .catch((err) => {
        console.error("Error fetching last matches:", err)
        setError(t('sonMaclarHata'))
      })
      .finally(() => {
        setLoading(false)
      })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-green-500 mb-2" />
        <p className="text-xs text-green-400">{t('loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-4 bg-red-900/20 rounded-md border border-red-700/30">
        <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-400 mb-2">{error}</p>
        <Button variant="outline" size="sm" onClick={handleRetry} className="border-red-700/50 text-red-400">
          {t('retry')}
        </Button>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center p-4 bg-yellow-900/20 rounded-md border border-yellow-700/30">
        <AlertCircle className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
        <p className="text-sm text-yellow-400">{t('noDataFound')}</p>
        <Button variant="outline" size="sm" onClick={handleRetry} className="mt-2 border-yellow-700/50 text-yellow-400">
          {t('retry')}
        </Button>
      </div>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-green-700/30 overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=400')] opacity-5"></div>
      <CardHeader className="p-3 relative z-10">
        <CardTitle className="text-base text-white flex items-center">
          <BarChart2 className="w-4 h-4 mr-2 text-green-400" />
          <span>{teamName} - {t('lastTenMatches')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 pt-0 px-3">
        {/* Form - 0-100 arasında performans */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-400">{t('form')}</span>
            <div className="flex items-center">
              {analysis.trend === "up" && <TrendingUp className="w-3 h-3 text-green-500 mr-1" />}
              {analysis.trend === "down" && <TrendingDown className="w-3 h-3 text-red-500 mr-1" />}
              <span
                className={`text-xs font-bold ${
                  analysis.form > 70
                    ? "text-green-500"
                    : analysis.form > 40
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
              >
                {analysis.form.toFixed(0)}%
              </span>
            </div>
          </div>
          <Progress
            value={analysis.form}
            className="h-1 bg-slate-700"
            indicatorColor={
              analysis.form > 70
                ? "bg-green-500"
                : analysis.form > 40
                ? "bg-yellow-500"
                : "bg-red-500"
            }
          />
        </div>

        {/* Son 10 maç analizi - Sonuçlar */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-800/80 rounded p-2">
            <div className="text-xs text-slate-400 mb-1">{t('results')}</div>
            <div className="grid grid-cols-3 gap-1">
              <div className="bg-green-900/30 rounded p-1 text-center">
                <div className="text-lg font-bold text-green-500">{analysis.wins}</div>
                <div className="text-[10px] text-green-500/80">{t('wins')}</div>
              </div>
              <div className="bg-yellow-900/30 rounded p-1 text-center">
                <div className="text-lg font-bold text-yellow-500">{analysis.draws}</div>
                <div className="text-[10px] text-yellow-500/80">{t('draws')}</div>
              </div>
              <div className="bg-red-900/30 rounded p-1 text-center">
                <div className="text-lg font-bold text-red-500">{analysis.losses}</div>
                <div className="text-[10px] text-red-500/80">{t('losses')}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 rounded p-2">
            <div className="text-xs text-slate-400 mb-1">{t('goalsPerMatch')}</div>
            <div className="grid grid-cols-2 gap-1">
              <div className="bg-green-900/30 rounded p-1 text-center">
                <div className="text-lg font-bold text-green-500">{analysis.goalsScored}</div>
                <div className="text-[10px] text-green-500/80">{t('scored')}</div>
              </div>
              <div className="bg-red-900/30 rounded p-1 text-center">
                <div className="text-lg font-bold text-red-500">{analysis.goalsConceded}</div>
                <div className="text-[10px] text-red-500/80">{t('conceded')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ekstra istatistikler - Ortalamalar ve özel durumlar */}
        <div className="bg-slate-800/80 rounded p-2 mb-4">
          <div className="text-xs text-slate-400 mb-1">{t('extraStats')}</div>
          <div className="grid grid-cols-4 gap-1">
            <div className="bg-slate-700/60 rounded p-1 text-center">
              <div className="text-sm font-bold text-white">{analysis.averageGoalsScored.toFixed(1)}</div>
              <div className="text-[10px] text-slate-400">{t('scored')}</div>
            </div>
            <div className="bg-slate-700/60 rounded p-1 text-center">
              <div className="text-sm font-bold text-white">{analysis.averageGoalsConceded.toFixed(1)}</div>
              <div className="text-[10px] text-slate-400">{t('conceded')}</div>
            </div>
            <div className="bg-slate-700/60 rounded p-1 text-center">
              <div className="text-sm font-bold text-white">{analysis.cleanSheets}</div>
              <div className="text-[10px] text-slate-400">{t('cleanSheets')}</div>
            </div>
            <div className="bg-slate-700/60 rounded p-1 text-center">
              <div className="text-sm font-bold text-white">{analysis.failedToScore}</div>
              <div className="text-[10px] text-slate-400">{t('failedToScore')}</div>
            </div>
          </div>
        </div>

        {/* Son maçlar - Takım performansı hakkında yorum */}
        <div className="bg-slate-800/80 rounded p-2">
          <div className="text-xs text-slate-400 mb-1">{t('comments')}</div>
          <div className="p-1">
            <p className="text-xs text-white/90 leading-relaxed">
              {analysis.trend === "up"
                ? t('trendUp', { teamName } as any)
                : analysis.trend === "down"
                  ? t('trendDown', { teamName, avgConceded: analysis.averageGoalsConceded.toFixed(1) } as any)
                  : t('trendStable', { teamName, wins: analysis.wins, draws: analysis.draws, losses: analysis.losses } as any)}
              {analysis.cleanSheets > 0 && ` ${t('cleanSheetsComment', { count: analysis.cleanSheets } as any)}`}
              {analysis.failedToScore > 0 && ` ${t('failedToScoreComment', { count: analysis.failedToScore } as any)}`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 