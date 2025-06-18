import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { pb } from './pocketbase-config';
import { useToast } from '@/hooks/use-toast';
import { Coins } from 'lucide-react';
import React from 'react';

interface CreditState {
  credits: number;
  isLoading: boolean;
  lastSync: number;
  lastKnownCredits: number; // Son bilinen kredi miktarı
  addCredits: (amount: number) => Promise<void>;
  useCredits: (amount: number) => Promise<boolean>;
  hasCredits: (amount: number) => boolean;
  getCredits: () => number;
  setCredits: (amount: number) => void;
  forceSync: () => Promise<void>;
  showCreditNotification: (oldAmount: number, newAmount: number) => void;
  showCreditDeductionNotification: (oldAmount: number, newAmount: number, reason?: string) => void;
}

// Senkronizasyon için debounce fonksiyonu
let syncTimeout: NodeJS.Timeout | null = null;
const debouncedSync = (callback: () => Promise<void>) => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  syncTimeout = setTimeout(async () => {
    await callback();
  }, 100);
};

export const useCreditStore = create<CreditState>()(
  persist(
    (set, get) => ({
      credits: 0,
      isLoading: false,
      lastSync: 0,
      lastKnownCredits: 0,

      setCredits: (amount: number) => {
        const oldCredits = get().credits;
        set({ 
          credits: amount, 
          lastSync: Date.now(),
          lastKnownCredits: oldCredits 
        });
        
        // Sadece kredi artışlarında bildirim göster
        if (amount > oldCredits) {
          get().showCreditNotification(oldCredits, amount);
        } 
        // Kredi azalışlarında bildirim gösterme - bu bildirimler bileşenler tarafından tetiklenecek
      },

      addCredits: async (amount: number) => {
        if (!pb.authStore.isValid) return;
        const userId = pb.authStore.model?.id;
        if (!userId) return;

        try {
          set({ isLoading: true });
          
          // Önce sunucudan güncel krediyi al
          const user = await pb.collection('users').getOne(userId);
          const currentServerCredits = user.credits || 0;
          
          // Sunucuya güncellemeyi gönder
          const result = await pb.collection('users').update(userId, {
            credits: currentServerCredits + amount
          });

          // Yerel state'i güncelle
          set({ 
            credits: result.credits,
            lastSync: Date.now(),
            isLoading: false 
          });

        } catch (error) {
          console.error('Add credits error:', error);
          set({ isLoading: false });
          // Hata durumunda son bilinen krediyi koru
          debouncedSync(async () => {
            await get().forceSync();
          });
        }
      },

      useCredits: async (amount: number) => {
        if (!pb.authStore.isValid) return false;
        const userId = pb.authStore.model?.id;
        if (!userId) return false;

        try {
          set({ isLoading: true });
          
          // Önce sunucudan güncel krediyi kontrol et
          const user = await pb.collection('users').getOne(userId);
          const currentServerCredits = user.credits || 0;

          if (currentServerCredits < amount) {
            set({ isLoading: false });
            return false;
          }

          // Kredi kullanım sebebini belirle
          let reason = 'bet';
          if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            if (path.includes('/predictions')) {
              reason = 'prediction';
            } else if (path.includes('/analysis')) {
              reason = 'analysis';
            }
          }

          console.log('Using credits with reason:', reason);

          // Sunucuda krediyi düş
          const result = await pb.collection('users').update(userId, {
            credits: currentServerCredits - amount
          });

          // Yerel state'i güncelle
          set({ 
            credits: result.credits,
            lastSync: Date.now(),
            isLoading: false 
          });
          
          // Kredi düşme bildirimi göster - bu bileşenler tarafından tetiklenir
          // Burada bildirim göstermeyi kaldırıyoruz, çünkü her bileşen kendi creditUsed eventini tetikleyecek
          // get().showCreditDeductionNotification(currentServerCredits, result.credits, reason);

          return true;

        } catch (error) {
          console.error('Use credits error:', error);
          set({ isLoading: false });
          // Hata durumunda son bilinen krediyi koru
          debouncedSync(async () => {
            await get().forceSync();
          });
          return false;
        }
      },

      hasCredits: (amount: number) => {
        return get().credits >= amount;
      },

      getCredits: () => {
        return get().credits;
      },

      forceSync: async () => {
        if (!pb.authStore.isValid) return;
        const userId = pb.authStore.model?.id;
        if (!userId) return;

        // Eğer zaten loading durumundaysa veya son senkronizasyondan 5 saniye geçmediyse
        if (get().isLoading || Date.now() - get().lastSync < 5000) {
          return;
        }

        try {
          set({ isLoading: true });
          const user = await pb.collection('users').getOne(userId);
          const oldCredits = get().credits;
          const newCredits = user.credits || 0;
          
          // State güncellemesini bir sonraki mikro görevde yap
          setTimeout(() => {
            set({ 
              credits: newCredits,
              lastSync: Date.now(),
              isLoading: false,
              lastKnownCredits: oldCredits
            });
            
            // Sadece kredi artışlarında bildirim göster
            if (newCredits > oldCredits) {
              get().showCreditNotification(oldCredits, newCredits);
            } 
            // Kredi azalışlarında bildirim gösterme - bu bildirimler bileşenler tarafından tetiklenecek
          }, 0);
          
        } catch (error) {
          console.error('Force sync error:', error);
          setTimeout(() => {
            set({ isLoading: false });
          }, 0);
        }
      },
      
      // Kredi ekleme bildirimi gösterme fonksiyonu
      showCreditNotification: (oldAmount: number, newAmount: number) => {
        const difference = newAmount - oldAmount;
        if (difference <= 0) return;
        
        // Toast bildirimi göster
        if (typeof document !== 'undefined') {
          // Toast bildirimi için bir event oluştur
          const event = new CustomEvent('creditAdded', { 
            detail: { 
              amount: difference,
              message: `Yetkili admin tarafından ${difference} kredi yüklendi!`
            }
          });
          document.dispatchEvent(event);
        }
      },
      
      // Kredi düşme bildirimi gösterme fonksiyonu
      showCreditDeductionNotification: (oldAmount: number, newAmount: number, reason: string = 'bet') => {
        const difference = oldAmount - newAmount;
        if (difference <= 0) return;
        
        // Toast bildirimi göster
        if (typeof document !== 'undefined') {
          // Toast bildirimi için bir event oluştur
          const event = new CustomEvent('creditUsed', { 
            detail: { 
              amount: difference,
              reason: reason,
              message: `${difference} kredi kullanıldı!`
            }
          });
          document.dispatchEvent(event);
        }
      }
    }),
    {
      name: 'football-app-credits',
      partialize: (state) => ({ 
        credits: state.credits,
        lastKnownCredits: state.lastKnownCredits
      }),
    }
  )
);

