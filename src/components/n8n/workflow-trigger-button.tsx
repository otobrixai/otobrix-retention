'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface WorkflowTriggerButtonProps {
  clientId: string
  segment: string
  action: string
  label: string
  description?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  icon?: React.ReactNode
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function WorkflowTriggerButton({
  clientId,
  segment,
  action,
  label,
  description,
  variant = 'default',
  size = 'default',
  className = '',
  icon,
  onSuccess,
  onError
}: WorkflowTriggerButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const triggerWorkflow = async () => {
    setIsLoading(true)
    setStatus('idle')
    
    try {
      const response = await fetch('/api/n8n/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          segment,
          action
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger workflow')
      }

      setStatus('success')
      toast.success('Workflow triggered successfully', {
        description: `Action: ${action} | Segment: ${segment}`
      })
      
      if (onSuccess) {
        onSuccess(data)
      }

      // Reset status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000)
    } catch (error) {
      setStatus('error')
      console.error('Failed to trigger n8n workflow:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error('Failed to trigger workflow', {
        description: errorMessage
      })
      
      if (onError) {
        onError(error as Error)
      }
      
      // Reset status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span>Processing...</span>
        </>
      )
    }

    if (status === 'success') {
      return (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          <span>Success!</span>
        </>
      )
    }

    if (status === 'error') {
      return (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          <span>Retry</span>
        </>
      )
    }

    return (
      <>
        {icon}
        <span>{label}</span>
      </>
    )
  }

  const getButtonVariant = () => {
    if (status === 'success') return 'default'
    if (status === 'error') return 'destructive'
    return variant
  }

  return (
    <div className="flex flex-col">
      <Button
        onClick={triggerWorkflow}
        disabled={isLoading || status === 'success'}
        variant={getButtonVariant()}
        size={size}
        className={`relative overflow-hidden ${className}`}
        aria-label={`Trigger ${label} workflow`}
        aria-busy={isLoading}
      >
        {getButtonContent()}
        
        {/* Loading bar */}
        {isLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
        )}
      </Button>
      
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
          {description}
        </p>
      )}
      
      {/* Status indicator dot */}
      {status !== 'idle' && !isLoading && (
        <div 
          className={`mt-2 w-2 h-2 rounded-full mx-auto ${
            status === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
          aria-hidden="true"
        />
      )}
    </div>
  )
}

// Add this to ensure the file is recognized as a module
export default WorkflowTriggerButton