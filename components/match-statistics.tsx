"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMatchStatistics } from "@/lib/football-api"
import { RefreshCw, Loader2, AlertCircle, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "./language-provider"

interface MatchStatisticsProps {
  matchId: string
  homeTeam: string
  awayTeam: string
  isLive?: boolean
}

export function MatchStatistics({ matchId, homeTeam, awayTeam, isLive = false }: MatchStatisticsProps) {
  const { t } = useTranslation()
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStatistics = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    else setRefreshing(true)

    setError(null)

    try {
      // API'den istatistikleri çek
      const data = await getMatchStatistics(matchId)

      if (!data || Object.keys(data).length === 0) {
        setError(t('noStatsFound'))
        setStatistics(null)
      } else {
        setStatistics(data)
      }
    } catch (err) {
      console.error(t('statsLoadError'), err)
      setError(t('statsLoadError'))
      setStatistics(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStatistics()

    // Canlı maçlar için otomatik yenileme
    let interval: NodeJS.Timeout | null = null

    if (isLive) {
      interval = setInterval(() => {
        fetchStatistics(false)
      }, 30000) // Her 30 saniyede bir yenile
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [matchId, isLive])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
        <p className="text-xs text-slate-400">{t('loadingStats')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-4 bg-red-900/20 rounded-md border border-red-700/30">
        <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-400 mb-2">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchStatistics()}
          className="border-red-700/50 text-red-400"
        >
          {t('retry')}
        </Button>
      </div>
    )
  }

  if (!statistics) {
    return (
      <div className="text-center p-4 bg-yellow-900/20 rounded-md border border-yellow-700/30">
        <AlertCircle className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
        <p className="text-sm text-yellow-400">{t('noStatsFound')}</p>
      </div>
    )
  }

  // İstatistikleri göster
  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=400')] opacity-5"></div>
      <CardHeader className="p-3 relative z-10">
        <CardTitle className="text-base text-white flex items-center justify-between">
          <span className="text-xs text-cyan-400 font-normal">{homeTeam}</span>
          <div className="flex items-center">
            <BarChart3 className="w-3 h-3 mr-1 text-white" />
            <span className="text-xs text-white font-bold">{t('statistics')}</span>
            {isLive && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-1 text-slate-400 hover:text-white"
                onClick={() => fetchStatistics(false)}
                disabled={refreshing}
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
          <span className="text-xs text-pink-400 font-normal">{awayTeam}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-4 relative z-10">
        {Object.entries(statistics).map(([statName, values]: [string, any]) => {
          // Toplam değeri hesapla
          const homeValue = Number.parseFloat(values.home) || 0
          const awayValue = Number.parseFloat(values.away) || 0
          const total = homeValue + awayValue

          // Yüzdeleri hesapla
          const homePercent = total > 0 ? (homeValue / total) * 100 : 50
          const awayPercent = total > 0 ? (awayValue / total) * 100 : 50

          // Özel durum: Eğer değer zaten yüzde ise (örn. "55%")
          const isPercentage = typeof values.home === "string" && values.home.includes("%")
          const homePercentValue = isPercentage ? Number.parseFloat(values.home.replace("%", "")) : homePercent
          const awayPercentValue = isPercentage ? Number.parseFloat(values.away.replace("%", "")) : awayPercent

          return (
            <div key={statName} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-cyan-400 font-medium">{values.home}</span>
                <span className="text-xs text-slate-300">{statName}</span>
                <span className="text-pink-400 font-medium">{values.away}</span>
              </div>
              <div className="flex h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 glow-cyan rounded-l-full"
                  style={{ width: `${homePercentValue}%` }}
                ></div>
                <div
                  className="h-full bg-pink-500 glow-pink rounded-r-full"
                  style={{ width: `${awayPercentValue}%` }}
                ></div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
