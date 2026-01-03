import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function LoadingSpinner({ 
  className, 
  size = 'md', 
  label = 'Loading...' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  }

  return (
    <div 
      className={cn("inline-flex items-center justify-center", className)}
      role="status"
      aria-label={label}
    >
      <div 
        className={cn(
          "animate-spin rounded-full border-current border-t-transparent",
          sizeClasses[size]
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}