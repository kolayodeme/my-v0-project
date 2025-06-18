import { useEffect, useState } from 'react';
import { BannerAdPosition } from '@capacitor-community/admob';
import { adMobService } from '@/lib/admob-service';

// Add Capacitor interface to fix window.Capacitor type errors
interface CapacitorWindow extends Window {
  Capacitor?: {
    getPlatform: () => string;
    [key: string]: any;
  };
}

interface AdMobBannerProps {
  position?: BannerAdPosition;
  className?: string;
  disabled?: boolean;
}

export function AdMobBanner({ 
  position = BannerAdPosition.BOTTOM_CENTER,
  className,
  disabled = true
}: AdMobBannerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (disabled) {
      console.log('Banner ads are disabled');
      return;
    }
    
    const loadBanner = async () => {
      try {
        // Check if we're in a browser environment
        const capacitorWindow = window as CapacitorWindow;
        const isCapacitorAvailable = 
          typeof window !== 'undefined' && 
          capacitorWindow.Capacitor && 
          capacitorWindow.Capacitor.getPlatform;
        
        if (!isCapacitorAvailable) {
          console.log('AdMob Banner: Not running in Capacitor environment');
          return;
        }

        const result = await adMobService.showBannerAd(position);
        setIsLoaded(result);
        if (!result) {
          setError('Failed to load banner ad');
        }
      } catch (err) {
        console.error('Error showing banner ad:', err);
        setError('Error loading ad');
      }
    };

    loadBanner();

    // Cleanup function to remove banner when component unmounts
    return () => {
      if (!disabled) {
        adMobService.removeBannerAd().catch(err => {
          console.error('Error removing banner ad:', err);
        });
      }
    };
  }, [position, disabled]);

  // This component doesn't render anything visible directly
  // The banner is shown by the native AdMob plugin
  return null;
} 