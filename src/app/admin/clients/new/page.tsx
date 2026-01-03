// src/app/admin/clients/new/page.tsx - ENTERPRISE DARK
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { createClientAction } from '@/actions/admin/clients'
import {
  ArrowLeft,
  User,
  Mail,
  Building,
  Save,
  Check,
  XCircle,
  Zap
} from 'lucide-react'

type PageProps = {
  searchParams?: Promise<{ 
    success?: string 
    error?: string
  }>
}

export default async function NewClientPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session || session.user.type !== 'admin') {
    redirect(`/${process.env.ADMIN_LOGIN_PATH_SEGMENT}`)
  }

  const params = await searchParams
  const successMessage = params?.success
  const errorMessage = params?.error

  return (
    <div className="enterprise-dark-bg min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <a
          href="/admin/clients"
          className="inline-flex items-center gap-2 text-enterprise-slate hover:text-white mb-8 transition-colors enterprise-card px-4 py-2 rounded-lg w-fit"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Clients</span>
        </a>

        {/* Success message */}
        {successMessage && (
          <div className="enterprise-card financial-positive mb-8 p-6">
            <div className="flex items-center gap-3">
              <Check className="text-enterprise-green flex-shrink-0" size={24} />
              <p className="text-white font-medium">
                {decodeURIComponent(successMessage)}
              </p>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="enterprise-card financial-risk mb-8 p-6">
            <div className="flex items-center gap-3">
              <XCircle className="text-enterprise-red flex-shrink-0" size={24} />
              <div>
                <p className="text-white font-medium">
                  {getErrorMessage(decodeURIComponent(errorMessage))}
                </p>
                <p className="text-enterprise-slate text-sm mt-1">
                  Please check your input and try again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-enterprise-blue to-enterprise-purple rounded-xl flex items-center justify-center shadow-enterprise">
            <User className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white enterprise-metric">Create New Client</h1>
            <p className="text-enterprise-slate mt-1">Add a new client to RetentionIQ Enterprise</p>
          </div>
        </div>

        {/* Simple Form - No CSRF complexity */}
        <form action={createClientAction} className="space-y-6">
          <div className="enterprise-card p-8">
            {/* Company Name */}
            <div className="mb-6">
              <label htmlFor="company_name" className="block text-sm font-medium text-slate-300 mb-2">
                Company Name
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-enterprise-slate" size={20} />
                <input
                  type="text"
                  name="company_name"
                  id="company_name"
                  placeholder="Acme Corp (optional)"
                  maxLength={200}
                  className="w-full pl-12 pr-4 py-3 enterprise-card border-enterprise-slate bg-enterprise-panel/50 text-white placeholder:text-enterprise-slate focus:ring-2 focus:ring-enterprise-blue focus:border-enterprise-blue transition-colors"
                />
              </div>
            </div>

            {/* Client Name */}
            <div className="mb-6">
              <label htmlFor="client_name" className="block text-sm font-medium text-slate-300 mb-2">
                Client Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-enterprise-slate" size={20} />
                <input
                  type="text"
                  name="client_name"
                  id="client_name"
                  required
                  placeholder="John Doe"
                  maxLength={100}
                  className="w-full pl-12 pr-4 py-3 enterprise-card border-enterprise-slate bg-enterprise-panel/50 text-white placeholder:text-enterprise-slate focus:ring-2 focus:ring-enterprise-blue focus:border-enterprise-blue transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-enterprise-slate" size={20} />
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  placeholder="john@acme.com"
                  maxLength={150}
                  className="w-full pl-12 pr-4 py-3 enterprise-card border-enterprise-slate bg-enterprise-panel/50 text-white placeholder:text-enterprise-slate focus:ring-2 focus:ring-enterprise-blue focus:border-enterprise-blue transition-colors"
                />
              </div>
            </div>

            {/* Status */}
            <div className="mb-6">
              <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-2">
                Status
              </label>
              <select
                name="status"
                id="status"
                defaultValue="active"
                className="w-full px-4 py-3 enterprise-card border-enterprise-slate bg-enterprise-panel/50 text-white focus:ring-2 focus:ring-enterprise-blue focus:border-enterprise-blue transition-colors"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-enterprise-slate mt-8">
              <a
                href="/admin/clients"
                className="flex-1 text-center py-3 enterprise-card border-enterprise-slate text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </a>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-enterprise-blue to-enterprise-purple text-white py-3 rounded-xl font-medium hover:from-enterprise-blue/90 hover:to-enterprise-purple/90 transition-all duration-300"
              >
                <Save size={20} />
                Create Client
              </button>
            </div>
          </div>
        </form>

        {/* Info box */}
        <div className="enterprise-card financial-positive mt-8 p-6">
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-gradient-to-br from-enterprise-blue to-enterprise-purple rounded-full flex items-center justify-center flex-shrink-0">
              <Zap className="text-white" size={16} />
            </div>
            <div>
              <p className="text-white font-medium mb-2">What happens next?</p>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Client receives a secure password setup email</li>
                <li>• You can manage them from the clients list</li>
                <li>• They get instant access to their analytics dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function for error messages
function getErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    'csrf_validation_failed': 'Security validation failed. Please refresh the page and try again.',
    'email_already_exists': 'A client with this email already exists.',
    'creation_failed': 'Failed to create client. Please try again.',
    'client_name_required': 'Client name is required.',
    'invalid_email': 'Please provide a valid email address.',
  }
  
  return messages[errorCode] || errorCode
}