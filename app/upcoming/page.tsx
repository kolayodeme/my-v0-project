"use client"

import { UpcomingMatches } from "@/components/upcoming-matches"
import { useTranslation } from "@/components/language-provider"
import { authService } from "@/lib/auth-service"
import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserIcon, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function UpcomingPage() {
  const { t } = useTranslation()
  const [isGuest, setIsGuest] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    // Check if user is authenticated
    setIsGuest(!authService.isAuthenticated())
  }, [])
  
  return (
    <div className="container px-1 py-1 mx-auto safe-area-top">
      {isGuest && (
        <Alert className="mb-2 bg-yellow-900/30 border-yellow-700/50 text-yellow-200">
          <div className="flex items-center justify-between w-full">
            <AlertDescription className="flex items-center">
              <UserIcon className="w-4 h-4 mr-2 text-yellow-400" />
              {t('guestModeActive')}
            </AlertDescription>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 border-yellow-600 text-yellow-300 hover:bg-yellow-800/50"
              onClick={() => router.push('/login')}
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" />
              {t('login')}
            </Button>
          </div>
        </Alert>
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
        <h1 className="text-sm font-bold">{t('upcomingMatches')}</h1>
      </div>
      <UpcomingMatches />
    </div>
  )
}
