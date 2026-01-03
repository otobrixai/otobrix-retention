// src/components/admin/dashboard-content.tsx - FIXED ESLINT ERRORS
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Building, 
  Shield,
  ArrowRight,
  RefreshCw,
  Eye,
  Mail,
  Check,
  X,
  Database,
  Server,
  Settings,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { testEmailService } from '@/lib/actions/admin'

interface DashboardContentProps {
  data: {
    stats: {
      totalClients: number
      activeClients: number
      inactiveClients: number
      totalClientUsers: number
    } | null // ✅ Add null type here
    recentClients: Array<{
      client_id: string
      company_name: string | null;
      client_name: string;
      email: string
      status: string
      created_at: Date
    }>
  }
  session: {
    user?: {
      name?: string
    }
  }
}

export function DashboardContent({ data, session }: DashboardContentProps) {
  const router = useRouter()
  const [testingEmail, setTestingEmail] = useState(false)
  const [emailTestResult, setEmailTestResult] = useState<{success: boolean; message: string; service_used?: string} | null>(null)

  const handleTestEmailService = async () => {
    const testEmail = prompt('Enter email address to test the email service:')
    if (!testEmail) return

    setTestingEmail(true)
    setEmailTestResult(null)

    try {
      const result = await testEmailService(testEmail)
      setEmailTestResult(result)
    } catch (_error) {
      setEmailTestResult({
        success: false,
        message: 'Failed to test email service'
      })
    } finally {
      setTestingEmail(false)
    }
  }

  // ✅ Add early return for null stats (degraded state)
  if (!data.stats) {
    return (
      <div className="min-h-screen enterprise-dark-bg p-6">
        <div className="enterprise-card p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-enterprise-yellow/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-enterprise-yellow" size={20} />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg enterprise-metric mb-1">
                Data Refresh in Progress
              </h2>
              <p className="text-slate-300 text-sm">
                Dashboard data is being updated. Please try again in a moment.
              </p>
            </div>
          </div>
          <button 
            onClick={() => router.refresh()}
            className="mt-4 px-4 py-3 bg-enterprise-blue text-white rounded-lg hover:bg-enterprise-blue/90 flex items-center gap-2 font-medium enterprise-card hover:scale-[1.02] transition-all duration-300"
          >
            <RefreshCw size={16} />
            Refresh Page
          </button>
        </div>
      </div>
    )
  }


  const statCards = [
    {
      title: 'Total Clients',
      value: data.stats.totalClients,
      change: '+0 this month',
      icon: Building,
      description: 'All registered clients',
      color: 'from-enterprise-blue to-enterprise-cyan'
    },
    {
      title: 'Active Clients',
      value: data.stats.activeClients,
      change: `${Math.round((data.stats.activeClients / (data.stats.totalClients || 1)) * 100)}% active`,
      icon: Users,
      description: 'Currently active clients',
      color: 'from-enterprise-green to-emerald-500'
    },
    {
      title: 'Client Users',
      value: data.stats.totalClientUsers,
      change: '+0% this month',
      icon: Users,
      description: 'Total client team members',
      color: 'from-enterprise-purple to-purple-500'
    },
    {
      title: 'System Status',
      value: 'Online',
      change: 'All systems operational',
      icon: Shield,
      description: 'Platform health status',
      color: 'from-enterprise-green to-green-500'
    }
  ]

  const quickActions = [
    {
      title: 'Add New Client',
      description: 'Create a new client account',
      icon: Building,
      action: () => router.push('/admin/clients/new'),
      color: 'enterprise-blue'
    },
    {
      title: 'Manage Clients',
      description: 'View and manage all clients',
      icon: Users,
      action: () => router.push('/admin/clients'),
      color: 'enterprise-purple'
    },
    {
      title: 'System Settings',
      description: 'Platform configuration',
      icon: Settings,
      action: () => console.warn('System settings'),
      color: 'enterprise-amber'
    }
  ]

  return (
    <div className="min-h-screen enterprise-dark-bg p-6">
      <div className="space-y-8">
        {/* Enterprise Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <p className="text-enterprise-slate">
              Welcome back, {session?.user?.name || 'Administrator'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline"
              onClick={() => router.refresh()}
              className="gap-2 border-enterprise-slate text-enterprise-slate hover:text-white hover:border-enterprise-blue transition-colors"
            >
              <RefreshCw size={16} />
              Refresh Data
            </Button>
            <Button 
              onClick={() => router.push('/admin/clients')}
              className="gap-3 bg-gradient-to-r from-enterprise-blue to-enterprise-purple text-white hover:from-enterprise-blue/90 hover:to-enterprise-purple/90 transition-all duration-300"
            >
              <Building size={20} />
              <span>Manage Clients</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </div>

        {/* Email Test Result */}
        {emailTestResult && (
          <div className={`enterprise-card ${emailTestResult.success ? 'financial-positive' : 'financial-risk'} animate-enterprise-fade-in`}>
            <div className="p-4">
              <div className="flex items-center gap-3">
                {emailTestResult.success ? (
                  <Check className="h-4 w-4 text-enterprise-green" />
                ) : (
                  <X className="h-4 w-4 text-enterprise-red" />
                )}
                <div className="flex-1">
                  <p className="text-white">{emailTestResult.message}</p>
                  {emailTestResult.service_used && (
                    <p className="text-sm mt-1 text-enterprise-slate">
                      Service used: {emailTestResult.service_used}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEmailTestResult(null)}
                  className="hover:bg-enterprise-panel text-slate-300"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Enterprise Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <div 
              key={index} 
              className="enterprise-card hover:animate-enterprise-float"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-enterprise-slate mb-1">{stat.title}</p>
                    <p className="text-2xl font-semibold text-white enterprise-metric">{stat.value}</p>
                    <p className="text-sm text-enterprise-slate mt-1">{stat.change}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="text-white" size={24} />
                  </div>
                </div>
                <p className="text-xs text-enterprise-slate mt-3">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Clients */}
          <div className="enterprise-card hover:shadow-enterprise-lg transition-all duration-300 lg:col-span-2">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white enterprise-metric">Recent Clients</h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-enterprise-slate">
                    {data.recentClients.length} clients
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/admin/clients')}
                    className="text-enterprise-slate hover:text-white transition-colors"
                    style={{ pointerEvents: 'auto' }}
                  >
                    View All →
                  </Button>
                </div>
              </div>
              <div>
                {data.recentClients.length > 0 ? (
                  <div className="space-y-4">
                    {data.recentClients.map((client, index) => (
                      <div 
                        key={client.client_id}
                        className="enterprise-card hover:border-enterprise-green/50 transition-all duration-300 cursor-pointer animate-enterprise-slide-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                        onClick={() => router.push(`/admin/clients/${client.client_id}`)}
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className="w-10 h-10 bg-enterprise-panel rounded-lg flex items-center justify-center text-enterprise-slate font-medium flex-shrink-0">
                                {client.company_name?.charAt(0)?.toUpperCase() || 'C'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-white truncate">{client.company_name}</p>
                                <p className="text-sm text-enterprise-slate truncate">{client.client_name}</p>
                                <p className="text-xs text-enterprise-slate/75 mt-1">
                                  {client.email}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4">
                              <Badge className={client.status === 'active' ? 'financial-badge-positive' : 'financial-badge-neutral'}>
                                {client.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/admin/clients/${client.client_id}`)
                                }}
                                className="h-8 w-8 hover:bg-enterprise-panel transition-colors text-slate-300"
                              >
                                <Eye size={16} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 animate-enterprise-fade-in">
                    <Building className="mx-auto text-enterprise-slate mb-4" size={48} />
                    <p className="text-enterprise-slate mb-2">No clients found</p>
                    <Button 
                      onClick={() => router.push('/admin/clients/new')}
                      className="bg-gradient-to-r from-enterprise-blue to-enterprise-purple text-white hover:from-enterprise-blue/90 hover:to-enterprise-purple/90 transition-all duration-300"
                    >
                      <Building size={16} className="mr-2" />
                      Add Your First Client
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions & System Info */}
          <div className="space-y-6">
            <div className="enterprise-card">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white enterprise-metric mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      className="w-full enterprise-card hover:border-enterprise-blue/50 transition-all duration-300 animate-enterprise-slide-up text-left p-4"
                      style={{ animationDelay: `${index * 100}ms` }}
                      onClick={action.action}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-${action.color}/20 flex items-center justify-center`}>
                          <action.icon className={`text-${action.color}`} size={18} />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-white">{action.title}</p>
                          <p className="text-sm text-enterprise-slate">{action.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}

                  <button
                    className="w-full enterprise-card hover:border-enterprise-blue/50 transition-all duration-300 animate-enterprise-slide-up text-left p-4"
                    style={{ animationDelay: `${quickActions.length * 100}ms` }}
                    onClick={handleTestEmailService}
                    disabled={testingEmail}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-enterprise-blue/20 flex items-center justify-center">
                        <Mail className="text-enterprise-blue" size={18} />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-white">
                          {testingEmail ? 'Testing Email...' : 'Test Email Service'}
                        </p>
                        <p className="text-sm text-enterprise-slate">Verify email configuration</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="enterprise-card">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white enterprise-metric mb-4">System Status</h2>
                <div className="space-y-4">
                  {[
                    { name: 'Authentication', icon: Shield, status: 'operational' },
                    { name: 'Database', icon: Database, status: 'operational' },
                    { name: 'API Services', icon: Server, status: 'operational' },
                    { 
                      name: 'Email Service', 
                      icon: Mail, 
                      status: emailTestResult ? (emailTestResult.success ? 'operational' : 'issues') : 'not-tested'
                    }
                  ].map((service, index) => (
                    <div 
                      key={index} 
                      className="enterprise-card p-4 animate-enterprise-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <service.icon className={`h-4 w-4 ${
                            service.status === 'operational' ? 'text-enterprise-green' :
                            service.status === 'issues' ? 'text-enterprise-red' : 'text-enterprise-amber'
                          }`} />
                          <span className="text-slate-300 font-medium">{service.name}</span>
                        </div>
                        <span className={`flex items-center gap-2 text-sm font-medium ${
                          service.status === 'operational' ? 'text-enterprise-green' :
                          service.status === 'issues' ? 'text-enterprise-red' : 'text-enterprise-amber'
                        }`}>
                          <div className={`w-2 h-2 rounded-full animate-enterprise-pulse ${
                            service.status === 'operational' ? 'bg-enterprise-green' :
                            service.status === 'issues' ? 'bg-enterprise-red' : 'bg-enterprise-amber'
                          }`}></div>
                          {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-enterprise-slate">
                    <span className="text-sm text-enterprise-slate">Last Updated</span>
                    <span className="text-sm text-white font-medium enterprise-metric">
                      {new Date().toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}