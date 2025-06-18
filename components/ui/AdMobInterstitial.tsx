import { useEffect } from 'react';
import { adMobService } from '@/lib/admob-service';

// Add Capacitor interface to fix window.Capacitor type errors
interface CapacitorWindow extends Window {
  Capacitor?: {
    getPlatform: () => string;
    [key: string]: any;
  };
}

interface AdMobInterstitialProps {
  triggerOn?: 'mount' | 'unmount';
  onAdDismissed?: () => void;
  onAdFailed?: () => void;
}

export function AdMobInterstitial({
  triggerOn = 'mount',
  onAdDismissed,
  onAdFailed
}: AdMobInterstitialProps) {
  const showAd = async () => {
    try {
      // Check if we're in a browser environment
      const capacitorWindow = window as CapacitorWindow;
      const isCapacitorAvailable = 
        typeof window !== 'undefined' && 
        capacitorWindow.Capacitor && 
        capacitorWindow.Capacitor.getPlatform;
      
      if (!isCapacitorAvailable) {
        console.log('AdMob Interstitial: Not running in Capacitor environment');
        // For development in browser, simulate a successful ad
        setTimeout(() => {
          onAdDismissed?.();
        }, 1000);
        return;
      }

      const success = await adMobService.showInterstitialAd();
      
      if (success) {
        onAdDismissed?.();
      } else {
        onAdFailed?.();
      }
    } catch (error) {
      console.error('Error showing interstitial ad:', error);
      onAdFailed?.();
    }
  };

  useEffect(() => {
    if (triggerOn === 'mount') {
      showAd();
    }

    return () => {
      if (triggerOn === 'unmount') {
        showAd();
      }
    };
  }, [triggerOn]);

  // This component doesn't render anything visible directly
  return null;
} 