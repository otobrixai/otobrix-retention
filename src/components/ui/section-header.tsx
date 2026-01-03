// src/components/ui/section-header.tsx
'use client'

import { HelpIcon } from './help-icon'
import { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  description?: string
  tooltipContent: string
  icon?: ReactNode
}

export function SectionHeader({ 
  title, 
  description, 
  tooltipContent, 
  icon 
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon && <div className="text-blue-400">{icon}</div>}
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <HelpIcon
          content={tooltipContent}
          className="ml-1"
        />
      </div>
      {description && (
        <p className="text-sm text-slate-400 hidden md:block">{description}</p>
      )}
    </div>
  )
}