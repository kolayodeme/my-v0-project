import axios from "axios"
import { cacheService } from "./cache-service"
import { useTranslation } from "@/components/language-provider"

// API anahtarı ve temel URL - process.env kullanımı
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "767e82cff88f63361a9e21f78879bcf500259b55045dcd2af66f5fbcf8f566c9"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://apiv3.apifootball.com"

// Axios örneği oluştur
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  params: {
    APIkey: API_KEY,
  },
  timeout: 10000, // 10 saniye timeout
})

// Çeviri fonksiyonu
const getTranslation = () => {
  try {
    // Client-side'da çalışıyorsa useTranslation kullan
    if (typeof window !== 'undefined') {
      return useTranslation().t
    }
  } catch (error) {
    // Server-side veya hook kullanılamadığında basit bir fonksiyon döndür
    return (key: string) => key
  }
  
  // Fallback olarak basit bir fonksiyon döndür
  return (key: string) => key
}

// Yeniden deneme mantığı ekle
apiClient.interceptors.response.use(undefined, async (error) => {
  const { config, response } = error

  // Sadece ağ hatalarında veya 5xx hatalarında yeniden dene
  if (!response || (response && response.status >= 500)) {
    config._retryCount = config._retryCount || 0

    if (config._retryCount < 3) {
      config._retryCount += 1

      // Üstel geri çekilme
      const delay = 1000 * Math.pow(2, config._retryCount)
      console.log(`API isteği yeniden deneniyor (${config._retryCount}/3) ${delay}ms sonra...`)
      await new Promise((resolve) => setTimeout(resolve, delay))

      return apiClient(config)
    }
  }

  // Hata bilgilerini logla
  console.error("API Hatası:", {
    url: config.url,
    params: config.params,
    status: response?.status,
    statusText: response?.statusText,
    data: response?.data,
  })

  return Promise.reject(error)
})

// API yanıtlarını işle
const handleApiResponse = async <T>(apiCall: Promise<any>, cacheKey: string, cacheDuration: number): Promise<T> => {
  try {
    // Önbellekten veriyi kontrol et - daha önce değişmeyecek veriler için daha uzun süre önbellekte tut
    const cachedData = cacheService.get(cacheKey)
    if (cachedData) {
      return cachedData as T
    }

    // Performans optimizasyonu: AbortController ile zaman aşımı ekle
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 saniye zaman aşımı
    
    // API'den veriyi çek
    const response = await apiCall;
    clearTimeout(timeoutId);
    
    if (response.data) {
      // API yanıtını işlemek için requestIdleCallback kullan (tarayıcı boşta ise)
      const processData = () => {
        // Veriyi önbelleğe al
        cacheService.set(cacheKey, response.data, cacheDuration)
        return response.data
      }
      
      // Tarayıcı için performans optimizasyonu
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        window.requestIdleCallback(() => processData())
      } else {
        // RequestIdleCallback kullanılamıyorsa direkt işle
        processData()
      }
      
      return response.data as T
    }

    throw new Error("apiError")
  } catch (error) {
    console.error(`API çağrısında hata (${cacheKey}):`, error)
    
    // Hata durumunda boş bir veri dizisi döndür, bu şekilde kullanıcı arayüzü çökmez
    if (cacheKey.includes('matches') || cacheKey.includes('events')) {
      return [] as unknown as T
    }
    
    throw error
  }
}

// Optimize edilmiş API istekleri için batch fonksiyonu
// Birden fazla API isteğini tek seferde yapabilmek için
const batchApiRequests = async <T>(requests: (() => Promise<T>)[], maxConcurrent = 3): Promise<T[]> => {
  const results: T[] = [];
  const chunks: (() => Promise<T>)[][] = [];
  
  // İstekleri parçalara böl
  for (let i = 0; i < requests.length; i += maxConcurrent) {
    chunks.push(requests.slice(i, i + maxConcurrent));
  }
  
  // Her bir parçayı paralel olarak işle
  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map(req => req()));
    results.push(...chunkResults);
  }
  
  return results;
};

