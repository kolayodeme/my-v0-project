"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import Cookies from 'js-cookie'
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'
import { isAndroid } from '@/lib/pocketbase-config'

// Form schema
const formSchema = z.object({
  email: z.string().email({ message: "Geçerli bir e-posta adresi girin" }),
  password: z.string().min(6, { message: "Şifre en az 6 karakter olmalıdır" }),
})

// Auth storage keys
const TOKEN_KEY = 'pb_auth_token';
const MODEL_KEY = 'pb_auth_model';
const COOKIE_TOKEN_KEY = 'pb_token';
const SECURE_STORAGE_KEY = 'pb_auth_data';
const COOKIE_EXPIRY = 30; // days

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Form definition
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Function to save auth to all available storage mechanisms
  const saveAuthToAllStorages = async () => {
    try {
      if (authService.isAuthenticated()) {
        const token = authService.getAuthToken();
        const user = authService.getCurrentUser();
        const modelStr = JSON.stringify(user);
        
        // Save to localStorage
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(MODEL_KEY, modelStr);
        
        // Save to sessionStorage as backup
        sessionStorage.setItem(TOKEN_KEY, token);
        sessionStorage.setItem(MODEL_KEY, modelStr);
        
        // Save token to cookie for maximum compatibility
        Cookies.set(COOKIE_TOKEN_KEY, token, { 
          expires: COOKIE_EXPIRY, 
          sameSite: 'strict', 
          secure: window.location.protocol === 'https:' 
        });
        
        // For Android, also save to secure storage
        if (isAndroid) {
          try {
            await SecureStoragePlugin.set({
              key: SECURE_STORAGE_KEY,
              value: JSON.stringify({ token, model: modelStr })
            });
            console.log('Auth saved to secure storage after login');
          } catch (err) {
            console.error('Error saving to secure storage:', err);
          }
        }
        
        console.log('Auth saved to all storage mechanisms after login');
      }
    } catch (err) {
      console.error('Error saving auth to storage:', err);
    }
  };

  // Form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      
      await authService.login(values.email, values.password)
      
      // Ensure auth data is saved to all storage mechanisms
      await saveAuthToAllStorages();
      
      toast({
        title: "Giriş başarılı",
        description: "Hesabınıza giriş yaptınız",
        variant: "default",
      })
      
      // Add a small delay before redirecting to ensure auth is saved
      setTimeout(async () => {
        // Save auth one more time before redirecting
        await saveAuthToAllStorages();
        // Redirect to profile page
        router.push('/profile')
      }, 500);
    } catch (error: any) {
      console.error('Login error:', error)
      
      toast({
        title: "Giriş başarısız",
        description: error.message || "E-posta veya şifre hatalı",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Giriş Yap</CardTitle>
          <CardDescription className="text-center">
            Hesabınıza giriş yaparak özel özelliklere erişin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Button 
                type="submit" 
                className="w-full bg-green-700 hover:bg-green-600" 
                disabled={isLoading}
              >
                {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center">
            Hesabınız yok mu?{" "}
            <Link href="/register" className="text-green-400 hover:underline">
              Kayıt Ol
            </Link>
          </div>
          <div className="text-sm text-center">
            <Link href="/forgot-password" className="text-slate-400 hover:underline">
              Şifremi Unuttum
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 