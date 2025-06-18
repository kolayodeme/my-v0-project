type NotificationType = "goal" | "card" | "substitution" | "matchStart" | "matchEnd" | "halfTime" | "info"

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  data?: any
  vibrate?: number[]
  requireInteraction?: boolean
  actions?: NotificationAction[]
  silent?: boolean
}

interface NotificationAction {
  action: string
  title: string
  icon?: string
}

class NotificationService {
  private enabled = false
  private permission: NotificationPermission = "default"
  private callbacks: Record<string, Function> = {}

  constructor() {
    if (typeof window !== "undefined" && "Notification" in window) {
      this.permission = Notification.permission
      this.enabled = localStorage.getItem("notifications") === "true"

      // Bildirim izni kontrolü
      if (this.permission === "granted") {
        this.enabled = true
        localStorage.setItem("notifications", "true")
      }
    }
  }

  // Bildirim izni iste
  async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      this.permission = permission

      if (permission === "granted") {
        this.enabled = true
        localStorage.setItem("notifications", "true")
        return true
      } else {
        this.enabled = false
        localStorage.setItem("notifications", "false")
        return false
      }
    } catch (error) {
      console.error("Bildirim izni istenirken hata:", error)
      return false
    }
  }

  // Bildirimleri aç/kapat
  toggleNotifications(enabled: boolean): void {
    this.enabled = enabled
    localStorage.setItem("notifications", enabled ? "true" : "false")

    if (enabled && this.permission !== "granted") {
      this.requestPermission()
    }
  }

  // Bildirim gönder
  async sendNotification(type: NotificationType, options: NotificationOptions): Promise<boolean> {
    if (
      !this.enabled ||
      this.permission !== "granted" ||
      typeof window === "undefined" ||
      !("Notification" in window)
    ) {
      return false
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || this.getDefaultIcon(type),
        tag: options.tag || type,
        data: options.data || { type },
        vibrate: options.vibrate || [200, 100, 200],
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
      })

      notification.onclick = (event) => {
        event.preventDefault()
        if (this.callbacks["click"]) {
          this.callbacks["click"](notification)
        }
        notification.close()
      }

      notification.onclose = () => {
        if (this.callbacks["close"]) {
          this.callbacks["close"](notification)
        }
      }

      return true
    } catch (error) {
      console.error("Bildirim gönderilirken hata:", error)
      return false
    }
  }

  // Bildirim olayı dinleyicisi ekle
  addEventListener(event: "click" | "close", callback: Function): void {
    this.callbacks[event] = callback
  }

  // Bildirim olayı dinleyicisini kaldır
  removeEventListener(event: "click" | "close"): void {
    delete this.callbacks[event]
  }

  // Bildirim durumunu kontrol et
  isEnabled(): boolean {
    return this.enabled
  }

  // İzin durumunu kontrol et
  getPermission(): NotificationPermission {
    return this.permission
  }

  // Varsayılan ikon al
  private getDefaultIcon(type: NotificationType): string {
    switch (type) {
      case "goal":
        return "/icons/goal.png"
      case "card":
        return "/icons/card.png"
      case "substitution":
        return "/icons/substitution.png"
      case "matchStart":
        return "/icons/match-start.png"
      case "matchEnd":
        return "/icons/match-end.png"
      case "halfTime":
        return "/icons/half-time.png"
      default:
        return "/icons/football.png"
    }
  }
}

// Singleton örneği
export const notificationService = typeof window !== "undefined" ? new NotificationService() : null
