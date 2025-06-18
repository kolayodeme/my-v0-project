import { useState } from 'react';
import { BannerAdPosition } from '@capacitor-community/admob';
import { useAdMob } from '@/hooks/useAdMob';
import { AdMobBanner } from '@/components/ui/AdMobBanner';
import { AdMobRewardButton } from '@/components/ui/AdMobRewardButton';
import { AdMobInterstitial } from '@/components/ui/AdMobInterstitial';

export function AdMobExample() {
  const [rewardCount, setRewardCount] = useState(0);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const { showBanner, hideBanner, removeBanner } = useAdMob({ initializeOnMount: true });

  const handleReward = () => {
    setRewardCount(prev => prev + 1);
  };

  const handleRewardFail = () => {
    console.log('Reward ad failed or was closed without reward');
  };

  const toggleBanner = async () => {
    if (bannerVisible) {
      await hideBanner();
    } else {
      await showBanner(BannerAdPosition.BOTTOM_CENTER);
    }
    setBannerVisible(!bannerVisible);
  };

  const toggleInterstitial = () => {
    setShowInterstitial(!showInterstitial);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">AdMob Example</h1>
      
      {/* Banner ad controls */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Banner Ads</h2>
        <div className="flex gap-2">
          <button 
            onClick={toggleBanner}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {bannerVisible ? 'Hide Banner' : 'Show Banner'}
          </button>
          {bannerVisible && (
            <button 
              onClick={() => {
                removeBanner();
                setBannerVisible(false);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Remove Banner
            </button>
          )}
        </div>
        {bannerVisible && <AdMobBanner position={BannerAdPosition.BOTTOM_CENTER} />}
      </div>

      {/* Interstitial ad controls */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Interstitial Ads</h2>
        <button 
          onClick={toggleInterstitial}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Show Interstitial Ad
        </button>
        {showInterstitial && (
          <AdMobInterstitial 
            onAdDismissed={() => {
              setShowInterstitial(false);
              console.log('Interstitial ad dismissed');
            }}
            onAdFailed={() => {
              setShowInterstitial(false);
              console.log('Interstitial ad failed to load');
            }}
          />
        )}
      </div>

      {/* Reward ad controls */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Reward Ads</h2>
        <p>Reward count: {rewardCount}</p>
        <AdMobRewardButton 
          onReward={handleReward}
          onFail={handleRewardFail}
          className="px-4 py-2 bg-purple-500 text-white rounded"
        >
          Watch Ad for Reward
        </AdMobRewardButton>
      </div>
    </div>
  );
} 