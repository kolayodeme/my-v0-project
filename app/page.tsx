"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, TrendingUp, Users, Clock, Activity, Calendar, ChevronRight, Brain, Cpu, Sparkles, Languages, Coins } from "lucide-react"
import { getLiveMatches, getUpcomingMatches } from "@/lib/api"
import { UpcomingMatches } from "@/components/upcoming-matches"
import { LiveMatchTracker } from "@/components/live-match-tracker"
import { useTranslation } from "@/components/language-provider"
import AdMobBannerComponent from "@/components/AdMobBannerComponent"
import { AdTriggerButton } from "@/components/ad-trigger-button"
import { useCreditStore } from "@/lib/credit-system"
import { AdMobRewardButton } from "@/components/ui/AdMobRewardButton"

interface LiveMatch {
  match_id: string
  match_hometeam_name: string
  match_awayteam_name: string
  match_hometeam_score: string
  match_awayteam_score: string
  match_status: string
  match_time: string
  league_name: string
  team_home_badge?: string
  team_away_badge?: string
}

interface UpcomingMatch {
  match_id: string
  match_hometeam_name: string
  match_awayteam_name: string
  match_date: string
  match_time: string
  league_name: string
  team_home_badge?: string
  team_away_badge?: string
}

export default function HomePage() {
  const { t, language, setLanguage } = useTranslation()
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [successRate, setSuccessRate] = useState(0)
  const [predictions, setPredictions] = useState(0)
  const [users, setUsers] = useState(0)
  const { credits, addCredits } = useCreditStore()
  const [mounted, setMounted] = useState(false)

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "tr" : "en")
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        // Canlı maçları yükle
        const liveData = await getLiveMatches()
        if (Array.isArray(liveData)) {
          setLiveMatches(liveData.slice(0, 3)) // İlk 3 canlı maç
        }

        // Yaklaşan maçları yükle
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 7) // 7 gün sonraya kadar

        const upcomingData = await getUpcomingMatches(
          today.toISOString().split("T")[0],
          tomorrow.toISOString().split("T")[0],
        )
        if (Array.isArray(upcomingData)) {
          setUpcomingMatches(upcomingData.slice(0, 3)) // İlk 3 yaklaşan maç
        }
      } catch (error) {
        console.error("Veri yükleme hatası:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Animated counters
    const successTimer = setInterval(() => {
      setSuccessRate((prev) => (prev < 92 ? prev + 1 : 92))
    }, 30)

    const predictionTimer = setInterval(() => {
      setPredictions((prev) => (prev < 15847 ? prev + 50 : 15847))
    }, 20)

    const userTimer = setInterval(() => {
      setUsers((prev) => (prev < 8432 ? prev + 25 : 8432))
    }, 25)

    return () => {
      clearInterval(successTimer)
      clearInterval(predictionTimer)
      clearInterval(userTimer)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  const formatMatchTime = (time: string) => {
    if (!time || time === "0") return "0'"
    const minutes = Number.parseInt(time) || 0
    return `${minutes}'`
  }

  const formatUpcomingTime = (date: string, time: string) => {
    if (!date || !time) return "TBA"

    try {
      const matchDateTime = new Date(`${date}T${time}`)
      return matchDateTime.toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return time || "TBA"
    }
  }

  const formatUpcomingDate = (date: string) => {
    if (!date) return "TBA"

    try {
      const matchDate = new Date(date)
      return matchDate.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
      })
    } catch {
      return date
    }
  }

  const handleAdReward = () => {
    addCredits(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-green-900">
      <div className="container px-3 py-4 mx-auto max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              AI Football Prophet
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {mounted && (
              <div className="flex items-center gap-1 px-2 py-1 bg-slate-800/80 rounded-full">
                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-xs font-medium text-yellow-400">{credits}</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={toggleLanguage} className="flex items-center gap-1">
              <Languages className="w-4 h-4" />
              <span className="text-xs font-bold">{language.toUpperCase()}</span>
            </Button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-blue-500/20 blur-2xl rounded-full"></div>
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl border border-green-500/20">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                    <Cpu className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-slate-900" />
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">
                {t('aiPowered')}
                <span className="block bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  %{successRate} {t('successRate')}
                </span>
              </h2>

              <p className="text-sm text-slate-300 mb-4 px-2">
                {t('aiDescription')}
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center">
                  <div className="text-xl font-bold text-green-400">{predictions.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">
                    {t('successfulPredictions')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-400">{users.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">
                    {t('happyUsers')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-yellow-400">24/7</div>
                  <div className="text-xs text-slate-400">
                    {t('liveAnalysis')}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Link href="/live">
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    {t('seeLivePredictions')}
                  </Button>
                </Link>
                <Link href="/predictions">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-green-500/50 text-green-400 hover:bg-green-500/10"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {t('aiAnalysis')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Credit System */}
        <div className="mb-6">
          <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-slate-200 flex items-center">
                <Coins className="w-5 h-5 mr-2 text-yellow-400" />
                Kredi Sistemi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="text-sm text-slate-300">
                  <p>Reklam izleyerek kredi kazanın ve bu kredilerle maç analizleri ve tahminleri görüntüleyin.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 bg-slate-700/30 p-3 rounded-lg">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex items-center text-xl font-bold text-yellow-400 mb-1">
                      <Coins className="w-4 h-4 mr-1" />
                      1
                    </div>
                    <p className="text-xs text-slate-300">Analiz Et</p>
                  </div>
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="flex items-center text-xl font-bold text-yellow-400 mb-1">
                      <Coins className="w-4 h-4 mr-1" />
                      1
                    </div>
                    <p className="text-xs text-slate-300">Tahmin Et</p>
                  </div>
                </div>
                
                <AdMobRewardButton 
                  onReward={handleAdReward}
                  className="w-full bg-green-800 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                >
                  <Coins className="w-4 h-4" />
                  Reklam İzle ve +1 Kredi Kazan
                </AdMobRewardButton>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Matches Preview */}
        {!loading && liveMatches.length > 0 && (
          <div className="mb-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-500" />
                    <CardTitle className="text-lg">
                      {t('liveMatches')}
                    </CardTitle>
                    <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
                      <div className="w-1 h-1 bg-red-400 rounded-full mr-1"></div>
                      {liveMatches.length} {t('liveBadge')}
                    </Badge>
                  </div>
                  <Link href="/live">
                    <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {liveMatches.map((match) => (
                  <div
                    key={match.match_id}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center space-x-2">
                          {match.team_home_badge && (
                            <img
                              src={match.team_home_badge || "/placeholder.svg"}
                              alt={match.match_hometeam_name}
                              className="w-4 h-4 rounded-full"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display = "none"
                              }}
                            />
                          )}
                          <span className="font-medium truncate">{match.match_hometeam_name}</span>
                        </div>
                        <span className="text-green-400 font-bold">{match.match_hometeam_score}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          {match.team_away_badge && (
                            <img
                              src={match.team_away_badge || "/placeholder.svg"}
                              alt={match.match_awayteam_name}
                              className="w-4 h-4 rounded-full"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display = "none"
                              }}
                            />
                          )}
                          <span className="font-medium truncate">{match.match_awayteam_name}</span>
                        </div>
                        <span className="text-green-400 font-bold">{match.match_awayteam_score}</span>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="flex items-center gap-1 text-xs text-green-400 mb-1">
                        <Clock className="w-3 h-3" />
                        {formatMatchTime(match.match_time)}
                      </div>
                      <div className="text-xs text-slate-400 truncate max-w-[80px]">{match.league_name}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upcoming Matches Preview */}
        {!loading && upcomingMatches.length > 0 && (
          <div className="mb-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <CardTitle className="text-lg">
                      {t('upcomingMatches')}
                    </CardTitle>
                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      {upcomingMatches.length} {language === "en" ? "Matches" : "Maç"}
                    </Badge>
                  </div>
                  <Link href="/upcoming">
                    <Button variant="ghost" size="sm" className="text-green-400 hover:text-green-300">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingMatches.map((match) => (
                  <div
                    key={match.match_id}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1 flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          {match.team_home_badge && (
                            <img
                              src={match.team_home_badge || "/placeholder.svg"}
                              alt={match.match_hometeam_name}
                              className="w-4 h-4 rounded-full"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display = "none"
                              }}
                            />
                          )}
                          <span className="truncate">{match.match_hometeam_name}</span>
                        </div>
                        <span className="text-slate-400">{t('vs')}</span>
                        <div className="flex items-center space-x-1">
                          {match.team_away_badge && (
                            <img
                              src={match.team_away_badge || "/placeholder.svg"}
                              alt={match.match_awayteam_name}
                              className="w-4 h-4 rounded-full"
                              onError={(e) => {
                                ;(e.target as HTMLImageElement).style.display = "none"
                              }}
                            />
                          )}
                          <span className="truncate">{match.match_awayteam_name}</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 truncate">{match.league_name}</div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-xs text-blue-400 font-medium">
                        {formatUpcomingTime(match.match_date, match.match_time)}
                      </div>
                      <div className="text-xs text-slate-400">{formatUpcomingDate(match.match_date)}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Features */}
        <Card className="bg-gradient-to-br from-green-900/30 to-slate-900 border-green-500/30 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                <Brain className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-base font-bold text-white">
                {t('deepLearningAI')}
              </h3>
            </div>
            <p className="text-sm text-slate-300 mb-3">
              {t('deepLearningAIDesc')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-xs text-slate-400">
                  {t('teamAnalysis')}
                </div>
              </div>
              <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-xs text-slate-400">
                  {t('realTime')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ödüllü Reklam Butonu */}
        <div className="mb-6">
          <AdTriggerButton 
            onSuccess={() => {
              console.log("Reklam başarıyla tamamlandı!")
              // Burada ödül verebilirsiniz
            }}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
            type="rewarded"
          />
        </div>

        {/* Banner Reklam */}
        <div className="fixed bottom-16 left-0 right-0 z-50">
          <AdMobBannerComponent disabled={true} />
        </div>
      </div>
    </div>
  )
}
