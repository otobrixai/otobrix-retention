// src/components/ui/help-icon.tsx
"use client"

import { HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

interface HelpIconProps {
  content: string
  className?: string
  side?: "top" | "right" | "bottom" | "left"
}

export function HelpIcon({
  content,
  className,
  side = "top",
}: HelpIconProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex cursor-help">
          <HelpCircle
            size={16}
            className={cn(
              "text-slate-400 hover:text-slate-300 transition-colors",
              className
            )}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent side={side}>
        {content}
      </TooltipContent>
    </Tooltip>
  )
}