// Canlı maçları çek - optimize edilmiş
export async function getLiveMatches() {
  try {
    // İlk önce önbelleğe bak
    const cacheKey = "live_matches";
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) return cachedData;
    
    // API çağrısı yap
    const response = await apiClient.get("", {
      params: {
        action: "get_events",
        match_live: "1",
      },
      // 5 saniye timeout ile, hızlı yanıt için
      timeout: 5000
    });
    
    // Veriyi işle ve array olduğundan emin ol
    const data = Array.isArray(response.data) ? response.data : [];
    
    // Önbelleğe al
    cacheService.set(cacheKey, data, 15 * 1000); // 15 saniye
    
    return data;
  } catch (error) {
    console.error("apiError", error);
    return []; // Her zaman dizi döndür
  }
}

// Maç detaylarını çek
export async function getMatchDetails(matchId: string) {
  return handleApiResponse<any>(
    apiClient.get("", {
      params: {
        action: "get_events",
        match_id: matchId,
      },
    }),
    `match_details_${matchId}`,
    15 * 1000, // 15 saniye önbellek
  )
}

// Maç istatistiklerini çek
export async function getMatchStatistics(matchId: string) {
  try {
    const cacheKey = `match_statistics_${matchId}`
    const cachedData = cacheService.get(cacheKey)

    if (cachedData) {
      return cachedData
    }

    const response = await apiClient.get("", {
      params: {
        action: "get_statistics",
        match_id: matchId,
      },
    })

    // API yanıtını kontrol et
    if (
      !response.data ||
      response.data === "No statistics found" ||
      (Array.isArray(response.data) && response.data.length === 0)
    ) {
      console.log("noStatsFound")
      return null
    }

    // Veriyi işle
    let statistics: Record<string, { home: any; away: any }> = {}

    if (Array.isArray(response.data)) {
      // İstatistikleri işle
      statistics = response.data.reduce((acc, stat) => {
        if (stat.type && stat.home !== undefined && stat.away !== undefined) {
          acc[stat.type] = {
            home: stat.home,
            away: stat.away,
          }
        }
        return acc
      }, {} as Record<string, { home: any; away: any }>)
    } else if (typeof response.data === "object") {
      // Tek bir istatistik nesnesi
      Object.entries(response.data).forEach(([key, value]: [string, any]) => {
        if (value && value.home !== undefined && value.away !== undefined) {
          statistics[key] = {
            home: value.home,
            away: value.away,
          }
        }
      })
    }

    // İstatistik yoksa null döndür
    if (Object.keys(statistics).length === 0) {
      console.log("noStatsFound")
      return null
    }

    // Önbelleğe al
    cacheService.set(cacheKey, statistics, 15 * 1000) // 15 saniye önbellek
    return statistics
  } catch (error) {
    console.error("statsLoadError", error)
    return null // Tutarlılık için null döndür
  }
}

// Maç kadrosunu çek
export async function getMatchLineups(matchId: string) {
  try {
    const cacheKey = `match_lineups_${matchId}`
    const cachedData = cacheService.get(cacheKey)

    if (cachedData) {
      return cachedData
    }

    const response = await apiClient.get("", {
      params: {
        action: "get_lineups",
        match_id: matchId,
      },
    })

    // API yanıtını kontrol et
    if (!response.data || response.data === "No lineups found" || response.data.error) {
      console.log("noSquadDataFound")
      return null
    }

    // Önbelleğe al
    cacheService.set(cacheKey, response.data, 15 * 1000) // 15 saniye önbellek
    return response.data
  } catch (error) {
    console.error("errorLoadingSquadData", error)
    return null // Tutarlılık için null döndür
  }
}

// H2H maçları çek
export async function getHeadToHead(team1Id: string, team2Id: string) {
  try {
    const cacheKey = `h2h_${team1Id}_${team2Id}`
    const cachedData = cacheService.get(cacheKey)

    if (cachedData) {
      return cachedData
    }

    const response = await apiClient.get("", {
      params: {
        action: "get_H2H",
        firstTeamId: team1Id,
        secondTeamId: team2Id,
      },
    })

    // API yanıtını kontrol et
    if (
      !response.data ||
      !response.data.firstTeam_VS_secondTeam ||
      response.data.firstTeam_VS_secondTeam.length === 0
    ) {
      console.log("noH2HData")
      return { matches: [] }
    }

    // Veriyi işle
    const h2hMatches = response.data.firstTeam_VS_secondTeam.map((match: any) => ({
      id: match.match_id,
      homeTeam: {
        id: match.match_hometeam_id,
        name: match.match_hometeam_name,
      },
      awayTeam: {
        id: match.match_awayteam_id,
        name: match.match_awayteam_name,
      },
      score: {
        fullTime: {
          home: Number.parseInt(match.match_hometeam_score) || 0,
          away: Number.parseInt(match.match_awayteam_score) || 0,
        },
      },
      utcDate: match.match_date,
      status: match.match_status,
    }))

    const result = { matches: h2hMatches }

    // Önbelleğe al
    cacheService.set(cacheKey, result, 30 * 60 * 1000) // 30 dakika önbellek
    return result
  } catch (error) {
    console.error("h2hLoadError", error)
    return { matches: [] } // Tutarlılık için boş dizi döndür
  }
}

