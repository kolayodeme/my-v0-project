"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "./language-provider"
import { Loader2 } from "lucide-react"

interface Player {
  lineup_player: string
  lineup_number: string
  lineup_position: string
  player_key?: string
}

interface LineupData {
  home: {
    starting_lineups: Player[]
    substitutes: Player[]
    coach: { lineup_player: string }[]
    missing_players?: Player[]
  }
  away: {
    starting_lineups: Player[]
    substitutes: Player[]
    coach: { lineup_player: string }[]
    missing_players?: Player[]
  }
}

interface TeamLineupProps {
  homeTeam: string
  awayTeam: string
  lineup: LineupData | null
}

export function TeamLineup({ homeTeam, awayTeam, lineup }: TeamLineupProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [lineupData, setLineupData] = useState<LineupData | null>(null)

  useEffect(() => {
    if (lineup) {
      setLineupData(lineup)
      return
    }

    // If no lineup data is provided, try to fetch it
    const fetchLineup = async () => {
      setLoading(true)
      try {
        // In a real implementation, we would fetch lineup data here
        // For now, use mock data
        setLineupData(generateMockLineup())
      } catch (error) {
        console.error("Error fetching lineup:", error)
        setLineupData(generateMockLineup())
      } finally {
        setLoading(false)
      }
    }

    fetchLineup()
  }, [lineup])

  // Generate mock lineup data if none provided
  const generateMockLineup = (): LineupData => {
    return {
      home: {
        starting_lineups: Array(11)
          .fill(0)
          .map((_, i) => ({
            lineup_player: `${homeTeam} Player ${i + 1}`,
            lineup_number: `${i + 1}`,
            lineup_position: i === 0 ? "G" : i < 5 ? "D" : i < 9 ? "M" : "F",
          })),
        substitutes: Array(7)
          .fill(0)
          .map((_, i) => ({
            lineup_player: `${homeTeam} Sub ${i + 1}`,
            lineup_number: `${i + 12}`,
            lineup_position: ["G", "D", "M", "F", "M", "D", "F"][i],
          })),
        coach: [{ lineup_player: `${homeTeam} Coach` }],
      },
      away: {
        starting_lineups: Array(11)
          .fill(0)
          .map((_, i) => ({
            lineup_player: `${awayTeam} Player ${i + 1}`,
            lineup_number: `${i + 1}`,
            lineup_position: i === 0 ? "G" : i < 5 ? "D" : i < 9 ? "M" : "F",
          })),
        substitutes: Array(7)
          .fill(0)
          .map((_, i) => ({
            lineup_player: `${awayTeam} Sub ${i + 1}`,
            lineup_number: `${i + 12}`,
            lineup_position: ["G", "D", "M", "F", "M", "D", "F"][i],
          })),
        coach: [{ lineup_player: `${awayTeam} Coach` }],
      },
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
        <p className="text-xs text-slate-400">{t('loadingLineups')}</p>
      </div>
    )
  }

  if (!lineupData) {
    return (
      <div className="text-center p-4">
        <p className="text-sm text-slate-400">{t('noLineupData')}</p>
      </div>
    )
  }

  const positionOrder = { G: 1, D: 2, M: 3, F: 4 }

  const sortByPosition = (a: Player, b: Player) => {
    return (
      positionOrder[a.lineup_position as keyof typeof positionOrder] -
      positionOrder[b.lineup_position as keyof typeof positionOrder]
    )
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=400')] opacity-5"></div>
      <CardHeader className="p-3 relative z-10">
        <CardTitle className="text-base text-white">{t('lineups')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0 relative z-10">
        <Tabs defaultValue="home">
          <TabsList className="w-full bg-slate-700 rounded-none">
            <TabsTrigger
              value="home"
              className="flex-1 text-xs data-[state=active]:bg-cyan-900/50 data-[state=active]:text-cyan-400"
            >
              {homeTeam}
            </TabsTrigger>
            <TabsTrigger
              value="away"
              className="flex-1 text-xs data-[state=active]:bg-pink-900/50 data-[state=active]:text-pink-400"
            >
              {awayTeam}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="p-3 space-y-3">
            <div>
              <h4 className="text-xs font-medium text-cyan-400 mb-2 border-b border-slate-700 pb-1">{t('startingLineup')}</h4>
              <div className="grid grid-cols-1 gap-1">
                {lineupData.home.starting_lineups &&
                  [...lineupData.home.starting_lineups].sort(sortByPosition).map((player, index) => (
                    <div key={index} className="flex items-center text-xs p-1 bg-slate-800/50 rounded">
                      <div className="w-6 h-6 rounded-full bg-cyan-900 flex items-center justify-center text-[10px] text-cyan-400 mr-2">
                        {player.lineup_number}
                      </div>
                      <span className="text-white">{player.lineup_player}</span>
                      <span className="ml-auto text-[10px] text-cyan-400 font-bold">{player.lineup_position}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-cyan-400 mb-2 border-b border-slate-700 pb-1">{t('substitutes')}</h4>
              <div className="grid grid-cols-1 gap-1">
                {lineupData.home.substitutes &&
                  lineupData.home.substitutes.map((player, index) => (
                    <div key={index} className="flex items-center text-xs p-1 bg-slate-800/50 rounded">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 mr-2">
                        {player.lineup_number}
                      </div>
                      <span className="text-slate-300">{player.lineup_player}</span>
                      <span className="ml-auto text-[10px] text-slate-400 font-bold">{player.lineup_position}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-cyan-400 mb-2 border-b border-slate-700 pb-1">{t('coach')}</h4>
              <div className="text-xs p-1 bg-slate-800/50 rounded text-white">
                {(lineupData.home.coach && lineupData.home.coach[0]?.lineup_player) || t('unknown')}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="away" className="p-3 space-y-3">
            <div>
              <h4 className="text-xs font-medium text-pink-400 mb-2 border-b border-slate-700 pb-1">{t('startingLineup')}</h4>
              <div className="grid grid-cols-1 gap-1">
                {lineupData.away.starting_lineups &&
                  [...lineupData.away.starting_lineups].sort(sortByPosition).map((player, index) => (
                    <div key={index} className="flex items-center text-xs p-1 bg-slate-800/50 rounded">
                      <div className="w-6 h-6 rounded-full bg-pink-900 flex items-center justify-center text-[10px] text-pink-400 mr-2">
                        {player.lineup_number}
                      </div>
                      <span className="text-white">{player.lineup_player}</span>
                      <span className="ml-auto text-[10px] text-pink-400 font-bold">{player.lineup_position}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-pink-400 mb-2 border-b border-slate-700 pb-1">{t('substitutes')}</h4>
              <div className="grid grid-cols-1 gap-1">
                {lineupData.away.substitutes &&
                  lineupData.away.substitutes.map((player, index) => (
                    <div key={index} className="flex items-center text-xs p-1 bg-slate-800/50 rounded">
                      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 mr-2">
                        {player.lineup_number}
                      </div>
                      <span className="text-slate-300">{player.lineup_player}</span>
                      <span className="ml-auto text-[10px] text-slate-400 font-bold">{player.lineup_position}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-pink-400 mb-2 border-b border-slate-700 pb-1">{t('coach')}</h4>
              <div className="text-xs p-1 bg-slate-800/50 rounded text-white">
                {(lineupData.away.coach && lineupData.away.coach[0]?.lineup_player) || t('unknown')}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
