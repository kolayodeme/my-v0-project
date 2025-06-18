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

interface LastFiveMatchAnalysisProps {
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

export function LastFiveMatchAnalysis({ teamId, teamName, matches: providedMatches }: LastFiveMatchAnalysisProps) {
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

        let matchData: any[] = []

        if (providedMatches && providedMatches.length > 0) {
          matchData = providedMatches
        } else {
          // Fetch from API if not provided
          matchData = await getTeamLastMatches(teamId, 5) as any[]
        }

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
        console.error("Error fetching last matches:", err)
        setError(t('sonMaclarHata'))
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
    // Max possible points = 15 (5 wins)
    const points = wins * 3 + draws * 1
    const form = (points / 15) * 100

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
    getTeamLastMatches(teamId, 5)
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
        <p className="text-xs text-green-400">{t('loadingAnalysis')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-4 bg-red-900/20 rounded-md border border-red-700/30">
        <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-400 mb-2">{error}</p>
        <Button variant="outline" size="sm" onClick={handleRetry} className="border-red-700/50 text-red-400">
          {t('retryButton')}
        </Button>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="text-center p-4 bg-yellow-900/20 rounded-md border border-yellow-700/30">
        <AlertCircle className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
        <p className="text-sm text-yellow-400">{t('noAnalysisData')}</p>
        <Button variant="outline" size="sm" onClick={handleRetry} className="mt-2 border-yellow-700/50 text-yellow-400">
          {t('retryButton')}
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
          <span>{teamName} - {t('lastFiveMatchAnalysis')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-xs text-slate-400">{t('form')}:</div>
            <div className="flex items-center">
              {analysis.trend === "up" && <TrendingUp className="w-3 h-3 text-green-500 mr-1" />}
              {analysis.trend === "down" && <TrendingDown className="w-3 h-3 text-red-500 mr-1" />}
              <span
                className={`text-sm font-bold ${
                  analysis.trend === "up"
                    ? "text-green-400"
                    : analysis.trend === "down"
                      ? "text-red-400"
                      : "text-yellow-400"
                }`}
              >
                {analysis.form.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex space-x-2 text-xs">
            <div className="px-2 py-1 bg-green-900/30 rounded-md text-green-400 font-medium">{analysis.wins}{t('winsShort')}</div>
            <div className="px-2 py-1 bg-yellow-900/30 rounded-md text-yellow-400 font-medium">{analysis.draws}{t('drawsShort')}</div>
            <div className="px-2 py-1 bg-red-900/30 rounded-md text-red-400 font-medium">{analysis.losses}{t('lossesShort')}</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">{t('lastFiveMatchGoalsPerMatch')}</span>
            <span className="text-green-400">{analysis.averageGoalsScored.toFixed(1)} / {t('matchesPlayed').toLowerCase()}</span>
          </div>
          <Progress
            value={analysis.averageGoalsScored * 20}
            className="h-1.5 bg-slate-700 bg-green-500 glow-green"
          />

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">{t('lastFiveMatchConcededPerMatch')}</span>
            <span className="text-red-400">{analysis.averageGoalsConceded.toFixed(1)} / {t('matchesPlayed').toLowerCase()}</span>
          </div>
          <Progress
            value={analysis.averageGoalsConceded * 20}
            className="h-1.5 bg-slate-700 bg-red-500 glow-red"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 bg-green-900/20 rounded-md">
            <div className="text-xs text-slate-400 mb-1">{t('lastFiveMatchTotalGoals')}</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-green-400">{analysis.goalsScored}</span>
              <span className="text-xs text-slate-400">{t('atilan')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-red-400">{analysis.goalsConceded}</span>
              <span className="text-xs text-slate-400">{t('yenilen')}</span>
            </div>
          </div>

          <div className="p-2 bg-green-900/20 rounded-md">
            <div className="text-xs text-slate-400 mb-1">{t('specialStats')}</div>
            <div className="flex items-center justify-between">
              <div className="bg-slate-700/60 rounded p-1 text-center">
                <div className="text-sm font-bold text-white">{analysis.cleanSheets}</div>
                <span className="text-xs text-slate-400">{t('cleanSheets')}</span>
              </div>
              <div className="bg-slate-700/60 rounded p-1 text-center">
                <div className="text-sm font-bold text-white">{analysis.failedToScore}</div>
                <span className="text-xs text-slate-400">{t('failedToScore')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-400 mb-1">{t('lastMatches')}</div>
          {matches.map((match, index) => (
            <div key={index} className="flex items-center justify-between text-[10px] p-1 bg-slate-800/50 rounded">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center mr-1 ${
                  match.result === "W"
                    ? "bg-green-900/50 text-green-400"
                    : match.result === "D"
                      ? "bg-yellow-900/50 text-yellow-400"
                      : "bg-red-900/50 text-red-400"
                }`}
              >
                {match.result}
              </div>
              <span className="w-1/3 truncate text-slate-300">{match.homeTeam}</span>
              <span className="font-medium text-white">{match.score}</span>
              <span className="w-1/3 truncate text-right text-slate-300">{match.awayTeam}</span>
            </div>
          ))}
        </div>

        <div className="p-2 bg-green-900/20 rounded-md">
          <div className="text-xs text-slate-400 mb-1">{t('analysisComment')}</div>
          <p className="text-xs text-white">
            {analysis.trend === "up"
              ? t('risingFormText', { teamName, avgScored: analysis.averageGoalsScored.toFixed(1) } as any)
              : analysis.trend === "down"
                ? t('decliningFormText', { teamName, avgConceded: analysis.averageGoalsConceded.toFixed(1) } as any)
                : t('stableFormText', { teamName, wins: analysis.wins, draws: analysis.draws, losses: analysis.losses } as any)}
            {analysis.cleanSheets > 0 && ` ${t('lastFiveCleanSheetsComment', { count: analysis.cleanSheets } as any)}`}
            {analysis.failedToScore > 0 && ` ${t('lastFiveFailedToScoreComment', { count: analysis.failedToScore } as any)}`}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