// Yıldız oyuncuları çek
export async function getStarPlayers(teamId: string) {
  try {
    const cacheKey = `star_players_${teamId}`
    const cachedData = cacheService.get(cacheKey)

    if (cachedData) {
      return cachedData
    }

    // Önce takım oyuncularını çek
    const response = await apiClient.get("", {
      params: {
        action: "get_teams",
        team_id: teamId,
      },
    })

    // API yanıtını kontrol et
    if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
      console.log("noStarPlayersFound")
      return null
    }

    // Veriyi işle
    let players: Array<{
      id: string;
      name: string;
      position: string;
      rating: number;
      goals: number;
      assists: number;
      matches: number;
    }> = []

    if (Array.isArray(response.data) && response.data.length > 0) {
      // Oyuncuları çıkar
      if (response.data[0].players && Array.isArray(response.data[0].players)) {
        players = response.data[0].players.map((player: any) => ({
          id: player.player_id || `player-${Math.random().toString(36).substr(2, 9)}`,
          name: player.player_name,
          position: mapPosition(player.player_type),
          rating: Number.parseFloat(player.player_rating) || 6 + Math.random() * 4,
          goals: Number.parseInt(player.player_goals) || 0,
          assists: Number.parseInt(player.player_assists) || 0,
          matches: Number.parseInt(player.player_match_played) || 0,
        }))

        // Oyuncuları sırala (gol, asist, puan)
        players.sort((a, b) => {
          if (a.goals !== b.goals) return b.goals - a.goals
          if (a.assists !== b.assists) return b.assists - a.assists
          return b.rating - a.rating
        })

        // En iyi 5 oyuncuyu al
        players = players.slice(0, 5)
      }
    }

    // Oyuncu yoksa null döndür
    if (players.length === 0) {
      console.log("noStarPlayersFound")
      return null
    }

    // Önbelleğe al
    cacheService.set(cacheKey, players, 30 * 60 * 1000) // 30 dakika önbellek
    return players
  } catch (error) {
    console.error("errorLoadingStarPlayers", error)
    return null // Tutarlılık için null döndür
  }
}

// Pozisyon tipini dönüştür
function mapPosition(type: string): string {
  if (!type) return "unknown"

  type = type.toLowerCase()

  if (type.includes("goalkeeper") || type.includes("kaleci")) return "goalkeeper"
  if (type.includes("defender") || type.includes("defans")) return "defender"
  if (type.includes("midfielder") || type.includes("orta saha")) return "midfielder"
  if (type.includes("forward") || type.includes("forvet")) return "attacker"

  return "unknown"
}

// Takım formunu çekmek için fonksiyon
export async function getTeamForm(teamId: string) {
  try {
    const cacheKey = `team_form_${teamId}`
    const cachedData = cacheService.get(cacheKey)

    if (cachedData) {
      return cachedData
    }

    // Son 10 maçı çek
    const lastMatches = await getTeamLastMatches(teamId)

    if (!Array.isArray(lastMatches) || lastMatches.length === 0) {
      console.log("errorLoadingFormData")
      return []
    }

    // Form hesapla (W, D, L)
    const form = lastMatches.map((match) => {
      const isHome = match.match_hometeam_id === teamId
      const homeScore = Number.parseInt(match.match_hometeam_score || "0")
      const awayScore = Number.parseInt(match.match_awayteam_score || "0")

      if (isHome) {
        if (homeScore > awayScore) return "W"
        if (homeScore < awayScore) return "L"
        return "D"
      } else {
        if (homeScore < awayScore) return "W"
        if (homeScore > awayScore) return "L"
        return "D"
      }
    })

    // 30 dakika için önbelleğe al
    cacheService.set(cacheKey, form, 30 * 60 * 1000)
    return form
  } catch (error) {
    console.error("errorUpdatingFormData", error)
    return [] // Tutarlılık için boş dizi döndür
  }
}

