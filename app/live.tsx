"use client"

import { LiveMatchTracker } from "@/components/live-match-tracker"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LivePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-green-900">
      <div className="container px-3 py-4 mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-green-400">Canlı Maç Takibi</h1>
          </div>
        </div>
        
        {/* Live Match Tracker */}
        <LiveMatchTracker />
      </div>
    </div>
  )
} 