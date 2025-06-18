import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { adMobService } from '@/lib/admob-service';
import { useToast } from '@/hooks/use-toast';
import { Coins } from 'lucide-react';

// Add Capacitor interface to fix window.Capacitor type errors
interface CapacitorWindow extends Window {
  Capacitor?: {
    getPlatform: () => string;
    [key: string]: any;
  };
}

interface AdMobRewardButtonProps {
  onReward: () => void;
  onFail?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
}

export function AdMobRewardButton({
  onReward,
  onFail,
  disabled = false,
  className = '',
  variant = "default",
  size = "default",
  children
}: AdMobRewardButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    try {
      setIsLoading(true);
      
      // Önce direkt olarak krediyi veriyoruz - kullanıcı beklemesin
      onReward();
      
      // Kredi kazanıldığına dair bildirim gösteriyoruz
      toast({
        title: "1 Kredi Kazanıldı",
        description: (
          <div className="flex items-center">
            <div className="relative mr-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center shadow-md">
                <Coins className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -inset-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div 
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-yellow-300 animate-ping-slow"
                    style={{ 
                      left: `${Math.random() * 100}%`, 
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 1}s`,
                      opacity: 0.6
                    }}
                  />
                ))}
              </div>
            </div>
            <span className="font-medium">Reklam izlediğiniz için <span className="text-yellow-400 font-bold">1 kredi</span> kazandınız!</span>
          </div>
        ),
        variant: "default",
        duration: 2500,
        className: "bg-slate-800 border-l-4 border-yellow-500 text-white shadow-lg"
      });
      
      // Kapacitor ortamında olmadığımızda sadece simüle ediyoruz
      const capacitorWindow = window as CapacitorWindow;
      const isCapacitorAvailable = 
        typeof window !== 'undefined' && 
        capacitorWindow.Capacitor && 
        capacitorWindow.Capacitor.getPlatform;
      
      if (!isCapacitorAvailable) {
        console.log('AdMob Reward: Not running in Capacitor environment');
        // Sadece yükleme durumunu kaldırıyoruz, kredi zaten verildi
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
        return;
      }

      // Gerçek cihazda reklam gösterme
      try {
        await adMobService.showRewardedAd();
      } catch (error) {
        console.error('Error showing reward ad:', error);
        // Hata olsa bile kredi zaten verildi, sadece hatayı logluyoruz
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error in reward button:', error);
      setIsLoading(false);
      
      // Hata bildirimi
      toast({
        title: "Bilgi",
        description: "İşlem tamamlandı, krediniz eklendi",
        variant: "default",
        duration: 1500,
      });
    }
  };

  return (
    <Button
      disabled={disabled || isLoading}
      className={className}
      variant={variant}
      size={size}
      onClick={handleClick}
    >
      {isLoading ? "Yükleniyor..." : children}
    </Button>
  );
} 