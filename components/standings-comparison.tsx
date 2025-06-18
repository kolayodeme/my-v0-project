"use client"

import { useEffect, useState } from "react"
import { getStandings } from "@/lib/football-api"
import { Skeleton } from "@/components/ui/skeleton"
import { Trophy } from "lucide-react"

interface StandingsComparisonProps {
  homeTeamId: string
  awayTeamId: string
  homeTeam: string
  awayTeam: string
  leagueId?: string
}

interface TeamStanding {
  overall_league_position: string
  overall_league_payed: string
  overall_league_W: string
  overall_league_D: string
  overall_league_L: string
  overall_league_GF: string
  overall_league_GA: string
  overall_league_PTS: string
  team_name: string
}

export function StandingsComparison({
  homeTeamId,
  awayTeamId,
  homeTeam,
  awayTeam,
  leagueId,
}: StandingsComparisonProps) {
  const [loading, setLoading] = useState(true)
  const [homeStanding, setHomeStanding] = useState<TeamStanding | null>(null)
  const [awayStanding, setAwayStanding] = useState<TeamStanding | null>(null)

  useEffect(() => {
    const loadStandings = async () => {
      if (!leagueId) return

      try {
        setLoading(true)
        const standings = await getStandings(leagueId)

        if (Array.isArray(standings)) {
          const homeTeamStanding = standings.find(
            (s) => s.team_id === homeTeamId || s.team_name?.toLowerCase() === homeTeam.toLowerCase()
          )
          const awayTeamStanding = standings.find(
            (s) => s.team_id === awayTeamId || s.team_name?.toLowerCase() === awayTeam.toLowerCase()
          )

          setHomeStanding(homeTeamStanding || null)
          setAwayStanding(awayTeamStanding || null)
        }
      } catch (error) {
        console.error("Error loading standings:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStandings()
  }, [leagueId, homeTeamId, awayTeamId, homeTeam, awayTeam])

  if (loading) {
    return <StandingsSkeleton />
  }

  if (!homeStanding || !awayStanding) {
    return (
      <div className="text-center text-xs text-slate-400">
        <Trophy className="w-6 h-6 mx-auto mb-1.5 text-slate-500" />
        Puan durumu bilgisi bulunamadı
      </div>
    )
  }

  return (
    <div className="bg-slate-900/50 rounded-lg overflow-hidden text-[11px]">
      {/* Teams Header */}
      <div className="grid grid-cols-3 border-b border-slate-700/50">
        <div className="p-2 text-center">
          <span className="font-medium text-white">{homeTeam}</span>
          <div className="text-[10px] text-slate-400">
            {homeStanding.overall_league_position}. Sıra
          </div>
        </div>
        <div className="p-2 text-center border-x border-slate-700/50">
          <span className="font-medium text-slate-400">Karşılaştırma</span>
        </div>
        <div className="p-2 text-center">
          <span className="font-medium text-white">{awayTeam}</span>
          <div className="text-[10px] text-slate-400">
            {awayStanding.overall_league_position}. Sıra
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="divide-y divide-slate-700/50">
        {/* Points */}
        <div className="grid grid-cols-3 items-center">
          <div className="p-2 text-center">
            <span className="text-lg font-bold text-white">{homeStanding.overall_league_PTS}</span>
          </div>
          <div className="p-2 text-center border-x border-slate-700/50">
            <span className="text-[10px] text-slate-400">Puan</span>
          </div>
          <div className="p-2 text-center">
            <span className="text-lg font-bold text-white">{awayStanding.overall_league_PTS}</span>
          </div>
        </div>

        {/* Matches */}
        <div className="grid grid-cols-3 items-center">
          <div className="p-2 text-center">
            <span className="font-bold text-white">{homeStanding.overall_league_payed}</span>
          </div>
          <div className="p-2 text-center border-x border-slate-700/50">
            <span className="text-[10px] text-slate-400">Maç</span>
          </div>
          <div className="p-2 text-center">
            <span className="font-bold text-white">{awayStanding.overall_league_payed}</span>
          </div>
        </div>

        {/* Goals */}
        <div className="grid grid-cols-3 items-center">
          <div className="p-2 text-center">
            <div className="font-bold">
              <span className="text-green-400">{homeStanding.overall_league_GF}</span>
              <span className="text-slate-400 mx-0.5">/</span>
              <span className="text-red-400">{homeStanding.overall_league_GA}</span>
            </div>
          </div>
          <div className="p-2 text-center border-x border-slate-700/50">
            <span className="text-[10px] text-slate-400">Gol A/Y</span>
          </div>
          <div className="p-2 text-center">
            <div className="font-bold">
              <span className="text-green-400">{awayStanding.overall_league_GF}</span>
              <span className="text-slate-400 mx-0.5">/</span>
              <span className="text-red-400">{awayStanding.overall_league_GA}</span>
            </div>
          </div>
        </div>

        {/* Win/Draw/Loss */}
        <div className="grid grid-cols-3 items-center">
          <div className="p-2 text-center">
            <div className="font-bold">
              <span className="text-green-400">{homeStanding.overall_league_W}</span>
              <span className="text-slate-400 mx-0.5">/</span>
              <span className="text-yellow-400">{homeStanding.overall_league_D}</span>
              <span className="text-slate-400 mx-0.5">/</span>
              <span className="text-red-400">{homeStanding.overall_league_L}</span>
            </div>
          </div>
          <div className="p-2 text-center border-x border-slate-700/50">
            <span className="text-[10px] text-slate-400">G/B/M</span>
          </div>
          <div className="p-2 text-center">
            <div className="font-bold">
              <span className="text-green-400">{awayStanding.overall_league_W}</span>
              <span className="text-slate-400 mx-0.5">/</span>
              <span className="text-yellow-400">{awayStanding.overall_league_D}</span>
              <span className="text-slate-400 mx-0.5">/</span>
              <span className="text-red-400">{awayStanding.overall_league_L}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StandingsSkeleton() {
  return (
    <div className="bg-slate-900/50 rounded-lg overflow-hidden">
      <div className="grid grid-cols-3 border-b border-slate-700/50">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-2">
            <Skeleton className="h-4 w-full bg-slate-700" />
            <Skeleton className="h-3 w-2/3 mx-auto mt-1 bg-slate-700" />
          </div>
        ))}
      </div>
      <div className="divide-y divide-slate-700/50">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="grid grid-cols-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="p-2">
                <Skeleton className="h-6 w-full bg-slate-700" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
} 