// src/app/store/[client_id]/settings/page.tsx
"use client";

import { Bell, Brain, ArrowLeft, Building } from "lucide-react";
import { SettingsSection } from "../components/SettingsSection";
import { ToggleSettingRow } from "../components/ToggleSettingRow";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen enterprise-dark-bg text-slate-100 relative flex flex-col">
      {/* Main Header - Same as dashboard */}
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
                <p className="text-sm text-slate-400">Settings & Preferences</p>
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

      {/* Main Content - Add flex-1 */}
      <div className="flex-1 p-6 lg:p-8 space-y-10">
        {/* Notifications */}
        <SettingsSection
          title="Notifications"
          description="Choose how and when the system notifies you about AI activity."
          icon={<Bell size={18} />}
        >
          <ToggleSettingRow
            label="AI Action Alerts"
            description="Get notified when the AI intervenes to prevent customer churn."
            defaultEnabled
          />

          <ToggleSettingRow
            label="Weekly Summary Email"
            description="Receive a weekly summary of retention performance and revenue impact."
            defaultEnabled
          />
        </SettingsSection>

        {/* AI Preferences */}
        <SettingsSection
          title="AI Preferences"
          description="Control how aggressively the AI works to retain customers."
          icon={<Brain size={18} />}
        >
          <ToggleSettingRow
            label="Aggressive Retention Mode"
            description="Allow AI to take stronger actions for high-risk customers."
          />

          <ToggleSettingRow
            label="Auto Win-Back Campaigns"
            description="Automatically trigger win-back actions without manual approval."
            defaultEnabled
          />
        </SettingsSection>
      </div>

      {/* Footer - Same as dashboard */}
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