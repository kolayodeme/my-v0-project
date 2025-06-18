"use client"

import React from "react"

// Define the translations
const translations = {
  en: {
    // Navigation
    navLive: "Live Matches",
    navPredictions: "Predictions",
    navStatistics: "Statistics", 
    upcoming: "Upcoming",
    
    // Navigation - Bottom Bar
    navHome: "Home",
    navLiveBadge: "Live",
    navProfile: "Profile",
    navLogin: "Login",
    navVip: "VIP",

    // Authentication
    guestModeActive: "Guest Mode Active",
    login: "Login",

    // Live match screen
    liveMatches: "Live Matches",
    noLiveMatches: "No live matches at the moment",
    matchHalfTime: "HT",
    fullTime: "FT",
    liveBadge: "LIVE",
    goals: "Goals",
    cards: "Cards",
    substitutions: "Substitutions",
    commentary: "Live Commentary",
    liveMatchTracking: "Live Match Tracking",
    
    // Match Status
    firstHalf: "First Half",
    secondHalf: "Second Half",
    matchEnd: "Match End",
    penalties: "Penalties",
    
    // Live Match Details
    watchLive: "Watch Live",
    makeLivePrediction: "Make Live Prediction",
    matchStatsDetails: "Match Statistics",
    possessionStat: "Possession",
    shots: "Shots",
    shotsOnTarget: "Shots on Target",
    corners: "Corners",
    fouls: "Fouls",
    yellowCards: "Yellow Cards",
    redCards: "Red Cards",
    factors: "Factors",
    noFactorData: "No factor data available",
    matchStatistics: "Match Statistics",
    ballPossession: "Possession",

    // Predictions
    matchPredictions: "Match Predictions",
    overUnder: "Over/Under",
    matchWinner: "Match Winner",
    probability: "Probability",
    predictionComment: "Prediction Comment",
    successRate: "Success Rate",
    aiPowered: "AI-Powered with",
    aiAnalysis: "AI Analysis",
    seeLivePredictions: "See Live Predictions",
    liveAnalysis: "Live Analysis",
    successfulPredictions: "Successful Predictions",
    happyUsers: "Happy Users",
    
    // Tabs in Match Details
    details: "Details",
    h2h: "H2H",
    last10Matches: "Last 10 Matches",
    standings: "Standings",
    prediction: "Prediction",
    tabStatistics: "Statistics",
    comparison: "Comparison",
    formAnalysis: "Form Analysis",

    // Statistics
    lastTenMatches: "Last 10 Matches",
    goalsPerMatch: "Goals per Match",
    cardsPerMatch: "Cards per Match",
    predictedOutcomes: "Predicted Outcomes",

    // Upcoming matches
    upcomingMatches: "Upcoming Matches",
    filterByTeam: "Filter by Team",
    filterByLeague: "Filter by League",
    filterByCountry: "Filter by Country",
    searchTeams: "Search Teams",
    
    // Leagues Section
    allLeagues: "All Leagues",
    allCountries: "All Countries",
    todayLabel: "Today",
    tomorrowLabel: "Tomorrow",
    noFavoriteLeagues: "No favorite leagues yet",
    leagueNotFound: "League not found",
    addLeaguesToFavorites: "Click the star icon to add leagues to favorites",
    tryChangingSearchCriteria: "Try changing your search criteria",
    searchLeagueOrTeam: "Search for league or team...",
    viewMatches: "View Matches",
    leagues: "Leagues",
    ligler: "Leagues",
    ligVeyaTakimAra: "Search league or team...",
    populer: "Popular",
    favoriler: "Favorites",
    analyze: "Analyze",
    predict: "Predict",
    
    // Winners
    vipWinners: "VIP Winners",
    all: "All",
    over25: "Over 2.5",
    under25: "Under 2.5",
    over15: "Over 1.5",
    under15: "Under 1.5",
    over05: "Over 0.5",
    under05: "Under 0.5",
    bttsYes: "BTTS Yes",
    bttsNo: "BTTS No",
    allMatches: "All Matches:",
    completedMatches: "Completed Matches:",
    errorLoadingWinners: "Error loading winning predictions",
    noWinningPredictionsToday: "No winning predictions for today yet",
    noWinningPredictionsYesterday: "No winning predictions for yesterday",
    noWinningPredictionsThisWeek: "No winning predictions for this week",

    // News
    transferNewsTitle1: "Big transfer move from Liverpool!",
    transferNewsTitle2: "Manchester United last-minute victory in the derby",
    transferNewsTitle3: "Chelsea's star will be out for 3 weeks",
    transferNewsTitle4: "Critical victory for Arsenal on the European path",
    transferNewsTitle5: "Premier League title race heats up",
    transferNewsTitle6: "National Team squad announced",
    transferNewsTitle7: "New season fixture announced",
    transferNewsTitle8: "New decision for referees from FA",
    transferNewsTitle9: "This week's matches in European Leagues",
    transferNewsTitle10: "Major change in the VAR system",

    // General
    loading: "Loading...",
    error: "Error loading data",
    retry: "Retry",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    language: "Language",
    dateLabel: "Date",
    timeLabel: "Time",
    win: "Win",
    draw: "Draw",
    loss: "Loss",
    yes: "Yes",
    no: "No",
    over: "Over",
    under: "Under",
    reloadButton: "Reload",
    refreshButton: "Refresh",
    notificationsLabel: "Notifications",
    autoRefreshLabel: "Auto Refresh",
    stadium: "Stadium",
    score: "Score",
    vs: "VS",
    
    // Standings
    standingsComparison: "Standings Comparison",
    positionRank: "Position",
    standingsPositionDifference: "Position Difference",
    pointsDifference: "Points Difference",
    pointsCount: "Points",
    matchesPlayed: "Matches Played",
    winsShort: "W",
    drawsShort: "D",
    lossesShort: "L",
    goalsForShort: "GF",
    goalsAgainstShort: "GA",
    
    // Match Stats
    noMatchStatsFound: "No match statistics found",
    matchStatusDisplayFirstHalf: "1H",
    matchStatusDisplayHalfTime: "HT",
    matchStatusDisplaySecondHalf: "2H",
    matchStatusDisplayFullTime: "FT",
    matchStatusDisplayLive: "LIVE",
    
    // Loading States
    loadingLiveMatchesStatus: "Loading live matches...",
    
    // Filters
    filterByTeamName: "Filter by team name",
    filterByLeagueName: "Filter by league name",
    filterByCountryName: "Filter by country name",
    
    // Error Messages
    upcomingMatchNotFound: "No upcoming matches found",
    upcomingMatchLoadError: "Error loading upcoming matches",
    tryAgain: "Try again",
    noFinishedMatchToday: "No finished matches today",
    finishedMatchLoadError: "Error loading finished matches",
    noFinishedMatchesYesterday: "No finished matches yesterday",
    noFinishedMatchesToday: "No finished matches today",
    matchesWillAppear: "Matches will appear here when they are completed",
    
    // Buttons
    loadMoreMatches: "Load more matches",
    
    // Counts
    matchesCount: "matches",

    // Prediction specific terms
    favorite: "Favorite",
    recommendedBet: "Recommended Bet",
    highProbabilityAtLeastOneGoal: "High probability of at least one goal",
    highProbabilityNoGoals: "High probability of no goals",
    atLeastTwoGoals: "At least two goals expected",
    expectAtLeastTwoGoals: "Expect at least two goals",
    expectMaxOneGoal: "Expect maximum one goal",
    threeOrMoreGoals: "Three or more goals expected",
    expectThreeOrMoreGoals: "Expect three or more goals",
    bothTeamsHighGoalAverage: "Both teams have high goal average",
    expectZeroToTwoGoals: "Expect zero to two goals",
    over35: "Over 3.5",
    under35: "Under 3.5",
    expectHighScoringMatch: "Expect a high scoring match",
    expectMaxThreeGoals: "Expect maximum three goals",
    dortBuçukUst: "Over 4.5",
    expectManyGoals: "Expect many goals",
    bothTeamsScoring: "Both teams are likely to score",
    atLeastOneTeamNotScoring: "At least one team is likely not to score",
    bttsYesAndOver25: "BTTS Yes & Over 2.5",
    bttsNoAndUnder25: "BTTS No & Under 2.5",
    bothTeamsWillScoreAndOver: "Both teams will score and over 2.5 goals",
    expectLowScoringNoBtts: "Expect low scoring match with at least one team not scoring",
    htftHomeWin: "HT/FT Home Win",
    htftAwayWin: "HT/FT Away Win",
    teamWillWinBothHalves: "{{teamName}} will likely win both halves",
    teamWillWinByTwoGoals: "{{teamName}} will likely win by two or more goals",
    teamHasLowWinProbability: "{{teamName}} has low win probability",
    doubleChanceX: "Double Chance X",
    highDrawProbability: "High draw probability",
    bothTeamsWillScoreAndOver15: "Both teams will score and over 1.5 goals",
    veryHigh: "Very High",
    veryLow: "Very Low",
    trendBettingTips: "Trend Betting Tips",
    bestBets: "Best Bets",
    risk: "Risk",
    marketSuggestions: "Market Suggestions",
    alternativeBets: "Alternative Bets",
    basedOnLast10MatchesAndH2H: "Based on last 10 matches and H2H",
    notEnoughDataForBets: "Not enough data for betting suggestions",
    moreMatchesNeeded: "More matches needed for accurate predictions",
    overUnderMarkets: "Over/Under Markets",
    atLeastOneGoal: "At least one goal",
    fourOrMoreGoals: "Four or more goals",
    fiveOrMoreGoals: "Five or more goals",
    basedOnTeamsLast10MatchesAndH2H: "Based on teams' last 10 matches and H2H",
    bttsAnalysis: "BTTS Analysis",
    
    // Missing keys for upcoming-match-prediction.tsx
    expectHighScoringWithTeamWin: "Expect a high scoring match with {{teamName}} win",
    teamHasAdvantageInHighScoring: "{{teamName}} has advantage in high scoring match",
    btts: "BTTS",
    noData: "No data",
    home: "Home",
    away: "Away",
    average: "Average",
    bttsProbability: "BTTS probability",
    nobtts: "No BTTS",
    
    // Risk levels
    low: "Low",
    lowMedium: "Low-Medium",
    medium: "Medium",
    mediumHigh: "Medium-High",
    high: "High",
  },
  tr: {
    // Navigation
    navLive: "Canlı Maçlar",
    navPredictions: "Tahminler",
    navStatistics: "İstatistikler",
    upcoming: "Yaklaşan",
    
    // Navigation - Bottom Bar
    navHome: "Ana Sayfa",
    navLiveBadge: "Canlı",
    navProfile: "Profil",
    navLogin: "Giriş",
    navVip: "VIP",

    // Authentication
    guestModeActive: "Konuk Mod Aktif",
    login: "Giriş",

    // Live match screen
    liveMatches: "Canlı Maçlar",
    noLiveMatches: "Şu anda canlı maç yok",
    matchHalfTime: "Devre Arası",
    fullTime: "Maç Sonu",
    liveBadge: "CANLI",
    goals: "Goller",
    cards: "Kartlar",
    substitutions: "Değişiklikler",
    commentary: "Canlı Anlatım",
    liveMatchTracking: "Canlı Maç Takibi",
    
    // Match Status
    firstHalf: "İlk Yarı",
    secondHalf: "İkinci Yarı",
    matchEnd: "Maç Sonu",
    penalties: "Penaltılar",
    
    // Live Match Details
    watchLive: "Canlı İzle",
    makeLivePrediction: "Canlı Tahmin Yap",
    matchStatsDetails: "Maç İstatistikleri",
    possessionStat: "Topa Sahip Olma",
    shots: "Şutlar",
    shotsOnTarget: "İsabetli Şutlar",
    corners: "Kornerler",
    fouls: "Fauller",
    yellowCards: "Sarı Kartlar",
    redCards: "Kırmızı Kartlar",
    factors: "Faktörler",
    noFactorData: "Faktör verisi bulunamadı",
    matchStatistics: "Maç İstatistikleri",
    ballPossession: "Topa Sahip Olma",

    // Predictions
    matchPredictions: "Maç Tahminleri",
    overUnder: "Üst/Alt",
    matchWinner: "Maç Kazananı",
    probability: "Olasılık",
    predictionComment: "Tahmin Yorumu",
    successRate: "Başarı Oranı",
    aiPowered: "Yapay Zeka Destekli",
    aiAnalysis: "Yapay Zeka Analizi",
    seeLivePredictions: "Canlı Tahminleri Gör",
    liveAnalysis: "Canlı Analiz",
    successfulPredictions: "Başarılı Tahminler",
    happyUsers: "Memnun Kullanıcılar",
    
    // Tabs in Match Details
    details: "Detaylar",
    h2h: "H2H",
    last10Matches: "Son 10 Maç",
    standings: "Puan Durumu",
    prediction: "Tahmin",
    tabStatistics: "İstatistikler",
    comparison: "Karşılaştırma",
    formAnalysis: "Form Analizi",

    // Statistics
    lastTenMatches: "Son 10 Maç",
    goalsPerMatch: "Maç Başı Gol",
    cardsPerMatch: "Maç Başı Kart",
    predictedOutcomes: "Tahmin Edilen Sonuçlar",

    // Upcoming matches
    upcomingMatches: "Yaklaşan Maçlar",
    filterByTeam: "Takıma Göre Filtrele",
    filterByLeague: "Lige Göre Filtrele",
    filterByCountry: "Ülkeye Göre Filtrele",
    searchTeams: "Takım Ara",
    
    // Leagues Section
    allLeagues: "Tüm Ligler",
    allCountries: "Tüm Ülkeler",
    todayLabel: "Bugün",
    tomorrowLabel: "Yarın",
    noFavoriteLeagues: "Henüz favori lig yok",
    leagueNotFound: "Lig bulunamadı",
    addLeaguesToFavorites: "Ligleri favorilere eklemek için yıldız simgesine tıklayın",
    tryChangingSearchCriteria: "Arama kriterlerinizi değiştirmeyi deneyin",
    searchLeagueOrTeam: "Lig veya takım ara...",
    viewMatches: "Maçları Görüntüle",
    leagues: "Ligler",
    ligler: "Ligler",
    ligVeyaTakimAra: "Lig veya takım ara...",
    populer: "Popüler",
    favoriler: "Favoriler",
    analyze: "Analiz Et",
    predict: "Tahmin Et",
    
    // Winners
    vipWinners: "VIP Kazananlar",
    all: "Tümü",
    over25: "2.5 Üst",
    under25: "2.5 Alt",
    over15: "1.5 Üst",
    under15: "1.5 Alt",
    over05: "0.5 Üst",
    under05: "0.5 Alt",
    bttsYes: "KG Var",
    bttsNo: "KG Yok",
    allMatches: "Tüm Maçlar:",
    completedMatches: "Tamamlanan Maçlar:",
    errorLoadingWinners: "Kazanan tahminler yüklenirken hata oluştu",
    noWinningPredictionsToday: "Bugün için henüz kazanan tahmin yok",
    noWinningPredictionsYesterday: "Dün için kazanan tahmin yok",
    noWinningPredictionsThisWeek: "Bu hafta için kazanan tahmin yok",

    // News
    transferNewsTitle1: "Liverpool'dan büyük transfer hamlesi!",
    transferNewsTitle2: "Manchester United derbide son dakika zaferi",
    transferNewsTitle3: "Chelsea'nin yıldızı 3 hafta sahalardan uzak kalacak",
    transferNewsTitle4: "Arsenal'dan Avrupa yolunda kritik galibiyet",
    transferNewsTitle5: "Premier Lig şampiyonluk yarışı kızışıyor",
    transferNewsTitle6: "Milli Takım kadrosu açıklandı",
    transferNewsTitle7: "Yeni sezon fikstürü belli oldu",
    transferNewsTitle8: "FA'dan hakemler için yeni karar",
    transferNewsTitle9: "Avrupa Liglerinde bu haftanın maçları",
    transferNewsTitle10: "VAR sisteminde büyük değişiklik",

    // General
    loading: "Yükleniyor...",
    error: "Veri yüklenirken hata oluştu",
    retry: "Tekrar Dene",
    darkMode: "Karanlık Mod",
    lightMode: "Aydınlık Mod",
    language: "Dil",
    dateLabel: "Tarih",
    timeLabel: "Saat",
    win: "Galibiyet",
    draw: "Beraberlik",
    loss: "Mağlubiyet",
    yes: "Evet",
    no: "Hayır",
    over: "Üst",
    under: "Alt",
    reloadButton: "Yeniden Yükle",
    refreshButton: "Yenile",
    notificationsLabel: "Bildirimler",
    autoRefreshLabel: "Otomatik Yenile",
    stadium: "Stadyum",
    score: "Skor",
    vs: "VS",
    
    // Standings
    standingsComparison: "Puan Durumu Karşılaştırması",
    positionRank: "Sıralama",
    standingsPositionDifference: "Sıralama Farkı",
    pointsDifference: "Puan Farkı",
    pointsCount: "Puan",
    matchesPlayed: "Oynanan Maçlar",
    winsShort: "G",
    drawsShort: "B",
    lossesShort: "M",
    goalsForShort: "AG",
    goalsAgainstShort: "YG",
    
    // Match Stats
    noMatchStatsFound: "Maç istatistikleri bulunamadı",
    matchStatusDisplayFirstHalf: "1Y",
    matchStatusDisplayHalfTime: "DA",
    matchStatusDisplaySecondHalf: "2Y",
    matchStatusDisplayFullTime: "MS",
    matchStatusDisplayLive: "CANLI",
    
    // Loading States
    loadingLiveMatchesStatus: "Canlı maçlar yükleniyor...",
    
    // Filters
    filterByTeamName: "Takım adına göre filtrele",
    filterByLeagueName: "Lig adına göre filtrele",
    filterByCountryName: "Ülke adına göre filtrele",
    
    // Error Messages
    upcomingMatchNotFound: "Yaklaşan maç bulunamadı",
    upcomingMatchLoadError: "Yaklaşan maçlar yüklenirken hata oluştu",
    tryAgain: "Tekrar deneyin",
    noFinishedMatchToday: "Bugün tamamlanan maç yok",
    finishedMatchLoadError: "Tamamlanan maçlar yüklenirken hata oluştu",
    noFinishedMatchesYesterday: "Dün tamamlanan maç yok",
    noFinishedMatchesToday: "Bugün tamamlanan maç yok",
    matchesWillAppear: "Maçlar tamamlandığında burada görünecek",
    
    // Buttons
    loadMoreMatches: "Daha fazla maç yükle",
    
    // Counts
    matchesCount: "maç",

    // Prediction specific terms
    favorite: "Favori",
    recommendedBet: "Önerilen Bahis",
    highProbabilityAtLeastOneGoal: "En az bir gol olma olasılığı yüksek",
    highProbabilityNoGoals: "Gol olmama olasılığı yüksek",
    atLeastTwoGoals: "En az iki gol bekleniyor",
    expectAtLeastTwoGoals: "En az iki gol bekleyin",
    expectMaxOneGoal: "En fazla bir gol bekleyin",
    threeOrMoreGoals: "Üç veya daha fazla gol bekleniyor",
    expectThreeOrMoreGoals: "Üç veya daha fazla gol bekleyin",
    bothTeamsHighGoalAverage: "Her iki takımın da gol ortalaması yüksek",
    expectZeroToTwoGoals: "Sıfır ila iki gol bekleyin",
    over35: "3.5 Üst",
    under35: "3.5 Alt",
    expectHighScoringMatch: "Yüksek skorlu bir maç bekleyin",
    expectMaxThreeGoals: "En fazla üç gol bekleyin",
    dortBuçukUst: "4.5 Üst",
    expectManyGoals: "Çok fazla gol bekleyin",
    bothTeamsScoring: "Her iki takımın da gol atma olasılığı yüksek",
    atLeastOneTeamNotScoring: "En az bir takımın gol atamama olasılığı yüksek",
    bttsYesAndOver25: "KG Var & 2.5 Üst",
    bttsNoAndUnder25: "KG Yok & 2.5 Alt",
    bothTeamsWillScoreAndOver: "Her iki takım da gol atacak ve 2.5 üst olacak",
    expectLowScoringNoBtts: "Düşük skorlu bir maç ve en az bir takım gol atamayacak",
    htftHomeWin: "İY/MS Ev Sahibi Kazanır",
    htftAwayWin: "İY/MS Deplasman Kazanır",
    teamWillWinBothHalves: "{{teamName}} muhtemelen her iki yarıyı da kazanacak",
    teamWillWinByTwoGoals: "{{teamName}} muhtemelen iki veya daha fazla farkla kazanacak",
    teamHasLowWinProbability: "{{teamName}} kazanma olasılığı düşük",
    doubleChanceX: "Çifte Şans X",
    highDrawProbability: "Yüksek beraberlik olasılığı",
    bothTeamsWillScoreAndOver15: "Her iki takım da gol atacak ve 1.5 üst olacak",
    veryHigh: "Çok Yüksek",
    veryLow: "Çok Düşük",
    trendBettingTips: "Trend Bahis Önerileri",
    bestBets: "En İyi Bahisler",
    risk: "Risk",
    
    // H2H Analysis
    h2hAnalysis: "H2H Analizi",
    loadingH2H: "H2H verileri yükleniyor...",
    noH2HData: "H2H verisi bulunamadı",
    h2hLoadError: "H2H verileri yüklenirken hata oluştu",
    statistics: "İstatistikler",
    goalAnalysis: "Gol Analizi",
    recentMatches: "Son Maçlar",
    totalMatches: "Toplam Maçlar",
    average: "Ortalama",
    
    // Live Matches
    hide: "Gizle",
    predictionComingSoon: "Tahmin Yakında Gelecek",
    matchesLabel: "maç",
    checkBackLater: "Daha sonra kontrol edin",
    refresh: "Yenile",
    comments: "Yorumlar",
    user: "Kullanıcı",
    noCommentsYet: "Henüz yorum yok",
    writeYourComment: "Yorumunuzu yazın...",
    addComment: "Yorum Ekle",
    
    // Credit System
    creditAdded: "Kredi Eklendi",
    creditUsed: "Kredi Kullanıldı",
    
    // Risk Levels
    low: "Düşük",
    lowMedium: "Düşük-Orta",
    medium: "Orta",
    mediumHigh: "Orta-Yüksek",
    high: "Yüksek",
    
    // Market Suggestions
    marketSuggestions: "Market Önerileri",
    alternativeBets: "Alternatif Bahisler",
    basedOnLast10MatchesAndH2H: "Son 10 maç ve H2H verilerine dayanarak",
    notEnoughDataForBets: "Bahis önerileri için yeterli veri yok",
    moreMatchesNeeded: "Doğru tahminler için daha fazla maç gerekiyor",
    overUnderMarkets: "Alt/Üst Marketleri",
    atLeastOneGoal: "En az bir gol",
    fourOrMoreGoals: "Dört veya daha fazla gol",
    fiveOrMoreGoals: "Beş veya daha fazla gol",
    bttsAnalysis: "KG Var Analizi",
    bttsProbability: "KG Var olasılığı",
    home: "Ev Sahibi",
    away: "Deplasman",
    expectHighScoringWithTeamWin: "{{teamName}} galibiyetiyle yüksek skorlu maç bekleyin",
    teamHasAdvantageInHighScoring: "{{teamName}} yüksek skorlu maçta avantajlı"
  }
}

