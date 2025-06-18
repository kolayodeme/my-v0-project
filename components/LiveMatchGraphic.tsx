"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/components/language-provider"
import { AlertTriangle, Flag, ShieldAlert, Goal, Clock, Loader2 } from "lucide-react"
import { getMatchDetails, getMatchStatistics, getLiveMatches } from "@/lib/football-api"

// Maç olayları tipi
type MatchEvent = {
  id: string
  type: "attack" | "goal" | "yellowCard" | "redCard" | "corner" | "foul"
  team: "home" | "away"
  minute: number
  player?: string
  description: string
}

// Takım bilgisi tipi
type Team = {
  id: string
  name: string
  score: number
  logo?: string
}

interface LiveMatchGraphicProps {
  matchId?: string
  homeTeamName?: string
  awayTeamName?: string
  homeTeamId?: string
  awayTeamId?: string
  homeTeamLogo?: string
  awayTeamLogo?: string
  homeScore?: string
  awayScore?: string
  matchStatus?: string
  matchElapsed?: string
  isLive?: boolean
}

export function LiveMatchGraphic({
  matchId,
  homeTeamName = "Ev Sahibi",
  awayTeamName = "Deplasman",
  homeTeamId,
  awayTeamId,
  homeTeamLogo,
  awayTeamLogo,
  homeScore = "0",
  awayScore = "0",
  matchStatus = "",
  matchElapsed = "0",
  isLive = true
}: LiveMatchGraphicProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<"field" | "stats" | "lineup" | "chat">("field")
  const [matchTime, setMatchTime] = useState(parseInt(matchElapsed) || 0)
  const [matchEvents, setMatchEvents] = useState<MatchEvent[]>([])
  const [currentEvent, setCurrentEvent] = useState<MatchEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [homeTeam, setHomeTeam] = useState<Team>({
    id: homeTeamId || "1",
    name: homeTeamName || "Ev Sahibi",
    score: parseInt(homeScore) || 0,
    logo: homeTeamLogo || "/placeholder.svg"
  })
  const [awayTeam, setAwayTeam] = useState<Team>({
    id: awayTeamId || "2",
    name: awayTeamName || "Deplasman",
    score: parseInt(awayScore) || 0,
    logo: awayTeamLogo || "/placeholder.svg"
  })
  const [stats, setStats] = useState<any>(null)
  const [currentMatchElapsed, setCurrentMatchElapsed] = useState(matchElapsed)
  const [leagueInfo, setLeagueInfo] = useState<{name: string, logo?: string}>({name: ""})
  const [lastAttackTeam, setLastAttackTeam] = useState<"home" | "away" | null>(null)
  const [ballPosition, setBallPosition] = useState({x: 50, y: 50})
  const [playerPositions, setPlayerPositions] = useState<{team: "home" | "away", x: number, y: number, player?: string}[]>([])

  // Takım bilgilerini güncelle
  useEffect(() => {
    if (matchId) {
      setHomeTeam({
        id: homeTeamId || "1",
        name: homeTeamName || "Ev Sahibi",
        score: parseInt(homeScore) || 0,
        logo: homeTeamLogo || "/placeholder.svg"
      })
      
      setAwayTeam({
        id: awayTeamId || "2",
        name: awayTeamName || "Deplasman",
        score: parseInt(awayScore) || 0,
        logo: awayTeamLogo || "/placeholder.svg"
      })
      
      setCurrentMatchElapsed(matchElapsed)
      setMatchTime(parseInt(matchElapsed) || 0)
    }
  }, [homeTeamId, homeTeamName, homeTeamLogo, homeScore, awayTeamId, awayTeamName, awayTeamLogo, awayScore, matchElapsed, matchId])

  // Maç zamanını güncelle - Her 30 saniyede bir gerçek zamanlı güncelleme
  useEffect(() => {
    if (!isLive) return
    
    // API'den gelen başlangıç dakikasını ayarla
    setMatchTime(parseInt(currentMatchElapsed) || 0)
    
    const timer = setInterval(() => {
      // Canlı maçlar için API'den yeni dakika bilgisini kontrol et
      if (matchId) {
        getMatchDetails(matchId).then(details => {
          if (details && Array.isArray(details) && details.length > 0) {
            const matchDetail = details[0];
            if (matchDetail && matchDetail.match_elapsed) {
              const newElapsed = matchDetail.match_elapsed;
              console.log("API'den alınan güncel dakika:", newElapsed);
              setCurrentMatchElapsed(newElapsed);
              setMatchTime(parseInt(newElapsed));
            }
          }
        }).catch(err => {
          console.error("Maç dakikası güncellenirken hata:", err);
          // Hata durumunda manuel olarak arttır
          setMatchTime(prevTime => {
            const newTime = prevTime + 1;
            setCurrentMatchElapsed(newTime.toString());
            return newTime;
          });
        });
      } else {
        // Eğer matchId yoksa manuel olarak arttır
        setMatchTime(prevTime => {
          const newTime = prevTime + 1;
          setCurrentMatchElapsed(newTime.toString());
          return newTime;
        });
      }
      
      // Top ve oyuncu pozisyonlarını güncelle
      updateDynamicElements();
    }, 30000); // Her 30 saniyede bir güncelle

    return () => clearInterval(timer);
  }, [isLive, currentMatchElapsed, matchId]);
  
  // Top ve oyuncu pozisyonlarını güncelleme fonksiyonu
  const updateDynamicElements = useCallback(() => {
    // Son olaya göre top pozisyonunu güncelle
    if (currentEvent) {
      if (currentEvent.team === "home") {
        setBallPosition({
          x: Math.random() * 30 + 50, // Sağ taraf (ev sahibi atak)
          y: Math.random() * 60 + 20
        });
        setLastAttackTeam("home");
      } else {
        setBallPosition({
          x: Math.random() * 30 + 20, // Sol taraf (deplasman atak)
          y: Math.random() * 60 + 20
        });
        setLastAttackTeam("away");
      }
    } else {
      // Rastgele orta saha pozisyonu
      setBallPosition({
        x: Math.random() * 20 + 40,
        y: Math.random() * 20 + 40
      });
    }
    
    // Oyuncu pozisyonlarını güncelle
    const newPositions: {team: "home" | "away", x: number, y: number, player?: string}[] = [];
    
    // Ev sahibi takım oyuncuları (5 oyuncu)
    for (let i = 0; i < 5; i++) {
      let xPos, yPos;
      
      if (lastAttackTeam === "home") {
        // Atak durumunda ileri pozisyonlar
        xPos = Math.random() * 30 + 50;
        yPos = 20 + (i * 15);
      } else {
        // Savunma durumunda geri pozisyonlar
        xPos = Math.random() * 30 + 10;
        yPos = 20 + (i * 15);
      }
      
      newPositions.push({
        team: "home",
        x: xPos,
        y: yPos
      });
    }
    
    // Deplasman takımı oyuncuları (5 oyuncu)
    for (let i = 0; i < 5; i++) {
      let xPos, yPos;
      
      if (lastAttackTeam === "away") {
        // Atak durumunda ileri pozisyonlar
        xPos = Math.random() * 30 + 10;
        yPos = 20 + (i * 15);
      } else {
        // Savunma durumunda geri pozisyonlar
        xPos = Math.random() * 30 + 60;
        yPos = 20 + (i * 15);
      }
      
      newPositions.push({
        team: "away",
        x: xPos,
        y: yPos
      });
    }
    
    // Gol atan oyuncuları ekle
    matchEvents.forEach(event => {
      if (event.type === "goal" && event.player) {
        const teamSide = event.team === "home" ? "home" : "away";
        const xPos = event.team === "home" ? 75 : 25;
        const yPos = Math.random() * 60 + 20;
        
        // Gol atan oyuncuyu özel pozisyona ekle
        newPositions.push({
          team: teamSide,
          x: xPos,
          y: yPos,
          player: event.player
        });
      }
    });
    
    setPlayerPositions(newPositions);
  }, [currentEvent, lastAttackTeam, matchEvents]);

  // Maç olaylarını işleme fonksiyonu
  const processMatchEvents = useCallback((detailsData: any) => {
    if (detailsData && Array.isArray(detailsData)) {
      const details = detailsData[0]
      const events: MatchEvent[] = []
      
      // Golleri ekle
      if (details && details.goalscorer && Array.isArray(details.goalscorer)) {
        details.goalscorer.forEach((goal: any, index: number) => {
          if (goal.time && (goal.home_scorer || goal.away_scorer)) {
            events.push({
              id: `goal-${index}`,
              type: "goal",
              team: goal.home_scorer ? "home" : "away",
              minute: parseInt(goal.time),
              player: goal.home_scorer || goal.away_scorer,
              description: `Gol! ${goal.home_scorer || goal.away_scorer} (${goal.time}')`
            })
          }
        })
      }
      
      // Kartları ekle
      if (details && details.cards && Array.isArray(details.cards)) {
        details.cards.forEach((card: any, index: number) => {
          if (card.time && (card.home_fault || card.away_fault)) {
            events.push({
              id: `card-${index}`,
              type: card.card === "yellow card" ? "yellowCard" : "redCard",
              team: card.home_fault ? "home" : "away",
              minute: parseInt(card.time),
              player: card.home_fault || card.away_fault,
              description: `${card.card === "yellow card" ? "Sarı Kart" : "Kırmızı Kart"} ${card.home_fault || card.away_fault} (${card.time}')`
            })
          }
        })
      }
      
      // Tehlikeli ataklar ekle (API'den gelmiyorsa, maçın akışına göre tahmin et)
      // Maç dakikasına göre otomatik atak olayları oluştur
      const currentMinute = parseInt(currentMatchElapsed)
      
      // Her 5 dakikada bir tehlikeli atak ekle (daha gerçekçi maç akışı için)
      if (currentMinute % 5 === 0 && currentMinute > 0) {
        const attackTeam = Math.random() > 0.5 ? "home" : "away";
        events.push({
          id: `attack-${attackTeam}-${currentMinute}`,
          type: "attack",
          team: attackTeam,
          minute: currentMinute,
          description: "Tehlikeli atak"
        });
        setLastAttackTeam(attackTeam);
      }
      
      // Olayları dakikaya göre sırala
      events.sort((a, b) => a.minute - b.minute)
      setMatchEvents(events)
      
      // Dinamik elemanları güncelle
      updateDynamicElements();
    }
  }, [currentMatchElapsed, updateDynamicElements])

  // Rastgele bir canlı maç seç ve verilerini kullan
  const fetchRandomLiveMatch = useCallback(async () => {
    if (matchId) return // Eğer matchId varsa, rastgele maç seçme

    try {
      setLoading(true)
      setError(null)
      
      // Canlı maçları çek
      const liveMatches = await getLiveMatches()
      
      if (liveMatches && Array.isArray(liveMatches) && liveMatches.length > 0) {
        console.log("Çekilen canlı maçlar:", liveMatches)
        
        // Rastgele bir canlı maç seç
        const randomIndex = Math.floor(Math.random() * liveMatches.length)
        const randomMatch = liveMatches[randomIndex]
        
        console.log("Seçilen canlı maç:", randomMatch)
        
        // Seçilen maçın ID'sini kullanarak detay ve istatistik bilgilerini çek
        const [detailsData, statsData] = await Promise.all([
          getMatchDetails(randomMatch.match_id),
          getMatchStatistics(randomMatch.match_id)
        ])
        
        console.log("Çekilen maç detayları:", detailsData)
        
        // Takım bilgilerini güncelle - API'den gelen gerçek verilerle
        setHomeTeam({
          id: randomMatch.match_hometeam_id,
          name: randomMatch.match_hometeam_name,
          score: parseInt(randomMatch.match_hometeam_score || "0"),
          logo: randomMatch.team_home_badge || "/placeholder.svg"
        })
        
        setAwayTeam({
          id: randomMatch.match_awayteam_id,
          name: randomMatch.match_awayteam_name,
          score: parseInt(randomMatch.match_awayteam_score || "0"),
          logo: randomMatch.team_away_badge || "/placeholder.svg"
        })
        
        // Lig bilgilerini ayarla
        setLeagueInfo({
          name: randomMatch.league_name || "",
          logo: randomMatch.league_logo || undefined
        });
        
        // Maç durumu ve geçen süreyi güncelle - API'den gelen gerçek verilerle
        setCurrentMatchElapsed(randomMatch.match_elapsed || "0")
        setMatchTime(parseInt(randomMatch.match_elapsed || "0"))
        
        // Maç olaylarını işle - API'den gelen gerçek verilerle
        if (detailsData && Array.isArray(detailsData) && detailsData.length > 0) {
          processMatchEvents(detailsData)
        } else {
          setMatchEvents([])
        }
        
        // İstatistikleri ayarla - API'den gelen gerçek verilerle
        if (statsData) {
          setStats(statsData)
        }
        
        // İlk dinamik elemanları ayarla
        updateDynamicElements();
      } else {
        console.error("Canlı maç bulunamadı veya API yanıtı geçersiz:", liveMatches)
        setError("Canlı maç bulunamadı. Lütfen daha sonra tekrar deneyin.")
      }
    } catch (error) {
      console.error("Rastgele canlı maç yüklenirken hata:", error)
      setError("Maç verileri yüklenirken hata oluştu. Lütfen daha sonra tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }, [matchId, processMatchEvents, updateDynamicElements])

  // Mevcut olayı ayarla
  useEffect(() => {
    // Mevcut dakikaya göre en son olayı bul
    const currentEvents = matchEvents.filter(e => e.minute <= matchTime)
    if (currentEvents.length > 0) {
      const lastEvent = currentEvents[currentEvents.length - 1]
      setCurrentEvent(lastEvent)
    } else {
      setCurrentEvent(null)
    }
  }, [matchEvents, matchTime])

  // Olay tipi simgesini göster
  const renderEventIcon = (type: MatchEvent["type"]) => {
    switch (type) {
      case "attack":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />
      case "goal":
        return <Goal className="w-4 h-4 text-green-400" />
      case "yellowCard":
        return <div className="w-3 h-4 bg-yellow-400 rounded-sm" />
      case "redCard":
        return <div className="w-3 h-4 bg-red-500 rounded-sm" />
      case "corner":
        return <Flag className="w-4 h-4 text-blue-400" />
      case "foul":
        return <ShieldAlert className="w-4 h-4 text-red-400" />
      default:
        return null
    }
  }

  // Futbol sahası render fonksiyonu
  const renderFootballField = () => {
    return (
      <div className="relative bg-gradient-to-br from-green-800 to-green-900 aspect-[4/3] overflow-hidden">
        {/* Saha çizgileri */}
        <div className="absolute inset-0">
          {/* Orta çizgi */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/30 transform -translate-x-1/2"></div>
          
          {/* Orta daire */}
          <div className="absolute left-1/2 top-1/2 w-24 h-24 border border-white/30 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white/30 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Ceza sahaları */}
          {/* Sol (ev sahibi) */}
          <div className="absolute left-0 top-1/2 w-16 h-32 border-r border-white/30 transform -translate-y-1/2"></div>
          <div className="absolute left-0 top-1/2 w-5 h-12 border-r border-white/30 transform -translate-y-1/2"></div>
          
          {/* Sağ (deplasman) */}
          <div className="absolute right-0 top-1/2 w-16 h-32 border-l border-white/30 transform -translate-y-1/2"></div>
          <div className="absolute right-0 top-1/2 w-5 h-12 border-l border-white/30 transform -translate-y-1/2"></div>
          
          {/* Kale çizgileri */}
          <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-white/30"></div>
          <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/30"></div>
          <div className="absolute left-0 right-0 top-0 h-[1px] bg-white/30"></div>
          <div className="absolute left-0 right-0 bottom-0 h-[1px] bg-white/30"></div>
        </div>

        {/* Lig bilgisi */}
        {leagueInfo.name && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-slate-900/70 px-2 py-1 rounded-b-md">
            <div className="flex items-center">
              {leagueInfo.logo && (
                <img 
                  src={leagueInfo.logo} 
                  alt={leagueInfo.name} 
                  className="w-4 h-4 mr-1 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <span className="text-white text-xs">{leagueInfo.name}</span>
            </div>
          </div>
        )}

        {/* Takım adları ve skorlar */}
        <div className="absolute top-2 left-2">
          <div className="flex items-center">
            {homeTeam.logo && (
              <img 
                src={homeTeam.logo} 
                alt={homeTeam.name} 
                className="w-6 h-6 mr-1 object-contain bg-white rounded-full p-0.5"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            )}
            <Badge className="bg-slate-800/70 text-white text-xs">{homeTeam.name}</Badge>
          </div>
        </div>
        <div className="absolute top-2 right-2">
          <div className="flex items-center">
            <Badge className="bg-slate-800/70 text-white text-xs mr-1">{awayTeam.name}</Badge>
            {awayTeam.logo && (
              <img 
                src={awayTeam.logo} 
                alt={awayTeam.name} 
                className="w-6 h-6 object-contain bg-white rounded-full p-0.5"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            )}
          </div>
        </div>
        
        {/* Skor gösterimi */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 flex items-center bg-slate-900/70 px-3 py-1 rounded-full">
          <span className="text-white font-medium text-sm">{homeTeam.score}</span>
          <span className="text-slate-400 mx-1">-</span>
          <span className="text-white font-medium text-sm">{awayTeam.score}</span>
        </div>
        
        {/* Maç zamanı */}
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 flex items-center bg-slate-900/70 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3 text-red-400 mr-1 animate-pulse" />
          <span className="text-white text-xs">{currentMatchElapsed}'</span>
        </div>
        
        {/* Mevcut olay gösterimi */}
        {currentEvent && (
          <div className={`absolute ${
            currentEvent.team === "home" 
              ? "left-1/4" 
              : "right-1/4"
            } top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-pulse`}>
            <div className="bg-slate-900/80 text-white px-2 py-1 rounded-md text-xs flex items-center mb-1">
              {renderEventIcon(currentEvent.type)}
              <span className="ml-1">{currentEvent.description}</span>
            </div>
            {currentEvent.type === "goal" && (
              <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
            )}
            {currentEvent.type === "attack" && (
              <div className="w-3 h-3 border-2 border-amber-400 rounded-full"></div>
            )}
            {currentEvent.type === "yellowCard" && (
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            )}
            {currentEvent.type === "redCard" && (
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            )}
          </div>
        )}

        {/* Oyuncu pozisyonları - Dinamik */}
        {playerPositions.map((player, index) => (
          <div 
            key={`player-${index}`}
            className={`absolute w-2 h-2 ${player.team === "home" ? "bg-blue-500" : "bg-red-500"} rounded-full animate-pulse group`}
            style={{
              left: `${player.x}%`,
              top: `${player.y}%`,
              transform: "translate(-50%, -50%)",
              transition: "all 0.5s ease-in-out"
            }}
          >
            {player.player && (
              <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-900/80 text-white text-xs p-1 rounded whitespace-nowrap">
                {player.player}
              </div>
            )}
          </div>
        ))}
        
        {/* Top animasyonu - Dinamik */}
        <div 
          className="absolute w-2 h-2 bg-white rounded-full shadow-md animate-bounce"
          style={{
            left: `${ballPosition.x}%`,
            top: `${ballPosition.y}%`,
            transform: "translate(-50%, -50%)",
            transition: "all 0.5s ease-in-out"
          }}
        ></div>

        {/* Tüm olayların listesi - Sahada küçük göstergeler olarak */}
        {matchEvents.map(event => {
          // Olayın pozisyonunu hesapla
          const leftPos = event.team === "home" ? 
            Math.max(10, Math.min(40, event.minute / 2)) : 
            undefined;
          
          const rightPos = event.team === "away" ? 
            Math.max(10, Math.min(40, event.minute / 2)) : 
            undefined;
          
          const topPos = 20 + (event.minute % 60);
          
          return (
            <div 
              key={event.id} 
              style={{
                position: 'absolute',
                left: leftPos ? `${leftPos}%` : undefined,
                right: rightPos ? `${rightPos}%` : undefined,
                top: `${topPos}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 10
              }}
              className="group"
            >
              {event.type === "goal" && (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-900/80 text-white text-xs p-1 rounded whitespace-nowrap">
                    {event.player ? `Gol: ${event.player} (${event.minute}')` : `Gol (${event.minute}')`}
                  </div>
                </>
              )}
              {event.type === "yellowCard" && (
                <>
                  <div className="w-2 h-3 bg-yellow-400 rounded-sm"></div>
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-900/80 text-white text-xs p-1 rounded whitespace-nowrap">
                    {event.player ? `Sarı Kart: ${event.player} (${event.minute}')` : `Sarı Kart (${event.minute}')`}
                  </div>
                </>
              )}
              {event.type === "redCard" && (
                <>
                  <div className="w-2 h-3 bg-red-500 rounded-sm"></div>
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-900/80 text-white text-xs p-1 rounded whitespace-nowrap">
                    {event.player ? `Kırmızı Kart: ${event.player} (${event.minute}')` : `Kırmızı Kart (${event.minute}')`}
                  </div>
                </>
              )}
              {event.type === "attack" && (
                <>
                  <div className="w-3 h-3 border-2 border-amber-400 rounded-full animate-pulse"></div>
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-900/80 text-white text-xs p-1 rounded whitespace-nowrap">
                    Tehlikeli Atak ({event.minute}')
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="relative bg-gradient-to-br from-green-800 to-green-900 aspect-[4/3] overflow-hidden flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
          <p className="text-sm text-white">Maç verileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative bg-gradient-to-br from-green-800 to-green-900 aspect-[4/3] overflow-hidden flex items-center justify-center">
        <div className="bg-slate-900/80 p-4 rounded-lg text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-white">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            onClick={() => fetchRandomLiveMatch()}
          >
            Tekrar Dene
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Futbol sahası */}
      {renderFootballField()}

      {/* Alt menü */}
      <div className="flex border-t border-slate-700/50 bg-slate-800">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex-1 rounded-none h-10 text-xs ${activeTab === "field" ? "bg-slate-700" : ""}`}
          onClick={() => setActiveTab("field")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="12" y1="3" x2="12" y2="21"></line>
          </svg>
          Saha
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex-1 rounded-none h-10 text-xs ${activeTab === "stats" ? "bg-slate-700" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M3 3v18h18"></path>
            <path d="M18 12V8"></path>
            <path d="M14 12V6"></path>
            <path d="M10 12V4"></path>
            <path d="M6 12v-2"></path>
          </svg>
          İstatistik
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex-1 rounded-none h-10 text-xs ${activeTab === "lineup" ? "bg-slate-700" : ""}`}
          onClick={() => setActiveTab("lineup")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          Kadro
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex-1 rounded-none h-10 text-xs ${activeTab === "chat" ? "bg-slate-700" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Sohbet
        </Button>
      </div>
    </div>
  )
} 