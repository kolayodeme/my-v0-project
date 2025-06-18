"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { H2HAnalysis } from "./h2h-analysis"
import { LastTenMatchAnalysis } from "./last-ten-match-analysis"
import { getTeamLastMatches, getStandings, getH2HMatches } from "@/lib/api"
import { Loader2, Trophy, TrendingUp, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "./language-provider"
import { UpcomingMatchPrediction } from "./upcoming-match-prediction"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { BarChart2 } from "lucide-react"

interface MatchDetailsProps {
  matchId: string
  homeTeam: string
  awayTeam: string
  homeTeamId: string
  awayTeamId: string
  isLive?: boolean
}

// API'den takımın puan durumunu çek
const getTeamStandings = async (teamId: string, teamName: string, leagueId?: string) => {
  try {
    // Gerçek API'den takımın lig bilgilerini çek
    if (!leagueId) {
      // Takımın lig bilgisi yoksa, varsayılan bir lig ID'si kullanıyoruz
      leagueId = "148"; // Süper Lig ID'si varsayılan olarak
    }
    
    // Ligin puan durumunu çek
    const standings = await getStandings(leagueId);
    
    if (!Array.isArray(standings) || standings.length === 0) {
      console.log("API'den puan durumu verisi alınamadı veya boş dizi döndü");
      return null;
    }
    
    console.log(`${teamName} için puan durumu aranıyor, ID: ${teamId}`);
    
    // Önce ID ile eşleşme ara
    let teamStanding = standings.find((item: any) => {
      return item.team_id === teamId || 
             item.team_id === parseInt(teamId) || 
             item.team_id === teamId.toString();
    });
    
    // ID ile bulunamadıysa, takım adı ile ara (tam veya kısmi eşleşme)
    if (!teamStanding) {
      console.log(`${teamName} için ID ile eşleşme bulunamadı, isim ile aranıyor`);
      
      // Takım adını küçük harfe çevir ve normalize et
      const normalizedTeamName = teamName.toLowerCase().trim();
      
      teamStanding = standings.find((item: any) => {
        // Takım adı tam eşleşme
        if (item.team_name && item.team_name.toLowerCase().trim() === normalizedTeamName) {
          return true;
        }
        
        // Kısmi eşleşme (takım adı diğerini içeriyor mu?)
        if (item.team_name && 
            (item.team_name.toLowerCase().includes(normalizedTeamName) || 
             normalizedTeamName.includes(item.team_name.toLowerCase()))) {
          return true;
        }
        
        return false;
      });
    }
    
    if (teamStanding) {
      console.log(`${teamName} için puan durumu bulundu:`, teamStanding.team_name);
      return {
        position: parseInt(teamStanding.overall_league_position) || 0,
        points: parseInt(teamStanding.overall_league_PTS) || 0,
        played: parseInt(teamStanding.overall_league_payed) || 0,
        won: parseInt(teamStanding.overall_league_W) || 0,
        drawn: parseInt(teamStanding.overall_league_D) || 0,
        lost: parseInt(teamStanding.overall_league_L) || 0,
        goalsFor: parseInt(teamStanding.overall_league_GF) || 0,
        goalsAgainst: parseInt(teamStanding.overall_league_GA) || 0
      };
    } else {
      console.log(`${teamName} için puan durumu bulunamadı`);
      // Takım puan durumu bulunamadıysa, boş bir nesne döndür
      return null;
    }
  } catch (error) {
    console.error(`Error fetching team standings for ${teamName}:`, error);
    // Hata durumunda null döndür
    return null;
  }
};

const StandingsComparison = ({
  homeTeam,
  awayTeam,
  homeStanding,
  awayStanding,
}: {
  homeTeam: string
  awayTeam: string
  homeStanding: any
  awayStanding: any
}) => {
  const { t } = useTranslation()

  if (!homeStanding && !awayStanding) {
    return (
      <div className="text-center p-4">
        <p className="text-xs text-slate-400">{t('noStandingsInfo')}</p>
      </div>
    )
  }

  if (!homeStanding || !awayStanding) {
    return (
      <div className="text-center p-4">
        <p className="text-xs text-slate-400">
          {t('teamStandingsNotFound', {teamName: !homeStanding ? homeTeam : awayTeam})}
        </p>
      </div>
    )
  }

  const positionDiff = homeStanding.position - awayStanding.position
  const pointsDiff = homeStanding.points - awayStanding.points

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center mb-3">
        <Trophy className="w-4 h-4 text-yellow-500 mr-2" />
        <h3 className="text-sm font-medium text-green-400">{t('standingsComparisonTitle')}</h3>
      </div>
      {/* Position Comparison */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xs text-slate-400 mb-1">{homeTeam}</div>
              <Badge
                className={`text-xs ${homeStanding.position <= awayStanding.position ? "bg-green-600" : "bg-red-600"}`}
              >
                {homeStanding.position}. sıra
              </Badge>
            </div>
            <div className="flex flex-col items-center justify-center">
              <TrendingUp className="w-3 h-3 text-slate-400 mb-1" />
              <div className="text-xs text-slate-400">{Math.abs(positionDiff)} sıra fark</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-1">{awayTeam}</div>
              <Badge
                className={`text-xs ${awayStanding.position <= homeStanding.position ? "bg-green-600" : "bg-red-600"}`}
              >
                {awayStanding.position}. sıra
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Points Comparison */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-green-400">{homeStanding.points}</div>
              <div className="text-xs text-slate-400">puan</div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="text-xs text-slate-400 mb-1">Puan Farkı</div>
              <Badge variant="outline" className="text-xs">
                {Math.abs(pointsDiff)} puan
              </Badge>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-400">{awayStanding.points}</div>
              <div className="text-xs text-slate-400">puan</div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Detailed Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-2">
            <div className="text-xs text-center">
              <div className="font-medium text-green-400 mb-1">{homeTeam}</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Maç:</span>
                  <span className="text-white">{homeStanding.played}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">G:</span>
                  <span className="text-green-400">{homeStanding.won}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">B:</span>
                  <span className="text-yellow-400">{homeStanding.drawn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">M:</span>
                  <span className="text-red-400">{homeStanding.lost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">A/Y:</span>
                  <span className="text-white">
                    {homeStanding.goalsFor}/{homeStanding.goalsAgainst}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-2">
            <div className="text-xs text-center">
              <div className="font-medium text-yellow-400 mb-1">{awayTeam}</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Maç:</span>
                  <span className="text-white">{awayStanding.played}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">G:</span>
                  <span className="text-green-400">{awayStanding.won}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">B:</span>
                  <span className="text-yellow-400">{awayStanding.drawn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">M:</span>
                  <span className="text-red-400">{awayStanding.lost}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">A/Y:</span>
                  <span className="text-white">
                    {awayStanding.goalsFor}/{awayStanding.goalsAgainst}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function MatchDetails({
  matchId,
  homeTeam,
  awayTeam,
  homeTeamId,
  awayTeamId,
  isLive = false,
}: MatchDetailsProps) {
  const [homeLastMatches, setHomeLastMatches] = useState<any[]>([])
  const [awayLastMatches, setAwayLastMatches] = useState<any[]>([])
  const [h2h, setH2h] = useState<any>(null)
  const [standings, setStandings] = useState<{ home: any; away: any } | null>(null)
  const [loading, setLoading] = useState({ h2h: true, last10: true, standings: true })
  const { t } = useTranslation()

  useEffect(() => {
    setLoading({ h2h: true, last10: true, standings: true })
    // Paralel veri çekme
    Promise.all([
      getH2HMatches(homeTeamId, awayTeamId).then((data) => setH2h(data)).finally(() => setLoading((l) => ({ ...l, h2h: false }))),
      Promise.all([
        getTeamLastMatches(homeTeamId, 10),
        getTeamLastMatches(awayTeamId, 10),
      ]).then(([home, away]) => {
        setHomeLastMatches(Array.isArray(home) ? home : [])
        setAwayLastMatches(Array.isArray(away) ? away : [])
      }).finally(() => setLoading((l) => ({ ...l, last10: false }))),
      Promise.all([
        getTeamStandings(homeTeamId, homeTeam),
        getTeamStandings(awayTeamId, awayTeam),
      ]).then(([home, away]) => {
        setStandings({ home, away })
      }).finally(() => setLoading((l) => ({ ...l, standings: false }))),
    ])
  }, [homeTeamId, awayTeamId, homeTeam, awayTeam])

  return (
    <div className="space-y-4">
      <Tabs defaultValue="standings" className="w-full">
        <TabsList className="grid grid-cols-3 h-auto bg-slate-800/50">
          <TabsTrigger value="standings" className="text-xs py-1 px-2">
            {t('standings')}
          </TabsTrigger>
          <TabsTrigger value="h2h" className="text-xs py-1 px-2">
            H2H
          </TabsTrigger>
          <TabsTrigger value="last10" className="text-xs py-1 px-2">
            {t('last10Matches')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standings" className="mt-2">
          {loading.standings ? (
            <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-green-500" /></div>
          ) : (
            <StandingsComparison
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              homeStanding={standings?.home}
              awayStanding={standings?.away}
            />
          )}
        </TabsContent>

        <TabsContent value="h2h" className="mt-2">
          {loading.h2h ? (
            <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-green-500" /></div>
          ) : (
            <H2HAnalysis
              firstTeamId={homeTeamId}
              secondTeamId={awayTeamId}
              firstTeamName={homeTeam}
              secondTeamName={awayTeam}
              h2hData={h2h}
            />
          )}
        </TabsContent>

        <TabsContent value="last10" className="mt-2">
          {loading.last10 ? (
            <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-green-500" /></div>
          ) : (
            <div className="space-y-3">
              <LastTenMatchAnalysis teamId={homeTeamId} teamName={homeTeam} matches={homeLastMatches} />
              <LastTenMatchAnalysis teamId={awayTeamId} teamName={awayTeam} matches={awayLastMatches} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
