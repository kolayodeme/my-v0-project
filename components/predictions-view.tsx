"use client"

import { useState, useEffect } from "react"
import { getLiveMatches } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "./language-provider"


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
}

export function PredictionsView() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const { t } = useTranslation()

  const fetchMatches = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getLiveMatches()
      if (Array.isArray(data)) {
        setMatches(data)
        // Select the first match by default if available
        if (data.length > 0 && !selectedMatch) {
          setSelectedMatch(data[0].match_id)
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

  useEffect(() => {
    fetchMatches()

    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      fetchMatches()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (loading && matches.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>
                <Skeleton className="w-48 h-6" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
                <Skeleton className="w-full h-4" />
              </div>
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

  if (matches.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>{t("noLiveMatches")}</p>
        </CardContent>
      </Card>
    )
  }

  const selectedMatchData = matches.find((match) => match.match_id === selectedMatch)

  return (
    <div className="space-y-3 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{t("matchPredictions")}</h2>
        <Button variant="outline" size="sm" onClick={fetchMatches} className="flex items-center">
          <RefreshCw className="w-3 h-3 mr-1" />
          {t("retry")}
        </Button>
      </div>

      <Tabs defaultValue={selectedMatch || ""} onValueChange={setSelectedMatch}>
        <TabsList className="flex w-full overflow-x-auto">
          {matches.map((match) => (
            <TabsTrigger key={match.match_id} value={match.match_id} className="flex-shrink-0 text-xs">
              {match.match_hometeam_name} vs {match.match_awayteam_name}
            </TabsTrigger>
          ))}
        </TabsList>

        {matches.map((match) => (
          <TabsContent key={match.match_id} value={match.match_id}>
            <Card>
              <CardHeader className="p-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-5 h-5 overflow-hidden rounded-full bg-muted">
                      {match.team_home_badge ? (
                        <img
                          src={match.team_home_badge || "/placeholder.svg"}
                          alt={match.match_hometeam_name}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=20&width=20"
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-xs font-bold">
                          {match.match_hometeam_name.substring(0, 1)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs">{match.match_hometeam_name}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-bold">
                      {match.match_hometeam_score} - {match.match_awayteam_score}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <span className="text-xs">{match.match_awayteam_name}</span>
                    <div className="w-5 h-5 overflow-hidden rounded-full bg-muted">
                      {match.team_away_badge ? (
                        <img
                          src={match.team_away_badge || "/placeholder.svg"}
                          alt={match.match_awayteam_name}
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg?height=20&width=20"
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-xs font-bold">
                          {match.match_awayteam_name.substring(0, 1)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
