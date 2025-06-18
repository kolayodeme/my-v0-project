"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { authService } from "@/lib/auth-service"
import { adminService } from "@/lib/admin-service"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ArrowLeft, RefreshCcw, Coins, Crown, Clock, ShoppingCart, User } from "lucide-react"

// Transaction type mapping
const transactionTypeMap: Record<string, { label: string, icon: any, color: string }> = {
  'CREDIT_PURCHASE': { 
    label: 'Kredi Satın Alma', 
    icon: ShoppingCart, 
    color: 'text-green-400' 
  },
  'CREDIT_USE': { 
    label: 'Kredi Kullanımı', 
    icon: Coins, 
    color: 'text-yellow-400' 
  },
  'PRO_PURCHASE': { 
    label: 'Pro Üyelik Satın Alma', 
    icon: Crown, 
    color: 'text-amber-400' 
  },
  'PRO_EXPIRED': { 
    label: 'Pro Üyelik Sona Erdi', 
    icon: Clock, 
    color: 'text-red-400' 
  },
  'ADMIN_CREDIT': { 
    label: 'Admin Kredi Ekleme', 
    icon: User, 
    color: 'text-blue-400' 
  },
  'PRO_ENABLED': { 
    label: 'Pro Üyelik Etkinleştirildi', 
    icon: Crown, 
    color: 'text-amber-400' 
  },
  'PRO_DISABLED': { 
    label: 'Pro Üyelik Devre Dışı', 
    icon: Crown, 
    color: 'text-red-400' 
  }
}

export default function TransactionsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const router = useRouter()
  const { toast } = useToast()

  // Check authentication and load transactions
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
      
      await loadTransactions()
    }
    
    checkAuth()
  }, [router])
  
  // Load transactions
  const loadTransactions = async (page: number = 1) => {
    try {
      setIsLoading(true)
      
      const user = authService.getCurrentUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      const result = await adminService.getUserTransactions(user.id, page, 10)
      
      setTransactions(result.items)
      setTotalPages(Math.ceil(result.totalItems / 10))
      setCurrentPage(page)
    } catch (error) {
      console.error('Error loading transactions:', error)
      toast({
        title: "Hata",
        description: "İşlem geçmişi yüklenirken bir hata oluştu",
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
      return format(new Date(dateString), 'dd.MM.yyyy HH:mm')
    } catch (error) {
      return "-"
    }
  }
  
  // Get transaction type info
  const getTransactionType = (type: string) => {
    return transactionTypeMap[type] || { 
      label: 'Diğer', 
      icon: Coins, 
      color: 'text-slate-400' 
    }
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/profile')}
            className="mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">İşlem Geçmişi</h1>
        </div>
        <Button onClick={() => loadTransactions(currentPage)} size="sm" variant="outline">
          <RefreshCcw className="w-4 h-4" />
        </Button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg">Kredi ve Üyelik İşlemleri</CardTitle>
          <CardDescription>
            Tüm kredi ve üyelik işlemleriniz
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              Henüz işlem geçmişiniz bulunmuyor
            </div>
          ) : (
            <div className="rounded-md border border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-800/50">
                    <TableHead>İşlem</TableHead>
                    <TableHead>Miktar</TableHead>
                    <TableHead>Tarih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => {
                    const typeInfo = getTransactionType(transaction.type)
                    const TypeIcon = typeInfo.icon
                    
                    return (
                      <TableRow key={transaction.id} className="border-slate-700">
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`mr-2 ${typeInfo.color}`}>
                              <TypeIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">{typeInfo.label}</div>
                              <div className="text-xs text-slate-400">{transaction.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {transaction.amount > 0 ? (
                            <span className="text-green-400">+{transaction.amount}</span>
                          ) : transaction.amount < 0 ? (
                            <span className="text-red-400">{transaction.amount}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-400">
                          {formatDate(transaction.created)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadTransactions(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
            >
              Önceki
            </Button>
            <span className="text-sm text-slate-400">
              Sayfa {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadTransactions(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
            >
              Sonraki
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
} 