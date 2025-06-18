"use client"

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCreditStore } from '@/lib/credit-system';
import { AdMobRewardButton } from '@/components/ui/AdMobRewardButton';
import { Coins } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreditRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredCredits: number;
  actionDescription: string;
  onContinue: () => void;
}

export function CreditRequiredModal({
  isOpen,
  onClose,
  requiredCredits,
  actionDescription,
  onContinue
}: CreditRequiredModalProps) {
  const { credits, addCredits, hasCredits } = useCreditStore();
  const [isAdCompleted, setIsAdCompleted] = useState(false);
  const [localCredits, setLocalCredits] = useState(credits);
  const { toast } = useToast();

  // Kredi değişikliklerini takip et
  useEffect(() => {
    setLocalCredits(credits);
  }, [credits]);

  const handleAdReward = () => {
    addCredits(1);
    setIsAdCompleted(true);
    setLocalCredits(prev => prev + 1);
    
    // Kredi kazanıldığında otomatik olarak devam et
    if (localCredits + 1 >= requiredCredits) {
      setTimeout(() => {
        onContinue();
        onClose();
      }, 1200); // Bildirim görünmesi için biraz beklet
    }
  };

  const handleContinue = () => {
    if (hasCredits(requiredCredits)) {
      onContinue();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-green-400">Kredi Gerekiyor</DialogTitle>
          <DialogDescription>
            {actionDescription} için {requiredCredits} kredi gerekiyor. Şu anda {localCredits} krediniz var.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center py-4">
          <div className="relative flex items-center gap-2 px-4 py-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700/50 shadow-lg">
            {/* Coin animasyonu */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 flex items-center justify-center animate-coin-flip shadow-md shadow-amber-500/20 border-2 border-yellow-300/50 overflow-hidden" style={{ perspective: '1000px' }}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-yellow-200/30 to-white/40 animate-spin-slow"></div>
                <Coins className="w-6 h-6 text-white drop-shadow-md" />
              </div>
              
              {/* Parıltı efekti */}
              <div className="absolute -inset-2 z-[-1]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div 
                    key={i}
                    className="absolute rounded-full bg-yellow-300 animate-sparkle"
                    style={{ 
                      left: `${Math.random() * 100}%`, 
                      top: `${Math.random() * 100}%`,
                      width: `${Math.random() * 3 + 1}px`,
                      height: `${Math.random() * 3 + 1}px`,
                      animationDelay: `${Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>
            </div>
            
            {/* Kredi miktarı */}
            <span className="text-xl font-bold bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-transparent bg-clip-text animate-gold-shimmer" style={{ backgroundSize: '200% 200%' }}>{localCredits}</span>
            
            <span className="text-slate-400 flex items-center">
              <span className="mx-1">/</span>
              <span className="text-lg font-medium text-green-400">{requiredCredits}</span>
              <span className="ml-1 text-sm">gerekli</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="text-center text-sm text-slate-400">
            Reklam izleyerek 1 kredi kazanabilirsiniz
          </div>
          
          <AdMobRewardButton 
            onReward={handleAdReward}
            className="w-full bg-gradient-to-r from-green-900/50 to-green-800/50 border-green-700/50 text-green-400 hover:bg-green-800/70 shadow-md shadow-green-900/20 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <div className="relative">
              <Coins className="w-4 h-4" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping-slow"></div>
            </div>
            Reklam İzle +1 Kredi
          </AdMobRewardButton>
        </div>

        <DialogFooter className="flex justify-between mt-4">
          <Button variant="outline" onClick={onClose} className="border-slate-700 text-slate-400">
            İptal
          </Button>
          <Button 
            onClick={handleContinue} 
            disabled={!hasCredits(requiredCredits)}
            className={hasCredits(requiredCredits) ? "bg-green-800 text-white hover:bg-green-700" : "bg-slate-800 text-slate-500"}
          >
            {hasCredits(requiredCredits) ? "Devam Et" : `${requiredCredits - localCredits} Kredi Daha Gerekiyor`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 