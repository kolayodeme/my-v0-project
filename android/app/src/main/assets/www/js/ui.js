// Kullanıcı arayüzü yönetimi

// UI servisi
const ui = {
    // Sayfa gösterme
    showPage(page, params = []) {
        console.log(`Sayfa gösteriliyor: ${page}, Parametreler:`, params);
        
        // Yükleniyor göstergesini göster
        this.showLoader();
        
        // Sayfa içeriğini temizle
        const mainContent = document.getElementById('main-content');
        
        // Önce yükleniyor spinner'ı ekleyelim
        if (!document.getElementById('page-loader')) {
            const loader = document.createElement('div');
            loader.className = 'loading-spinner';
            loader.id = 'page-loader';
            loader.innerHTML = '<div class="spinner"></div><p>Yükleniyor...</p>';
            mainContent.appendChild(loader);
        }
        
        // İlgili sayfanın template'ini bulalım
        const templateId = `${page}-template`;
        const template = document.getElementById(templateId);
        
        if (!template) {
            console.error(`Template bulunamadı: ${templateId}`);
            this.hideLoader();
            mainContent.innerHTML = `<div class="error-message">Sayfa bulunamadı: ${page}</div>`;
            return;
        }
        
        // Template içeriğini klonla
        const pageContent = template.content.cloneNode(true);
        
        // Yükleniyor göstergesini gizle ve içeriği ekle
        setTimeout(() => {
            this.hideLoader();
            
            // Önceki içeriği temizle (yükleniyor spinner'ı hariç)
            const oldContent = mainContent.querySelector('.page-content');
            if (oldContent) {
                oldContent.remove();
            }
            
            // Yeni içeriği ekle
            mainContent.appendChild(pageContent);
            
            // Sayfa için özel içerik yükleme işlemleri
            this.loadPageContent(page, params);
        }, 500); // Yükleniyor animasyonu için kısa bir gecikme
    },
    
    // Yükleniyor göstergesini göster
    showLoader() {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.style.display = 'flex';
        }
    },
    
    // Yükleniyor göstergesini gizle
    hideLoader() {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    },
    
    // Sayfa içeriğini yükle
    loadPageContent(page, params) {
        switch (page) {
            case 'home':
                this.loadHomePage();
                break;
            case 'live':
                this.loadLivePage();
                break;
            case 'upcoming':
                this.loadUpcomingPage();
                break;
            case 'leagues':
                this.loadLeaguesPage();
                break;
            case 'profile':
                this.loadProfilePage();
                break;
            case 'match':
                if (params.length > 0) {
                    this.loadMatchPage(params[0]);
                }
                break;
            default:
                console.log(`İçerik yükleme işlemi tanımlanmamış: ${page}`);
        }
    },
    
    // Ana sayfa içeriğini yükle
    loadHomePage() {
        // Canlı maçları güncelle
        this.updateLiveMatches('live-matches-container', 3);
        
        // Yaklaşan maçları güncelle
        this.updateUpcomingMatches('upcoming-matches-container', 3);
        
        // Ligleri güncelle
        this.updateLeagues('leagues-container');
    },
    
    // Canlı maçlar sayfasını yükle
    loadLivePage() {
        // Tüm canlı maçları göster
        this.updateLiveMatches('all-live-matches');
        
        // Filtre butonlarına olay dinleyiciler ekle
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Aktif sınıfı tüm butonlardan kaldır
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Tıklanan butona aktif sınıfı ekle
                button.classList.add('active');
                
                // Filtre değerini güncelle
                const filter = button.dataset.filter;
                appState.filters.live = filter;
                
                // Maçları filtrele
                this.updateLiveMatches('all-live-matches');
            });
        });
    },
    
    // Yaklaşan maçlar sayfasını yükle
    loadUpcomingPage() {
        // Tarih göstergesini güncelle
        this.updateDateDisplay();
        
        // Tüm yaklaşan maçları göster
        this.updateUpcomingMatches('all-upcoming-matches');
        
        // Tarih değiştirme butonlarına olay dinleyiciler ekle
        const prevDateBtn = document.querySelector('.date-nav.prev');
        const nextDateBtn = document.querySelector('.date-nav.next');
        
        if (prevDateBtn) {
            prevDateBtn.addEventListener('click', () => {
                // Seçili tarihi bir gün geriye al
                const date = new Date(appState.selectedDate);
                date.setDate(date.getDate() - 1);
                appState.selectedDate = date;
                
                // Tarih göstergesini güncelle
                this.updateDateDisplay();
                
                // Maçları güncelle
                this.updateUpcomingMatches('all-upcoming-matches');
            });
        }
        
        if (nextDateBtn) {
            nextDateBtn.addEventListener('click', () => {
                // Seçili tarihi bir gün ileriye al
                const date = new Date(appState.selectedDate);
                date.setDate(date.getDate() + 1);
                appState.selectedDate = date;
                
                // Tarih göstergesini güncelle
                this.updateDateDisplay();
                
                // Maçları güncelle
                this.updateUpcomingMatches('all-upcoming-matches');
            });
        }
    },
    
    // Ligler sayfasını yükle
    loadLeaguesPage() {
        // Tüm ligleri göster
        this.updateLeagues('all-leagues', true);
        
        // Arama kutusuna olay dinleyici ekle
        const searchInput = document.getElementById('league-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                this.filterLeagues(searchTerm);
            });
        }
    },
    
    // Profil sayfasını yükle
    loadProfilePage() {
        // Kullanıcı giriş yapmış mı kontrol et
        if (!appState.isLoggedIn) {
            // Giriş yapmamışsa giriş sayfasına yönlendir
            router.navigateTo('login');
            return;
        }
        
        // Kullanıcı bilgilerini güncelle
        this.updateUserInfo();
        
        // Menü öğelerine olay dinleyicileri ekle
        const logoutBtn = document.querySelector('.profile-menu-item.logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Çıkış işlemi
                androidInterface.sendMessage('logout');
                
                // Durumu güncelle (Android'den cevap gelmesini beklemeden)
                appState.isLoggedIn = false;
                appState.user = null;
                
                // Ana sayfaya yönlendir
                router.navigateTo('home');
                
                // Bildirim göster
                toastManager.show('Çıkış yapıldı', 'info');
            });
        }
    },
    
    // Maç detay sayfasını yükle
    loadMatchPage(matchId) {
        console.log(`Maç detayı yükleniyor: ${matchId}`);
        
        // Burada maç detaylarını getiren API çağrısı yapılacak
        // Şimdilik örnek veri kullanıyoruz
        
        // Canlı maçlarda ara
        let match = dataService.data.liveMatches.find(m => m.id === matchId);
        
        // Bulunamadıysa yaklaşan maçlarda ara
        if (!match) {
            match = dataService.data.upcomingMatches.find(m => m.id === matchId);
        }
        
        if (!match) {
            console.error(`Maç bulunamadı: ${matchId}`);
            return;
        }
        
        // Maç detayları burada gösterilecek
        // Gerçek uygulamada bu kısım çok daha kapsamlı olacak
    },
    
    // Canlı maçları güncelle
    updateLiveMatches(containerId = 'live-matches-container', limit = null) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Container'ı temizle
        container.innerHTML = '';
        
        // Maç verileri
        let matches = dataService.data.liveMatches;
        
        // Filtreleme işlemi
        if (appState.filters.live && appState.filters.live !== 'all') {
            // Gerçek uygulamada burada filtreleme yapılacak
            // Örneğin favoriler, önemli maçlar vb.
        }
        
        // Limit varsa uygula
        if (limit && matches.length > limit) {
            matches = matches.slice(0, limit);
        }
        
        // Maç yoksa mesaj göster
        if (matches.length === 0) {
            container.innerHTML = '<div class="empty-message">Şu anda canlı maç bulunmuyor.</div>';
            return;
        }
        
        // Maçları ekle
        matches.forEach(match => {
            const matchCard = this.createMatchCard(match, true);
            container.appendChild(matchCard);
            
            // Maç kartına tıklama olayı ekle
            matchCard.addEventListener('click', () => {
                router.navigateTo('match', [match.id]);
            });
        });
    },
    
    // Yaklaşan maçları güncelle
    updateUpcomingMatches(containerId = 'upcoming-matches-container', limit = null) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Container'ı temizle
        container.innerHTML = '';
        
        // Maç verileri
        let matches = dataService.data.upcomingMatches;
        
        // Filtreleme işlemi (gerçek uygulamada tarih filtresi olacak)
        
        // Limit varsa uygula
        if (limit && matches.length > limit) {
            matches = matches.slice(0, limit);
        }
        
        // Maç yoksa mesaj göster
        if (matches.length === 0) {
            container.innerHTML = '<div class="empty-message">Yaklaşan maç bulunmuyor.</div>';
            return;
        }
        
        // Maçları ekle
        matches.forEach(match => {
            const matchCard = this.createMatchCard(match, false);
            container.appendChild(matchCard);
            
            // Maç kartına tıklama olayı ekle
            matchCard.addEventListener('click', () => {
                router.navigateTo('match', [match.id]);
            });
        });
    },
    
    // Ligleri güncelle
    updateLeagues(containerId = 'leagues-container', isGrid = false) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Container'ı temizle
        container.innerHTML = '';
        
        // Lig verileri
        const leagues = dataService.data.leagues;
        
        // Lig yoksa mesaj göster
        if (leagues.length === 0) {
            container.innerHTML = '<div class="empty-message">Lig bulunamadı.</div>';
            return;
        }
        
        // Ligleri ekle
        leagues.forEach(league => {
            const leagueCard = this.createLeagueCard(league);
            container.appendChild(leagueCard);
            
            // Lig kartına tıklama olayı ekle
            leagueCard.addEventListener('click', () => {
                // Lig detay sayfasına yönlendir
                // router.navigateTo('league', [league.id]);
                toastManager.show(`${league.name} seçildi`, 'info');
            });
        });
    },
    
    // Ligleri filtrele
    filterLeagues(searchTerm) {
        const leagues = document.querySelectorAll('.league-card');
        
        leagues.forEach(league => {
            const leagueName = league.querySelector('.league-name').textContent.toLowerCase();
            
            if (leagueName.includes(searchTerm)) {
                league.style.display = '';
            } else {
                league.style.display = 'none';
            }
        });
    },
    
    // Tarih göstergesini güncelle
    updateDateDisplay() {
        const dateDisplay = document.getElementById('selected-date');
        if (!dateDisplay) return;
        
        // Seçili tarihi formatlayarak göster
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = appState.selectedDate.toLocaleDateString('tr-TR', options);
    },
    
    // Kullanıcı bilgilerini güncelle
    updateUserInfo() {
        if (!appState.isLoggedIn || !appState.user) return;
        
        const profileName = document.querySelector('.profile-name');
        const profileCredit = document.querySelector('.profile-credit');
        
        if (profileName) {
            profileName.textContent = appState.user.name || 'Kullanıcı';
        }
        
        if (profileCredit) {
            profileCredit.textContent = `${appState.user.credit || 0} Kredi`;
        }
    },
    
    // Maç kartı oluştur
    createMatchCard(match, isLive = false) {
        // Match card template'ini klonla
        const template = document.getElementById('match-card-template');
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.match-card');
        
        // Lig bilgilerini ayarla
        const leagueLogo = card.querySelector('.league-logo');
        const leagueName = card.querySelector('.league-name');
        
        leagueLogo.src = match.league.logo;
        leagueLogo.alt = match.league.name;
        leagueName.textContent = match.league.name;
        
        // Takım bilgilerini ayarla
        const homeTeamLogo = card.querySelector('.home-team .team-logo');
        const homeTeamName = card.querySelector('.home-team .team-name');
        const awayTeamLogo = card.querySelector('.away-team .team-logo');
        const awayTeamName = card.querySelector('.away-team .team-name');
        
        homeTeamLogo.src = match.homeTeam.logo;
        homeTeamLogo.alt = match.homeTeam.name;
        homeTeamName.textContent = match.homeTeam.name;
        
        awayTeamLogo.src = match.awayTeam.logo;
        awayTeamLogo.alt = match.awayTeam.name;
        awayTeamName.textContent = match.awayTeam.name;
        
        // Skor bilgilerini ayarla
        const homeScore = card.querySelector('.home-score');
        const awayScore = card.querySelector('.away-score');
        
        if (isLive && match.score) {
            homeScore.textContent = match.score.home;
            awayScore.textContent = match.score.away;
        } else {
            homeScore.textContent = '-';
            awayScore.textContent = '-';
        }
        
        // Maç bilgilerini ayarla
        const matchTime = card.querySelector('.match-time');
        const matchStatus = card.querySelector('.match-status');
        
        matchTime.textContent = match.time;
        matchStatus.textContent = match.status;
        
        if (isLive) {
            matchStatus.classList.add('live');
        }
        
        return card;
    },
    
    // Lig kartı oluştur
    createLeagueCard(league) {
        // League card template'ini klonla
        const template = document.getElementById('league-card-template');
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.league-card');
        
        // Lig bilgilerini ayarla
        const leagueLogo = card.querySelector('.league-logo');
        const leagueName = card.querySelector('.league-name');
        
        leagueLogo.src = league.logo;
        leagueLogo.alt = league.name;
        leagueName.textContent = league.name;
        
        return card;
    }
}; 