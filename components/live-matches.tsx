"use client"

import React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { getLiveMatches, getAllLeagues } from "@/lib/football-api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  AlertCircle,
  RefreshCw,
  Loader2,
  Clock,
  StickerIcon as Stadium,
  MessageSquare,
  Zap,
  ChevronDown,
  ChevronUp,
  Activity,
} from "lucide-react"
import { useTranslation } from "./language-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cacheService } from "@/lib/cache-service"
import { MatchDetails } from "./match-details"
import { Textarea } from "@/components/ui/textarea"

interface Player {
  time: string
  home_scorer?: string
  away_scorer?: string
  home_assist?: string
  away_assist?: string
  score?: string
  home_fault?: string
  away_fault?: string
  card?: string
  info?: string
  score_info_time?: string
}

interface Match {
  match_id: string
  match_status: string
  match_time: string
  match_hometeam_name: string
  match_hometeam_score: string
  match_awayteam_name: string
  match_awayteam_score: string
  team_home_badge: string
  team_away_badge: string
  match_live: string
  goalscorer: Player[]
  cards: Player[]
  league_name: string
  country_name: string
  league_logo?: string
  country_logo?: string
  substitutions: {
    home: Player[]
    away: Player[]
  }
  match_hometeam_id: string
  match_awayteam_id: string
  match_stadium?: string
  match_referee?: string
  league_id?: string
}

interface League {
  league_id: string
  league_name: string
  country_id: string
  country_name: string
  league_logo?: string
}

interface MatchComment {
  id: string
  matchId: string
  text: string
  timestamp: number
}

