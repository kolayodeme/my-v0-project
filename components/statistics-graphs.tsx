"use client"

import { useState, useEffect } from "react"
import { getLiveMatches } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "./language-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface Match {
  match_id: string
  match_hometeam_id: string
  match_awayteam_id: string
  match_hometeam_name: string
  match_awayteam_name: string
  team_home_badge: string
  team_away_badge: string
}

interface TeamStats {
  team_id: string
  team_name: string
  team_badge: string
  lastTenMatches: {
    result: "W" | "D" | "L"
    match: string
  }[]
  goalsPerMatch: {
    match: string
    scored: number
    conceded: number
  }[]
  cardsPerMatch: {
    match: string
    yellow: number
    red: number
  }[]
  predictedOutcomes: {
    outcome: string
    probability: number
  }[]
}

// Mock data generator for statistics
const generateMockStats = (teamId: string, teamName: string, teamBadge: string): TeamStats => {
  // Last 10 matches
  const results = ["W", "D", "L"] as const
  const lastTenMatches = Array.from({ length: 10 }, (_, i) => ({
    result: results[Math.floor(Math.random() * results.length)],
    match: `Match ${i + 1}`,
  }))

  // Goals per match
  const goalsPerMatch = Array.from({ length: 5 }, (_, i) => ({
    match: `Match ${i + 1}`,
    scored: Math.floor(Math.random() * 4),
    conceded: Math.floor(Math.random() * 3),
  }))

  // Cards per match
  const cardsPerMatch = Array.from({ length: 5 }, (_, i) => ({
    match: `Match ${i + 1}`,
    yellow: Math.floor(Math.random() * 5),
    red: Math.floor(Math.random() * 2),
  }))

  // Predicted outcomes
  const predictedOutcomes = [
    { outcome: "Win", probability: 40 + Math.floor(Math.random() * 30) },
    { outcome: "Draw", probability: 20 + Math.floor(Math.random() * 20) },
  ]
  predictedOutcomes.push({
    outcome: "Loss",
    probability: 100 - predictedOutcomes[0].probability - predictedOutcomes[1].probability,
  })

  return {
    team_id: teamId,
    team_name: teamName,
    team_badge: teamBadge,
    lastTenMatches,
    goalsPerMatch,
    cardsPerMatch,
    predictedOutcomes,
  }
}

export function StatisticsGraphs() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const { t, language } = useTranslation()

  const fetchMatches = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getLiveMatches()
      if (Array.isArray(data)) {
        setMatches(data)
        // Select the first team by default if available
        if (data.length > 0 && !selectedTeamId) {
          setSelectedTeamId(data[0].match_hometeam_id)

          // Generate mock stats for the selected team
          const selectedTeam = data[0]
          setTeamStats(
            generateMockStats(
              selectedTeam.match_hometeam_id,
              selectedTeam.match_hometeam_name,
              selectedTeam.team_home_badge,
            ),
          )
        }
      } else {
        setMatches([])
      }
    } catch (err) {
      setError(t("error"))
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamStats = async (teamId: string) => {
    try {
      setLoading(true)

      // Find the team in matches
      const match = matches.find((m) => m.match_hometeam_id === teamId || m.match_awayteam_id === teamId)

      if (match) {
        const isHomeTeam = match.match_hometeam_id === teamId
        const teamName = isHomeTeam ? match.match_hometeam_name : match.match_awayteam_name
        const teamBadge = isHomeTeam ? match.team_home_badge : match.team_away_badge

        // Generate mock stats for now
        setTeamStats(generateMockStats(teamId, teamName, teamBadge))
      }
    } catch (err) {
      setError(t("error"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [])

  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamStats(selectedTeamId)
    }
  }, [selectedTeamId])

  // Prepare teams for select dropdown
  const teams = matches
    .flatMap((match) => [
      { id: match.match_hometeam_id, name: match.match_hometeam_name, badge: match.team_home_badge },
      { id: match.match_awayteam_id, name: match.match_awayteam_name, badge: match.team_away_badge },
    ])
    .filter((team, index, self) => index === self.findIndex((t) => t.id === team.id))

  if (loading && !teamStats) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-full h-10" />
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>
                <Skeleton className="w-48 h-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="w-full h-64" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>{error}</AlertDescription>
        <Button variant="outline" size="sm" className="mt-2" onClick={fetchMatches}>
          <RefreshCw className="w-4 h-4 mr-2" />
          {t("retry")}
        </Button>
      </Alert>
    )
  }

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>{t("noData")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("statistics")}</h2>
        <Button variant="outline" size="sm" onClick={fetchMatches} className="flex items-center">
          <RefreshCw className="w-3 h-3 mr-1" />
          {t("retry")}
        </Button>
      </div>

      <div className="mb-3">
        <Select value={selectedTeamId || ""} onValueChange={setSelectedTeamId}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder={t("filterByTeam")} />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id} className="text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 overflow-hidden rounded-full bg-muted">
                    {team.badge ? (
                      <img
                        src={team.badge || "/placeholder.svg"}
                        alt={team.name}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=16&width=16"
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-xs font-bold">
                        {team.name.substring(0, 1)}
                      </div>
                    )}
                  </div>
                  <span>{team.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {teamStats && (
        <div className="space-y-3">
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="flex items-center space-x-2 text-sm">
                <div className="w-5 h-5 overflow-hidden rounded-full bg-muted">
                  {teamStats.team_badge ? (
                    <img
                      src={teamStats.team_badge || "/placeholder.svg"}
                      alt={teamStats.team_name}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=20&width=20"
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-xs font-bold">
                      {teamStats.team_name.substring(0, 1)}
                    </div>
                  )}
                </div>
                <span>{t("lastTenMatches")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <ChartContainer
                config={{
                  win: {
                    label: t("win"),
                    color: "hsl(var(--chart-1))",
                  },
                  draw: {
                    label: t("draw"),
                    color: "hsl(var(--chart-2))",
                  },
                  loss: {
                    label: t("loss"),
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={teamStats.lastTenMatches.map((match, index) => ({
                      match: match.match,
                      win: match.result === "W" ? 1 : 0,
                      draw: match.result === "D" ? 1 : 0,
                      loss: match.result === "L" ? 1 : 0,
                    }))}
                    margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="match" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 1]} hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Bar dataKey="win" stackId="a" fill="var(--color-win)" />
                    <Bar dataKey="draw" stackId="a" fill="var(--color-draw)" />
                    <Bar dataKey="loss" stackId="a" fill="var(--color-loss)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm">{t("goalsPerMatch")}</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <ChartContainer
                config={{
                  scored: {
                    label: t("scored"),
                    color: "hsl(var(--chart-1))",
                  },
                  conceded: {
                    label: t("conceded"),
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={teamStats.goalsPerMatch} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="match" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Line type="monotone" dataKey="scored" stroke="var(--color-scored)" />
                    <Line type="monotone" dataKey="conceded" stroke="var(--color-conceded)" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm">{t("cardsPerMatch")}</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <ChartContainer
                config={{
                  yellow: {
                    label: t("yellow"),
                    color: "hsl(var(--chart-1))",
                  },
                  red: {
                    label: t("red"),
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamStats.cardsPerMatch} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="match" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                    <Bar dataKey="yellow" fill="var(--color-yellow)" />
                    <Bar dataKey="red" fill="var(--color-red)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm">{t("predictedOutcomes")}</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <ChartContainer
                config={{
                  probability: {
                    label: t("probability"),
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamStats.predictedOutcomes} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="outcome" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="probability" fill="var(--color-probability)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
