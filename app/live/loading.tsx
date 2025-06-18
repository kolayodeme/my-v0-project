export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80">
      <div className="relative">
        {/* Stadyum arka plan efekti */}
        <div className="absolute -inset-10 bg-gradient-to-b from-blue-900/40 to-blue-950/60 rounded-full blur-xl"></div>
        
        {/* Futbol sahası */}
        <div className="relative w-64 h-40 bg-gradient-to-b from-emerald-800 to-emerald-900 rounded-xl overflow-hidden mb-6 shadow-xl border border-emerald-700/50">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 border-2 border-white/30 rounded-full"></div>
            <div className="absolute w-40 h-[1px] bg-white/30"></div>
            <div className="absolute w-[1px] h-40 bg-white/30"></div>
          </div>
          
          {/* Dönen top */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-10 h-10 animate-spin-slow">
              <div className="absolute inset-0 rounded-full bg-white shadow-lg flex items-center justify-center">
                <div className="w-9 h-9 rounded-full bg-[url('/ball.png')] bg-cover bg-center"></div>
              </div>
            </div>
          </div>
          
          {/* Stadyum ışıkları */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-400 rounded-full blur-xl opacity-70"></div>
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-400 rounded-full blur-xl opacity-70"></div>
          <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-blue-400 rounded-full blur-xl opacity-70"></div>
          <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-blue-400 rounded-full blur-xl opacity-70"></div>
        </div>
        
        <div className="text-center">
          <span className="text-lg text-white font-bold mb-1 block">Canlı Maçlar Yükleniyor</span>
          <div className="flex items-center justify-center gap-1 text-emerald-500">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="text-sm">CANLI</span>
          </div>
        </div>
      </div>
    </div>
  )
}
