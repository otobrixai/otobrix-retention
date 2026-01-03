// src/components/ui/tooltip.tsx
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

const TooltipProvider = TooltipPrimitive.Provider
const Tooltip = TooltipPrimitive.Root
const TooltipTrigger = TooltipPrimitive.Trigger
const TooltipPortal = TooltipPrimitive.Portal

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TooltipPortal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={8}
      collisionPadding={{ top: 80, bottom: 16, left: 16, right: 16 }}
      className={cn(
        "z-[1000]",
        "max-w-xs",
        "rounded-md border border-slate-700 bg-slate-800",
        "px-3 py-2",
        "text-sm text-white",
        "shadow-lg",
        "leading-relaxed whitespace-normal break-words",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      {props.children}

      <TooltipPrimitive.Arrow
        width={10}
        height={5}
        className="fill-slate-800"
      />
    </TooltipPrimitive.Content>
  </TooltipPortal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
}
