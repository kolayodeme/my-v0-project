import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Gift, Loader2 } from 'lucide-react';
import { AdMobRewardButton } from '@/components/ui/AdMobRewardButton';
import { pointsService } from '@/lib/points-service';
import { useToast } from '@/components/ui/use-toast';
import { adMobService } from '@/lib/admob-service';

// Add Capacitor interface to fix window.Capacitor type errors
interface CapacitorWindow extends Window {
  Capacitor?: {
    getPlatform: () => string;
    [key: string]: any;
  };
}

interface RewardAdButtonProps {
  onReward?: () => void;
  onFail?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  pointsToEarn?: number;
  cooldownMinutes?: number;
  children?: React.ReactNode;
}

export function RewardAdButton({
  onReward,
  onFail,
  disabled = false,
  className = '',
  variant = "default",
  size = "default",
  pointsToEarn = 1,
  cooldownMinutes = 60,
  children
}: RewardAdButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  
  // Bileşen yüklendiğinde cooldown durumunu kontrol et
  useEffect(() => {
    checkCooldownStatus();
    
    // Her dakika cooldown durumunu güncelle
    const interval = setInterval(() => {
      checkCooldownStatus();
    }, 60000); // 60 saniye
    
    return () => clearInterval(interval);
  }, []);
  
  // Cooldown durumunu kontrol et
  const checkCooldownStatus = () => {
    const hasRecentReward = pointsService.hasEarnedPointsRecently(cooldownMinutes);
    setIsOnCooldown(hasRecentReward);
    
    if (hasRecentReward) {
      const minutesPassed = pointsService.getMinutesSinceLastReward();
      setCooldownRemaining(Math.max(0, cooldownMinutes - minutesPassed));
    }
  };
  
  const handleClick = async () => {
    if (isOnCooldown) {
      toast({
        title: "Bekleme Süresi",
        description: `${cooldownRemaining} dakika sonra tekrar deneyin.`,
        variant: "destructive",
        duration: 3000,
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Check if we're in a Capacitor environment
      const capacitorWindow = window as CapacitorWindow;
      const isCapacitorAvailable = 
        typeof window !== 'undefined' && 
        capacitorWindow.Capacitor && 
        capacitorWindow.Capacitor.getPlatform;
      
      if (!isCapacitorAvailable) {
        console.log('AdMob Reward: Not running in Capacitor environment');
        // Simulate reward in development environment
        setTimeout(() => {
          setIsLoading(false);
          handleReward();
        }, 1000);
        return;
      }

      // Show reward ad
      const rewarded = await adMobService.showRewardedAd();
      setIsLoading(false);
      
      if (rewarded) {
        // Reward earned
        handleReward();
      } else {
        // Reward not earned or ad dismissed
        handleFail();
      }
    } catch (error) {
      console.error('Error showing reward ad:', error);
      setIsLoading(false);
      handleFail();
    }
  };
  
  // Reklam izleme ödülü
  const handleReward = () => {
    // Puanları ekle
    const newPoints = pointsService.addPoints(pointsToEarn);
    
    // Başarılı toast mesajı göster
    toast({
      title: "Tebrikler!",
      description: `${pointsToEarn} puan kazandınız! Toplam puanınız: ${newPoints}`,
      duration: 5000,
    });
    
    // Cooldown'u güncelle
    setIsOnCooldown(true);
    setCooldownRemaining(cooldownMinutes);
    
    // Özel onReward callback'i çağır
    if (onReward) onReward();
  };
  
  // Reklam başarısız olduğunda
  const handleFail = () => {
    toast({
      title: "Hata",
      description: "Reklam yüklenemedi veya tamamlanamadı. Lütfen tekrar deneyin.",
      variant: "destructive",
      duration: 3000,
    });
    
    if (onFail) onFail();
  };

  return (
    <Button
      disabled={disabled || isLoading || isOnCooldown}
      className={className}
      variant={variant}
      size={size}
      onClick={handleClick}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Yükleniyor...</span>
        </>
      ) : isOnCooldown ? (
        <>
          <Gift className="h-4 w-4" />
          <span>{cooldownRemaining} dk sonra</span>
        </>
      ) : (
        children || (
          <>
            <Gift className="h-4 w-4" />
            <span>Ödül Kazan (+{pointsToEarn})</span>
          </>
        )
      )}
    </Button>
  );
} 