type Language = "en" | "tr"
type TranslationKey = keyof typeof translations.en | keyof typeof translations.tr

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey, params?: Record<string, any>) => string
}

// React 19 için varsayılan değerlerle context oluşturma
const defaultContext: LanguageContextType = {
  language: "tr",
  setLanguage: () => {},
  t: (key) => key as string,
}

export const LanguageContext = React.createContext<LanguageContextType>(defaultContext)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = React.useState<Language>("tr")

  // Load language preference from localStorage on client side
  React.useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem("language") as Language
      if (savedLanguage && (savedLanguage === "en" || savedLanguage === "tr")) {
        setLanguage(savedLanguage)
      }
    } catch (error) {
      console.error("Error loading language from localStorage:", error)
    }
  }, [])

  // Save language preference to localStorage and sync with user settings
  React.useEffect(() => {
    try {
      localStorage.setItem("language", language)
      
      // Dil değiştiğinde localStorage'daki user_settings nesnesini de güncelle
      const savedSettings = localStorage.getItem("user_settings")
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        if (parsedSettings.language !== language) {
          parsedSettings.language = language
          localStorage.setItem("user_settings", JSON.stringify(parsedSettings))
        }
      } else {
        // Eğer user_settings yoksa oluştur
        localStorage.setItem("user_settings", JSON.stringify({
          language: language,
          theme: "dark",
          notifications: true,
          autoRefresh: true
        }))
      }
    } catch (error) {
      console.error("Error updating user settings language:", error)
    }
  }, [language])

  const t = React.useCallback((key: TranslationKey, params?: Record<string, any>): string => {
    try {
      // Eğer çeviride bu anahtar yoksa anahtarın kendisini döndür
      const translationObj = translations[language] as Record<string, string>
      if (!translationObj[key as string]) {
        console.warn(`Translation missing for key: ${key} in language: ${language}`)
        return key as string
      }
      
      let text = translationObj[key as string]
      
      // If params are provided, replace placeholders in the format {{paramName}}
      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), paramValue)
        })
      }
      
      return text
    } catch (error) {
      console.error("Error in translation function:", error)
      return key as string
    }
  }, [language])

  const contextValue = React.useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, t])

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>
}

export function useTranslation() {
  return React.useContext(LanguageContext)
}