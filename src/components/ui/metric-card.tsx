// src/components/ui/metric-card.tsx
'use client'

import { Card, CardContent } from './card'
import { Badge } from './badge'
import { HelpIcon } from './help-icon'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  trend: string
  icon: LucideIcon
  color: string
  period: string
  description: string
  tooltipContent: string
  className?: string
}

export function MetricCard({ 
  title, 
  value, 
  trend, 
  icon: Icon, 
  color, 
  period, 
  description,
  tooltipContent,
  className = "" 
}: MetricCardProps) {
  return (
    <Card className={`bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 group ${className}`}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
            <Icon className="text-white" size={18} />
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs ${
              trend.startsWith('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            } border-0`}>
              {trend}
            </Badge>
            <HelpIcon content={tooltipContent} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <p className="text-slate-400 text-xs font-medium">{title}</p>
        </div>
        <p className="text-xl font-bold text-white mb-1">{value}</p>
        <p className="text-slate-500 text-xs">{period}</p>
        <p className="text-slate-400 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}