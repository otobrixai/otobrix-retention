// src/components/ui/loading-skeleton.tsx - Updated with all exports
export function ClientDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 animate-pulse">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 bg-slate-800/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-slate-700 rounded-lg"></div>
              <div>
                <div className="h-6 w-48 bg-slate-700 rounded mb-2"></div>
                <div className="h-4 w-32 bg-slate-700 rounded"></div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden lg:block">
                <div className="h-9 w-24 bg-slate-700 rounded-md"></div>
              </div>
              <div className="w-10 h-10 bg-slate-700 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="p-6 lg:p-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 border-slate-700/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-slate-700 rounded-lg"></div>
                <div className="h-6 w-16 bg-slate-700 rounded"></div>
              </div>
              <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-slate-700 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-slate-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>

        {/* Tabs skeleton */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-1 mb-6">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-700 rounded-md flex-1"></div>
            ))}
          </div>
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800/50 border-slate-700/50 rounded-lg p-6">
            <div className="h-6 w-48 bg-slate-700 rounded mb-6"></div>
            <div className="h-80 bg-slate-700 rounded-2xl"></div>
          </div>
          <div className="bg-slate-800/50 border-slate-700/50 rounded-lg p-6">
            <div className="h-6 w-48 bg-slate-700 rounded mb-6"></div>
            <div className="h-80 bg-slate-700 rounded-2xl"></div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="bg-slate-800/50 border-slate-700/50 rounded-lg p-6">
          <div className="h-6 w-48 bg-slate-700 rounded mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Admin Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-900 animate-pulse">
      <div className="p-6 lg:p-8">
        <div className="h-8 w-64 bg-slate-700 rounded mb-8"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-800/50 border-slate-700/50 rounded-lg p-6">
              <div className="h-4 bg-slate-700 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-slate-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 border-slate-700/50 rounded-lg p-6">
            <div className="h-6 w-48 bg-slate-700 rounded mb-6"></div>
            <div className="h-64 bg-slate-700 rounded-2xl"></div>
          </div>
          <div className="bg-slate-800/50 border-slate-700/50 rounded-lg p-6">
            <div className="h-6 w-48 bg-slate-700 rounded mb-6"></div>
            <div className="h-64 bg-slate-700 rounded-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Admin Clients List Skeleton
export function ClientsListSkeleton() {
  return (
    <div className="min-h-screen bg-slate-900 animate-pulse">
      <div className="p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-48 bg-slate-700 rounded"></div>
          <div className="h-10 w-32 bg-slate-700 rounded"></div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 bg-slate-800/30">
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
          
          <div className="divide-y divide-slate-700/50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="grid grid-cols-5 gap-4">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="h-4 bg-slate-700 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}