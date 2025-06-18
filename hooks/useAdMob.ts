import { useEffect, useState } from 'react';
import { AdMob, BannerAdPosition } from '@capacitor-community/admob';
import { adMobService } from '@/lib/admob-service';

// Add Capacitor interface to fix window.Capacitor type errors
interface CapacitorWindow extends Window {
  Capacitor?: {
    getPlatform: () => string;
    [key: string]: any;
  };
}

interface UseAdMobOptions {
  initializeOnMount?: boolean;
  showBannerOnMount?: boolean;
  bannerPosition?: BannerAdPosition;
}

export function useAdMob({
  initializeOnMount = true,
  showBannerOnMount = false,
  bannerPosition = BannerAdPosition.BOTTOM_CENTER
}: UseAdMobOptions = {}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = async () => {
    try {
      // Check if we're in a browser environment
      const capacitorWindow = window as CapacitorWindow;
      const isCapacitorAvailable = 
        typeof window !== 'undefined' && 
        capacitorWindow.Capacitor && 
        capacitorWindow.Capacitor.getPlatform;
      
      if (!isCapacitorAvailable) {
        console.log('AdMob Hook: Not running in Capacitor environment');
        setIsInitialized(true);
        return;
      }

      await AdMob.initialize({
        testingDevices: ['2077ef9a63d2b398840261c8221a0c9b'],
        initializeForTesting: process.env.NODE_ENV !== 'production'
      });
      
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize AdMob:', err);
      setError('Failed to initialize AdMob');
      setIsInitialized(false);
    }
  };

  const showBanner = async (position: BannerAdPosition = bannerPosition) => {
    if (!isInitialized) {
      await initialize();
    }
    
    try {
      const success = await adMobService.showBannerAd(position);
      setIsBannerVisible(success);
      return success;
    } catch (err) {
      console.error('Error showing banner ad:', err);
      setError('Failed to show banner ad');
      return false;
    }
  };

  const hideBanner = async () => {
    try {
      await adMobService.hideBannerAd();
      setIsBannerVisible(false);
      return true;
    } catch (err) {
      console.error('Error hiding banner ad:', err);
      setError('Failed to hide banner ad');
      return false;
    }
  };

  const removeBanner = async () => {
    try {
      await adMobService.removeBannerAd();
      setIsBannerVisible(false);
      return true;
    } catch (err) {
      console.error('Error removing banner ad:', err);
      setError('Failed to remove banner ad');
      return false;
    }
  };

  const showInterstitial = async () => {
    if (!isInitialized) {
      await initialize();
    }
    
    try {
      return await adMobService.showInterstitialAd();
    } catch (err) {
      console.error('Error showing interstitial ad:', err);
      setError('Failed to show interstitial ad');
      return false;
    }
  };

  const showRewarded = async () => {
    if (!isInitialized) {
      await initialize();
    }
    
    try {
      return await adMobService.showRewardedAd();
    } catch (err) {
      console.error('Error showing rewarded ad:', err);
      setError('Failed to show rewarded ad');
      return false;
    }
  };

  useEffect(() => {
    if (initializeOnMount) {
      initialize();
    }
  }, [initializeOnMount]);

  useEffect(() => {
    if (showBannerOnMount && isInitialized) {
      showBanner();
    }
    
    return () => {
      // Clean up banner when component unmounts
      if (isBannerVisible) {
        removeBanner().catch(console.error);
      }
    };
  }, [showBannerOnMount, isInitialized]);

  return {
    isInitialized,
    isBannerVisible,
    error,
    initialize,
    showBanner,
    hideBanner,
    removeBanner,
    showInterstitial,
    showRewarded
  };
} 