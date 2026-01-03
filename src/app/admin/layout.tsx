// src/app/admin/layout.tsx - COMPLETE
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { SimpleHeader } from '@/components/admin/simple-header'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect(`/${process.env.ADMIN_LOGIN_PATH_SEGMENT}`)
  }

  return (
    <div className="min-h-screen enterprise-dark-bg">
      <SimpleHeader session={session} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <main className="enterprise-card min-h-[60vh] p-6">
          {children}
        </main>
        
        <footer className="mt-8 text-center text-sm text-enterprise-slate">
          <p>© {new Date().getFullYear()} RetentionIQ Enterprise. All rights reserved.</p>
          <p className="mt-1 text-xs enterprise-metric">v{process.env.npm_package_version || '2.1.0'}</p>
        </footer>
      </div>
    </div>
  )
}