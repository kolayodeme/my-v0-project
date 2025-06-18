"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { authService, User } from "@/lib/auth-service"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, AlertCircle, Save } from "lucide-react"

// Form schema for updating username
const updateUsernameSchema = z.object({
  username: z.string().min(3, { message: "Kullanıcı adı en az 3 karakter olmalıdır" }),
})

// Form schema for updating password
const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Mevcut şifre gereklidir" }),
  newPassword: z.string().min(6, { message: "Yeni şifre en az 6 karakter olmalıdır" }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
})

export default function AccountPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Forms
  const usernameForm = useForm<z.infer<typeof updateUsernameSchema>>({
    resolver: zodResolver(updateUsernameSchema),
    defaultValues: {
      username: "",
    },
  })
  
  const passwordForm = useForm<z.infer<typeof updatePasswordSchema>>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  // Check authentication and load user data
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
      
      const currentUser = authService.getCurrentUser()
      setUser(currentUser)
      
      if (currentUser) {
        usernameForm.setValue("username", currentUser.username)
      }
      
      setIsLoading(false)
    }
    
    checkAuth()
  }, [router, usernameForm])
  
  // Update username
  const handleUpdateUsername = async (values: z.infer<typeof updateUsernameSchema>) => {
    if (!user) return
    
    try {
      setIsLoading(true)
      
      await authService.updateProfile({
        username: values.username,
      })
      
      // Refresh user data
      const updatedUser = authService.getCurrentUser()
      setUser(updatedUser)
      
      toast({
        title: "Kullanıcı adı güncellendi",
        description: "Kullanıcı adınız başarıyla güncellendi",
        variant: "default",
      })
    } catch (error: any) {
      console.error('Error updating username:', error)
      
      toast({
        title: "Güncelleme başarısız",
        description: error.message || "Kullanıcı adı güncellenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Update password
  const handleUpdatePassword = async (values: z.infer<typeof updatePasswordSchema>) => {
    // Note: PocketBase doesn't have a direct method to update password with verification
    // This is a placeholder for a custom implementation
    toast({
      title: "Şifre değiştirme",
      description: "Bu özellik henüz uygulanmadı",
      variant: "default",
    })
    
    // Reset password form
    passwordForm.reset()
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
        <h1 className="text-2xl font-bold">Hesap Ayarları</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <>
          {/* User Info */}
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Kullanıcı Bilgileri</CardTitle>
              <CardDescription>
                Hesap bilgilerinizi görüntüleyin ve düzenleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">E-posta</p>
                <p className="text-sm text-slate-400">{user?.email}</p>
              </div>
              
              <Form {...usernameForm}>
                <form onSubmit={usernameForm.handleSubmit(handleUpdateUsername)} className="space-y-4">
                  <FormField
                    control={usernameForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kullanıcı Adı</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="kullanici_adi" 
                            disabled={isLoading}
                            className="bg-slate-900 border-slate-700"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? "Kaydediliyor..." : "Kullanıcı Adını Kaydet"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Change Password */}
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Şifre Değiştir</CardTitle>
              <CardDescription>
                Hesabınızın şifresini güncelleyin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 bg-amber-900/20 border-amber-800/50 text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Dikkat</AlertTitle>
                <AlertDescription>
                  Şifrenizi değiştirdikten sonra yeniden giriş yapmanız gerekecektir.
                </AlertDescription>
              </Alert>
              
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handleUpdatePassword)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mevcut Şifre</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="********" 
                            disabled={isLoading}
                            className="bg-slate-900 border-slate-700"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yeni Şifre</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="********" 
                            disabled={isLoading}
                            className="bg-slate-900 border-slate-700"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yeni Şifre (Tekrar)</FormLabel>
                        <FormControl>
                          <Input 
                            type="password"
                            placeholder="********" 
                            disabled={isLoading}
                            className="bg-slate-900 border-slate-700"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    variant="outline"
                    className="w-full" 
                    disabled={isLoading}
                  >
                    Şifreyi Değiştir
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Account Actions */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">Hesap İşlemleri</CardTitle>
              <CardDescription>
                Hesabınızla ilgili diğer işlemler
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={() => {
                  toast({
                    title: "Hesap silme",
                    description: "Bu özellik henüz uygulanmadı",
                    variant: "default",
                  })
                }}
              >
                Hesabımı Sil
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 