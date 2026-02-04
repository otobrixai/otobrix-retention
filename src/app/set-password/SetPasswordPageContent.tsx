'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Eye, EyeOff, Key, Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'

export default function SetPasswordPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email')
  
  const [email, setEmail] = useState(emailParam || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(!!emailParam)
  const [error, setError] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isValidUser, setIsValidUser] = useState(false)
  const [clientId, setClientId] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Verify user when email is provided in URL
  useEffect(() => {
    if (emailParam) {
      verifyUser(emailParam)
    }
  }, [emailParam])

  const verifyUser = async (userEmail: string) => {
    try {
      setVerifying(true)
      const response = await fetch(`/api/client/verify-email?email=${encodeURIComponent(userEmail)}`)
      
      if (!response.ok) {
        throw new Error('Invalid or expired setup link')
      }
      
      const data = await response.json()
      if (data.valid && data.requiresPasswordChange) {
        setIsValidUser(true)
        setEmail(userEmail)
        setClientId(data.clientId)
      } else {
        setError('This link is no longer valid or password already set')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid setup link')
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email) {
      setError('Email is required')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match")
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/client/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        toast.success('Password set successfully!', {
          description: 'Signing you in...'
        })

        // Auto sign-in
        const result = await signIn('credentials', {
          email,
          password: newPassword,
          redirect: false,
        })

        if (result?.error) {
          setError('Password set, but auto-login failed. Please login manually.')
          setTimeout(() => router.push('/'), 3000)
        } else {
          // Success! Redirect to dashboard
          router.push(clientId ? `/store/${clientId}` : '/')
        }
      } else {
        setError(data.error || 'Failed to set password')
      }
    } catch (_error) {
      setError('An error occurred while setting password')
    } finally {
      if (!success) setLoading(false)
    }
  }

  // If verifying, show loading
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Verifying your setup link...</p>
        </div>
      </div>
    )
  }

  // If email provided but not valid user
  if (emailParam && !isValidUser && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-600 to-red-500 rounded-2xl flex items-center justify-center shadow-lg mb-6">
              <span className="text-white font-bold text-2xl">!</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Invalid Link</h2>
            <p className="text-gray-600 mt-2">{error}</p>
            <button 
              onClick={() => router.push('/')}
              className="mt-6 bg-blue-600 text-white py-2 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If success, show success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="text-emerald-500" size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
            <p className="text-gray-600">Your password has been set. We're redirecting you to your dashboard now...</p>
          </div>
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-blue-600" size={24} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {emailParam ? 'Set Your Password' : 'Password Setup'}
          </h2>
          <p className="text-gray-600 mt-2">
            {emailParam 
              ? `Setting password for ${email}`
              : 'Enter your email to set a password'
            }
          </p>
        </div>

        {/* Password Form */}
        <form className="mt-8 space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-gray-200" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Email Field (only show if not from URL param) */}
          {!emailParam && (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your email"
                  disabled={loading || !!emailParam}
                />
              </div>
            </div>
          )}

          {/* New Password Field */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter new password"
                disabled={loading}
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Password must be at least 8 characters long
            </p>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Confirm your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Setting Password...
              </>
            ) : (
              'Set Password'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}