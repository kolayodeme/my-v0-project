"use client"

import { Button } from "@/components/ui/button"
import { adMobService } from "@/lib/admob-service"
import { useState } from "react"

interface AdTriggerButtonProps {
  onSuccess?: () => void
  className?: string
  type?: 'interstitial' | 'rewarded'
}

export function AdTriggerButton({ onSuccess, className, type = 'interstitial' }: AdTriggerButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    try {
      setIsLoading(true)
      const adResult = type === 'interstitial' 
        ? await adMobService.showInterstitialAd()
        : await adMobService.showRewardedAd()
        
      if (adResult && onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Ad error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      variant="outline"
    >
      {isLoading ? "Yükleniyor..." : type === 'rewarded' ? "Ödüllü Reklamı İzle" : "Reklamı İzle"}
    </Button>
  )
} 