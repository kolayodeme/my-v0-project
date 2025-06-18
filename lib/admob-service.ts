"use client"

import { AdMob, AdOptions, BannerAdOptions, BannerAdPluginEvents, BannerAdPosition, BannerAdSize, InterstitialAdPluginEvents, RewardAdPluginEvents } from '@capacitor-community/admob';

interface AdIdMap {
  android: string;
  ios: string;
  [key: string]: string;
}

// Add Capacitor interface to fix window.Capacitor type errors
interface CapacitorWindow extends Window {
  Capacitor?: {
    getPlatform: () => string;
    [key: string]: any;
  };
}

// Test ad IDs
const TEST_BANNER_ID: AdIdMap = {
  android: 'ca-app-pub-3940256099942544/6300978111',
  ios: 'ca-app-pub-3940256099942544/2934735716'
};
const TEST_INTERSTITIAL_ID: AdIdMap = {
  android: 'ca-app-pub-3940256099942544/1033173712',
  ios: 'ca-app-pub-3940256099942544/4411468910'
};
const TEST_REWARDED_ID: AdIdMap = {
  android: 'ca-app-pub-3940256099942544/5224354917',
  ios: 'ca-app-pub-3940256099942544/1712485313'
};

// Production ad IDs (should be stored in environment variables)
const PROD_BANNER_ID: AdIdMap = {
  android: process.env.NEXT_PUBLIC_ADMOB_BANNER_ANDROID_ID || TEST_BANNER_ID.android,
  ios: process.env.NEXT_PUBLIC_ADMOB_BANNER_IOS_ID || TEST_BANNER_ID.ios
};
const PROD_INTERSTITIAL_ID: AdIdMap = {
  android: process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ANDROID_ID || TEST_INTERSTITIAL_ID.android,
  ios: process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_IOS_ID || TEST_INTERSTITIAL_ID.ios
};
const PROD_REWARDED_ID: AdIdMap = {
  android: process.env.NEXT_PUBLIC_ADMOB_REWARDED_ANDROID_ID || TEST_REWARDED_ID.android,
  ios: process.env.NEXT_PUBLIC_ADMOB_REWARDED_IOS_ID || TEST_REWARDED_ID.ios
};

class AdMobService {
  private isInitialized = false;
  private isTesting = process.env.NODE_ENV !== 'production';
  
