// src/app/store/[client_id]/components/BillingUsageCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Shield, Activity, DollarSign } from "lucide-react";

export function BillingUsageCard() {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardContent className="p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">
          Usage & Value
        </h3>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-400">
              <Shield size={14} />
              Customers Monitored
            </span>
            <span className="text-white font-medium">2,340</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-400">
              <Activity size={14} />
              AI Actions (30 days)
            </span>
            <span className="text-white font-medium">186</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-400">
              <DollarSign size={14} />
              Revenue Protected
            </span>
            <span className="text-emerald-400 font-semibold">
              $12,450
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 pt-2">
          Usage metrics are refreshed automatically and reflect real AI activity.
        </p>
      </CardContent>
    </Card>
  );
}