// Compact mobile-optimized match card
const MobileMatchCard = React.memo(
  ({
    match,
    isSelected,
    onMatchClick,
    onPredictionClick,
  }: {
    match: Match
    isSelected: boolean
    onMatchClick: (matchId: string) => void
    onPredictionClick: (matchId: string) => void
  }) => {
    const { t } = useTranslation()
    
    const getStatusBadge = useCallback((status: string) => {
      if (status === "HT")
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1 py-0 h-4">HT</Badge>
        )
      if (status === "FT")
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-[10px] px-1 py-0 h-4">FT</Badge>
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-1 py-0 h-4 animate-pulse">
          <div className="w-1 h-1 bg-red-400 rounded-full mr-1"></div>
          {t('liveBadge')}
        </Badge>
      )
    }, [t])

    // Calculate match minutes
    const getMatchMinutes = useCallback((time: string, status: string) => {
      if (status === "FT") return "90'"
      if (status === "HT") return "45'"
      if (!time || time === "0") return "0'"

      const minutes = Number.parseInt(time) || 0
      return `${minutes}'`
    }, [])

    return (
      <Card
        className={`cursor-pointer transition-all duration-200 bg-slate-900/50 border-slate-700/50 hover:border-emerald-500/50 ${
          isSelected ? "border-emerald-500 bg-slate-800/70" : ""
        } rounded-lg shadow-sm`}
        onClick={() => onMatchClick(match.match_id)}
      >
        <CardContent className="p-2">
          {/* Header with league and status */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1">
              {match.league_logo && (
                <img
                  src={match.league_logo || "/placeholder.svg"}
                  alt={match.league_name}
                  className="w-3 h-3 rounded-full"
                  loading="lazy"
                />
              )}
              <span className="text-[10px] text-emerald-400 font-medium truncate max-w-[120px]">{match.league_name}</span>
            </div>
            {getStatusBadge(match.match_status)}
          </div>

          {/* Match Time with Minutes */}
          <div className="flex items-center justify-center mb-2">
            <div className="bg-slate-700/50 px-2 py-1 rounded text-[10px] text-slate-300 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span className="font-bold text-emerald-400">{getMatchMinutes(match.match_time, match.match_status)}</span>
            </div>
          </div>

          {/* Teams and Score */}
          <div className="space-y-2">
            {/* Home Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-full bg-slate-700/80 flex-shrink-0 overflow-hidden shadow-inner">
                  {match.team_home_badge ? (
                    <img
                      src={match.team_home_badge || "/placeholder.svg"}
                      alt={match.match_hometeam_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=24&width=24"
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-[10px] font-bold text-white">
                      {match.match_hometeam_name.substring(0, 1)}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-white truncate">{match.match_hometeam_name}</span>
              </div>
              <span className="text-lg font-bold text-emerald-400 min-w-[20px] text-center">
                {match.match_hometeam_score}
              </span>
            </div>

            {/* Away Team */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-full bg-slate-700/80 flex-shrink-0 overflow-hidden shadow-inner">
                  {match.team_away_badge ? (
                    <img
                      src={match.team_away_badge || "/placeholder.svg"}
                      alt={match.match_awayteam_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=24&width=24"
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-[10px] font-bold text-white">
                      {match.match_awayteam_name.substring(0, 1)}
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-white truncate">{match.match_awayteam_name}</span>
              </div>
              <span className="text-lg font-bold text-emerald-400 min-w-[20px] text-center">
                {match.match_awayteam_score}
              </span>
            </div>
          </div>

          {/* Stadium Info (if available) */}
          {match.match_stadium && (
            <div className="flex items-center justify-center mb-2 mt-2">
              <div className="text-[10px] text-slate-400 flex items-center truncate">
                <Stadium className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{match.match_stadium}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-1 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-[10px] h-7 bg-emerald-900/20 border-emerald-700/30 text-emerald-400 hover:bg-emerald-800/40"
              onClick={(e) => {
                e.stopPropagation()
                onMatchClick(match.match_id)
              }}
            >
              {isSelected ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span className="ml-1">{isSelected ? t('hide') : t('details')}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-[10px] h-7 bg-blue-900/20 border-blue-700/30 text-blue-400 hover:bg-blue-800/40"
              onClick={(e) => {
                e.stopPropagation()
                onPredictionClick(match.match_id)
              }}
            >
              <Zap className="w-3 h-3 mr-1" />
              {t('prediction')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  },
)

MobileMatchCard.displayName = "MobileMatchCard"

// Geçici MatchPrediction bileşeni
const MatchPrediction = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  matchStatus,
  homeTeamId,
  awayTeamId,
  isLive,
}: {
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  matchStatus: string
  homeTeamId: string
  awayTeamId: string
  isLive: boolean
}) => {
  const { t } = useTranslation()
  
  return (
    <div className="text-center py-4">
      <p className="text-sm text-green-400">{t('predictionComingSoon')}</p>
      <p className="text-xs text-slate-400 mt-2">
        {homeTeam} vs {awayTeam}
      </p>
    </div>
  )
}

export function LiveMatches() {
  const [matches, setMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [leagues, setLeagues] = useState<League[]>([])
  const [selectedLeague, setSelectedLeague] = useState<string>("all-leagues")
  const { t } = useTranslation()
  const selectedMatchRef = useRef<HTMLDivElement>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false)
  const [comments, setComments] = useState<MatchComment[]>([])
  const [newComment, setNewComment] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("details")
  const [refreshing, setRefreshing] = useState<boolean>(false)

  const fetchMatches = useCallback(async () => {
    try {
      setRefreshing(true)
      setError(null)

      // Try cache first
      const cachedMatches = cacheService.get("live_matches")
      if (cachedMatches && Array.isArray(cachedMatches) && !loading) {
        setMatches(cachedMatches)
        setFilteredMatches(cachedMatches)
      }

      // Fetch fresh data
      const data = await getLiveMatches()
      if (Array.isArray(data) && data.length > 0) {
        setMatches(data)
        setFilteredMatches(data)
        cacheService.set("live_matches", data, 30 * 1000)
      } else {
        setMatches([])
        setFilteredMatches([])
      }
    } catch (err) {
      console.error("Error fetching live matches:", err)
      setError("Canlı maçlar yüklenirken hata oluştu")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [loading])

  const fetchLeagues = useCallback(async () => {
    try {
      const cachedLeagues = cacheService.get("all_leagues")
      if (cachedLeagues && Array.isArray(cachedLeagues)) {
        setLeagues(cachedLeagues)
        return
      }

      const data = await getAllLeagues()
      if (Array.isArray(data) && data.length > 0) {
        setLeagues(data)
        cacheService.set("all_leagues", data, 30 * 60 * 1000)
      }
    } catch (err) {
      console.error("Error fetching leagues:", err)
    }
  }, [])

  // Memoized filtered matches
  const memoizedFilteredMatches = useMemo(() => {
    if (selectedLeague === "all-leagues") {
      return matches
    }

    const leagueInfo = leagues.find((l) => l.league_id === selectedLeague)
    return matches.filter((match) => match.league_name === leagueInfo?.league_name)
  }, [matches, selectedLeague, leagues])

  useEffect(() => {
    setFilteredMatches(memoizedFilteredMatches)
  }, [memoizedFilteredMatches])

  useEffect(() => {
    fetchMatches()
    fetchLeagues()

    // Load comments
    const savedComments = localStorage.getItem("match_comments")
    if (savedComments) {
      try {
        setComments(JSON.parse(savedComments))
      } catch (e) {
        console.error("Error parsing saved comments:", e)
      }
    }

    // Auto refresh every 30 seconds
    const interval = setInterval(fetchMatches, 30000)
    return () => clearInterval(interval)
  }, [fetchMatches, fetchLeagues])

  // Save comments to localStorage
  useEffect(() => {
    localStorage.setItem("match_comments", JSON.stringify(comments))
  }, [comments])

  const handleMatchClick = useCallback(
    (matchId: string) => {
      setIsLoadingDetails(true)
      if (selectedMatch === matchId) {
        setSelectedMatch(null)
        setActiveTab("details")
      } else {
        setSelectedMatch(matchId)
        setActiveTab("details")
      }
      setTimeout(() => setIsLoadingDetails(false), 200)
    },
    [selectedMatch],
  )

  const handlePredictionClick = useCallback((matchId: string) => {
    setSelectedMatch(matchId)
    setActiveTab("prediction")
    setIsLoadingDetails(false)
  }, [])

  const handleAddComment = useCallback(
    (matchId: string) => {
      if (!newComment.trim()) return

      const comment: MatchComment = {
        id: Date.now().toString(),
        matchId,
        text: newComment,
        timestamp: Date.now(),
      }

      setComments((prev) => [...prev, comment])
      setNewComment("")
    },
    [newComment],
  )

  const getMatchComments = useCallback(
    (matchId: string) => {
      return comments.filter((comment) => comment.matchId === matchId)
    },
    [comments],
  )

  const formatCommentTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }, [])

  if (loading && matches.length === 0) {
    return (
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-green-400">{t('liveMatches')}</h2>
          <Skeleton className="w-16 h-6 bg-slate-700" />
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-green-500" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-900/50 border-red-700 m-3">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription className="text-sm">{error}</AlertDescription>
        <Button variant="outline" size="sm" className="mt-2 h-7 text-xs" onClick={fetchMatches}>
          <RefreshCw className="w-3 h-3 mr-1" />
          {t('tryAgain')}
        </Button>
      </Alert>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-green-400">{t('liveMatches')}</h2>
          <Badge className="bg-slate-700 text-slate-400">0 {t('matchesLabel')}</Badge>
        </div>
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="p-4 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-sm text-green-400">{t('noLiveMatches')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('checkBackLater')}</p>
            <Button variant="outline" size="sm" className="mt-3 h-7 text-xs" onClick={fetchMatches}>
              <RefreshCw className="w-3 h-3 mr-1" />
              {t('refresh')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-3 max-w-sm mx-auto">
      {/* Header with Live Match Count */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-green-400">{t('liveMatches')}</h2>
        <div className="flex items-center space-x-2">
          <Badge className="bg-green-700 text-white animate-pulse">
            <Activity className="w-3 h-3 mr-1" />
            {filteredMatches.length} {t('liveBadge')}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMatches}
            disabled={refreshing}
            className="h-7 text-xs bg-green-900/30 border-green-700/50 text-green-400 hover:bg-green-800/50"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "..." : t('refresh')}
          </Button>
        </div>
      </div>

      {/* League Filter */}
      <div>
        <Select value={selectedLeague} onValueChange={setSelectedLeague}>
          <SelectTrigger className="h-8 text-xs bg-slate-900/50 border-slate-700/50 text-white">
            <SelectValue placeholder={t('allLeagues')} />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700">
            <SelectItem value="all-leagues" className="text-xs">
              {t('allLeagues')}
            </SelectItem>
            {leagues.map((league) => (
              <SelectItem key={league.league_id} value={league.league_id} className="text-xs">
                <div className="flex items-center">
                  {league.league_logo && (
                    <img
                      src={league.league_logo || "/placeholder.svg"}
                      alt={league.league_name}
                      className="w-3 h-3 mr-2 rounded-full"
                      loading="lazy"
                    />
                  )}
                  <span className="truncate">{league.league_name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Matches List */}
      <div className="space-y-2">
        {filteredMatches.map((match) => (
          <div key={match.match_id} ref={match.match_id === selectedMatch ? selectedMatchRef : null}>
            <MobileMatchCard
              match={match}
              isSelected={selectedMatch === match.match_id}
              onMatchClick={handleMatchClick}
              onPredictionClick={handlePredictionClick}
            />

            {/* Expanded Details */}
            {selectedMatch === match.match_id && (
              <div className="mt-2">
                {isLoadingDetails ? (
                  <Card className="bg-slate-900/50 border-slate-700/50">
                    <CardContent className="p-3 flex justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-green-500" />
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-slate-900/50 border-slate-700/50">
                    <CardContent className="p-3">
                      {/* Tab Navigation */}
                      <div className="flex border-b border-slate-700/50 mb-3">
                        <button
                          className={`px-2 py-1 text-xs font-medium transition-colors ${
                            activeTab === "details"
                              ? "border-b-2 border-green-500 text-green-400"
                              : "text-slate-400 hover:text-green-400"
                          }`}
                          onClick={() => setActiveTab("details")}
                        >
                          {t('details')}
                        </button>
                        <button
                          className={`px-2 py-1 text-xs font-medium transition-colors ${
                            activeTab === "prediction"
                              ? "border-b-2 border-green-500 text-green-400"
                              : "text-slate-400 hover:text-green-400"
                          }`}
                          onClick={() => setActiveTab("prediction")}
                        >
                          <Zap className="w-3 h-3 mr-1 inline" />
                          {t('prediction')}
                        </button>
                        <button
                          className={`px-2 py-1 text-xs font-medium transition-colors ${
                            activeTab === "comments"
                              ? "border-b-2 border-green-500 text-green-400"
                              : "text-slate-400 hover:text-green-400"
                          }`}
                          onClick={() => setActiveTab("comments")}
                        >
                          {t('commentary')}
                        </button>
                      </div>

                      {/* Tab Content */}
                      {activeTab === "details" && (
                        <div className="text-xs">
                          <MatchDetails
                            matchId={match.match_id}
                            homeTeam={match.match_hometeam_name}
                            awayTeam={match.match_awayteam_name}
                            homeTeamId={match.match_hometeam_id}
                            awayTeamId={match.match_awayteam_id}
                            isLive={match.match_status !== "FT"}
                          />
                        </div>
                      )}

                      {activeTab === "prediction" && (
                        <div className="text-xs">
                          <MatchPrediction
                            homeTeam={match.match_hometeam_name}
                            awayTeam={match.match_awayteam_name}
                            homeScore={Number.parseInt(match.match_hometeam_score) || 0}
                            awayScore={Number.parseInt(match.match_awayteam_score) || 0}
                            matchStatus={match.match_status}
                            homeTeamId={match.match_hometeam_id}
                            awayTeamId={match.match_awayteam_id}
                            isLive={match.match_status !== "FT"}
                          />
                        </div>
                      )}

                      {activeTab === "comments" && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-medium text-green-400">{t('comments')}</h3>

                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {getMatchComments(match.match_id).length > 0 ? (
                              getMatchComments(match.match_id).map((comment) => (
                                <div key={comment.id} className="bg-slate-700/30 p-2 rounded">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-medium text-green-400">{t('user')}</span>
                                    <span className="text-[10px] text-slate-400">
                                      {formatCommentTime(comment.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-300">{comment.text}</p>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-3">
                                <p className="text-[10px] text-slate-400">{t('noCommentsYet')}</p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Textarea
                              placeholder={t('writeYourComment')}
                              className="text-[10px] bg-slate-700/30 border-slate-600 resize-none h-16"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                            />
                            <Button
                              size="sm"
                              className="w-full h-7 text-[10px] bg-green-700 hover:bg-green-600 text-white"
                              onClick={() => handleAddComment(match.match_id)}
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {t('addComment')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
