"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "./language-provider"
import { Loader2, Trophy, AlertCircle } from "lucide-react"
import { getStandings } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface TeamStanding {
  position: number
  team_name: string
  matches_played: number
  won: number
  draw: number
  lost: number
  goals_for: number
  goals_against: number
  points: number
  form: string
}

interface MatchStandingsProps {
  leagueName: string
  homeTeam: string
  awayTeam: string
  leagueId?: string
}

export function MatchStandings({ leagueName, homeTeam, awayTeam, leagueId = "148" }: MatchStandingsProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [standings, setStandings] = useState<TeamStanding[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStandings = async () => {
      setLoading(true)
      setError(null)
      try {
        // API'den puan durumunu çek
        const standingsData = await getStandings(leagueId)
        
        if (Array.isArray(standingsData) && standingsData.length > 0) {
          // API'den gelen veriyi bileşenin kullandığı formata dönüştür
          const formattedStandings = standingsData.map((team: any) => ({
            position: parseInt(team.overall_league_position) || 0,
            team_name: team.team_name || "",
            matches_played: parseInt(team.overall_league_payed) || 0,
            won: parseInt(team.overall_league_W) || 0,
            draw: parseInt(team.overall_league_D) || 0,
            lost: parseInt(team.overall_league_L) || 0,
            goals_for: parseInt(team.overall_league_GF) || 0,
            goals_against: parseInt(team.overall_league_GA) || 0,
            points: parseInt(team.overall_league_PTS) || 0,
            form: team.league_round || "",
          }));
          
          setStandings(formattedStandings);
          
          // Takım adlarını kontrol et
          const homeTeamFound = formattedStandings.some(team => 
            team.team_name.toLowerCase().includes(homeTeam.toLowerCase()) || 
            homeTeam.toLowerCase().includes(team.team_name.toLowerCase())
          );
          
          const awayTeamFound = formattedStandings.some(team => 
            team.team_name.toLowerCase().includes(awayTeam.toLowerCase()) || 
            awayTeam.toLowerCase().includes(team.team_name.toLowerCase())
          );
          
          if (!homeTeamFound) {
            console.log(`${homeTeam} ${t('teamNotFoundInStandings')}`);
          }
          
          if (!awayTeamFound) {
            console.log(`${awayTeam} ${t('teamNotFoundInStandings')}`);
          }
          
          if (!homeTeamFound && !awayTeamFound) {
            setError(t('bothTeamsNotFound'));
          }
        } else {
          // API'den veri gelmezse boş dizi kullan
          setStandings([]);
          setError(t('standingsDataNotFound'));
        }
      } catch (error) {
        console.error("Error fetching standings:", error);
        // Hata durumunda boş dizi kullan
        setStandings([]);
        setError(t('standingsLoadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, [leagueId, leagueName, homeTeam, awayTeam, t]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-green-500 mb-2" />
        <p className="text-xs text-green-400">{t('loadingStandingsData')}</p>
      </div>
    )
  }

  if (error || standings.length === 0) {
    return (
      <Alert variant="destructive" className="bg-red-900/20 border-red-700/30 text-red-400">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          {error || t('standingsDataNotFound')}
        </AlertDescription>
      </Alert>
    );
  }

  const homeTeamStanding = standings.find((team) => {
    const normalizedTeamName = team.team_name.toLowerCase().trim();
    const normalizedHomeTeam = homeTeam.toLowerCase().trim();
    return normalizedTeamName === normalizedHomeTeam || 
           normalizedTeamName.includes(normalizedHomeTeam) || 
           normalizedHomeTeam.includes(normalizedTeamName);
  });
  
  const awayTeamStanding = standings.find((team) => {
    const normalizedTeamName = team.team_name.toLowerCase().trim();
    const normalizedAwayTeam = awayTeam.toLowerCase().trim();
    return normalizedTeamName === normalizedAwayTeam || 
           normalizedTeamName.includes(normalizedAwayTeam) || 
           normalizedAwayTeam.includes(normalizedTeamName);
  });

  if (!homeTeamStanding || !awayTeamStanding) {
    return (
      <Alert variant="destructive" className="bg-yellow-900/20 border-yellow-700/30 text-yellow-400">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          {t('teamsStandingsNotFound')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-green-700/30 overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=400')] opacity-5"></div>
      <CardHeader className="p-3 relative z-10">
        <CardTitle className="text-base text-white flex items-center">
          <Trophy className="w-4 h-4 mr-2 text-yellow-400" />
          <span className="text-green-400">{leagueName}</span>
          <span className="text-xs text-slate-400 ml-2">{t('standings')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 relative z-10">
        <Tabs defaultValue="full">
          <TabsList className="w-full bg-green-900/30 rounded-none">
            <TabsTrigger
              value="full"
              className="flex-1 text-xs data-[state=active]:bg-green-800/50 data-[state=active]:text-green-400"
            >
              {t('fullTable')}
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="flex-1 text-xs data-[state=active]:bg-green-800/50 data-[state=active]:text-green-400"
            >
              {t('team')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="full" className="p-3 space-y-2">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-green-700/30">
                    <th className="p-1 text-left text-green-400">#</th>
                    <th className="p-1 text-left text-green-400">{t('team')}</th>
                    <th className="p-1 text-center text-green-400">{t('matchesPlayed').charAt(0)}</th>
                    <th className="p-1 text-center text-green-400">{t('win').charAt(0)}</th>
                    <th className="p-1 text-center text-green-400">{t('draw').charAt(0)}</th>
                    <th className="p-1 text-center text-green-400">{t('loss').charAt(0)}</th>
                    <th className="p-1 text-center text-green-400">{t('goalsForTitle').charAt(0)}</th>
                    <th className="p-1 text-center text-green-400">{t('goalsAgainstTitle').charAt(0)}</th>
                    <th className="p-1 text-center text-green-400">{t('pointsTitle').charAt(0)}</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team) => (
                    <tr
                      key={team.position}
                      className={`border-b border-slate-700/30 ${
                        team.team_name === homeTeam || team.team_name === awayTeam ? "bg-green-900/20" : ""
                      }`}
                    >
                      <td className="p-1 text-left">
                        {team.position <= 3 ? (
                          <span
                            className={`
                            inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold
                            ${
                              team.position === 1
                                ? "bg-yellow-900/50 text-yellow-400"
                                : team.position === 2
                                  ? "bg-slate-400/20 text-slate-300"
                                  : "bg-amber-800/30 text-amber-400"
                            }
                          `}
                          >
                            {team.position}
                          </span>
                        ) : (
                          <span className="text-slate-400">{team.position}</span>
                        )}
                      </td>
                      <td
                        className={`p-1 text-left font-medium ${
                          team.team_name === homeTeam
                            ? "text-green-400"
                            : team.team_name === awayTeam
                              ? "text-yellow-400"
                              : "text-white"
                        }`}
                      >
                        {team.team_name}
                      </td>
                      <td className="p-1 text-center text-slate-300">{team.matches_played}</td>
                      <td className="p-1 text-center text-green-400">{team.won}</td>
                      <td className="p-1 text-center text-yellow-400">{team.draw}</td>
                      <td className="p-1 text-center text-red-400">{team.lost}</td>
                      <td className="p-1 text-center text-slate-300">{team.goals_for}</td>
                      <td className="p-1 text-center text-slate-300">{team.goals_against}</td>
                      <td className="p-1 text-center font-bold text-white">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="teams" className="p-3 space-y-3">
            {homeTeamStanding && (
              <div className="p-2 bg-green-900/20 border border-green-700/30 rounded-md">
                <h4 className="text-xs font-medium text-green-400 mb-1">{homeTeam}</h4>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">{t('positionTitle')}:</span>
                    <span className="ml-1 font-bold text-white">{homeTeamStanding.position}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('pointsTitle')}:</span>
                    <span className="ml-1 font-bold text-white">{homeTeamStanding.points}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('matchesPlayed')}:</span>
                    <span className="ml-1 text-white">
                      {homeTeamStanding.matches_played}/{homeTeamStanding.won}/{homeTeamStanding.draw}/
                      {homeTeamStanding.lost}
                    </span>
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">{t('standingsPositionDifference')}:</span>
                    <span className="ml-1 text-white">
                      {homeTeamStanding.goals_for}-{homeTeamStanding.goals_against}(
                      {homeTeamStanding.goals_for - homeTeamStanding.goals_against > 0 ? "+" : ""}
                      {homeTeamStanding.goals_for - homeTeamStanding.goals_against})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('form')}:</span>
                    <span className="ml-1">
                      {homeTeamStanding.form.split("").map((result, i) => (
                        <span
                          key={i}
                          className={`inline-block w-4 h-4 text-[10px] text-center leading-4 rounded-sm ml-0.5 
                            ${
                              result === "W"
                                ? "bg-green-900/50 text-green-400"
                                : result === "D"
                                  ? "bg-yellow-900/50 text-yellow-400"
                                  : "bg-red-900/50 text-red-400"
                            }`}
                        >
                          {result === "W" ? t('win').charAt(0) : result === "D" ? t('draw').charAt(0) : t('loss').charAt(0)}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {awayTeamStanding && (
              <div className="p-2 bg-yellow-900/20 border border-yellow-700/30 rounded-md">
                <h4 className="text-xs font-medium text-yellow-400 mb-1">{awayTeam}</h4>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">{t('positionTitle')}:</span>
                    <span className="ml-1 font-bold text-white">{awayTeamStanding.position}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('pointsTitle')}:</span>
                    <span className="ml-1 font-bold text-white">{awayTeamStanding.points}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('matchesPlayed')}:</span>
                    <span className="ml-1 text-white">
                      {awayTeamStanding.matches_played}/{awayTeamStanding.won}/{awayTeamStanding.draw}/
                      {awayTeamStanding.lost}
                    </span>
                  </div>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">{t('standingsPositionDifference')}:</span>
                    <span className="ml-1 text-white">
                      {awayTeamStanding.goals_for}-{awayTeamStanding.goals_against}(
                      {awayTeamStanding.goals_for - awayTeamStanding.goals_against > 0 ? "+" : ""}
                      {awayTeamStanding.goals_for - awayTeamStanding.goals_against})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">{t('form')}:</span>
                    <span className="ml-1">
                      {awayTeamStanding.form.split("").map((result, i) => (
                        <span
                          key={i}
                          className={`inline-block w-4 h-4 text-[10px] text-center leading-4 rounded-sm ml-0.5 
                            ${
                              result === "W"
                                ? "bg-green-900/50 text-green-400"
                                : result === "D"
                                  ? "bg-yellow-900/50 text-yellow-400"
                                  : "bg-red-900/50 text-red-400"
                            }`}
                        >
                          {result === "W" ? t('win').charAt(0) : result === "D" ? t('draw').charAt(0) : t('loss').charAt(0)}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
