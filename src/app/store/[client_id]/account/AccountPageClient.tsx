// src/app/store/[client_id]/account/AccountPageClient.tsx
"use client";

import { useState } from "react";
import { Bell, Mail, ArrowLeft, Building, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ClientPreferences {
  ai_risk_alerts: boolean
  weekly_report: boolean
  email_notifications: boolean
}

interface AccountPageClientProps {
  clientId: string
  initialPreferences: ClientPreferences
}

export default function AccountPageClient({ 
  clientId, 
  initialPreferences 
}: AccountPageClientProps) {
  const router = useRouter();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const [preferences, setPreferences] = useState({
    aiRiskAlerts: initialPreferences.ai_risk_alerts,
    weeklyReport: initialPreferences.weekly_report,
    emailNotifications: initialPreferences.email_notifications,
  });

  const handleToggle = async (key: keyof typeof preferences) => {
    const newValue = !preferences[key];
    const updatedPreferences = { ...preferences, [key]: newValue };
    
    // Optimistic update
    setPreferences(updatedPreferences);
    setSaveStatus('saving');

    try {
      const response = await fetch(`/api/client/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiRiskAlerts: updatedPreferences.aiRiskAlerts,
          weeklyReport: updatedPreferences.weeklyReport,
          emailNotifications: updatedPreferences.emailNotifications,
        }),
      });
      
      if (!response.ok) throw new Error('Save failed');
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error("Save error:", error);
      // Revert on error
      setPreferences({
        aiRiskAlerts: initialPreferences.ai_risk_alerts,
        weeklyReport: initialPreferences.weekly_report,
        emailNotifications: initialPreferences.email_notifications,
      });
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen enterprise-dark-bg text-slate-100 relative flex flex-col">
      {/* Main Header - Same as other pages */}
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
                <p className="text-sm text-slate-400">Account & Preferences</p>
              </div>
            </div>

            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-slate-400 hover:text-white hover:bg-slate-700/50"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6 lg:p-8 max-w-lg mx-auto space-y-6">
        {/* Notifications Section */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell size={20} className="text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              <p className="text-sm text-slate-400">Control your alerts and reports</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-slate-300">AI Risk Alerts</Label>
                <p className="text-sm text-slate-400">Daily digest of high-risk customers</p>
              </div>
              <Switch
                checked={preferences.aiRiskAlerts}
                onCheckedChange={() => handleToggle('aiRiskAlerts')}
                disabled={saveStatus === 'saving'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-slate-300">Weekly Retention Report</Label>
                <p className="text-sm text-slate-400">Performance summary and revenue impact</p>
              </div>
              <Switch
                checked={preferences.weeklyReport}
                onCheckedChange={() => handleToggle('weeklyReport')}
                disabled={saveStatus === 'saving'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-slate-300">Email Notifications</Label>
                <p className="text-sm text-slate-400">Receive alerts via email</p>
              </div>
              <Switch
                checked={preferences.emailNotifications}
                onCheckedChange={() => handleToggle('emailNotifications')}
                disabled={saveStatus === 'saving'}
              />
            </div>
          </div>

          {/* Status Indicators */}
          {saveStatus === 'saving' && (
            <div className="mt-4 text-sm text-slate-400">Saving...</div>
          )}
          
          {saveStatus === 'saved' && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-400">
              <CheckCircle size={14} />
              Preferences saved
            </div>
          )}
          
          {saveStatus === 'error' && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-400">
              <XCircle size={14} />
              Save failed - try again
            </div>
          )}
        </div>

        {/* Support Section */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-sm font-medium text-slate-300 mb-3">Support & Billing</h3>
          <p className="text-sm text-slate-400 mb-4">
            Currently on manual billing. All invoices and plan changes are handled by our support team.
          </p>
          
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              window.location.href = 'mailto:support@otobrixai.com?subject=Billing%20Inquiry';
            }}
          >
            <Mail size={16} className="mr-2" />
            Contact Support for Billing Questions
          </Button>

          <p className="text-xs text-slate-500 mt-4 text-center">
            Advanced features (SMS alerts, auto-campaigns, branding) available on upgraded plans
          </p>
        </div>
      </div>

      {/* Footer - Same as other pages */}
      <footer className="enterprise-header py-4">
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
    </div>
  );
}
