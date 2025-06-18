// Add a new service for H2H data
import { getH2HMatches } from "./api"

export interface H2HResult {
  firstTeamWins: number
  secondTeamWins: number
  draws: number
  totalMatches: number
  lastTenMatches: {
    date: string
    homeTeam: string
    awayTeam: string
    score: string
    result: "HOME_WIN" | "AWAY_WIN" | "DRAW"
  }[]
}

export async function getH2HAnalysis(firstTeamId: string, secondTeamId: string): Promise<H2HResult> {
  try {
    const data = await getH2HMatches(firstTeamId, secondTeamId)

    // Process the data to get H2H statistics
    let firstTeamWins = 0
    let secondTeamWins = 0
    let draws = 0

    const lastTenMatches = data.firstTeam_VS_secondTeam.slice(0, 10).map((match: any) => {
      const homeScore = Number.parseInt(match.match_hometeam_score)
      const awayScore = Number.parseInt(match.match_awayteam_score)
      let result: "HOME_WIN" | "AWAY_WIN" | "DRAW" = "DRAW"

      if (homeScore > awayScore) {
        result = "HOME_WIN"
        if (match.match_hometeam_id === firstTeamId) {
          firstTeamWins++
        } else {
          secondTeamWins++
        }
      } else if (awayScore > homeScore) {
        result = "AWAY_WIN"
        if (match.match_awayteam_id === firstTeamId) {
          firstTeamWins++
        } else {
          secondTeamWins++
        }
      } else {
        draws++
      }

      return {
        date: match.match_date,
        homeTeam: match.match_hometeam_name,
        awayTeam: match.match_awayteam_name,
        score: `${match.match_hometeam_score} - ${match.match_awayteam_score}`,
        result,
      }
    })

    return {
      firstTeamWins,
      secondTeamWins,
      draws,
      totalMatches: firstTeamWins + secondTeamWins + draws,
      lastTenMatches,
    }
  } catch (error) {
    console.error("Error fetching H2H analysis:", error)
    throw error
  }
}
