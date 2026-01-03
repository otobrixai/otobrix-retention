// src/app/admin/clients/[id]/edit/page.tsx - ENTERPRISE DARK
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';

interface Client {
  client_id: string;
  client_name: string;
  email: string;
  status: string;
  n8n_base_url?: string;
  company_name?: string;
}

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadClient() {
      try {
        const response = await fetch(`/api/admin/clients/${clientId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch client');
        }
        
        const data = await response.json();
        setClient(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update client');
      }

      router.push(`/admin/clients/${clientId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Client, value: string) => {
    setClient(prev => prev ? { ...prev, [field]: value } : null);
  };

  if (loading) return (
    <div className="enterprise-dark-bg min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-enterprise-green mx-auto"></div>
        <p className="text-slate-300 mt-4 enterprise-metric">Loading client data...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="enterprise-dark-bg min-h-screen flex items-center justify-center">
      <div className="enterprise-card financial-risk p-8 max-w-md text-center">
        <AlertTriangle className="w-12 h-12 text-enterprise-red mx-auto mb-4" />
        <p className="text-white text-lg mb-2">Error</p>
        <p className="text-slate-300">{error}</p>
      </div>
    </div>
  );
  
  if (!client) return (
    <div className="enterprise-dark-bg min-h-screen flex items-center justify-center">
      <div className="enterprise-card p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-enterprise-amber mx-auto mb-4" />
        <p className="text-white text-lg mb-2">Client not found</p>
      </div>
    </div>
  );

  return (
    <div className="enterprise-dark-bg min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="enterprise-card p-8">
          {/* Header */}
          <div className="mb-8">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-enterprise-slate hover:text-white mb-6 transition-colors">
              <ArrowLeft size={20} />
              Back to Client
            </button>
            <h1 className="text-3xl font-bold text-white enterprise-metric mb-2">Edit Client: {client.client_name}</h1>
            <p className="text-enterprise-slate">Update client information and settings</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Client Name
                </label>
                <input
                  type="text"
                  value={client.client_name}
                  onChange={(e) => handleChange('client_name', e.target.value)}
                  className="w-full px-4 py-3 enterprise-card border-enterprise-slate bg-enterprise-panel/50 text-white focus:ring-2 focus:ring-enterprise-blue focus:border-enterprise-blue transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={client.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-3 enterprise-card border-enterprise-slate bg-enterprise-panel/50 text-white focus:ring-2 focus:ring-enterprise-blue focus:border-enterprise-blue transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={client.company_name || ''}
                  onChange={(e) => handleChange('company_name', e.target.value)}
                  className="w-full px-4 py-3 enterprise-card border-enterprise-slate bg-enterprise-panel/50 text-white focus:ring-2 focus:ring-enterprise-blue focus:border-enterprise-blue transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Automation URL
                </label>
                <input
                  type="url"
                  value={client.n8n_base_url || ''}
                  onChange={(e) => handleChange('n8n_base_url', e.target.value)}
                  className="w-full px-4 py-3 enterprise-card border-enterprise-slate bg-enterprise-panel/50 text-white focus:ring-2 focus:ring-enterprise-blue focus:border-enterprise-blue transition-colors"
                  placeholder="https://n8n.otobrixai.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Status
                </label>
                <select
                  value={client.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-4 py-3 enterprise-card border-enterprise-slate bg-enterprise-panel/50 text-white focus:ring-2 focus:ring-enterprise-blue focus:border-enterprise-blue transition-colors"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-4 pt-6 border-t border-enterprise-slate">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3 enterprise-card border-enterprise-slate text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-enterprise-blue to-enterprise-purple text-white py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Save size={20} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}