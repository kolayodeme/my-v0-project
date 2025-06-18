// IndexedDB-based cache system with 500MB capacity
interface CacheEntry {
  id: string
  data: any
  timestamp: number
  version: string
  size: number
  compressed: boolean
  dayStamp?: number // Günü takip etmek için yeni alan
}

class IndexedCache {
  private dbName = "FootballAppCache"
  private version = 1
  private storeName = "matches"
  private db: IDBDatabase | null = null
  private currentDay: number = this.getCurrentDay() // Şu anki günü takip et

  // Şu anki günün sayısal değerini al (1-31)
  private getCurrentDay(): number {
    return new Date().getDate() // Günün sayısal değeri (1-31)
  }
  
  // Gün değişimini kontrol et
  private isDayChanged(storedDay: number): boolean {
    const today = this.getCurrentDay()
    return storedDay !== today
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        
        // Gün değişimini kontrol et ve gerekirse verileri temizle
        this.checkDayChange()
        
        // Günlük kontrol zamanlayıcısı
        this.setupDailyCheck()
        
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" })
          store.createIndex("timestamp", "timestamp", { unique: false })
          store.createIndex("dayStamp", "dayStamp", { unique: false })
        }
      }
    })
  }
  
  // Gün değişimini düzenli olarak kontrol et
  private setupDailyCheck() {
    // Şu anki saati al
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    
    // Gece yarısına kaç dakika kaldığını hesapla
    const minutesToMidnight = (24 - currentHour - 1) * 60 + (60 - currentMinute)
    
    // Gece yarısı için zamanlayıcı kur
    setTimeout(() => {
      // Gün değişimini kontrol et
      this.checkDayChange()
      
      // Sonraki gün için zamanlayıcıyı yeniden ayarla (24 saat = 86400000 ms)
      setInterval(() => this.checkDayChange(), 86400000)
    }, minutesToMidnight * 60 * 1000)
    
    // Ek olarak, her saat başı kontrol et (önlem amaçlı)
    setInterval(() => {
      const newDay = this.getCurrentDay()
      if (newDay !== this.currentDay) {
        this.checkDayChange()
      }
    }, 3600000) // 1 saat = 3600000 ms
  }
  
  // Gün değişimini kontrol et ve gerekirse tüm verileri temizle
  private async checkDayChange() {
    const newDay = this.getCurrentDay()
    
    if (newDay !== this.currentDay) {
      console.log(`Gün değişimi tespit edildi: ${this.currentDay} -> ${newDay}. Tüm önbellek yenileniyor.`)
      this.currentDay = newDay
      
      // Tüm önbelleği temizle
      await this.clear()
      
      // Tarayıcı yerel depolama alanına günü kaydet (uygulama yeniden başlatıldığında kullanılabilir)
      try {
        localStorage.setItem('lastCacheDay', newDay.toString())
      } catch (e) {
        console.warn('LocalStorage erişimi mevcut değil')
      }
    }
  }

  async set(key: string, data: any, ttl: number = 24 * 60 * 60 * 1000): Promise<boolean> {
    try {
      if (!this.db) await this.init()

      const compressed = this.compress(data)
      const entry: CacheEntry = {
        id: key,
        data: compressed,
        timestamp: Date.now(),
        version: "2.0",
        size: JSON.stringify(compressed).length,
        compressed: true,
        dayStamp: this.getCurrentDay() // Şu anki günü kaydet
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], "readwrite")
        const store = transaction.objectStore(this.storeName)
        const request = store.put(entry)

        request.onsuccess = () => resolve(true)
        request.onerror = () => {
          console.error("IndexedDB set error:", request.error)
          resolve(false)
        }
      })
    } catch (error) {
      console.error("Cache set error:", error)
      return false
    }
  }

  async get(key: string): Promise<any | null> {
    try {
      if (!this.db) await this.init()

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], "readonly")
        const store = transaction.objectStore(this.storeName)
        const request = store.get(key)

        request.onsuccess = () => {
          const entry = request.result as CacheEntry
          if (!entry) {
            resolve(null)
            return
          }

          // Gün değişimini kontrol et
          if (entry.dayStamp && this.isDayChanged(entry.dayStamp)) {
            console.log(`Gün değişimi nedeniyle veri yenileniyor: ${key}`)
            this.delete(key)
            resolve(null)
            return
          }

          // Normal süre kontrolü
          if (Date.now() - entry.timestamp > 24 * 60 * 60 * 1000) {
            this.delete(key)
            resolve(null)
            return
          }

          const decompressed = this.decompress(entry.data)
          resolve(decompressed)
        }

        request.onerror = () => {
          console.error("IndexedDB get error:", request.error)
          resolve(null)
        }
      })
    } catch (error) {
      console.error("Cache get error:", error)
      return null
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      if (!this.db) await this.init()

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.storeName], "readwrite")
        const store = transaction.objectStore(this.storeName)
        const request = store.delete(key)

        request.onsuccess = () => resolve(true)
        request.onerror = () => resolve(false)
      })
    } catch (error) {
      console.error("Cache delete error:", error)
      return false
    }
  }

  async clear(): Promise<boolean> {
    try {
      if (!this.db) await this.init()

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.storeName], "readwrite")
        const store = transaction.objectStore(this.storeName)
        const request = store.clear()

        request.onsuccess = () => resolve(true)
        request.onerror = () => resolve(false)
      })
    } catch (error) {
      console.error("Cache clear error:", error)
      return false
    }
  }

  async getStorageInfo(): Promise<{ used: number; available: number; percentage: number }> {
    try {
      if (!this.db) await this.init()

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.storeName], "readonly")
        const store = transaction.objectStore(this.storeName)
        const request = store.getAll()

        request.onsuccess = () => {
          const entries = request.result as CacheEntry[]
          const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0)
          const maxSize = 500 * 1024 * 1024 // 500MB
          const percentage = (totalSize / maxSize) * 100

          resolve({
            used: totalSize,
            available: maxSize - totalSize,
            percentage: Math.round(percentage * 100) / 100,
          })
        }

        request.onerror = () => {
          resolve({ used: 0, available: 500 * 1024 * 1024, percentage: 0 })
        }
      })
    } catch (error) {
      return { used: 0, available: 500 * 1024 * 1024, percentage: 0 }
    }
  }

  async cleanup(): Promise<boolean> {
    try {
      if (!this.db) await this.init()

      const storageInfo = await this.getStorageInfo()
      if (storageInfo.percentage < 80) return true

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.storeName], "readwrite")
        const store = transaction.objectStore(this.storeName)
        const index = store.index("timestamp")
        const request = index.openCursor()

        const toDelete: string[] = []
        const now = Date.now()
        const oneDayAgo = now - 24 * 60 * 60 * 1000

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            const entry = cursor.value as CacheEntry
            if (entry.timestamp < oneDayAgo) {
              toDelete.push(entry.id)
            }
            cursor.continue()
          } else {
            // Delete expired entries
            Promise.all(toDelete.map((id) => this.delete(id))).then(() => {
              resolve(true)
            })
          }
        }

        request.onerror = () => resolve(false)
      })
    } catch (error) {
      console.error("Cache cleanup error:", error)
      return false
    }
  }

  private compress(data: any): string {
    try {
      // For better performance, stringify once
      const jsonString = JSON.stringify(data);
      
      // If the data is not an array or it's small, don't compress
      if (!Array.isArray(data) || data.length < 10) {
        return jsonString;
      }
      
      // Check if data is larger than 1MB
      if (jsonString.length < 1024 * 1024) {
        // For smaller data, use minimal compression
        return jsonString
          .replace(/\s+/g, " ")
          .trim();
      }
      
      // For large datasets, use more aggressive compression
      // Prepare regex patterns once for better performance
      const patterns = [
        { regex: /"match_id"/g, replacement: '"mi"' },
        { regex: /"match_date"/g, replacement: '"md"' },
        { regex: /"match_time"/g, replacement: '"mt"' },
        { regex: /"match_hometeam_name"/g, replacement: '"mhn"' },
        { regex: /"match_awayteam_name"/g, replacement: '"man"' },
        { regex: /"match_hometeam_id"/g, replacement: '"mhi"' },
        { regex: /"match_awayteam_id"/g, replacement: '"mai"' },
        { regex: /"team_home_badge"/g, replacement: '"thb"' },
        { regex: /"team_away_badge"/g, replacement: '"tab"' },
        { regex: /"league_name"/g, replacement: '"ln"' },
        { regex: /"league_logo"/g, replacement: '"ll"' },
        { regex: /"league_id"/g, replacement: '"li"' },
        { regex: /"country_name"/g, replacement: '"cn"' },
        { regex: /"country_logo"/g, replacement: '"cl"' },
        { regex: /"country_id"/g, replacement: '"ci"' },
        { regex: /"match_stadium"/g, replacement: '"ms"' },
        { regex: /null/g, replacement: "0" },
        { regex: /https:\/\//g, replacement: "h://" },
        { regex: /http:\/\//g, replacement: "p://" }
      ];
      
      // Apply all replacements
      let result = jsonString.replace(/\s+/g, " ").trim();
      for (const { regex, replacement } of patterns) {
        result = result.replace(regex, replacement);
      }
      
      return result;
    } catch (error) {
      console.warn("Compression error, returning original data", error);
      return JSON.stringify(data);
    }
  }

  private decompress(compressedString: string): any {
    try {
      // Quick check if this is a compressed string - check length and key patterns
      if (compressedString.length < 1000 || 
          (!compressedString.includes('"mi"') && 
           !compressedString.includes('"mhn"') && 
           !compressedString.includes('"man"'))) {
        // Not compressed or very small, just parse it
        return JSON.parse(compressedString);
      }
      
      // Prepare regex patterns once for better performance
      const patterns = [
        { regex: /h:\/\//g, replacement: "https://" },
        { regex: /p:\/\//g, replacement: "http://" },
        { regex: /([":,[])\s*0\s*([,\]}])/g, replacement: "$1null$2" },
        { regex: /"mi"/g, replacement: '"match_id"' },
        { regex: /"md"/g, replacement: '"match_date"' },
        { regex: /"mt"/g, replacement: '"match_time"' },
        { regex: /"mhn"/g, replacement: '"match_hometeam_name"' },
        { regex: /"man"/g, replacement: '"match_awayteam_name"' },
        { regex: /"mhi"/g, replacement: '"match_hometeam_id"' },
        { regex: /"mai"/g, replacement: '"match_awayteam_id"' },
        { regex: /"thb"/g, replacement: '"team_home_badge"' },
        { regex: /"tab"/g, replacement: '"team_away_badge"' },
        { regex: /"ln"/g, replacement: '"league_name"' },
        { regex: /"ll"/g, replacement: '"league_logo"' },
        { regex: /"li"/g, replacement: '"league_id"' },
        { regex: /"cn"/g, replacement: '"country_name"' },
        { regex: /"cl"/g, replacement: '"country_logo"' },
        { regex: /"ci"/g, replacement: '"country_id"' },
        { regex: /"ms"/g, replacement: '"match_stadium"' }
      ];
      
      // Apply all replacements
      let result = compressedString;
      for (const { regex, replacement } of patterns) {
        result = result.replace(regex, replacement);
      }

      return JSON.parse(result);
    } catch (error) {
      console.error("Decompression error, trying to parse as-is:", error);
      try {
        // Fallback to direct parsing
        return JSON.parse(compressedString);
      } catch (e) {
        console.error("Failed to parse JSON after decompression failed:", e);
        return null;
      }
    }
  }
}

export const indexedCache = new IndexedCache()
