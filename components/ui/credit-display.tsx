"use client"

import { useState, useEffect } from 'react';
import { Coins } from 'lucide-react';
import { useCreditStore, formatCredits } from '@/lib/credit-system';
import { Button } from '@/components/ui/button';
import { AdMobRewardButton } from '@/components/ui/AdMobRewardButton';

export function CreditDisplay() {
  const { credits, addCredits } = useCreditStore();
  const [mounted, setMounted] = useState(false);

  // Only use the store on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAdReward = () => {
    addCredits(1);
  };

  if (!mounted) {
    return (
      <div className="flex items-center space-x-1">
        <Coins className="h-4 w-4 text-yellow-400" />
        <span className="text-sm font-medium">--</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center space-x-1 mb-2">
        <Coins className="h-4 w-4 text-yellow-400" />
        <span className="text-sm font-medium">{formatCredits(credits)}</span>
      </div>
      <AdMobRewardButton 
        onReward={handleAdReward}
        variant="outline" 
        size="sm"
        className="text-xs h-7 px-2 py-1 bg-green-900/20 border-green-800/50 text-green-400 hover:bg-green-800/30"
      >
        +1
      </AdMobRewardButton>
    </div>
  );
} 