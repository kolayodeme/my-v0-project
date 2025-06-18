// Puan sistemi için servis
class PointsService {
  private readonly STORAGE_KEY = 'user_points_data';
  
  // Kullanıcının mevcut puanını al
  getUserPoints(): number {
    if (typeof window === 'undefined') return 0;
    
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return 0;
      
      const pointsData = JSON.parse(data);
      return pointsData.points || 0;
    } catch (error) {
      console.error('Puanlar yüklenirken hata oluştu:', error);
      return 0;
    }
  }
  
  // Kullanıcıya puan ekle
  addPoints(amount: number): number {
    if (typeof window === 'undefined') return 0;
    
    try {
      const currentPoints = this.getUserPoints();
      const newPoints = currentPoints + amount;
      
      const pointsData = {
        points: newPoints,
        lastUpdated: new Date().toISOString(),
        history: this.getPointsHistory().concat([{
          amount,
          reason: 'reward',
          timestamp: new Date().toISOString()
        }])
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pointsData));
      return newPoints;
    } catch (error) {
      console.error('Puan eklenirken hata oluştu:', error);
      return this.getUserPoints();
    }
  }
  
  // Kullanıcıdan puan çıkar
  deductPoints(amount: number): number {
    if (typeof window === 'undefined') return 0;
    
    try {
      const currentPoints = this.getUserPoints();
      const newPoints = Math.max(0, currentPoints - amount); // Negatif puan olmaması için
      
      const pointsData = {
        points: newPoints,
        lastUpdated: new Date().toISOString(),
        history: this.getPointsHistory().concat([{
          amount: -amount,
          reason: 'deduction',
          timestamp: new Date().toISOString()
        }])
      };
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(pointsData));
      return newPoints;
    } catch (error) {
      console.error('Puan çıkarılırken hata oluştu:', error);
      return this.getUserPoints();
    }
  }
  
  // Puan geçmişini al
  getPointsHistory(): Array<{amount: number, reason: string, timestamp: string}> {
    if (typeof window === 'undefined') return [];
    
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      
      const pointsData = JSON.parse(data);
      return pointsData.history || [];
    } catch (error) {
      console.error('Puan geçmişi yüklenirken hata oluştu:', error);
      return [];
    }
  }
  
  // Belirli bir süre içinde puan kazanılıp kazanılmadığını kontrol et
  hasEarnedPointsRecently(minutes: number = 60): boolean {
    const history = this.getPointsHistory();
    if (history.length === 0) return false;
    
    const now = new Date();
    const timeThreshold = new Date(now.getTime() - minutes * 60 * 1000);
    
    return history.some(entry => {
      const entryTime = new Date(entry.timestamp);
      return entry.amount > 0 && entry.reason === 'reward' && entryTime > timeThreshold;
    });
  }
  
  // Son puan kazanma zamanından bu yana geçen süreyi dakika olarak hesapla
  getMinutesSinceLastReward(): number {
    const history = this.getPointsHistory();
    if (history.length === 0) return Number.MAX_SAFE_INTEGER;
    
    const rewardEntries = history
      .filter(entry => entry.amount > 0 && entry.reason === 'reward')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (rewardEntries.length === 0) return Number.MAX_SAFE_INTEGER;
    
    const lastRewardTime = new Date(rewardEntries[0].timestamp);
    const now = new Date();
    
    return Math.floor((now.getTime() - lastRewardTime.getTime()) / (60 * 1000));
  }
}

export const pointsService = new PointsService(); 