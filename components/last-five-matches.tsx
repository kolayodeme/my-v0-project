"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { useTranslation } from "./language-provider"

interface LastFiveMatchesProps {
  teamId: string
  teamName: string
}

interface MatchResult {
  date: string
  homeTeam: string
  awayTeam: string
  score: string
  result: "W" | "D" | "L"
}

export function LastFiveMatches({ teamId, teamName }: LastFiveMatchesProps) {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  // Mock last five matches data
  const mockLastFiveMatches = (): MatchResult[] => {
    const opponents = [
      "Arsenal",
      "Chelsea",
      "Liverpool",
      "Manchester City",
      "Manchester United",
      "Tottenham",
      "Barcelona",
      "Real Madrid",
    ]

    return Array.from({ length: 5 }, (_, i) => {
      const isHome = Math.random() > 0.5
      const opponent = opponents[Math.floor(Math.random() * opponents.length)]
      const homeTeam = isHome ? teamName : opponent
      const awayTeam = isHome ? opponent : teamName

      const results = ["W", "D", "L"] as const
      const result = results[Math.floor(Math.random() * results.length)]

      let homeScore: number
      let awayScore: number

      if (result === "W") {
        if (isHome) {
          homeScore = Math.floor(Math.random() * 3) + 1
          awayScore = Math.floor(Math.random() * homeScore)
        } else {
          awayScore = Math.floor(Math.random() * 3) + 1
          homeScore = Math.floor(Math.random() * awayScore)
        }
      } else if (result === "L") {
        if (isHome) {
          awayScore = Math.floor(Math.random() * 3) + 1
          homeScore = Math.floor(Math.random() * awayScore)
        } else {
          homeScore = Math.floor(Math.random() * 3) + 1
          awayScore = Math.floor(Math.random() * homeScore)
        }
      } else {
        homeScore = Math.floor(Math.random() * 3)
        awayScore = homeScore
      }

      return {
        date: `2023-${10 - i}-${15 + i}`,
        homeTeam,
        awayTeam,
        score: `${homeScore} - ${awayScore}`,
        result,
      }
    })
  }

  useEffect(() => {
    const fetchLastFiveMatches = async () => {
      try {
        setLoading(true)
        setError(null)

        // In a real implementation, we would call the API
        // const data = await getLastFiveMatches(teamId)

        // For now, use mock data
        // Simulate API delay
        setTimeout(() => {
          const data = mockLastFiveMatches()
          setMatches(data)
          setLoading(false)
        }, 1000)
      } catch (err) {
        setError(t("error"))
        setLoading(false)
      }
    }

    fetchLastFiveMatches()
  }, [teamId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
        <p className="text-xs text-slate-400">Son maçlar yükleniyor...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-900 border-red-800">
        <AlertCircle className="w-3 h-3" />
        <AlertDescription className="text-xs">{error}</AlertDescription>
      </Alert>
    )
  }

  if (matches.length === 0) {
    return <div className="text-center text-xs text-slate-400">{t("noData")}</div>
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-slate-300">{teamName}</h4>

      <div className="flex justify-between mb-1">
        {matches.map((match, index) => (
          <div
            key={index}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              match.result === "W"
                ? "bg-green-600 text-white"
                : match.result === "D"
                  ? "bg-yellow-600 text-white"
                  : "bg-red-600 text-white"
            }`}
          >
            {match.result}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {matches.map((match, index) => (
          <div key={index} className="flex items-center justify-between text-[10px] p-1 bg-slate-700/30 rounded">
            <span className="w-1/3 truncate text-slate-300">{match.homeTeam}</span>
            <span className="font-medium text-white">{match.score}</span>
            <span className="w-1/3 truncate text-right text-slate-300">{match.awayTeam}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
