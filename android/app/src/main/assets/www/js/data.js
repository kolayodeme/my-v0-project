// Veri yönetimi hizmetleri

// Veri servisi
const dataService = {
    data: {
        liveMatches: [],
        upcomingMatches: [],
        leagues: [],
        teams: {},
        userPredictions: []
    },
    
    init() {
        // Önbelleğe alınmış verileri yükle
        this.loadCachedData();
        
        // Verileri güncelle
        this.fetchLiveMatches();
        this.fetchUpcomingMatches();
        this.fetchLeagues();
    },
    
    // Önbelleğe alınmış verileri yükle
    loadCachedData() {
        try {
            // LocalStorage'dan verileri al
            const cachedData = localStorage.getItem('footballAppData');
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                
                // Verilerin son güncelleme zamanını kontrol et
                const lastUpdate = new Date(parsedData.lastUpdate);
                const now = new Date();
                const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
                
                // Veriler son 1 saat içinde güncellenmişse kullan
                if (hoursSinceUpdate < 1) {
                    this.data = parsedData.data;
                    console.log('Önbellekten veriler yüklendi');
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error('Önbellek yükleme hatası:', error);
            return false;
        }
    },
    
    // Verileri önbelleğe kaydet
    saveToCache() {
        try {
            const cacheData = {
                data: this.data,
                lastUpdate: new Date()
            };
            localStorage.setItem('footballAppData', JSON.stringify(cacheData));
            console.log('Veriler önbelleğe kaydedildi');
        } catch (error) {
            console.error('Önbellek kaydetme hatası:', error);
        }
    },
    
    // Canlı maçları getir
    fetchLiveMatches() {
        // Gerçek uygulamada burada API çağrısı yapılır
        // Şimdilik örnek verilerle dolduralım
        setTimeout(() => {
            this.data.liveMatches = [
                {
                    id: 'live1',
                    league: {
                        id: 1,
                        name: 'Premier League',
                        logo: 'images/placeholder-logo.svg'
                    },
                    homeTeam: {
                        id: 101,
                        name: 'Arsenal',
                        logo: 'images/placeholder-logo.svg'
                    },
                    awayTeam: {
                        id: 102,
                        name: 'Chelsea',
                        logo: 'images/placeholder-logo.svg'
                    },
                    score: {
                        home: 2,
                        away: 1
                    },
                    status: 'İkinci Yarı 65\'',
                    time: '21:00'
                },
                {
                    id: 'live2',
                    league: {
                        id: 2,
                        name: 'La Liga',
                        logo: 'images/placeholder-logo.svg'
                    },
                    homeTeam: {
                        id: 201,
                        name: 'Barcelona',
                        logo: 'images/placeholder-logo.svg'
                    },
                    awayTeam: {
                        id: 202,
                        name: 'Real Madrid',
                        logo: 'images/placeholder-logo.svg'
                    },
                    score: {
                        home: 1,
                        away: 1
                    },
                    status: 'İlk Yarı 30\'',
                    time: '20:45'
                },
                {
                    id: 'live3',
                    league: {
                        id: 3,
                        name: 'Serie A',
                        logo: 'images/placeholder-logo.svg'
                    },
                    homeTeam: {
                        id: 301,
                        name: 'Juventus',
                        logo: 'images/placeholder-logo.svg'
                    },
                    awayTeam: {
                        id: 302,
                        name: 'Inter',
                        logo: 'images/placeholder-logo.svg'
                    },
                    score: {
                        home: 0,
                        away: 2
                    },
                    status: 'İkinci Yarı 75\'',
                    time: '19:30'
                }
            ];
            
            // UI'ı güncelle
            ui.updateLiveMatches();
            
            // Önbelleğe kaydet
            this.saveToCache();
        }, 1000);
    },
    
    // Yaklaşan maçları getir
    fetchUpcomingMatches() {
        // Gerçek uygulamada burada API çağrısı yapılır
        setTimeout(() => {
            this.data.upcomingMatches = [
                {
                    id: 'up1',
                    league: {
                        id: 1,
                        name: 'Premier League',
                        logo: 'images/placeholder-logo.svg'
                    },
                    homeTeam: {
                        id: 103,
                        name: 'Liverpool',
                        logo: 'images/placeholder-logo.svg'
                    },
                    awayTeam: {
                        id: 104,
                        name: 'Manchester City',
                        logo: 'images/placeholder-logo.svg'
                    },
                    status: 'Yarın',
                    time: '16:00'
                },
                {
                    id: 'up2',
                    league: {
                        id: 2,
                        name: 'La Liga',
                        logo: 'images/placeholder-logo.svg'
                    },
                    homeTeam: {
                        id: 203,
                        name: 'Atletico Madrid',
                        logo: 'images/placeholder-logo.svg'
                    },
                    awayTeam: {
                        id: 204,
                        name: 'Sevilla',
                        logo: 'images/placeholder-logo.svg'
                    },
                    status: 'Yarın',
                    time: '18:30'
                },
                {
                    id: 'up3',
                    league: {
                        id: 4,
                        name: 'Bundesliga',
                        logo: 'images/placeholder-logo.svg'
                    },
                    homeTeam: {
                        id: 401,
                        name: 'Bayern Munich',
                        logo: 'images/placeholder-logo.svg'
                    },
                    awayTeam: {
                        id: 402,
                        name: 'Borussia Dortmund',
                        logo: 'images/placeholder-logo.svg'
                    },
                    status: 'Pazar',
                    time: '17:15'
                }
            ];
            
            // UI'ı güncelle
            ui.updateUpcomingMatches();
            
            // Önbelleğe kaydet
            this.saveToCache();
        }, 1500);
    },
    
    // Ligleri getir
    fetchLeagues() {
        // Gerçek uygulamada burada API çağrısı yapılır
        setTimeout(() => {
            this.data.leagues = [
                {
                    id: 1,
                    name: 'Premier League',
                    country: 'İngiltere',
                    logo: 'images/placeholder-logo.svg'
                },
                {
                    id: 2,
                    name: 'La Liga',
                    country: 'İspanya',
                    logo: 'images/placeholder-logo.svg'
                },
                {
                    id: 3,
                    name: 'Serie A',
                    country: 'İtalya',
                    logo: 'images/placeholder-logo.svg'
                },
                {
                    id: 4,
                    name: 'Bundesliga',
                    country: 'Almanya',
                    logo: 'images/placeholder-logo.svg'
                },
                {
                    id: 5,
                    name: 'Ligue 1',
                    country: 'Fransa',
                    logo: 'images/placeholder-logo.svg'
                },
                {
                    id: 6,
                    name: 'Süper Lig',
                    country: 'Türkiye',
                    logo: 'images/placeholder-logo.svg'
                }
            ];
            
            // UI'ı güncelle
            ui.updateLeagues();
            
            // Önbelleğe kaydet
            this.saveToCache();
        }, 2000);
    },
    
    // Takım detaylarını getir
    fetchTeamDetails(teamId) {
        // Takım zaten önbellekte varsa kullan
        if (this.data.teams[teamId]) {
            return Promise.resolve(this.data.teams[teamId]);
        }
        
        // Gerçek uygulamada burada API çağrısı yapılır
        return new Promise((resolve) => {
            setTimeout(() => {
                const team = {
                    id: teamId,
                    name: 'Takım ' + teamId,
                    logo: 'images/placeholder-logo.svg',
                    country: 'Ülke',
                    stadium: 'Stadyum Adı',
                    founded: 1900,
                    coach: 'Teknik Direktör',
                    players: [
                        // Oyuncu listesi...
                    ]
                };
                
                // Önbelleğe ekle
                this.data.teams[teamId] = team;
                this.saveToCache();
                
                resolve(team);
            }, 1000);
        });
    },
    
    // Kullanıcı tahminlerini getir
    fetchUserPredictions() {
        // Kullanıcı giriş yapmamışsa boş dön
        if (!appState.isLoggedIn) {
            this.data.userPredictions = [];
            return Promise.resolve([]);
        }
        
        // Gerçek uygulamada burada API çağrısı yapılır
        return new Promise((resolve) => {
            setTimeout(() => {
                this.data.userPredictions = [
                    {
                        matchId: 'up1',
                        prediction: 'home',
                        creditSpent: 10
                    },
                    {
                        matchId: 'up3',
                        prediction: 'draw',
                        creditSpent: 5
                    }
                ];
                
                resolve(this.data.userPredictions);
            }, 1000);
        });
    },
    
    // Tahmin yap
    makePrediction(matchId, prediction, creditAmount) {
        // Kullanıcı giriş yapmamışsa hata dön
        if (!appState.isLoggedIn) {
            return Promise.reject('Tahmin yapmak için giriş yapmalısınız.');
        }
        
        // Gerçek uygulamada burada API çağrısı yapılır
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Başarılı ise
                const predictionData = {
                    matchId,
                    prediction,
                    creditSpent: creditAmount
                };
                
                // Kullanıcı tahminlerine ekle
                this.data.userPredictions.push(predictionData);
                
                // Önbelleğe kaydet
                this.saveToCache();
                
                resolve(predictionData);
            }, 1000);
        });
    }
};

// Uygulama API'leri
const apiService = {
    baseUrl: 'https://api.yourfootballapp.com',
    
    async get(endpoint) {
        try {
            // Gerçek uygulama implementasyonu burada olacak
            // Şimdilik simüle ediyoruz
            console.log(`API çağrısı: GET ${endpoint}`);
            return Promise.resolve({ success: true, data: [] });
        } catch (error) {
            console.error('API hatası:', error);
            return Promise.reject(error);
        }
    },
    
    async post(endpoint, data) {
        try {
            // Gerçek uygulama implementasyonu burada olacak
            console.log(`API çağrısı: POST ${endpoint}`, data);
            return Promise.resolve({ success: true, data: {} });
        } catch (error) {
            console.error('API hatası:', error);
            return Promise.reject(error);
        }
    }
}; 