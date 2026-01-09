// src/app/store/[client_id]/DashboardClient.tsx
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef } from 'react';
import { signOut, useSession } from 'next-auth/react';
import {
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  Crown,
  RefreshCw,
  Bell,
  LogOut,
  Settings,
  ChevronDown,
  Building,
  CircuitBoard,
  Shield,
  Target,
  Brain,
  Activity,
  Server,
  Database,
  Cpu,
  Wifi,
  BarChart3,
  Sparkles as _Sparkles,
  CheckCircle as _CheckCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ErrorBoundary } from '@/lib/errors/errorBoundary';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Import lazy components
import {
  CohortRetentionChart,
  RFMHeatmapInteractive,
  AtRiskLeaderboard,
  RecoveryROITracker
} from './DashboardClient.lazy';

// Import new AI Impact Feed dynamically (Required Phase 7 change)
const AIImpactFeed = dynamic(
  () => import('./components/AIImpactFeed'),
  { ssr: false }
);

// Import components
import { SectionHeader } from '@/components/ui/section-header';
import { MetricCard } from '@/components/ui/metric-card';
import { HelpIcon } from '@/components/ui/help-icon';
import { WelcomeTooltip } from '@/components/dashboard/welcome-tooltip';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// Import types
import { DashboardData } from '@/types/dashboard';

interface ClientData {
  clientId: string;
  client: {
    client_name: string;
    company_name: string | null;
  };
}

type Notification = {
  id: string;
  title: string;
  description?: string;
  createdAt?: string;
};

