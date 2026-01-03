// src/app/store/[client_id]/billing/page.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { BillingPlanCard } from "../components/BillingPlanCard";
import { BillingUsageCard } from "../components/BillingUsageCard";
import { ArrowLeft, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function BillingPage() {
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
                <p className="text-sm text-slate-400">Billing & Plan Management</p>
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

      {/* Main Content - Add flex-1 to take available space */}
      <div className="flex-1 p-6 lg:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BillingPlanCard />
          <BillingUsageCard />
        </div>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6 text-sm text-slate-400">
            Billing changes, upgrades, and invoices will be available soon.
            <br />
            For now, contact support if you need to change your plan.
          </CardContent>
        </Card>
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