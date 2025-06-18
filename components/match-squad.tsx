"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getMatchLineups } from "@/lib/football-api"
import { RefreshCw, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "./language-provider"

interface MatchSquadProps {
  matchId: string
  homeTeam: string
  awayTeam: string
  homeTeamId: string
  awayTeamId: string
  isLive?: boolean
}

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
    coach: string[]
    missing_players?: Player[]
  }
  away: {
    starting_lineups: Player[]
    substitutes: Player[]
    coach: string[]
    missing_players?: Player[]
  }
}

export function MatchSquad({ matchId, homeTeam, awayTeam, homeTeamId, awayTeamId, isLive = false }: MatchSquadProps) {
  const { t } = useTranslation()
  const [lineupData, setLineupData] = useState<LineupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLineups = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    else setRefreshing(true)

    setError(null)

    try {
      // API'den kadro verilerini çek
      const data = await getMatchLineups(matchId)

      if (!data || !data.home || !data.away) {
        setError("Bu maç için kadro verisi bulunamadı.")
        setLineupData(null)
      } else {
        setLineupData(data)
      }
    } catch (err) {
      console.error("Kadro verisi çekilirken hata:", err)
      setError("Kadro verisi yüklenirken bir hata oluştu.")
      setLineupData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLineups()

    // Canlı maçlar için otomatik yenileme
    let interval: NodeJS.Timeout | null = null

    if (isLive) {
      interval = setInterval(() => {
        fetchLineups(false)
      }, 60000) // Her 60 saniyede bir yenile
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [matchId, isLive])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
        <p className="text-xs text-slate-400">{t('loadingSquad')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-4 bg-red-900/20 rounded-md border border-red-700/30">
        <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-400 mb-2">{error}</p>
        <Button variant="outline" size="sm" onClick={() => fetchLineups()} className="border-red-700/50 text-red-400">
          {t('tryAgain')}
        </Button>
      </div>
    )
  }

  if (!lineupData) {
    return (
      <div className="text-center p-4 bg-yellow-900/20 rounded-md border border-yellow-700/30">
        <AlertCircle className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
        <p className="text-sm text-yellow-400">{t('noSquadData')}</p>
      </div>
    )
  }

  // Pozisyon kısaltmalarını tam isimlere dönüştür
  const getPositionName = (pos: string): string => {
    pos = pos.toUpperCase()
    if (pos === "G" || pos === "GK") return t('goalkeeper')
    if (pos === "D" || pos === "DF") return t('defender')
    if (pos === "M" || pos === "MF") return t('midfielder')
    if (pos === "F" || pos === "FW") return t('forward')
    return pos
  }

  // Oyuncuları pozisyonlarına göre grupla
  const groupPlayersByPosition = (players: Player[]) => {
    return players.reduce(
      (acc, player) => {
        const position = getPositionName(player.lineup_position)
        if (!acc[position]) acc[position] = []
        acc[position].push(player)
        return acc
      },
      {} as Record<string, Player[]>,
    )
  }

  const homeStartingByPosition = groupPlayersByPosition(lineupData.home.starting_lineups || [])
  const awayStartingByPosition = groupPlayersByPosition(lineupData.away.starting_lineups || [])

  return (
    <Card className="w-full betting-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">{t('matchSquad')}</CardTitle>
        {isLive && (
          <Button variant="outline" size="sm" onClick={() => fetchLineups(false)} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {t('refresh')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="home">{homeTeam}</TabsTrigger>
            <TabsTrigger value="away">{awayTeam}</TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('startingLineup')}</h3>
              {Object.entries(homeStartingByPosition).map(([position, players]) => (
                <div key={position} className="mb-4">
                  <h4 className="text-md font-medium mb-2 text-primary">{position}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {players.map((player, idx) => (
                      <div
                        key={idx}
                        className="flex items-center p-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-3">
                          {player.lineup_number || "?"}
                        </div>
                        <div>
                          <div className="font-medium">{player.lineup_player}</div>
                          <div className="text-xs text-muted-foreground">{getPositionName(player.lineup_position)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {lineupData.home.substitutes && lineupData.home.substitutes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('substitutes')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {lineupData.home.substitutes.map((player, idx) => (
                    <div
                      key={idx}
                      className="flex items-center p-2 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/70 flex items-center justify-center mr-3">
                        {player.lineup_number || "?"}
                      </div>
                      <div>
                        <div className="font-medium">{player.lineup_player}</div>
                        <div className="text-xs text-muted-foreground">{getPositionName(player.lineup_position)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lineupData.home.coach && lineupData.home.coach.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('coach')}</h3>
                <div className="p-2 rounded-md bg-secondary/20">
                  <div className="font-medium">{lineupData.home.coach[0]}</div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="away" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{t('startingLineup')}</h3>
              {Object.entries(awayStartingByPosition).map(([position, players]) => (
                <div key={position} className="mb-4">
                  <h4 className="text-md font-medium mb-2 text-primary">{position}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {players.map((player, idx) => (
                      <div
                        key={idx}
                        className="flex items-center p-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center mr-3">
                          {player.lineup_number || "?"}
                        </div>
                        <div>
                          <div className="font-medium">{player.lineup_player}</div>
                          <div className="text-xs text-muted-foreground">{getPositionName(player.lineup_position)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {lineupData.away.substitutes && lineupData.away.substitutes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('substitutes')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {lineupData.away.substitutes.map((player, idx) => (
                    <div
                      key={idx}
                      className="flex items-center p-2 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/70 flex items-center justify-center mr-3">
                        {player.lineup_number || "?"}
                      </div>
                      <div>
                        <div className="font-medium">{player.lineup_player}</div>
                        <div className="text-xs text-muted-foreground">{getPositionName(player.lineup_position)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lineupData.away.coach && lineupData.away.coach.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">{t('coach')}</h3>
                <div className="p-2 rounded-md bg-secondary/20">
                  <div className="font-medium">{lineupData.away.coach[0]}</div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
