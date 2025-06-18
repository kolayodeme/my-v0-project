"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "./language-provider"
import { Loader2, Trophy } from "lucide-react"

interface Scorer {
  player_name: string
  team_name: string
  goals: number
  assists?: number
  matches_played?: number
}

interface TopScorersProps {
  leagueId?: string
  teamId?: string
}

export function TopScorers({ leagueId, teamId }: TopScorersProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [scorers, setScorers] = useState<Scorer[]>([])

  useEffect(() => {
    // In a real app, we would fetch top scorers from the API
    // For now, generate mock data
    const mockScorers: Scorer[] = [
      { player_name: "Erling Haaland", team_name: "Manchester City", goals: 22, assists: 5, matches_played: 20 },
      { player_name: "Harry Kane", team_name: "Bayern Munich", goals: 20, assists: 7, matches_played: 19 },
      { player_name: "Kylian Mbappé", team_name: "PSG", goals: 19, assists: 8, matches_played: 18 },
      { player_name: "Robert Lewandowski", team_name: "Barcelona", goals: 18, assists: 3, matches_played: 20 },
      { player_name: "Mohamed Salah", team_name: "Liverpool", goals: 17, assists: 9, matches_played: 21 },
      { player_name: "Cristiano Ronaldo", team_name: "Al Nassr", goals: 16, assists: 4, matches_played: 17 },
      { player_name: "Lautaro Martínez", team_name: "Inter", goals: 15, assists: 3, matches_played: 19 },
      { player_name: "Victor Osimhen", team_name: "Napoli", goals: 14, assists: 2, matches_played: 18 },
      { player_name: "Jude Bellingham", team_name: "Real Madrid", goals: 13, assists: 6, matches_played: 20 },
      { player_name: "Marcus Rashford", team_name: "Manchester United", goals: 12, assists: 5, matches_played: 21 },
    ]

    setLoading(true)
    // Simulate API delay
    setTimeout(() => {
      setScorers(mockScorers)
      setLoading(false)
    }, 1000)
  }, [leagueId, teamId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
        <p className="text-xs text-slate-400">{t('loadingTopScorers')}</p>
      </div>
    )
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=400')] opacity-5"></div>
      <CardHeader className="p-3 relative z-10">
        <CardTitle className="text-base text-white flex items-center">
          <Trophy className="w-4 h-4 mr-2 text-yellow-400" />
          <span>{t('topScorers')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 relative z-10">
        <div className="space-y-2">
          {scorers.map((scorer, index) => (
            <div
              key={index}
              className={`flex items-center text-xs p-2 rounded ${
                index === 0
                  ? "bg-gradient-to-r from-yellow-900/30 to-yellow-800/20 border border-yellow-700/50"
                  : index === 1
                    ? "bg-gradient-to-r from-slate-400/20 to-slate-500/10 border border-slate-500/30"
                    : index === 2
                      ? "bg-gradient-to-r from-amber-800/20 to-amber-700/10 border border-amber-700/30"
                      : "bg-slate-800/50"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] mr-2 ${
                  index === 0
                    ? "bg-yellow-900 text-yellow-400 glow-yellow"
                    : index === 1
                      ? "bg-slate-700 text-slate-300"
                      : index === 2
                        ? "bg-amber-900 text-amber-400"
                        : "bg-slate-700 text-slate-400"
                }`}
              >
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-white">{scorer.player_name}</div>
                <div className="text-[10px] text-slate-400">{scorer.team_name}</div>
              </div>
              <div className="flex flex-col items-end">
                <div className="font-bold text-sm text-yellow-400">{scorer.goals}</div>
                <div className="text-[10px] text-slate-400">
                  {scorer.assists !== undefined && `A: ${scorer.assists}`}
                  {scorer.matches_played !== undefined && ` | ${scorer.matches_played} ${t('matchesShort')}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
