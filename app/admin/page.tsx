"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth-service"
import { adminService } from "@/lib/admin-service"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Coins, User, Check, X, Crown, Search, Plus, Calendar, RefreshCcw } from "lucide-react"

// Form schema for adding credits
const addCreditsSchema = z.object({
  amount: z.number().min(1, { message: "En az 1 kredi eklenmelidir" }).max(1000, { message: "En fazla 1000 kredi eklenebilir" }),
})

// Form schema for setting pro status
const setProSchema = z.object({
  duration: z.number().min(1, { message: "En az 1 gün olmalıdır" }).max(3650, { message: "En fazla 10 yıl (3650 gün) olabilir" }),
})

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [addCreditsOpen, setAddCreditsOpen] = useState(false)
  const [setProOpen, setSetProOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  
  // Forms
  const addCreditsForm = useForm<z.infer<typeof addCreditsSchema>>({
    resolver: zodResolver(addCreditsSchema),
    defaultValues: {
      amount: 10,
    },
  })
  
  const setProForm = useForm<z.infer<typeof setProSchema>>({
    resolver: zodResolver(setProSchema),
    defaultValues: {
      duration: 30,
    },
  })

  // Check if user is admin and load users
  useEffect(() => {
    const checkAdmin = async () => {
      const isAdmin = authService.isAdmin()
      
      if (!isAdmin) {
        toast({
          title: "Yetkisiz erişim",
          description: "Bu sayfaya erişim yetkiniz yok",
          variant: "destructive",
        })
        router.push('/')
        return
      }
      
      await loadUsers()
    }
    
    checkAdmin()
  }, [router])
  
  // Load users
  const loadUsers = async (page: number = 1) => {
    try {
      setIsLoading(true)
      const result = await adminService.getAllUsers(page, 10)
      
      setUsers(result.items)
      setTotalUsers(result.totalItems)
      setTotalPages(Math.ceil(result.totalItems / 10))
      setCurrentPage(page)
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: "Hata",
        description: "Kullanıcılar yüklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Search users
  const handleSearch = () => {
    // In a real implementation, this would search users on the server
    // For now, we'll just reload the users
    loadUsers()
  }
  
  // Add credits to a user
  const handleAddCredits = async (values: z.infer<typeof addCreditsSchema>) => {
    if (!selectedUser) return
    
    try {
      setIsLoading(true)
      await adminService.addCreditsToUser(selectedUser.id, values.amount)
      
      toast({
        title: "Kredi eklendi",
        description: `${selectedUser.username} kullanıcısına ${values.amount} kredi eklendi`,
        variant: "default",
      })
      
      // Reload users to update the UI
      await loadUsers(currentPage)
      setAddCreditsOpen(false)
    } catch (error: any) {
      console.error('Error adding credits:', error)
      toast({
        title: "Hata",
        description: error.message || "Kredi eklenirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Set pro status for a user
  const handleSetPro = async (values: z.infer<typeof setProSchema>) => {
    if (!selectedUser) return
    
    try {
      setIsLoading(true)
      
      // Calculate expiry date
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + values.duration)
      
      await adminService.setUserProStatus(selectedUser.id, true, expiryDate)
      
      toast({
        title: "Pro üyelik verildi",
        description: `${selectedUser.username} kullanıcısına ${values.duration} günlük pro üyelik verildi`,
        variant: "default",
      })
      
      // Reload users to update the UI
      await loadUsers(currentPage)
      setSetProOpen(false)
    } catch (error: any) {
      console.error('Error setting pro status:', error)
      toast({
        title: "Hata",
        description: error.message || "Pro üyelik verilirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Remove pro status from a user
  const handleRemovePro = async (userId: string, username: string) => {
    try {
      setIsLoading(true)
      await adminService.setUserProStatus(userId, false)
      
      toast({
        title: "Pro üyelik kaldırıldı",
        description: `${username} kullanıcısının pro üyeliği kaldırıldı`,
        variant: "default",
      })
      
      // Reload users to update the UI
      await loadUsers(currentPage)
    } catch (error: any) {
      console.error('Error removing pro status:', error)
      toast({
        title: "Hata",
        description: error.message || "Pro üyelik kaldırılırken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Toggle user active status
  const handleToggleActive = async (userId: string, isActive: boolean, username: string) => {
    try {
      setIsLoading(true)
      await adminService.toggleUserActiveStatus(userId, !isActive)
      
      toast({
        title: isActive ? "Kullanıcı devre dışı bırakıldı" : "Kullanıcı aktifleştirildi",
        description: `${username} kullanıcısının durumu değiştirildi`,
        variant: "default",
      })
      
      // Reload users to update the UI
      await loadUsers(currentPage)
    } catch (error: any) {
      console.error('Error toggling active status:', error)
      toast({
        title: "Hata",
        description: error.message || "Kullanıcı durumu değiştirilirken bir hata oluştu",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    
    try {
      return format(new Date(dateString), 'dd.MM.yyyy')
    } catch (error) {
      return "-"
    }
  }
  
  // Check if pro membership is active
  const isProActive = (user: any) => {
    if (!user.isPro) return false
    if (!user.proExpiryDate) return false
    
    try {
      const expiryDate = new Date(user.proExpiryDate)
      return expiryDate > new Date()
    } catch (error) {
      return false
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <Button onClick={() => loadUsers(currentPage)} size="sm">
          <RefreshCcw className="w-4 h-4 mr-2" />
          Yenile
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Kullanıcı Yönetimi</CardTitle>
          <CardDescription>
            Toplam {totalUsers} kullanıcı | Sayfa {currentPage}/{totalPages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Input
              placeholder="Kullanıcı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={handleSearch} size="sm">
              <Search className="w-4 h-4 mr-2" />
              Ara
            </Button>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kullanıcı Adı</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Krediler</TableHead>
                  <TableHead>Pro Üyelik</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead>İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Yükleniyor...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-4">
                      Kullanıcı bulunamadı
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Coins className="w-4 h-4 text-yellow-400 mr-1" />
                          {user.credits || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isProActive(user) ? (
                          <div className="flex items-center">
                            <Crown className="w-4 h-4 text-yellow-400 mr-1" />
                            <span className="text-yellow-400">
                              {formatDate(user.proExpiryDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <div className="flex items-center">
                            <Check className="w-4 h-4 text-green-400 mr-1" />
                            <span className="text-green-400">Aktif</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <X className="w-4 h-4 text-red-400 mr-1" />
                            <span className="text-red-400">Pasif</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(user.created)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedUser(user)
                              setAddCreditsOpen(true)
                            }}
                          >
                            <Coins className="h-4 w-4" />
                          </Button>
                          {isProActive(user) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-red-400 border-red-400"
                              onClick={() => handleRemovePro(user.id, user.username)}
                            >
                              <Crown className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-yellow-400 border-yellow-400"
                              onClick={() => {
                                setSelectedUser(user)
                                setSetProOpen(true)
                              }}
                            >
                              <Crown className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-8 w-8 p-0 ${user.isActive ? 'text-red-400 border-red-400' : 'text-green-400 border-green-400'}`}
                            onClick={() => handleToggleActive(user.id, user.isActive, user.username)}
                          >
                            {user.isActive ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => loadUsers(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            Önceki
          </Button>
          <span className="text-sm text-slate-400">
            Sayfa {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => loadUsers(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            Sonraki
          </Button>
        </CardFooter>
      </Card>
      
      {/* Add Credits Dialog */}
      <Dialog open={addCreditsOpen} onOpenChange={setAddCreditsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Kredi Ekle</DialogTitle>
            <DialogDescription>
              {selectedUser?.username} kullanıcısına kredi ekle
            </DialogDescription>
          </DialogHeader>
          <Form {...addCreditsForm}>
            <form onSubmit={addCreditsForm.handleSubmit(handleAddCredits)} className="space-y-4">
              <FormField
                control={addCreditsForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kredi Miktarı</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Eklenecek kredi miktarını girin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddCreditsOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Ekleniyor..." : "Kredi Ekle"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Set Pro Dialog */}
      <Dialog open={setProOpen} onOpenChange={setSetProOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pro Üyelik Ver</DialogTitle>
            <DialogDescription>
              {selectedUser?.username} kullanıcısına pro üyelik ver
            </DialogDescription>
          </DialogHeader>
          <Form {...setProForm}>
            <form onSubmit={setProForm.handleSubmit(handleSetPro)} className="space-y-4">
              <FormField
                control={setProForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Süre (Gün)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Pro üyelik süresini gün olarak girin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSetProOpen(false)}>
                  İptal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Veriliyor..." : "Pro Üyelik Ver"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 