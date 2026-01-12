// src/app/admin/clients/[id]/page.tsx - ENTERPRISE DARK
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Key, Send, Edit, AlertTriangle } from 'lucide-react';

interface Account {
  client_id: string;
  company_name: string;
  client_name: string;
  email: string;
  status: string;
  api_key?: string;
  n8n_base_url?: string;
  created_at: string;
  updated_at: string;
}

const formatAccountName = (account: Account) => 
  account.company_name || account.client_name || account.email.split('@')[0];

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;
  
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: 'Your RetentionIQ Dashboard Access',
    message: 'Hello! You can now access your retention intelligence dashboard.',
    include_dashboard_link: true
  });
  const [passwordData, setPasswordData] = useState({
    reason: '',
    sendEmail: true,
    emailMessage: 'Your password has been reset. Please log in and set a new one to access your dashboard.'
  });

  useEffect(() => {
    async function loadAccount() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/admin/clients/${accountId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to load account`);
        }
        
        const data = await response.json();
        setAccount(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load account details';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    if (accountId) loadAccount();
  }, [accountId]);

  const handleEdit = () => router.push(`/admin/clients/${accountId}/edit`);

  const handleResetPassword = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${accountId}/reset-password`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset password');
      }

      const result = await response.json();
      alert(`Password reset successfully! ${result.emailSent ? 'Email sent.' : 'Check logs for temporary password.'}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setShowPasswordModal(false);
    }
  };

  const handleSendAccessEmail = async () => {
    setSendingEmail(true);
    try {
      const response = await fetch(`/api/admin/clients/${accountId}/send-access-email`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send access email');
      }

      const result = await response.json();
      alert(`Dashboard access email sent! ${result.emailSent ? 'User can now set their password.' : 'Check logs for temporary password.'}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to send access email');
    } finally {
      setSendingEmail(false);
      setShowEmailModal(false);
    }
  };

  if (loading) return (
    <div className="enterprise-dark-bg min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-enterprise-green mx-auto"></div>
        <p className="text-slate-300 mt-4 enterprise-metric">Loading account details...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="enterprise-dark-bg min-h-screen flex items-center justify-center">
      <div className="enterprise-card financial-risk p-8 max-w-md text-center">
        <AlertTriangle className="w-12 h-12 text-enterprise-red mx-auto mb-4" />
        <p className="text-white text-lg mb-2">Error Loading Account</p>
        <p className="text-slate-300">{error}</p>
      </div>
    </div>
  );
  
  if (!account) return (
    <div className="enterprise-dark-bg min-h-screen flex items-center justify-center">
      <div className="enterprise-card p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-enterprise-amber mx-auto mb-4" />
        <p className="text-white text-lg mb-2">Account not found</p>
      </div>
    </div>
  );

  return (
    <div className="enterprise-dark-bg min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Modals */}
        {showEmailModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="enterprise-card p-8 w-full max-w-lg shadow-enterprise-lg">
              <h3 className="text-2xl font-bold text-white mb-6 enterprise-metric">Send Dashboard Access</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
                  <input 
                    type="text" 
                    value={emailData.subject}
                    onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                    className="w-full enterprise-card border-enterprise-slate bg-enterprise-panel/50 text-white px-4 py-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                  <textarea 
                    value={emailData.message}
                    onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                    rows={4}
                    className="w-full enterprise-card border-enterprise-slate bg-enterprise-panel/50 text-white px-4 py-2 rounded-lg"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    checked={emailData.include_dashboard_link}
                    onChange={(e) => setEmailData({...emailData, include_dashboard_link: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-slate-300 text-sm">Include dashboard link</span>
                </label>
              </div>
              <div className="mt-6 flex gap-4">
                <button onClick={() => setShowEmailModal(false)} className="flex-1 py-3 enterprise-card border-enterprise-slate text-slate-300 hover:text-white rounded-lg">Cancel</button>
                <button onClick={handleSendAccessEmail} disabled={sendingEmail} className="flex-1 py-3 bg-gradient-to-r from-enterprise-green to-emerald-500 text-white rounded-lg hover:opacity-90 transition-opacity">
                  {sendingEmail ? 'Sending...' : 'Send Welcome Email'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="enterprise-card p-8 w-full max-w-lg shadow-enterprise-lg">
              <h3 className="text-2xl font-bold text-white mb-6 enterprise-metric">Reset Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Reason for reset</label>
                  <input 
                    type="text" 
                    placeholder="Optional..."
                    value={passwordData.reason}
                    onChange={(e) => setPasswordData({...passwordData, reason: e.target.value})}
                    className="w-full enterprise-card border-enterprise-slate bg-enterprise-panel/50 text-white px-4 py-2 rounded-lg"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    checked={passwordData.sendEmail}
                    onChange={(e) => setPasswordData({...passwordData, sendEmail: e.target.checked})}
                    className="rounded"
                  />
                  <span className="text-slate-300 text-sm">Send email notification</span>
                </label>
                {passwordData.sendEmail && (
                  <textarea 
                    value={passwordData.emailMessage}
                    onChange={(e) => setPasswordData({...passwordData, emailMessage: e.target.value})}
                    rows={3}
                    className="w-full enterprise-card border-enterprise-slate bg-enterprise-panel/50 text-white px-4 py-2 rounded-lg"
                  />
                )}
              </div>
              <div className="mt-6 flex gap-4">
                <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-3 enterprise-card border-enterprise-slate text-slate-300 hover:text-white rounded-lg">Cancel</button>
                <button onClick={handleResetPassword} className="flex-1 py-3 bg-gradient-to-r from-enterprise-red to-red-500 text-white rounded-lg hover:opacity-90 transition-opacity">
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="enterprise-card p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <button onClick={() => router.push('/admin/clients')} className="flex items-center gap-2 text-enterprise-slate hover:text-white mb-4 transition-colors">
                <ArrowLeft size={20} />
                Back to Clients
              </button>
              <h1 className="text-4xl font-bold text-white enterprise-metric">
                {formatAccountName(account)}
              </h1>
              <p className="text-xl text-enterprise-slate mt-2">Managed by {account.client_name}</p>
            </div>
            <span className={`px-5 py-2 rounded-full text-lg font-semibold ${
              account.status === 'active' 
                ? 'financial-badge-positive' 
                : 'financial-badge-risk'
            }`}>
              {account.status.toUpperCase()}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-10 mb-10">
            <div>
              <h2 className="text-2xl font-bold mb-6 text-white enterprise-metric">Account Overview</h2>
              <dl className="space-y-5">
                <div className="enterprise-card p-4">
                  <dt className="font-medium text-enterprise-slate mb-1">Business Name</dt>
                  <dd className="font-bold text-white">{formatAccountName(account)}</dd>
                </div>
                <div className="enterprise-card p-4">
                  <dt className="font-medium text-enterprise-slate mb-1">Contact Person</dt>
                  <dd className="text-white">{account.client_name}</dd>
                </div>
                <div className="enterprise-card p-4">
                  <dt className="font-medium text-enterprise-slate mb-1">Email</dt>
                  <dd className="text-white">{account.email}</dd>
                </div>
                <div className="enterprise-card p-4">
                  <dt className="font-medium text-enterprise-slate mb-1">Account ID</dt>
                  <dd className="font-mono text-sm bg-enterprise-panel px-3 py-1 rounded text-slate-300">{account.client_id}</dd>
                </div>
                <div className="enterprise-card p-4">
                  <dt className="font-medium text-enterprise-slate mb-1">Joined</dt>
                  <dd className="text-white">{new Date(account.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6 text-white enterprise-metric">Integration Settings</h2>
              <dl className="space-y-5">
                <div className="enterprise-card p-4">
                  <dt className="font-medium text-enterprise-slate mb-1">Automation URL</dt>
                  <dd className="text-white">{account.n8n_base_url || 'Not configured'}</dd>
                </div>
                <div className="enterprise-card p-4">
                  <dt className="font-medium text-enterprise-slate mb-1">API Key</dt>
                  <dd className="font-mono text-sm text-slate-300">{account.api_key ? '••••••••' + account.api_key.slice(-8) : 'Not generated'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-enterprise-slate pt-8">
            <h3 className="text-2xl font-bold mb-6 text-white">Account Actions</h3>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => router.push('/admin/clients')} className="enterprise-card px-6 py-3 text-enterprise-slate hover:text-white transition-colors">
                ← All Accounts
              </button>
              <button onClick={handleEdit} className="enterprise-card px-6 py-3 bg-gradient-to-r from-enterprise-blue to-enterprise-purple text-white hover:opacity-90 transition-opacity">
                <Edit size={18} className="inline mr-2" />
                Edit Account
              </button>
              <button onClick={() => setShowPasswordModal(true)} className="enterprise-card px-6 py-3 bg-gradient-to-r from-enterprise-red to-red-500 text-white hover:opacity-90 transition-opacity">
                <Key size={18} className="inline mr-2" />
                Reset Password
              </button>
              <button onClick={() => setShowEmailModal(true)} className="enterprise-card px-6 py-3 bg-gradient-to-r from-enterprise-green to-green-500 text-white hover:opacity-90 transition-opacity">
                <Send size={18} className="inline mr-2" />
                Send Dashboard Access
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}