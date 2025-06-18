"use client"

import { useState, useEffect } from 'react'
import { Coins, X, ArrowUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function FloatingCreditNotification() {
  const [showNotification, setShowNotification] = useState(false)
  const [creditAmount, setCreditAmount] = useState(0)
  const router = useRouter()
  
  useEffect(() => {
    // Sadece kredi ekleme bildirimi için event listener
    const handleCreditAdded = (event: CustomEvent) => {
      const { amount } = event.detail
      
      console.log('Credit added event received:', { amount });
      
      setCreditAmount(Math.abs(amount))
      setShowNotification(true)
      
      // 8 saniye sonra bildirimi kapat
      setTimeout(() => {
        setShowNotification(false)
      }, 8000)
    }

    // Sadece kredi ekleme için event listener ekle
    document.addEventListener('creditAdded', handleCreditAdded as EventListener);

    // Cleanup
    return () => {
      document.removeEventListener('creditAdded', handleCreditAdded as EventListener);
    }
  }, [])
  
  // Profil sayfasına yönlendirme
  const handleClick = () => {
    router.push('/profile')
  }

  // Bildirimi kapat
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowNotification(false)
  }

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div 
          className="fixed top-4 right-4 z-[9999] cursor-pointer"
          initial={{ scale: 0.8, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={handleClick}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="bg-gradient-to-r from-green-700 to-green-600 border-green-500 p-1 rounded-lg shadow-lg border relative">
            <button 
              onClick={handleClose} 
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full w-6 h-6 flex items-center justify-center shadow-md z-10"
            >
              <X className="w-4 h-4 text-white" />
            </button>
            
            <div className="bg-slate-900 rounded-md px-4 py-3">
              <div className="flex items-center">
                <div className="mr-3 relative">
                  <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center shadow-md">
                    <Coins className="w-7 h-7 text-white" />
                  </div>
                  
                  <div className="absolute -top-2 -left-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-slate-900 text-sm font-bold border-2 border-slate-900">
                    <ArrowUp className="w-4 h-4" />
                  </div>
                </div>
                
                <div>
                  <div className="text-green-400 font-bold text-lg">
                    Kredi Yüklendi!
                  </div>
                  
                  <div className="text-slate-300 text-sm">
                    Yetkili admin tarafından
                  </div>
                  
                  <div className="text-yellow-400 font-bold">
                    {creditAmount} kredi hesabınıza eklendi!
                  </div>
                </div>
              </div>
              
              <div className="mt-2 text-xs text-green-400/80 text-center font-medium">
                Profil sayfasına gitmek için tıklayın
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 