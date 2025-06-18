"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth-service"
import { ArrowLeft, Bell, Moon, Languages, Smartphone } from "lucide-react"

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [language, setLanguage] = useState("tr")
  const router = useRouter()
  const { toast } = useToast()

  // Check authentication and load settings
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = authService.isAuthenticated()
      
      if (!isAuthenticated) {
        toast({
          title: "Giriş yapılmadı",
          description: "Bu sayfayı görüntülemek için giriş yapmalısınız",
          variant: "destructive",
        })
        router.push('/login')
        return
      }
      
      // Load settings from localStorage
      if (typeof window !== "undefined") {
        const storedNotifications = localStorage.getItem("notifications") === "true"
        const storedDarkMode = localStorage.getItem("darkMode") !== "false" // Default to true
        const storedLanguage = localStorage.getItem("language") || "tr"
        
        setNotificationsEnabled(storedNotifications)
        setDarkMode(storedDarkMode)
        setLanguage(storedLanguage)
      }
      
      setIsLoading(false)
    }
    
    checkAuth()
  }, [router, toast])
  
  // Handle notification toggle
  const handleNotificationsToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled)
    localStorage.setItem("notifications", enabled.toString())
    
    if (enabled) {
      // Request notification permission
      if (typeof Notification !== "undefined") {
        Notification.requestPermission().then((permission) => {
          if (permission !== "granted") {
            toast({
              title: "Bildirim izni reddedildi",
              description: "Bildirimleri almak için tarayıcı izinlerini kontrol edin",
              variant: "destructive",
            })
            setNotificationsEnabled(false)
            localStorage.setItem("notifications", "false")
          }
        })
      }
    }
    
    toast({
      title: enabled ? "Bildirimler açıldı" : "Bildirimler kapatıldı",
      description: enabled ? "Artık bildirimler alacaksınız" : "Artık bildirim almayacaksınız",
      variant: "default",
    })
  }
  
  // Handle dark mode toggle
  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled)
    localStorage.setItem("darkMode", enabled.toString())
    
    // Apply dark mode
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", enabled)
    }
    
    toast({
      title: enabled ? "Koyu tema açıldı" : "Açık tema açıldı",
      description: enabled ? "Koyu tema aktif edildi" : "Açık tema aktif edildi",
      variant: "default",
    })
  }
  
  // Handle language change
  const handleLanguageChange = (value: string) => {
    setLanguage(value)
    localStorage.setItem("language", value)
    
    toast({
      title: "Dil değiştirildi",
      description: value === "tr" ? "Türkçe dili seçildi" : "English language selected",
      variant: "default",
    })
    
    // In a real implementation, you would use i18n to change the language
    // For now, we'll just reload the page after a short delay
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/profile')}
          className="mr-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">Ayarlar</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <>
          {/* Notification Settings */}
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Bell className="w-5 h-5 mr-2 text-blue-400" />
                Bildirim Ayarları
              </CardTitle>
              <CardDescription>
                Bildirim tercihlerinizi yönetin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Bildirimleri Etkinleştir</Label>
                  <p className="text-sm text-slate-400">
                    Maç bildirimleri ve önemli güncellemeler alın
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationsToggle}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Appearance Settings */}
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Moon className="w-5 h-5 mr-2 text-purple-400" />
                Görünüm Ayarları
              </CardTitle>
              <CardDescription>
                Uygulama görünümünü özelleştirin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="darkMode">Koyu Tema</Label>
                  <p className="text-sm text-slate-400">
                    Koyu temayı etkinleştirin veya devre dışı bırakın
                  </p>
                </div>
                <Switch
                  id="darkMode"
                  checked={darkMode}
                  onCheckedChange={handleDarkModeToggle}
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Language Settings */}
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Languages className="w-5 h-5 mr-2 text-green-400" />
                Dil Ayarları
              </CardTitle>
              <CardDescription>
                Uygulama dilini değiştirin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Dil Seçin</Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger id="language" className="bg-slate-900 border-slate-700">
                    <SelectValue placeholder="Dil seçin" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="tr">Türkçe</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* App Info */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Smartphone className="w-5 h-5 mr-2 text-amber-400" />
                Uygulama Bilgisi
              </CardTitle>
              <CardDescription>
                Uygulama hakkında bilgiler
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Versiyon</span>
                  <span className="text-sm">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Yapım Tarihi</span>
                  <span className="text-sm">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  toast({
                    title: "Güncellemeler kontrol ediliyor",
                    description: "Şu anda en güncel sürümü kullanıyorsunuz",
                    variant: "default",
                  })
                }}
              >
                Güncellemeleri Kontrol Et
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 