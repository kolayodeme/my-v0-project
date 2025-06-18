"use client"

import { useEffect } from 'react';
import {
  AdMob,
  BannerAdPluginEvents,
  BannerAdSize,
  BannerAdPosition,
  AdmobConsentStatus
} from '@capacitor-community/admob';

interface BannerSizeChanged {
  width: number;
  height: number;
}

interface AdMobError {
  code: number;
  message: string;
}

interface AdMobBannerComponentProps {
  disabled?: boolean;
}

const BANNER_AD_ID = 'ca-app-pub-3940256099942544/6300978111';
const TESTING_DEVICE = '2077ef9a63d2b398840261c8221a0c9b';

const AdMobBannerComponent = ({ disabled = true }: AdMobBannerComponentProps) => {
  useEffect(() => {
    if (disabled) {
      console.log('Banner ads are disabled');
      return;
    }

    const initializeAdMob = async () => {
      try {
        // 1. Initialize AdMob
        await AdMob.initialize({
          testingDevices: [TESTING_DEVICE],
          initializeForTesting: true,
        });

        // 2. Request consent information
        const consentInfo = await AdMob.requestConsentInfo({
          tagForUnderAgeOfConsent: false,
          debugGeography: 1, // EEA
          testDeviceIdentifiers: [],
        });

        if (consentInfo.isConsentFormAvailable &&
            consentInfo.status === AdmobConsentStatus.REQUIRED) {
          const consentForm = await AdMob.showConsentForm();
          console.log('Consent form status:', consentForm.status);
        }

        // 3. Set up event listeners
        const loadedListener = await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
          console.log('Banner ad loaded');
        });

        const failedListener = await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, (error: AdMobError) => {
          console.error('Banner ad failed to load:', error);
        });

        const sizeChangedListener = await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size: BannerSizeChanged) => {
          console.log('Banner size changed:', size);
        });

        const openedListener = await AdMob.addListener(BannerAdPluginEvents.Opened, () => {
          console.log('Banner ad opened');
        });

        const closedListener = await AdMob.addListener(BannerAdPluginEvents.Closed, () => {
          console.log('Banner ad closed');
        });

        // 4. Configure app volume and muting
        await AdMob.setApplicationMuted({
          muted: false,
        });

        await AdMob.setApplicationVolume({
          volume: 1,
        });

        // 5. Show banner ad
        await AdMob.showBanner({
          adId: process.env.NEXT_PUBLIC_ADMOB_BANNER_ID || BANNER_AD_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
        });

        // Return cleanup function
        return () => {
          loadedListener.remove();
          failedListener.remove();
          sizeChangedListener.remove();
          openedListener.remove();
          closedListener.remove();
        };

      } catch (err) {
        console.error('AdMob initialization error:', err);
      }
    };

    const cleanup = initializeAdMob();

    return () => {
      const performCleanup = async () => {
        try {
          await AdMob.removeBanner();
          if (cleanup) {
            const cleanupFn = await cleanup;
            if (cleanupFn) {
              cleanupFn();
            }
          }
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      };
      performCleanup();
    };
  }, [disabled]);

  return null;
};

export default AdMobBannerComponent; 