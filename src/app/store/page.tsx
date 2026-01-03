// src/app/store/page.tsx
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  MessageCircle,
  ArrowRight,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ClientDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    } else if (status === 'authenticated' && session.user.type === 'client' && session.user.clientId) {
      // Redirect to client-specific dashboard if client_id is available
      router.push(`/store/${session.user.clientId}`)
    }
  }, [status, session, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.type !== 'client') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Verifying access...</p>
        </div>
      </div>
    )
  }

  const stats = [
    {
      title: 'Total Customers',
      value: '12,458',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Retention Rate',
      value: '68%',
      change: '+5%',
      trend: 'up',
      icon: TrendingUp,
      color: 'green'
    },
    {
      title: 'Active Campaigns',
      value: '8',
      change: '+2',
      trend: 'up',
      icon: MessageCircle,
      color: 'purple'
    },
    {
      title: 'Monthly Revenue',
      value: '$45.2K',
      change: '+18%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'orange'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-gray-900 cyber-text">
            Welcome back, {session.user.clientName}!
          </h1>
          <p className="text-gray-600 text-lg font-light">
            Here's your retention performance overview
          </p>
        </div>
        <Button className="gap-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <Activity size={20} />
          <span>Run Campaign</span>
          <ArrowRight size={16} />
        </Button>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="cyber-card group cursor-pointer hover:scale-105 transition-all duration-300 border-0 shadow-lg hover:shadow-xl">
            <CardContent className="p-6 relative overflow-hidden">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 cyber-text">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm border border-gray-200/50 ${
                  stat.color === 'blue' ? 'bg-blue-500/10' :
                  stat.color === 'green' ? 'bg-green-500/10' :
                  stat.color === 'purple' ? 'bg-purple-500/10' : 'bg-orange-500/10'
                }`}>
                  <stat.icon className={
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    stat.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                  } size={24} />
                </div>
              </div>
              <p className={`text-sm font-medium relative z-10 ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Activity & Campaign Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enhanced Recent Activity */}
        <Card className="cyber-card border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="cyber-text text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Email campaign sent', count: '2,458 customers', time: '2 hours ago' },
                { action: 'SMS retention offer', count: '1,234 customers', time: '5 hours ago' },
                { action: 'Win-back campaign', count: '890 customers', time: '1 day ago' },
                { action: 'Loyalty program update', count: 'All customers', time: '2 days ago' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 cyber-border rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-300 bg-white/50 backdrop-blur-sm">
                  <div>
                    <p className="font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.count}</p>
                  </div>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Campaign Performance */}
        <Card className="cyber-card border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="cyber-text text-xl">Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Welcome Series', type: 'Email', engagement: '42%', revenue: '$8.2K' },
                { name: 'Cart Abandonment', type: 'SMS', engagement: '38%', revenue: '$12.1K' },
                { name: 'Win-back Offer', type: 'Email', engagement: '28%', revenue: '$5.7K' },
                { name: 'Loyalty Reward', type: 'Push', engagement: '51%', revenue: '$15.3K' }
              ].map((campaign, index) => (
                <div key={index} className="flex items-center justify-between p-4 cyber-border rounded-xl hover:border-green-300 hover:shadow-md transition-all duration-300 bg-white/50 backdrop-blur-sm">
                  <div>
                    <p className="font-medium text-gray-900">{campaign.name}</p>
                    <p className="text-sm text-gray-600">{campaign.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{campaign.engagement}</p>
                    <p className="text-sm text-green-600 font-semibold">{campaign.revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