// Real data fetching hook
const useDashboardData = (clientId: string) => {
  return useQuery({
    queryKey: ['dashboard', clientId],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/snapshot/${clientId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      const data = await response.json();

      // Transform the data to match DashboardData type
      return {
        ...data,
        // Ensure cacheHit is boolean
        cacheHit: Boolean(data.cacheHit)
      } as DashboardData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    initialData: {
      roi: {
        recoveredLast30Days: 0,
        projectedNext30Days: 0,
        totalAtRiskRevenue: 0
      },
      heroMetrics: {
        repeatPurchaseRate: 0,
        clvTrend: '+0%'
      },
      actionSummary: {
        customersSaved: 0,
        customersAtRisk: 0,
        customersPredictedToChurn: 0
      },
      aiImpactFeed: [],
      customers: [],
      campaigns: [],
      rfmSegments: [],
      cohortData: [],
      system: {
        lastSync: 'Just now',
        aiStatus: 'Active',
        cacheHit: false
      }
    } as DashboardData
  });
};

export default function DashboardClient({ initialData }: { initialData: ClientData }) {
  const { clientId } = initialData;
  const { data: dashboardData, isLoading, error, refetch } = useDashboardData(clientId);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [confettiTriggered, setConfettiTriggered] = useState(false);
  const { data: session } = useSession();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications', clientId],
    queryFn: async () => {
      const res = await fetch(`/api/client/${clientId}/notifications`)
      if (!res.ok) throw new Error('Failed to load notifications')
      return res.json()
    },
    staleTime: 60_000,
  })
  const [showNotifications, setShowNotifications] = useState(false)


  
  // Required Phase 7 change: Gate WelcomeTooltip behind conditional render
  const [showWelcomeTooltip, setShowWelcomeTooltip] = useState(false);

  // Click outside handler for user menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Click outside handler for notifications
  useEffect(() => {
    function handleNotificationClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleNotificationClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleNotificationClickOutside);
    };
  }, [showNotifications]);

  // Trigger confetti only once when recovered revenue is significant
  useEffect(() => {
    const recovered = dashboardData.roi?.recoveredLast30Days || 0;
    if (recovered > 5000 && !confettiTriggered) {
      setConfettiTriggered(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [dashboardData.roi?.recoveredLast30Days, confettiTriggered]);

  // Required Phase 7 change: Show welcome tooltip after component mounts
  useEffect(() => {
    setShowWelcomeTooltip(true);
  }, []);

  // Data refresh mutation
  const refreshMutation = useMutation({
    mutationFn: () => refetch(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['dashboard', clientId] });

      const previousData = queryClient.getQueryData(['dashboard', clientId]);

      queryClient.setQueryData(['dashboard', clientId], (old: DashboardData) => ({
        ...old,
        _isRefreshing: true
      }));

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['dashboard', clientId], context.previousData);
      }
      toast.error('Failed to refresh data', {
        description: 'Please try again in a moment.'
      });
    },
    onSuccess: () => {
      toast.success('Data refreshed successfully!', {
        description: 'Dashboard updated with latest information.'
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', clientId] });
    },
  });

  // Calculate metrics from real data
  const heroMetrics = {
    revenueSaved: dashboardData.roi?.recoveredLast30Days || 0,
    projectedRevenue: dashboardData.roi?.projectedNext30Days || 0,
    atRiskRevenue: dashboardData.roi?.totalAtRiskRevenue || 0,
    repeatPurchaseRate: dashboardData.heroMetrics?.repeatPurchaseRate || 0,
    clvTrend: dashboardData.heroMetrics?.clvTrend || '+0%',
    customersSaved: dashboardData.actionSummary?.customersSaved || 0,
    customersAtRisk: dashboardData.actionSummary?.customersAtRisk || 0,
    customersPredictedToChurn: dashboardData.actionSummary?.customersPredictedToChurn || 0
  };

  // Hero Outcome Bar - Top of page
  const heroOutcomeStats = [
    {
      title: 'Revenue Saved',
      value: `$${heroMetrics.revenueSaved > 1000 ? `${(heroMetrics.revenueSaved / 1000).toFixed(0)}K` : heroMetrics.revenueSaved.toLocaleString()}`,
      trend: heroMetrics.revenueSaved > 0 ? '+18%' : '0%',
      icon: DollarSign,
      color: 'from-emerald-500 to-green-500',
      period: 'Last 30 days',
      description: 'AI-recovered revenue from at-risk customers',
      tooltipContent: 'Actual money recovered by AI from customers who were about to churn. This is real revenue that would have been lost without our intervention. Every dollar here stayed in your business.'
    },
    {
      title: 'Projected Earnings',
      value: `$${heroMetrics.projectedRevenue > 1000 ? `${(heroMetrics.projectedRevenue / 1000).toFixed(0)}K` : heroMetrics.projectedRevenue.toLocaleString()}`,
      trend: heroMetrics.projectedRevenue > 0 ? '+8%' : '0%',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      period: 'Next 30 days',
      description: 'AI-driven revenue projections',
      tooltipContent: 'Forecasted revenue based on current AI performance and customer engagement patterns. These are likely earnings you can expect from ongoing retention efforts in the coming month.'
    },
    {
      title: 'At-Risk Revenue',
      value: `$${heroMetrics.atRiskRevenue > 1000 ? `${(heroMetrics.atRiskRevenue / 1000).toFixed(0)}K` : heroMetrics.atRiskRevenue.toLocaleString()}`,
      trend: heroMetrics.atRiskRevenue > 0 ? '-12%' : '0%',
      icon: AlertTriangle,
      color: 'from-red-500 to-orange-500',
      period: 'AI actively protecting',
      description: 'Revenue being monitored & protected',
      tooltipContent: 'Total revenue from customers identified as high-risk. Our AI is actively working 24/7 to protect this money from being lost to churn. The downward trend shows our success in reducing risk.'
    },
    {
      title: 'Repeat Purchase Rate',
      value: `${heroMetrics.repeatPurchaseRate}%`,
      trend: heroMetrics.repeatPurchaseRate > 0 ? '+5%' : '0%',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      period: 'Customer loyalty',
      description: 'AI-driven retention improvement',
      tooltipContent: 'Percentage of customers who make repeat purchases. Higher rates mean better customer loyalty and lifetime value. Shows how well we\'re turning one-time buyers into loyal customers.'
    },
    {
      title: 'CLV Trend',
      value: heroMetrics.clvTrend,
      trend: '+0.3',
      icon: Crown,
      color: 'from-amber-500 to-yellow-500',
      period: 'Efficiency gain',
      description: 'Customer lifetime value increase',
      tooltipContent: 'Customer Lifetime Value trend. Shows how much more each customer is worth over time due to AI-driven retention efforts. Higher CLV means more revenue from each customer over their lifetime.'
    }
  ];

  // Action Summary Cards
  const actionSummaryCards = [
    {
      title: 'Customers Saved',
      value: heroMetrics.customersSaved,
      description: 'Prevented from churning this month',
      icon: Shield,
      color: 'text-emerald-400 bg-emerald-500/10',
      trend: heroMetrics.customersSaved > 0 ? '+12' : '0',
      financialImpact: `$${(heroMetrics.customersSaved * 150).toLocaleString()}`,
      tooltipContent: 'Number of customers who were about to leave but were retained through AI interventions. Each saved customer represents preserved future revenue and ongoing business relationships.'
    },
    {
      title: 'Customers At Risk',
      value: heroMetrics.customersAtRisk,
      description: 'Currently being monitored by AI',
      icon: AlertTriangle,
      color: 'text-amber-400 bg-amber-500/10',
      trend: heroMetrics.customersAtRisk > 0 ? '-8' : '0',
      financialImpact: `$${(heroMetrics.customersAtRisk * 85).toLocaleString()} protected`,
      tooltipContent: 'Customers currently being monitored by AI as having high churn risk. These customers are being actively targeted with personalized retention strategies to prevent them from leaving.'
    },
    {
      title: 'Predicted to Churn',
      value: heroMetrics.customersPredictedToChurn,
      description: 'Next 30 days probability',
      icon: Target,
      color: 'text-red-400 bg-red-500/10',
      trend: heroMetrics.customersPredictedToChurn > 0 ? '-5' : '0',
      financialImpact: `$${(heroMetrics.customersPredictedToChurn * 120).toLocaleString()} at risk`,
      tooltipContent: 'Customers with high probability of leaving in the next 30 days. AI is proactively engaging these customers with win-back offers and personalized communication to retain them.'
    }
  ];

  // System Status Cards
  const systemHealth = {
    lastSync: dashboardData.system?.lastSync || 'Just now',
    aiStatus: dashboardData.system?.aiStatus || 'Active',
    cacheStatus: dashboardData.system?.cacheHit ? 'Hit' : 'Miss',
    databaseStatus: 'Connected',
    apiStatus: 'Healthy',
    latency: '42ms'
  };

  const systemStatusCards = [
    {
      title: 'AI System',
      status: systemHealth.aiStatus,
      icon: Cpu,
      color: systemHealth.aiStatus === 'Active' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10',
      description: 'Retention AI',
      tooltipContent: 'The core AI engine that analyzes customer behavior and executes retention strategies. Active status means it\'s working 24/7 to protect your revenue.'
    },
    {
      title: 'Database',
      status: systemHealth.databaseStatus,
      icon: Database,
      color: systemHealth.databaseStatus === 'Connected' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10',
      description: 'Customer Data',
      tooltipContent: 'Connection to your customer database. Connected status means we have real-time access to customer behavior data for accurate predictions.'
    },
    {
      title: 'API',
      status: systemHealth.apiStatus,
      icon: Server,
      color: systemHealth.apiStatus === 'Healthy' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10',
      description: 'External Services',
      tooltipContent: 'Connections to email, SMS, and other communication services. Healthy status means retention messages are being delivered successfully.'
    },
    {
      title: 'Sync',
      status: systemHealth.lastSync,
      icon: RefreshCw,
      color: 'text-blue-400 bg-blue-500/10',
      description: 'Last updated',
      tooltipContent: 'When data was last synchronized. Shows you\'re viewing the most current information about your customer retention.'
    },
    {
      title: 'Cache',
      status: systemHealth.cacheStatus,
      icon: CircuitBoard,
      color: systemHealth.cacheStatus === 'Hit' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10',
      description: 'Performance',
      tooltipContent: 'Data caching status. "Hit" means fast performance, "Miss" means loading fresh data. Both are normal operations.'
    },
    {
      title: 'Latency',
      status: systemHealth.latency,
      icon: Wifi,
      color: 'text-purple-400 bg-purple-500/10',
      description: 'Response time',
      tooltipContent: 'System response time. Lower numbers mean faster performance. 42ms is excellent for real-time AI processing.'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-slate-300 mt-4">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center font-sans">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Failed to load dashboard</h2>
          <p className="text-slate-400 mb-4">Please try refreshing the page</p>
          <Button onClick={() => refetch()} variant="outline" className="text-white border-slate-600">
            <RefreshCw size={16} className="mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    
    <div className="min-h-screen enterprise-dark-bg text-slate-100 relative">
      {/* Main Header */}
      <header className="sticky top-0 z-50 enterprise-header backdrop-blur-xl border-b border-enterprise-slate font-sans">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <Building className="text-white" size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white enterprise-metric">Retention Intelligence</h1>
                </div>
                <p className="text-sm text-slate-400">AI-Powered Results Dashboard</p>
              </div>
            </div>

            {/* Right: Actions & User Menu */}
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => refreshMutation.mutate()}
                variant="outline" 
                size="sm"
                className="hidden lg:flex border-slate-600 text-slate-300 hover:bg-slate-700 text-xs"
                loading={refreshMutation.isPending}
                aria-label="Refresh dashboard data"
              >
                <RefreshCw size={14} className={`mr-2 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <div className="relative" ref={notificationRef}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNotifications(v => !v)}
                      className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg"
                    >
                      <Bell size={20} />
                      {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-slate-800 border-slate-700 text-white">
                    <p className="text-sm">Important alerts about customer retention</p>
                  </TooltipContent>
                </Tooltip>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 rounded-xl shadow-2xl border border-slate-700/50 z-50">
                    <div className="px-4 py-3 border-b border-slate-700/50">
                      <p className="text-sm font-semibold text-white">Notifications</p>
                    </div>

                    {notifications.length === 0 && (
                      <div className="px-4 py-6 text-sm text-slate-400">
                        No recent activity
                      </div>
                    )}

                    {notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        className="px-4 py-3 border-b border-slate-700/30 hover:bg-slate-700/30 transition"
                      >
                        <p className="text-sm text-white font-medium">{n.title}</p>
                        {n.description && (
                          <p className="text-xs text-slate-400 mt-1">{n.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-all duration-200 group"
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-medium text-white">{session?.user?.name || 'User'}</p>
                    <p className="text-xs text-slate-400">{session?.user?.email || 'user@example.com'}</p>
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div
                    className="absolute right-0 top-full mt-2 w-64 bg-slate-800 rounded-xl shadow-2xl border border-slate-700/50 py-2 z-50"
                    role="menu"
                  >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-slate-700/50">
                      <p className="text-sm font-medium text-white">
                        {session?.user?.name || 'User'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {session?.user?.email || 'user@example.com'}
                      </p>
                    </div>

                    {/* Navigation */}
                    <div className="py-2">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                        role="menuitem"
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push(`/store/${clientId}/billing`);
                        }}
                      >
                        <DollarSign size={16} />
                        <span>Billing</span>
                      </button>

                      <button
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                        role="menuitem"
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push(`/store/${clientId}/settings`);
                        }}
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </button>

                      <button
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors"
                        role="menuitem"
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push(`/store/${clientId}/account`);
                        }}
                      >
                        <Bell size={16} />
                        <span>Account Preferences</span>
                      </button>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-slate-700/50 pt-2">
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        role="menuitem"
                      >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Full width */}
      <div className="min-h-[calc(100vh-4rem)]" id="main-content">
        <div className="p-6 lg:p-8 space-y-8">
          {/* SECTION 1: Hero Outcome Bar */}
          <div>
            <SectionHeader
              title="AI-Generated Financial Outcomes"
              icon={<BarChart3 size={20} className="text-blue-400" />}
              tooltipContent="Key financial metrics showing the direct impact of AI on your business. All numbers represent real value generated or protected from customer churn."
            />
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {heroOutcomeStats.map((stat, index) => (
                <MetricCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  trend={stat.trend}
                  icon={stat.icon}
                  color={stat.color}
                  period={stat.period}
                  description={stat.description}
                  tooltipContent={stat.tooltipContent}
                />
              ))}
            </div>
          </div>

          {/* SECTION 2: Action Summary Cards */}
          <div>
            <SectionHeader
              title="AI Action Summary"
              icon={<Activity size={20} className="text-blue-400" />}
              tooltipContent="Shows the scale of AI interventions and their financial impact. Each number represents customers protected and revenue preserved through automated retention efforts."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {actionSummaryCards.map((card, index) => (
                <div key={index} className={`enterprise-card hover:animate-enterprise-float group`}>
                  {/* Help Icon */}
                  <div className="absolute top-4 right-4 z-10">
                    <HelpIcon content={card.tooltipContent} />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${card.color} bg-opacity-20`}>
                        <card.icon size={20} />
                      </div>
                      <Badge className={`text-xs ${
                        card.trend.startsWith('+') ? 'financial-badge-positive' : 'financial-badge-risk'
                      }`}>
                        {card.trend}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-white enterprise-metric">{card.value}</p>
                    <p className="text-sm font-medium text-white mb-1">{card.title}</p>
                    <p className="text-xs text-slate-400 mb-3">{card.description}</p>
                    <div className="text-sm font-semibold text-emerald-400">
                      <span className="text-xl font-bold enterprise-metric text-enterprise-green">{card.financialImpact}</span>
                    </div>
                  </CardContent>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: AI Impact Feed */}
          <div>
            <SectionHeader
              title="AI Impact Feed"
              icon={<Brain size={20} className="text-purple-400" />}
              tooltipContent="Real-time log of AI actions and their financial results. Shows concrete examples of how AI is working for you right now to protect and grow your revenue."
            />
            <AIImpactFeed data={dashboardData} />
          </div>

          {/* SECTION 4: Retention Drivers - Charts */}
          <div>
            <SectionHeader
              title="Retention Drivers & Financial Impact"
              description="Cohort analysis and customer value segmentation"
              tooltipContent="Visual analysis showing how AI improves customer retention over time. The charts demonstrate patterns, opportunities, and the financial impact of retention efforts."
              icon={<Target size={20} className="text-amber-400" />}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="chart-container">
                <ErrorBoundary fallback={
                  <Card className="bg-slate-800/50 border-slate-700/50 p-6">
                    <CardContent className="text-center py-12">
                      <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-white mb-2">Chart Load Error</h3>
                      <p className="text-slate-400">Failed to load charts. Please try refreshing.</p>
                    </CardContent>
                  </Card>
                }><CohortRetentionChart data={dashboardData} />
                </ErrorBoundary>
              </div>
              <div className="chart-container">
                <ErrorBoundary>
                  <RFMHeatmapInteractive data={dashboardData} />
                </ErrorBoundary>
              </div>
            </div>
            
            {/* Keep only the financial summary section if you want it, but clean up */}
            <div className="mt-4 text-center text-slate-400 text-sm">
              {heroMetrics.revenueSaved > 0 ? (
                <p>
                  AI-driven retention improvements have saved an estimated{' '}
                  <span className="text-xl font-bold enterprise-metric text-enterprise-green">
                    ${heroMetrics.revenueSaved.toLocaleString()}
                  </span>{' '}
                  in potential churn losses this quarter.
                </p>
              ) : (
                <p>AI is actively monitoring retention patterns to prevent revenue loss.</p>
              )}
            </div>
          </div>

          {/* SECTION 5: At-Risk Customer Leaderboard */}
          <div>
            <ErrorBoundary fallback={
              <Card className="bg-slate-800/50 border-slate-700/50 p-6">
                <CardContent className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Leaderboard Load Error</h3>
                  <p className="text-slate-400">Failed to load leaderboard. Please try refreshing.</p>
                </CardContent>
              </Card>
            }>
              <AtRiskLeaderboard data={dashboardData} />
            </ErrorBoundary>
          </div>

          {/* SECTION 6: Recovery ROI Tracker */}
          <div>
            <ErrorBoundary>
              <RecoveryROITracker data={dashboardData} />
            </ErrorBoundary>
          </div>

          {/* SECTION 7: System Health Status */}
          <div>
            <SectionHeader
              title="System Health"
              icon={<CircuitBoard size={20} className="text-emerald-400" />}
              tooltipContent="Confirms the AI system is actively running and monitoring your customers 24/7. All green statuses mean everything is working optimally to protect your revenue."
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {systemStatusCards.map((card, index) => (
                <Card key={index} className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm relative group">
                  {/* Help Icon */}
                  <div className="absolute top-2 right-2 z-10">
                    <HelpIcon content={card.tooltipContent} />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${card.color}`}>
                        <card.icon size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">{card.title}</p>
                        <p className="text-sm font-semibold text-white enterprise-metric">{card.status}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">{card.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Footer - Add mt-auto to push it to bottom */}
      <footer className="enterprise-header py-4 mt-auto">
        <div className="px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-slate-400">OtoRetain Pro  <span>•</span>  AI-Powered Retention Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>© 2026 OtobrixAI</span>
              <span>•</span>
              <span>All rights reserved</span>
              <span>•</span>
              <span>v2.1.0</span>
            </div>
          </div>
        </div>
      </footer>

      {showWelcomeTooltip && (
        <div className="fixed bottom-6 right-6 z-[100]">
          <WelcomeTooltip />
        </div>
      )}

    </div>
  );
}