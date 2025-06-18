"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getStarPlayers } from "@/lib/football-api"
import { RefreshCw, Loader2, Star, Trophy, Award, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "./language-provider"

interface MatchStarPlayersProps {
  homeTeam: string
  awayTeam: string
  homeTeamId: string
  awayTeamId: string
  isLive?: boolean
}

interface StarPlayer {
  id: string | number
  name: string
  position: string
  rating: number
  goals: number
  assists: number
  matches?: number
}

export function MatchStarPlayers({
  homeTeam,
  awayTeam,
  homeTeamId,
  awayTeamId,
  isLive = false,
}: MatchStarPlayersProps) {
  const { t } = useTranslation()
  const [homeStars, setHomeStars] = useState<StarPlayer[]>([])
  const [awayStars, setAwayStars] = useState<StarPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStarPlayers = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    else setRefreshing(true)

    setError(null)

    try {
      // Her iki takımın yıldız oyuncularını paralel olarak çek
      const [homeData, awayData] = await Promise.all([getStarPlayers(homeTeamId), getStarPlayers(awayTeamId)])

      if (homeData && Array.isArray(homeData)) {
        setHomeStars(homeData)
      }

      if (awayData && Array.isArray(awayData)) {
        setAwayStars(awayData)
      }
    } catch (err) {
      console.error(t('errorLoadingStarPlayers'), err)
      setError(t('errorLoadingStarPlayers'))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStarPlayers()

    // Canlı maçlar için otomatik yenileme
    let interval: NodeJS.Timeout | null = null

    if (isLive) {
      interval = setInterval(() => {
        fetchStarPlayers(false)
      }, 60000) // Her 60 saniyede bir yenile
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [homeTeamId, awayTeamId, isLive])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
        <p className="text-xs text-slate-400">{t('loading')}</p>
      </div>
    )
  }

  if (error && homeStars.length === 0 && awayStars.length === 0) {
    return (
      <div className="text-center p-4 bg-red-900/20 rounded-md border border-red-700/30">
        <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-400 mb-2">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchStarPlayers()}
          className="border-red-700/50 text-red-400"
        >
          {t('retry')}
        </Button>
      </div>
    )
  }

  if (homeStars.length === 0 && awayStars.length === 0) {
    return (
      <div className="text-center p-4 bg-yellow-900/20 rounded-md border border-yellow-700/30">
        <AlertCircle className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
        <p className="text-sm text-yellow-400">{t('noStarPlayersFound')}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchStarPlayers()}
          className="mt-2 border-yellow-700/50 text-yellow-400"
        >
          {t('retry')}
        </Button>
      </div>
    )
  }

  return (
    <Card className="w-full betting-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-bold">{t('starPlayers')}</CardTitle>
        {isLive && (
          <Button variant="outline" size="sm" onClick={() => fetchStarPlayers(false)} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {t('refreshButton')}
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
            {homeStars.length > 0 ? (
              homeStars.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center p-3 rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex-shrink-0 mr-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-400" />
                      </div>
                      <Badge className="absolute -bottom-1 -right-1 bg-green-500 text-white">
                        {player.rating.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium text-lg">{player.name}</div>
                    <div className="text-xs text-muted-foreground">{player.position}</div>
                  </div>
                  <div className="flex-shrink-0 space-y-1">
                    <div className="flex items-center text-xs">
                      <Trophy className="w-3 h-3 mr-1 text-yellow-400" />
                      <span>{player.goals} {t('goals')}</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <Award className="w-3 h-3 mr-1 text-blue-400" />
                      <span>{player.assists} {t('assists')}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">{t('noStarPlayersFound')}</p>
            )}
          </TabsContent>

          <TabsContent value="away" className="space-y-4">
            {awayStars.length > 0 ? (
              awayStars.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center p-3 rounded-md bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex-shrink-0 mr-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-400" />
                      </div>
                      <Badge className="absolute -bottom-1 -right-1 bg-green-500 text-white">
                        {player.rating.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium text-lg">{player.name}</div>
                    <div className="text-xs text-muted-foreground">{player.position}</div>
                  </div>
                  <div className="flex-shrink-0 space-y-1">
                    <div className="flex items-center text-xs">
                      <Trophy className="w-3 h-3 mr-1 text-yellow-400" />
                      <span>{player.goals} {t('goals')}</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <Award className="w-3 h-3 mr-1 text-blue-400" />
                      <span>{player.assists} {t('assists')}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">{t('noStarPlayersFound')}</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
