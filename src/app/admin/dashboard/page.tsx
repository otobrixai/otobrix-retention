// src/app/admin/dashboard/page.tsx - ENTERPRISE DARK DASHBOARD
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getDashboardStats } from '@/lib/actions/admin'
import { DashboardSkeleton } from '@/components/ui/loading-skeleton'
import { DashboardContent } from '@/components/admin/dashboard-content'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminDashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/${process.env.ADMIN_LOGIN_PATH_SEGMENT}')
  }
  
  if (session.user.type !== 'admin') {
    redirect('/store')
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardDataLoader />
    </Suspense>
  )
}

// In DashboardDataLoader function, fix like this:
async function DashboardDataLoader() {
  const session = await auth()
  
  // Add null check for session
  if (!session) {
    redirect(`/${process.env.ADMIN_LOGIN_PATH_SEGMENT}`)
  }
  
  try {
    const data = await getDashboardStats()
    
    // ✅ ADD THIS: Handle degraded state (stats can be null)
    if (!data.stats) {
      return (
        <div className="p-8">
          <div className="financial-risk rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-enterprise-yellow/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-enterprise-yellow" size={20} />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg enterprise-metric mb-1">
                  Data Refresh in Progress
                </h2>
                <p className="text-slate-300 text-sm">
                  {data.metadata.error || 'Dashboard data is being updated. Please try again in a moment.'}
                </p>
              </div>
            </div>
            <form action={async () => {
              'use server'
              redirect('/admin/dashboard') // Redirect to same page to force reload
            }}>
              <button 
                type="submit"
                className="mt-4 px-4 py-3 bg-enterprise-blue text-white rounded-lg hover:bg-enterprise-blue/90 flex items-center gap-2 font-medium enterprise-card hover:scale-[1.02] transition-all duration-300"
              >
                <RefreshCw size={16} />
                Refresh Page
              </button>
            </form>
          </div>
        </div>
      )
    }
    
    // ✅ KEEP YOUR EXISTING VALIDATION (but stats will never be null here)
    if (!data || typeof data.stats.totalClients !== 'number') {
      console.error('❌ Invalid dashboard data structure:', data)
      throw new Error('Invalid dashboard data')
    }
    
    console.warn('✅ Dashboard data loaded successfully:', data.stats)
    return <DashboardContent data={data} session={session} />
  } catch (error) {
    console.error('❌ Error loading dashboard:', error)
    
    // Return fallback UI with enterprise styling
    return (
      <div className="p-8">
        <div className="financial-risk rounded-xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-enterprise-red/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-enterprise-red" size={20} />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg enterprise-metric mb-1">Error Loading Dashboard</h2>
              <p className="text-slate-300 text-sm">
                {error instanceof Error ? error.message : 'Failed to load dashboard data. Please refresh the page or contact support.'}
              </p>
            </div>
          </div>
          <form action={async () => {
            'use server'
            redirect('/admin/dashboard') // Redirect to same page to force reload
          }}>
            <button 
              type="submit"
              className="mt-4 px-4 py-3 bg-enterprise-red text-white rounded-lg hover:bg-enterprise-red/90 flex items-center gap-2 font-medium enterprise-card hover:scale-[1.02] transition-all duration-300"
            >
              <RefreshCw size={16} />
              Refresh Page
            </button>
          </form>
        </div>
      </div>
    )
  }
}