// Takımın son maçlarını çek
export async function getTeamLastMatches(teamId: string, limit = 10) {
  try {
    const response = await apiClient.get("", {
      params: {
        action: "get_events",
        team_id: teamId,
        from: "2023-01-01",
        to: new Date().toISOString().split("T")[0],
      },
    })
    
    if (!response.data || !Array.isArray(response.data)) {
      return []
    }

    // Son maçları tarihe göre sırala ve limitle
    const matches = response.data
      .sort((a, b) => {
        const dateA = new Date(`${a.match_date} ${a.match_time}`).getTime()
        const dateB = new Date(`${b.match_date} ${b.match_time}`).getTime()
        return dateB - dateA
      })
      .slice(0, limit)
    
    return matches
  } catch (error) {
    console.error("Son maçlar getirilirken hata:", error)
    return []
  }
}

// Birden çok takımın son maçlarını paralel olarak çek
export async function getMultipleTeamsLastMatches(teamIds: string[], limit = 10) {
  try {
    // Her takım için ayrı önbellekleme
    const fetchTeamMatches = (teamId: string) => getTeamLastMatches(teamId, limit);
    
    // Paralel istekler
    const requests = teamIds.map(teamId => () => fetchTeamMatches(teamId));
    const results = await batchApiRequests(requests, 3);  // Aynı anda en fazla 3 istek
    
    return results;
  } catch (error) {
    console.error("sonMaclarHata", error);
    return teamIds.map(() => []); // Her takım için boş dizi
  }
}

// Ülkeleri çek
export async function getCountries() {
  return handleApiResponse<any>(
    apiClient.get("", {
      params: {
        action: "get_countries",
      },
    }),
    "countries",
    24 * 60 * 60 * 1000, // 24 saat önbellek
  )
}

// Ligleri çek
export async function getLeagues(countryId?: string) {
  const cacheKey = `leagues_${countryId || "all"}`
  return handleApiResponse<any>(
    apiClient.get("", {
      params: {
        action: "get_leagues",
        country_id: countryId,
      },
    }),
    cacheKey,
    24 * 60 * 60 * 1000, // 24 saat önbellek
  )
}

// Tüm ligleri çek
export async function getAllLeagues() {
  return handleApiResponse<any>(
    apiClient.get("", {
      params: {
        action: "get_leagues",
      },
    }),
    "all_leagues",
    24 * 60 * 60 * 1000, // 24 saat önbellek
  )
}

// Yaklaşan maçları çek - paralel veri işleme ile optimize edilmiş
export async function getUpcomingMatches(from: string, to: string) {
  try {
    const cacheKey = `upcoming_matches_${from}_${to}`;
    const cachedData = cacheService.get(cacheKey);
    
    if (cachedData) {
      return cachedData;
    }
    
    const response = await apiClient.get("", {
      params: {
        action: "get_events",
        from,
        to,
      },
      timeout: 8000  // 8 saniye timeout
    });
    
    // Veriyi async olarak işle
    const processData = () => {
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Doğru sıralamayı sağlamak için tarihlere göre sırala
      const sortedData = data.sort((a, b) => {
        const dateA = new Date(`${a.match_date} ${a.match_time}`);
        const dateB = new Date(`${b.match_date} ${b.match_time}`);
        return dateA.getTime() - dateB.getTime();
      });
      
      // 5 dakika önbellekte tut
      cacheService.set(cacheKey, sortedData, 5 * 60 * 1000);
      return sortedData;
    };
    
    // Tarayıcıda boş zamanda işleme yapmak için
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      return new Promise(resolve => {
        window.requestIdleCallback(() => {
          resolve(processData());
        });
      });
    }
    
    return processData();
  } catch (error) {
    console.error("upcomingMatchLoadError", error);
    return []; // Boş dizi döndür
  }
}

// Lig sıralamasını çek
export async function getStandings(leagueId: string) {
  const cacheKey = `standings_${leagueId}`
  return handleApiResponse<any>(
    apiClient.get("", {
      params: {
        action: "get_standings",
        league_id: leagueId,
      },
    }),
    cacheKey,
    6 * 60 * 60 * 1000, // 6 saat önbellek
  )
}
