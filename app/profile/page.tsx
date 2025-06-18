"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdMobRewardButton } from "@/components/ui/AdMobRewardButton"
import { Coins, User, Settings, LogOut, CreditCard, History, ChevronRight, ShoppingCart, Crown, AlertCircle } from "lucide-react"
import { useCreditStore, formatCredits } from "@/lib/credit-system"
import { authService, User as UserType } from "@/lib/auth-service"
import { purchaseService, PRODUCTS } from "@/lib/purchase-service"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

export default function ProfilePage() {
  const { credits, addCredits } = useCreditStore()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<UserType | null>(null)
  const [isPurchaseAvailable, setIsPurchaseAvailable] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Ensure we're on the client and check authentication
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setMounted(true)
        
        const currentUser = await authService.getCurrentUser()
        if (!currentUser) {
          router.push('/login')
          return
        }
        
        // Update user state with the current user data
        setUser(currentUser)
        
        // Check if in-app purchases are available
        setIsPurchaseAvailable(purchaseService.isPurchaseAvailable())
        
        // Sync credits from server
        await authService.syncCredits()
      } catch (error) {
        console.error('Error loading user data:', error)
        router.push('/login')
      }
    }
    
    loadUserData()
  }, [router])

  // Handle ad reward
  const handleAdReward = async () => {
    addCredits(1)
    
    // Update credits on server if user is authenticated
    if (user) {
      try {
        await authService.updateProfile({ credits: credits + 1 })
      } catch (error) {
        console.error('Failed to update credits on server:', error)
      }
    }
  }
  
  // Handle logout
  const handleLogout = async () => {
    await authService.logout()
    router.push('/')
    
    toast({
      title: "Çıkış yapıldı",
      description: "Hesabınızdan güvenli bir şekilde çıkış yaptınız",
      variant: "default",
    })
  }
  
  // Format pro expiry date
  const formatProExpiry = (dateString: string | null) => {
    if (!dateString) return null
    
    try {
      const date = new Date(dateString)
      return format(date, 'dd.MM.yyyy')
    } catch (error) {
      return null
    }
  }
  
  // Check if pro membership is active
  const isProActive = () => {
    if (!user?.isPro) return false
    if (!user.proExpiryDate) return false
    
    try {
      const expiryDate = new Date(user.proExpiryDate)
      return expiryDate > new Date()
    } catch (error) {
      return false
    }
  }
  
  // Buy credits
  const handleBuyCredits = async (productId: string) => {
    try {
      await purchaseService.purchaseProduct(productId)
      
      // Refresh user data
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      }
      
      toast({
        title: "Satın alma başarılı",
        description: "Kredi satın alma işlemi başarıyla tamamlandı",
        variant: "default",
      })
    } catch (error: any) {
      console.error('Purchase error:', error)
      
      toast({
        title: "Satın alma başarısız",
        description: error.message || "Bir hata oluştu, lütfen tekrar deneyin",
        variant: "destructive",
      })
    }
  }
  
  // Buy pro membership
  const handleBuyPro = async (productId: string) => {
    try {
      await purchaseService.purchaseProduct(productId)
      
      // Refresh user data
      const currentUser = await authService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      }
      
      toast({
        title: "Satın alma başarılı",
        description: "Pro üyelik satın alma işlemi başarıyla tamamlandı",
        variant: "default",
      })
    } catch (error: any) {
      console.error('Purchase error:', error)
      
      toast({
        title: "Satın alma başarısız",
        description: error.message || "Bir hata oluştu, lütfen tekrar deneyin",
        variant: "destructive",
      })
    }
  }
  
  // Restore purchases
  const handleRestorePurchases = async () => {
    try {
      const result = await purchaseService.restorePurchases()
      
      if (result) {
        // Refresh user data
        const currentUser = await authService.getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
        }
        
        toast({
          title: "Satın almalar geri yüklendi",
          description: "Satın almalarınız başarıyla geri yüklendi",
          variant: "default",
        })
      } else {
        toast({
          title: "Geri yükleme başarısız",
          description: "Geri yüklenecek satın alma bulunamadı",
          variant: "default",
        })
      }
    } catch (error: any) {
      console.error('Restore purchases error:', error)
      
      toast({
        title: "Geri yükleme başarısız",
        description: error.message || "Bir hata oluştu, lütfen tekrar deneyin",
        variant: "destructive",
      })
    }
  }

  if (!mounted || !user) {
    return (
      <div className="container max-w-md mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Profil</h1>
        <div className="animate-pulse">
          <div className="h-24 bg-slate-700/50 rounded-lg mb-4"></div>
          <div className="h-12 bg-slate-700/50 rounded-lg mb-4"></div>
          <div className="h-36 bg-slate-700/50 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Profil</h1>

      {/* Kullanıcı Bilgileri */}
      <Card className="bg-slate-800/50 border-slate-700 mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-slate-200 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-400" />
            {user.username}
          </CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
      </Card>

      {/* Pro Üyelik Kartı */}
      <Card className={`${isProActive() ? 'bg-gradient-to-br from-amber-900/50 to-amber-800/30' : 'bg-slate-800/50'} border-amber-700/50 mb-6`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-slate-200 flex items-center">
            <Crown className={`w-5 h-5 mr-2 ${isProActive() ? 'text-yellow-400' : 'text-slate-400'}`} />
            Pro Üyelik
          </CardTitle>
          <CardDescription>
            {isProActive() 
              ? `Pro üyeliğiniz ${formatProExpiry(user.proExpiryDate)} tarihine kadar geçerli` 
              : "Pro üyelik avantajlarından yararlanın"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProActive() ? (
            <div className="flex flex-col items-center py-2">
              <div className="text-center text-sm text-yellow-400 font-medium mb-4">
                Pro üyelik aktif
              </div>
              <ul className="text-sm text-slate-300 space-y-1 mb-4 w-full">
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></div>
                  Sınırsız analiz ve tahmin
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></div>
                  Reklamsız deneyim
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></div>
                  Özel istatistikler
                </li>
              </ul>
            </div>
          ) : (
            <div className="flex flex-col items-center py-2">
              <div className="text-center text-sm text-slate-400 mb-4">
                Pro üyelik ile sınırsız analiz ve tahmin yapabilirsiniz
              </div>
              {isPurchaseAvailable && (
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button 
                    onClick={() => handleBuyPro('pro_1month')}
                    className="bg-amber-800 hover:bg-amber-700 text-white"
                    size="sm"
                  >
                    1 Ay (₺19.99)
                  </Button>
                  <Button 
                    onClick={() => handleBuyPro('pro_3month')}
                    className="bg-amber-800 hover:bg-amber-700 text-white"
                    size="sm"
                  >
                    3 Ay (₺49.99)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kredi Kartı */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 mb-6 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-slate-200 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-green-400" />
            Krediniz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex items-center gap-2 mb-4">
              {/* Altın para animasyonu */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 flex items-center justify-center animate-coin-flip shadow-lg shadow-amber-500/30 border-2 border-yellow-300/50 overflow-hidden" style={{ perspective: '1000px' }}>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-yellow-200/30 to-white/40 animate-spin-slow"></div>
                  <Coins className="w-7 h-7 text-white drop-shadow-md" />
                </div>
                
                {/* Parıltı efekti */}
                <div className="absolute -inset-2 z-[-1]">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div 
                      key={i}
                      className="absolute rounded-full bg-yellow-300 animate-sparkle"
                      style={{ 
                        left: `${Math.random() * 100}%`, 
                        top: `${Math.random() * 100}%`,
                        width: `${Math.random() * 3 + 1}px`,
                        height: `${Math.random() * 3 + 1}px`,
                        animationDelay: `${Math.random() * 2}s`
                      }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Kredi miktarı */}
              <span className="text-3xl font-bold bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-transparent bg-clip-text animate-gold-shimmer" style={{ backgroundSize: '200% 200%' }}>{formatCredits(credits)}</span>
            </div>
            
            <div className="text-center text-sm text-slate-400 mb-4">
              Kredi ile analiz ve tahmin özelliklerini kullanabilirsiniz
            </div>
            
            <div className="w-full space-y-2">
              <div className="text-xs text-center font-medium text-slate-400 mb-2">
                Reklam izleyerek kredi kazanın
              </div>
              <AdMobRewardButton 
                onReward={handleAdReward}
                className="w-full bg-gradient-to-r from-green-800 to-green-700 hover:from-green-700 hover:to-green-600 text-white flex items-center justify-center gap-2 shadow-md shadow-green-900/40 border border-green-600/30 transition-all duration-300"
              >
                <div className="relative">
                <Coins className="w-4 h-4" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping-slow"></div>
                </div>
                Reklam İzle ve +1 Kredi Kazan
              </AdMobRewardButton>
              
              {isPurchaseAvailable && (
                <>
                  <div className="text-xs text-center font-medium text-slate-400 mt-4 mb-2">
                    Kredi satın alın
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      onClick={() => handleBuyCredits('credits_10')}
                      className="bg-gradient-to-br from-green-800 to-green-700 hover:from-green-700 hover:to-green-600 text-white shadow-md shadow-green-900/30 border border-green-600/30 transition-all duration-300"
                      size="sm"
                    >
                      <span className="flex items-center">
                        <span className="mr-1">10</span>
                        <Coins className="w-3 h-3 text-yellow-400" />
                      </span>
                    </Button>
                    <Button 
                      onClick={() => handleBuyCredits('credits_50')}
                      className="bg-gradient-to-br from-green-800 to-green-700 hover:from-green-700 hover:to-green-600 text-white shadow-md shadow-green-900/30 border border-green-600/30 transition-all duration-300"
                      size="sm"
                    >
                      <span className="flex items-center">
                        <span className="mr-1">50</span>
                        <Coins className="w-3 h-3 text-yellow-400" />
                      </span>
                    </Button>
                    <Button 
                      onClick={() => handleBuyCredits('credits_100')}
                      className="bg-gradient-to-br from-green-800 to-green-700 hover:from-green-700 hover:to-green-600 text-white shadow-md shadow-green-900/30 border border-green-600/30 transition-all duration-300"
                      size="sm"
                    >
                      <span className="flex items-center">
                        <span className="mr-1">100</span>
                        <Coins className="w-3 h-3 text-yellow-400" />
                      </span>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Davet Kodu Kartı */}
      <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-700/50 mb-6 overflow-hidden shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-slate-200 flex items-center">
            <User className="w-5 h-5 mr-2 text-green-400" />
            Arkadaşlarını Davet Et
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4">
                          <div className="text-center text-sm text-slate-400 mb-4">
              Arkadaşlarını davet et, her kayıt olan arkadaşın için <span className="text-yellow-400 font-bold">5 kredi</span> kazan!
            </div>
            
            <div className="w-full mb-4">
              <div className="text-xs text-center font-medium text-slate-400 mb-2">
                Davet Kodun
              </div>
              <div className="flex">
                <input 
                  type="text" 
                  value={user?.referralCode || ''} 
                  readOnly 
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-l-md px-3 py-2 text-center text-yellow-400 font-mono"
                />
                <Button 
                  className="bg-green-600 hover:bg-green-500 text-white rounded-l-none shadow-md"
                  onClick={() => {
                    if (user?.referralCode) {
                      navigator.clipboard.writeText(user.referralCode);
                      toast({
                        title: "Kopyalandı!",
                        description: "Davet kodun panoya kopyalandı",
                        variant: "default",
                      });
                    }
                  }}
                >
                  Kopyala
                </Button>
              </div>
            </div>
            

            
            <div className="mt-4 flex gap-2">
              {navigator.share && (
                              <Button 
                className="bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center gap-1"
                onClick={() => {
                  const link = `${window.location.origin}/register?ref=${user?.referralCode || ''}`;
                  navigator.share({
                    title: 'Football App Davet',
                    text: 'Football App\'e kaydol ve birlikte analiz yapalım!',
                    url: link,
                  }).catch(console.error);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                Paylaş
              </Button>
              )}
              
              <Button 
                className="bg-green-600 hover:bg-green-500 text-white shadow-md flex items-center gap-1"
                onClick={() => {
                  const link = `${window.location.origin}/register?ref=${user?.referralCode || ''}`;
                  const text = `Football App'e kaydol ve birlikte analiz yapalım! ${link}`;
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(whatsappUrl, '_blank');
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Menü */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col divide-y divide-slate-700/50">
            <MenuItem 
              icon={User} 
              label="Hesap Bilgileri" 
              sublabel="Kullanıcı adı ve e-posta" 
              onClick={() => router.push('/profile/account')} 
            />
            <MenuItem 
              icon={History} 
              label="Kredi Geçmişi" 
              sublabel="Kredi kazanma ve harcama geçmişi" 
              onClick={() => router.push('/profile/transactions')} 
            />
            <MenuItem 
              icon={ShoppingCart} 
              label="Satın Almaları Geri Yükle" 
              sublabel="Önceki satın almalarınızı geri yükleyin" 
              onClick={handleRestorePurchases} 
            />
            <MenuItem 
              icon={Settings} 
              label="Ayarlar" 
              sublabel="Bildirimler ve uygulama tercihleri" 
              onClick={() => router.push('/profile/settings')} 
            />
            <MenuItem 
              icon={LogOut} 
              label="Çıkış Yap" 
              sublabel="Hesabınızdan güvenli çıkış yapın" 
              onClick={handleLogout} 
              className="text-red-400"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MenuItem({ 
  icon: Icon, 
  label, 
  sublabel, 
  onClick, 
  className = "" 
}: { 
  icon: any, 
  label: string, 
  sublabel: string, 
  onClick: () => void,
  className?: string 
}) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center py-3 w-full text-left transition-colors hover:bg-slate-700/20"
    >
      <div className="w-10 flex justify-center">
        <Icon className={`w-5 h-5 ${className || "text-slate-400"}`} />
      </div>
      <div className="ml-2">
        <div className={`text-sm font-medium ${className || "text-slate-200"}`}>{label}</div>
        <div className="text-xs text-slate-400">{sublabel}</div>
      </div>
      <div className="ml-auto">
        <ChevronRight className="w-4 h-4 text-slate-500" />
      </div>
    </button>
  )
}

 