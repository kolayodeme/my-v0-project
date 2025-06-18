// Ana uygulama dosyası

// Uygulama durumu
const appState = {
    currentPage: 'home',
    isLoggedIn: false,
    user: null,
    darkTheme: false,
    selectedDate: new Date(),
    filters: {
        live: 'all',
        upcoming: 'all'
    }
};

// Sayfa yönlendirme sistemi
const router = {
    init() {
        // Sayfa yüklendiğinde URL'deki hash'e göre sayfayı göster
        window.addEventListener('load', () => {
            this.handleRouteChange();
        });

        // Hash değiştiğinde sayfayı güncelle
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });

        // Başlangıçta hash yoksa ana sayfaya yönlendir
        if (!window.location.hash) {
            window.location.hash = '#home';
        }
    },

    handleRouteChange() {
        // URL'den hash'i al ve # işaretini kaldır
        let hash = window.location.hash.substring(1);
        
        // Parametreleri ayır (örn: match/123 -> page: match, params: [123])
        const parts = hash.split('/');
        const page = parts[0] || 'home';
        const params = parts.slice(1);
        
        // Sayfayı değiştir
        this.navigateTo(page, params);
    },

    navigateTo(page, params = []) {
        // Önceki aktif menü öğesinin sınıfını kaldır
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Ana navigasyon öğelerinde varsa ilgili öğeyi aktif yap
        const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }

        // Sayfa durumunu güncelle
        appState.currentPage = page;

        // Sayfayı göster
        ui.showPage(page, params);
    }
};

// Tema yönetimi
const themeManager = {
    init() {
        // Kaydedilmiş tema tercihini kontrol et
        const savedTheme = localStorage.getItem('darkTheme');
        if (savedTheme === 'true') {
            this.enableDarkTheme();
        }

        // Tema değiştirme butonuna tıklama olayı ekle
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                if (appState.darkTheme) {
                    this.disableDarkTheme();
                } else {
                    this.enableDarkTheme();
                }
            });
        }
    },

    enableDarkTheme() {
        document.body.classList.add('dark-theme');
        appState.darkTheme = true;
        localStorage.setItem('darkTheme', 'true');
        
        // Tema simgesini güncelle
        const themeIcon = document.querySelector('.theme-toggle i');
        if (themeIcon) {
            themeIcon.className = 'fas fa-sun';
        }
    },

    disableDarkTheme() {
        document.body.classList.remove('dark-theme');
        appState.darkTheme = false;
        localStorage.setItem('darkTheme', 'false');
        
        // Tema simgesini güncelle
        const themeIcon = document.querySelector('.theme-toggle i');
        if (themeIcon) {
            themeIcon.className = 'fas fa-moon';
        }
    }
};

// Toast bildirimleri
const toastManager = {
    show(message, type = 'info', duration = 3000) {
        // Toast container yoksa oluştur
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Toast elementi oluştur
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // İkon belirle
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        // Toast içeriğini ayarla
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="toast-message">${message}</div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Container'a ekle
        container.appendChild(toast);
        
        // Kapat butonuna tıklama olayı ekle
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.dismiss(toast);
        });
        
        // Belirli süre sonra otomatik kapat
        setTimeout(() => {
            this.dismiss(toast);
        }, duration);
    },
    
    dismiss(toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            toast.remove();
            
            // Eğer container boşsa onu da kaldır
            const container = document.querySelector('.toast-container');
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }
};

// Uygulama başlatma
document.addEventListener('DOMContentLoaded', () => {
    // Router'ı başlat
    router.init();
    
    // Tema yöneticisini başlat
    themeManager.init();
    
    // Veriyi yükle
    dataService.init();
});

// Android ile iletişim için arayüz
const androidInterface = {
    // Android'den JavaScript'e mesaj almak için
    receiveMessage(message) {
        try {
            const data = JSON.parse(message);
            console.log('Android\'den mesaj alındı:', data);
            
            // Mesaj tipine göre işlem yap
            if (data.type === 'login') {
                appState.isLoggedIn = true;
                appState.user = data.user;
                
                // Kullanıcı bilgilerini güncelle
                if (appState.currentPage === 'profile') {
                    ui.updateUserInfo();
                }
                
                toastManager.show('Giriş başarılı', 'success');
            } else if (data.type === 'logout') {
                appState.isLoggedIn = false;
                appState.user = null;
                
                // Ana sayfaya yönlendir
                router.navigateTo('home');
                
                toastManager.show('Çıkış yapıldı', 'info');
            }
        } catch (error) {
            console.error('Mesaj işleme hatası:', error);
        }
    },
    
    // JavaScript'ten Android'e mesaj göndermek için
    sendMessage(type, data = {}) {
        try {
            const message = JSON.stringify({
                type,
                ...data
            });
            
            // Android WebView'daki JavascriptInterface'e mesaj gönder
            if (window.Android && typeof window.Android.receiveMessage === 'function') {
                window.Android.receiveMessage(message);
            } else {
                console.log('Android arayüzü bulunamadı, mesaj:', message);
            }
        } catch (error) {
            console.error('Mesaj gönderme hatası:', error);
        }
    },
    
    // Spesifik işlemler
    openBrowser(url) {
        this.sendMessage('openBrowser', { url });
    },
    
    shareContent(title, text) {
        this.sendMessage('share', { title, text });
    },
    
    showAdMob() {
        this.sendMessage('showAd');
    }
};

// Global hata yakalama
window.onerror = function(message, source, lineno, colno, error) {
    console.error('JavaScript Hatası:', message, 'Kaynak:', source, 'Satır:', lineno);
    
    // Kritik hataları Android'e bildir
    androidInterface.sendMessage('error', { 
        message, 
        source, 
        lineno 
    });
    
    return true; // Varsayılan hata işlemeyi engelle
}; 