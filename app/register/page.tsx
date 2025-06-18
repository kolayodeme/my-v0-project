"use client"

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { authService } from '@/lib/auth-service'
import { useToast } from '@/hooks/use-toast'

// Form schema
const formSchema = z.object({
  username: z.string().min(3, { message: "Kullanıcı adı en az 3 karakter olmalıdır" }),
  email: z.string().email({ message: "Geçerli bir e-posta adresi girin" }),
  password: z.string().min(8, { message: "Şifre en az 8 karakter olmalıdır" }),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
})

function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref') || ''

  // Form definition
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      referralCode: referralCode,
    },
  })

  // Form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      
      await authService.register(
        values.email, 
        values.password, 
        values.username,
        values.referralCode
      )
      
      toast({
        title: "Kayıt başarılı",
        description: "Hesabınız oluşturuldu ve giriş yapıldı",
        variant: "default",
      })
      
      // Redirect to profile page
      router.push('/profile')
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Handle specific errors
      if (error.message.includes('email')) {
        toast({
          title: "Kayıt başarısız",
          description: "Bu e-posta adresi zaten kullanılıyor",
          variant: "destructive",
        })
      } else if (error.message.includes('username')) {
        toast({
          title: "Kayıt başarısız",
          description: "Bu kullanıcı adı zaten kullanılıyor",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Kayıt başarısız",
          description: error.message || "Bir hata oluştu, lütfen tekrar deneyin",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Kayıt Ol</CardTitle>
          <CardDescription className="text-center">
            Yeni bir hesap oluşturarak özel özelliklere erişin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
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
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="ornek@email.com" 
                        type="email" 
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
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="******" 
                        type="password" 
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
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şifre Tekrar</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="******" 
                        type="password" 
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
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Davet Kodu (İsteğe Bağlı)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Davet kodu" 
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
                className="w-full bg-green-700 hover:bg-green-600" 
                disabled={isLoading}
              >
                {isLoading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm">
            Zaten hesabınız var mı?{" "}
            <Link href="/login" className="text-green-400 hover:underline">
              Giriş Yap
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

// Loading fallback component
function RegisterLoading() {
  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Kayıt Ol</CardTitle>
          <CardDescription className="text-center">
            Yükleniyor...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 bg-slate-700/50 animate-pulse rounded-md"></div>
          <div className="h-10 bg-slate-700/50 animate-pulse rounded-md"></div>
          <div className="h-10 bg-slate-700/50 animate-pulse rounded-md"></div>
          <div className="h-10 bg-slate-700/50 animate-pulse rounded-md"></div>
          <div className="h-10 bg-slate-700/50 animate-pulse rounded-md"></div>
          <div className="h-10 bg-green-700/50 animate-pulse rounded-md"></div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterForm />
    </Suspense>
  )
} 