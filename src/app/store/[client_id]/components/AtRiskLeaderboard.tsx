// src/app/store/[client_id]/components/AtRiskLeaderboard.tsx
'use client'

import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ChevronDown, ChevronUp, Search, Filter, Clock, Mail, CheckCircle, DollarSign } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { Customer, DashboardData } from '@/types/dashboard'

interface AIEvent {
  timestamp: string
  description: string
  type: 'message' | 'followup' | 'purchase' | 'recovery' | 'other'
  financialImpact?: string
}

interface AtRiskLeaderboardProps {
  data: DashboardData
}

export default function AtRiskLeaderboard({ data }: AtRiskLeaderboardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSegment, setSelectedSegment] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'riskScore' | 'lifetimeValue' | 'lastPurchase'>('riskScore')
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null)
  
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Use real data from props
  const customers: Customer[] = data.customers || []

  // Filter and sort logic
  const filteredCustomers = useMemo(() => {
    let filtered = customers
    
    // Search filter
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase()
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query)
      )
    }
    
    // Segment filter
    if (selectedSegment !== 'all') {
      filtered = filtered.filter(customer => customer.segment === selectedSegment)
    }
    
    // Sorting
    return [...filtered].sort((a, b) => {
      if (sortBy === 'riskScore') return b.riskScore - a.riskScore
      if (sortBy === 'lifetimeValue') return b.lifetimeValue - a.lifetimeValue
      if (sortBy === 'lastPurchase') {
        // Parse days from string like "5 days ago"
        const aDays = parseInt(a.lastPurchase) || 999
        const bDays = parseInt(b.lastPurchase) || 999
        return bDays - aDays
      }
      return 0
    })
  }, [customers, debouncedSearch, selectedSegment, sortBy])

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'financial-badge-risk'
    if (score >= 60) return 'bg-enterprise-amber/20 text-enterprise-amber border-enterprise-amber/30'
    return 'financial-badge-positive'
  }

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'high_risk': return 'bg-red-500/10 text-red-600 dark:text-red-400'
      case 'medium_risk': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
      case 'low_risk': return 'bg-green-500/10 text-green-600 dark:text-green-400'
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
    }
  }

  const getEventIcon = (type: AIEvent['type']) => {
    switch (type) {
      case 'message': return <Mail size={14} className="text-blue-400" />
      case 'followup': return <Clock size={14} className="text-amber-400" />
      case 'purchase': return <DollarSign size={14} className="text-emerald-400" />
      case 'recovery': return <CheckCircle size={14} className="text-green-400" />
      default: return <AlertTriangle size={14} className="text-purple-400" />
    }
  }

  const toggleCustomerExpansion = (customerId: string) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId)
  }

  return (
    <div className="enterprise-card">
      <CardHeader>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} />
            At-Risk Customers Leaderboard
          </CardTitle>
          <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-0">
            {filteredCustomers.length} of {customers.length} customers
          </Badge>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Search customers by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              aria-label="Search customers"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <Filter size={16} />
              Filter by:
            </span>
            
            <div className="flex flex-wrap gap-2">
              {['all', 'high_risk', 'medium_risk', 'low_risk'].map((segment) => (
                <Button
                  key={segment}
                  variant={selectedSegment === segment ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSegment(segment)}
                  className="text-xs capitalize"
                >
                  {segment === 'all' ? 'All Segments' : segment.replace('_', ' ')}
                </Button>
              ))}
            </div>
            
            <div className="flex flex-wrap gap-2 ml-auto">
              <span className="text-sm text-slate-400">Sort by:</span>
              {[
                { key: 'riskScore' as const, label: 'Risk Score' },
                { key: 'lifetimeValue' as const, label: 'LTV' },
                { key: 'lastPurchase' as const, label: 'Last Purchase' }
              ].map((option) => (
                <Button
                  key={option.key}
                  variant={sortBy === option.key ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSortBy(option.key)}
                  className="text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-slate-400 mb-2">No at-risk customers found</div>
              <p className="text-sm text-slate-500">
                {customers.length === 0 
                  ? 'No at-risk customers identified yet' 
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <div key={customer.id} className="space-y-2">
                {/* Customer Card */}
                <div
                  className={cn(
                    "flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:bg-slate-700/50 transition-colors cursor-pointer",
                    expandedCustomer === customer.id && "rounded-b-none"
                  )}
                  onClick={() => toggleCustomerExpansion(customer.id)}
                >
                  <div className="flex-1 mb-3 sm:mb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div>
                        <h4 className="font-medium text-white">{customer.name}</h4>
                        <p className="text-sm text-slate-400">{customer.email}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
                        <Badge className={getRiskColor(customer.riskScore)}>
                          Risk: {customer.riskScore}%
                        </Badge>
                        <Badge variant="outline" className={getSegmentColor(customer.segment)}>
                          {customer.segment.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-0">
                          ${customer.lifetimeValue.toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      Last purchase: {customer.lastPurchase}
                    </p>
                  </div>
                  
                  {/* What We Did Button */}
                  <div className="flex items-center gap-2 self-stretch sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-9 text-xs transition-all",
                        expandedCustomer === customer.id 
                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30" 
                          : "bg-slate-700/50 text-slate-300 border-slate-600/50"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCustomerExpansion(customer.id)
                      }}
                    >
                      <span>What We Did</span>
                      {expandedCustomer === customer.id ? (
                        <ChevronUp size={14} className="ml-2" />
                      ) : (
                        <ChevronDown size={14} className="ml-2" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* AI Events Dropdown */}
                {expandedCustomer === customer.id && customer.aiEvents && customer.aiEvents.length > 0 && (
                  <div className="bg-slate-800/80 rounded-b-lg border border-t-0 border-slate-600/50 p-4 animate-in slide-in-from-top-2">
                    <h5 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <AlertTriangle size={14} className="text-amber-400" />
                      AI Actions & Financial Impact
                    </h5>
                    <div className="space-y-3">
                      {customer.aiEvents.map((event, index) => (
                        <div 
                          key={index} 
                          className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/50"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white">{event.description}</p>
                            {event.financialImpact && (
                              <p className="text-xs text-emerald-400 mt-1 font-medium">
                                {event.financialImpact}
                              </p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">{event.timestamp}</p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs border-0",
                              event.type === 'purchase' ? 'bg-emerald-500/20 text-emerald-400' :
                              event.type === 'recovery' ? 'bg-green-500/20 text-green-400' :
                              event.type === 'message' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-purple-500/20 text-purple-400'
                            )}
                          >
                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-700/50 text-xs text-slate-400">
                      <p>All actions performed automatically by AI retention system</p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Summary Footer */}
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="font-medium text-white mb-1">AI Retention Summary</h4>
              <p className="text-sm text-slate-400">
                {filteredCustomers.length} customers being monitored with automated retention workflows
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="financial-badge-positive border-0">
                <CheckCircle size={12} className="mr-1" />
                Active Monitoring
              </Badge>
              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-0">
                <AlertTriangle size={12} className="mr-1" />
                AI-Powered
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </div>
  )
}