// src/components/dashboard/welcome-tooltip.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'

export function WelcomeTooltip() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Only show on first visit
    const hasSeenWelcome = localStorage.getItem('hasSeenDashboardWelcome')
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setIsOpen(true)
        localStorage.setItem('hasSeenDashboardWelcome', 'true')
      }, 1000) // Show after 1 second delay
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="fixed bottom-4 right-4 z-50 bg-slate-800/80 backdrop-blur-sm border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/80 hidden md:flex"
        >
          <Info size={16} className="mr-2" />
          Dashboard Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Welcome to Your AI Dashboard 🎯</DialogTitle>
          <DialogDescription className="text-slate-300 pt-2">
            Here's how to read your results:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
            </div>
            <div>
              <h4 className="font-semibold text-emerald-400">Green Numbers = Money Saved</h4>
              <p className="text-sm text-slate-400 mt-1">Real revenue protected from customer churn. Every $1 here stayed in your business.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            </div>
            <div>
              <h4 className="font-semibold text-blue-400">Blue Charts = Customer Insights</h4>
              <p className="text-sm text-slate-400 mt-1">Shows patterns, trends, and opportunities for improving customer retention.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
            <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
            </div>
            <div>
              <h4 className="font-semibold text-amber-400">Yellow Badges = Improvements</h4>
              <p className="text-sm text-slate-400 mt-1">Positive trends and growth metrics showing your retention is getting better.</p>
            </div>
          </div>
          
          <div className="pt-2">
            <p className="text-sm text-slate-300">
              <span className="font-semibold text-white">Remember:</span> All numbers show <span className="text-emerald-400">real business impact</span>. The AI works 24/7 to protect and grow your revenue automatically.
            </p>
          </div>
          
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700/50">
            <div className="w-6 h-6 bg-slate-700/50 rounded flex items-center justify-center">
              <span className="text-xs">?</span>
            </div>
            <p className="text-xs text-slate-400">
              <span className="text-slate-300">Tip:</span> Hover over any <span className="text-blue-400">?</span> icon for detailed explanations
            </p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={() => setIsOpen(false)} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Got it, let's go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}