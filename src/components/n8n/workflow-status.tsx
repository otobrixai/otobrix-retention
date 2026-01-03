'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, Clock, Play } from 'lucide-react'

interface WorkflowStatusProps {
  clientId: string
}

interface Workflow {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime: string
  duration?: number
  progress?: number
}

export function WorkflowStatus({ clientId }: WorkflowStatusProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchWorkflows()
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchWorkflows, 10000)
    return () => clearInterval(interval)
  }, [clientId])

  const fetchWorkflows = async () => {
    try {
      // This would be a real API call in production
      // For now, simulate some data
      const simulatedWorkflows: Workflow[] = [
        {
          id: 'wf_1',
          name: 'Win-back Campaign',
          status: Math.random() > 0.7 ? 'running' : 'completed',
          startTime: new Date(Date.now() - 300000).toISOString(),
          duration: 120,
          progress: 75
        },
        {
          id: 'wf_2',
          name: 'Segment Refresh',
          status: 'completed',
          startTime: new Date(Date.now() - 600000).toISOString(),
          duration: 45
        },
        {
          id: 'wf_3',
          name: 'Email Broadcast',
          status: 'pending',
          startTime: new Date().toISOString()
        }
      ]
      
      setWorkflows(simulatedWorkflows)
    } catch (error) {
      console.error('Failed to fetch workflows:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: Workflow['status']) => {
    switch (status) {
      case 'running': return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending': return <Clock className="h-4 w-4 text-amber-500" />
      default: return <Play className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: Workflow['status']) => {
    switch (status) {
      case 'running': return 'bg-blue-500/20 text-blue-400'
      case 'completed': return 'bg-green-500/20 text-green-400'
      case 'failed': return 'bg-red-500/20 text-red-400'
      case 'pending': return 'bg-amber-500/20 text-amber-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-400">Loading workflows...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Active Workflows</h3>
          <Badge variant="outline" className="bg-slate-700/50 text-slate-400">
            {workflows.length} active
          </Badge>
        </div>
        
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/50"
            >
              <div className="flex items-center gap-3">
                <div className="text-slate-400">
                  {getStatusIcon(workflow.status)}
                </div>
                <div>
                  <h4 className="font-medium text-white text-sm">
                    {workflow.name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Started: {new Date(workflow.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {workflow.progress && workflow.status === 'running' && (
                  <div className="w-24">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-300"
                        style={{ width: `${workflow.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-1">
                      {workflow.progress}%
                    </p>
                  </div>
                )}
                
                <Badge className={getStatusColor(workflow.status)}>
                  {workflow.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        {workflows.length === 0 && (
          <div className="text-center py-8">
            <Play className="h-12 w-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No active workflows</p>
            <p className="text-sm text-slate-500 mt-1">
              Trigger a workflow to see it here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}