  constructor() {
    // Sunucu taraflı render sorununu önlemek için constructor'da initialize çağırmıyoruz
    // Bunun yerine, her metot çağrıldığında initialize çağrılacak
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Önce sunucuda olup olmadığımızı kontrol et
      if (typeof window === 'undefined') {
        console.log('AdMob: Running on server, skipping initialization');
        return;
      }
      
      // Check if we're running in a Capacitor environment
      const capacitorWindow = window as CapacitorWindow;
      const isCapacitorAvailable = 
        capacitorWindow.Capacitor && 
        capacitorWindow.Capacitor.getPlatform;
      
      if (!isCapacitorAvailable) {
        console.log('AdMob: Not running in Capacitor environment');
        return;
      }
      
      await AdMob.initialize({
        testingDevices: ['2077ef9a63d2b398840261c8221a0c9b'],
        initializeForTesting: this.isTesting,
      });
      
      this.isInitialized = true;
      console.log('AdMob initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AdMob:', error);
    }
  }
  
  getPlatform(): 'android' | 'ios' {
    // Sunucu taraflı render kontrolü
    if (typeof window === 'undefined') return 'android';
    
    const capacitorWindow = window as CapacitorWindow;
    if (!capacitorWindow.Capacitor) return 'android';
    return capacitorWindow.Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
  }
  
  async showBannerAd(position: BannerAdPosition = BannerAdPosition.BOTTOM_CENTER) {
    try {
      await this.initialize();
      
      // Sunucu taraflı veya Capacitor olmayan ortamlarda simüle et
      if (typeof window === 'undefined' || !(window as CapacitorWindow).Capacitor) {
        console.log('Banner ad would show in Capacitor environment');
        return true;
      }
      
      const platform = this.getPlatform();
      const adUnitID = this.isTesting ? 
        TEST_BANNER_ID[platform] : 
        PROD_BANNER_ID[platform];
      
      const options: BannerAdOptions = {
        adId: adUnitID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: position,
        margin: 0,
        isTesting: this.isTesting
      };
      
      // Remove any existing banner
      await AdMob.removeBanner();
      
      // Show new banner
      await AdMob.showBanner(options);
      return true;
    } catch (error) {
      console.error('Banner ad error:', error);
      return false;
    }
  }
  
  async hideBannerAd() {
    try {
      if (typeof window === 'undefined' || !(window as CapacitorWindow).Capacitor) {
        return true;
      }
      
      await AdMob.hideBanner();
      return true;
    } catch (error) {
      console.error('Hide banner error:', error);
      return false;
    }
  }
  
  async removeBannerAd() {
    try {
      if (typeof window === 'undefined' || !(window as CapacitorWindow).Capacitor) {
        return true;
      }
      
      await AdMob.removeBanner();
      return true;
    } catch (error) {
      console.error('Remove banner error:', error);
      return false;
    }
  }

  async showInterstitialAd() {
    try {
      await this.initialize();
      
      // Sunucu taraflı veya Capacitor olmayan ortamlarda simüle et
      if (typeof window === 'undefined' || !(window as CapacitorWindow).Capacitor) {
        console.log('Interstitial ad would show in Capacitor environment');
        return true;
      }
      
      const platform = this.getPlatform();
      const adUnitID = this.isTesting ? 
        TEST_INTERSTITIAL_ID[platform] : 
        PROD_INTERSTITIAL_ID[platform];

      await AdMob.prepareInterstitial({
        adId: adUnitID,
        isTesting: this.isTesting
      });

      await AdMob.showInterstitial();
      return true;
    } catch (error) {
      console.error('Interstitial ad error:', error);
      return false;
    }
  }

  async showRewardedAd() {
    let rewardedListener: any = null;
    let loadedListener: any = null;
    let failedListener: any = null;
    
    try {
      await this.initialize();
      
      // Sunucu taraflı veya Capacitor olmayan ortamlarda simüle et
      if (typeof window === 'undefined' || !(window as CapacitorWindow).Capacitor) {
        console.log('Reward ad would show in Capacitor environment');
        return true; // Geliştirme ortamında başarılı olduğunu varsayalım
      }
      
      const platform = this.getPlatform();
      const adUnitID = this.isTesting ? 
        TEST_REWARDED_ID[platform] : 
        PROD_REWARDED_ID[platform];
      
      console.log(`Preparing rewarded ad with ID: ${adUnitID} (${platform})`);

      // Prepare the rewarded ad
      await AdMob.prepareRewardVideoAd({
        adId: adUnitID,
        isTesting: this.isTesting
      });
      
      console.log('Rewarded ad prepared, showing now...');

      // Listen for reward events
      rewardedListener = await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
        console.log('User earned reward:', reward);
      });
      
      // Listen for ad loaded event
      loadedListener = await AdMob.addListener(RewardAdPluginEvents.Loaded, () => {
        console.log('Rewarded ad loaded successfully');
      });
      
      // Listen for ad failed to load
      failedListener = await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (error) => {
        console.error('Rewarded ad failed to load:', error);
      });

      // Show the ad and get the result
      const result = await AdMob.showRewardVideoAd();
      console.log('Rewarded ad result:', result);
      
      return result.type === 'Reward';
    } catch (error) {
      console.error('Rewarded ad error:', error);
      return false;
    } finally {
      // Remove listeners in finally block to ensure they're removed
      try {
        if (typeof window === 'undefined' || !(window as CapacitorWindow).Capacitor) {
          return;
        }
        
        if (rewardedListener) await rewardedListener.remove();
        if (loadedListener) await loadedListener.remove();
        if (failedListener) await failedListener.remove();
      } catch (e) {
        console.error('Error removing ad listeners:', e);
      }
    }
  }
  
  async trackAdEvent(eventName: string, eventData: any) {
    try {
      // Here you could implement analytics tracking for ads
      console.log(`Ad event: ${eventName}`, eventData);
    } catch (error) {
      console.error('Ad event tracking error:', error);
    }
  }
}

export const adMobService = new AdMobService(); 