// Senkronizasyon yöneticisi
let isSyncing = false;
const syncManager = async () => {
  if (isSyncing || !pb.authStore.isValid) return;
  
  isSyncing = true;
  try {
    await useCreditStore.getState().forceSync();
  } finally {
    isSyncing = false;
  }
};

// Otomatik senkronizasyon sistemi
if (typeof window !== 'undefined') {
  // Sayfa yüklendiğinde senkronize et
  if (pb.authStore.isValid) {
    debouncedSync(syncManager);
  }

  // Auth durumu değiştiğinde senkronize et
  pb.authStore.onChange(() => {
    if (pb.authStore.isValid) {
      debouncedSync(syncManager);
    } else {
      useCreditStore.getState().setCredits(0);
    }
  });

  // Sekme görünür olduğunda senkronize et
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && pb.authStore.isValid) {
      debouncedSync(syncManager);
    }
  });

  // Sayfa odaklandığında senkronize et
  window.addEventListener('focus', () => {
    if (pb.authStore.isValid) {
      debouncedSync(syncManager);
    }
  });

  // Route değişimlerini izle
  const originalPushState = window.history.pushState;
  window.history.pushState = function(data: any, unused: string, url?: string | URL) {
    originalPushState.call(this, data, unused, url);
    if (pb.authStore.isValid) {
      debouncedSync(syncManager);
    }
  };

  // PopState olayını dinle
  window.addEventListener('popstate', () => {
    if (pb.authStore.isValid) {
      debouncedSync(syncManager);
    }
  });

  // Network durumunu izle
  window.addEventListener('online', () => {
    if (pb.authStore.isValid) {
      debouncedSync(syncManager);
    }
  });

  // Her 60 saniyede bir senkronize et (arka planda)
  setInterval(() => {
    if (pb.authStore.isValid) {
      debouncedSync(syncManager);
    }
  }, 60000);
}

// Kredi maliyetleri
export const CREDIT_COSTS = {
  ANALYSIS: 1,
  PREDICTION: 1,
  LAST_TEN: 1,
};

// Kredi formatla
export const formatCredits = (credits: number): string => {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`;
  } else if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K`;
  } else {
    return credits.toString();
  }
}; 