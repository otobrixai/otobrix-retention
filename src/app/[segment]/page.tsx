// src/app/[segment]/page.tsx - ENTERPRISE DARK ADMIN LOGIN
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import { Eye, EyeOff, Mail, Key, Shield, Server } from 'lucide-react'

interface AdminLoginPageProps {
  params: Promise<{
    segment: string
  }>
}

export default function AdminLoginPage({ params }: AdminLoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [segment, setSegment] = useState<string>('')
  const router = useRouter()
  const { data: session, status } = useSession()

  // Handle the async params
  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params
      setSegment(resolvedParams.segment)
    }
    getParams()
  }, [params])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (status === 'authenticated' && session?.user.type === 'admin') {
      router.push('/admin/dashboard')
    }
  }, [status, session, router, mounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('admin', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid admin credentials')
      } else if (result?.ok) {
        console.warn('Admin login successful, redirecting to dashboard...')
      }
    } catch (_error) {
      setError('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while params are being resolved
  if (!segment || !mounted || status === 'loading') {
    return (
      <div className="min-h-screen enterprise-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-enterprise-green mx-auto"></div>
          <p className="text-slate-300 mt-4 enterprise-metric">Loading Admin Portal...</p>
        </div>
      </div>
    )
  }

  // If already authenticated as admin, show loading until redirect
  if (status === 'authenticated' && session?.user.type === 'admin') {
    return (
      <div className="min-h-screen enterprise-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-enterprise-green mx-auto"></div>
          <p className="text-slate-300 mt-4 enterprise-metric">Redirecting to Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen enterprise-dark-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Enterprise Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-enterprise-blue/5 rounded-full blur-3xl animate-enterprise-float"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-enterprise-purple/5 rounded-full blur-3xl animate-enterprise-float" style={{ animationDelay: '2s' }}></div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.1)'%3e%3cpath d='M0 .5H32M0 16.5H32M0 32.5H32M.5 0V32M16.5 0V32M31.5 0V32'/%3e%3c/svg%3e")`
      }}></div>

      <div className="max-w-sm w-full space-y-6 relative z-10">
        {/* Header - Compact */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white enterprise-metric mb-2">
            Secure Admin Access
          </h1>
          <p className="text-enterprise-slate text-sm">
            System administration & management
          </p>
        </div>

        {/* Admin Login Form - Compact */}
        <div className="enterprise-card p-6 space-y-4">
          {error && (
            <div className="financial-risk rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-enterprise-panel rounded-full flex items-center justify-center border border-enterprise-red">
                  <div className="w-1.5 h-1.5 bg-enterprise-red rounded-full"></div>
                </div>
                <p className="text-white text-xs font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field - Compact */}
            <div className="space-y-2">
              <label htmlFor="admin-email" className="block text-xs font-medium text-slate-300">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                  <Mail className="text-enterprise-slate" size={16} />
                </div>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-enterprise-panel/50 border border-enterprise-slate rounded-lg text-white placeholder:text-enterprise-slate focus:border-enterprise-green/50 transition-colors"
                  placeholder="admin@company.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field - Compact */}
            <div className="space-y-2">
              <label htmlFor="admin-password" className="block text-xs font-medium text-slate-300">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                  <Key className="text-enterprise-slate" size={16} />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-10 py-2 text-sm bg-enterprise-panel/50 border border-enterprise-slate rounded-lg text-white placeholder:text-enterprise-slate focus:border-enterprise-green/50 transition-colors"
                  placeholder="Enter admin password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-enterprise-slate hover:text-slate-300 text-sm"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button - Security Focused Compact */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-enterprise-dark/60 border border-enterprise-slate/30 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:border-enterprise-green/40 hover:bg-enterprise-dark/80 transition-colors duration-150 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border border-enterprise-slate border-t-enterprise-green"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Server size={16} className="text-enterprise-slate" />
                  <span>Access Admin</span>
                  <Shield size={14} className="text-enterprise-green/60" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Footer - Compact */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-enterprise-slate mb-1.5">
            <Shield className="text-enterprise-green" size={14} />
            <p className="text-xs">Secure Access Protocol</p>
          </div>
          <p className="text-enterprise-slate text-xs">
            All access is logged, monitored, and encrypted
          </p>
        </div>
      </div>
    </div>
  )
}