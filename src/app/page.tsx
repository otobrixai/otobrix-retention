// src/app/page.tsx
'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Eye, EyeOff, Mail, Key, Shield, Server } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && status === 'authenticated') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sessionUser = session?.user as any;
      if (sessionUser?.requiresPasswordChange) {
        router.push('/set-password')
        return
      }

      if (sessionUser?.type === 'admin') {
        router.push('/admin/dashboard')
      } else if (sessionUser?.type === 'client' && sessionUser?.clientId) {
        router.push(`/store/${sessionUser.clientId}`)
      }
    }
  }, [session, status, router, mounted])

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen enterprise-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-enterprise-green mx-auto mb-4"></div>
          <p className="text-enterprise-slate text-sm enterprise-metric">Initializing Platform</p>
          <div className="enterprise-loading mt-2">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen enterprise-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-enterprise-green mx-auto mb-4"></div>
          <p className="text-enterprise-slate text-sm enterprise-metric">Accessing Dashboard</p>
          <div className="enterprise-loading mt-2">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    )
  }

  return <EnterpriseDarkLoginForm />
}

function EnterpriseDarkLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [_error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await signIn('client', {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        setError('Invalid email or password')
      }
      // No need to handle success here as the Home component will redirect
    } catch (_error) {
      setError('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen enterprise-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enterprise Background Elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-enterprise-blue/5 rounded-full blur-3xl animate-enterprise-float"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-enterprise-purple/5 rounded-full blur-3xl animate-enterprise-float" style={{ animationDelay: '2s' }}></div>
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.1)'%3e%3cpath d='M0 .5H32M0 16.5H32M0 32.5H32M.5 0V32M16.5 0V32M31.5 0V32'/%3e%3c/svg%3e")`
      }}></div>

      <div className="max-w-sm w-full space-y-6 relative z-10">
        {/* Header - Smaller */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white enterprise-metric mb-2">
            Welcome Back
          </h1>
          <p className="text-enterprise-slate text-sm">
            Sign in to your analytics dashboard
          </p>
        </div>

        {/* Client Login Form - Compact */}
        <div className="enterprise-card p-6 space-y-4">
          {_error && (
            <div className="financial-risk rounded-lg p-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-enterprise-panel rounded-full flex items-center justify-center border border-enterprise-red">
                  <div className="w-1.5 h-1.5 bg-enterprise-red rounded-full"></div>
                </div>
                <p className="text-white text-xs font-medium">{_error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field - Compact */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                  <Mail className="text-enterprise-slate" size={16} />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm bg-enterprise-panel/50 border border-enterprise-slate rounded-lg text-white placeholder:text-enterprise-slate focus:border-enterprise-blue/50 transition-colors"
                  placeholder="your@company.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field - Compact */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-xs font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                  <Key className="text-enterprise-slate" size={16} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-10 py-2 text-sm bg-enterprise-panel/50 border border-enterprise-slate rounded-lg text-white placeholder:text-enterprise-slate focus:border-enterprise-blue/50 transition-colors"
                  placeholder="Enter your password"
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

            {/* Submit Button - Compact */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-enterprise-panel border border-enterprise-slate text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:border-enterprise-blue/50 hover:bg-enterprise-panel/80 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border border-enterprise-slate border-t-transparent"></div>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <Server size={16} className="text-enterprise-slate" />
                  <span>Access Dashboard</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer - Compact */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-enterprise-slate mb-1.5">
            <Shield className="text-enterprise-green" size={14} />
            <p className="text-xs">Secured Platform Powered by OtobrixAI</p>
          </div>
          <p className="text-enterprise-slate text-xs">
            All access is logged, monitored, and encrypted
          </p>
        </div>
      </div>
    </div>
  )
}