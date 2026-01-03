// src/app/store/[client_id]/components/BillingPlanCard.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown } from "lucide-react";

export function BillingPlanCard() {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Crown size={18} className="text-amber-400" />
            Current Plan
          </h3>
          <Badge className="financial-badge-positive">Active</Badge>
        </div>

        <div>
          <p className="text-2xl font-bold text-white">Pro Plan</p>
          <p className="text-sm text-slate-400">$49 / month</p>
        </div>

        <div className="text-xs text-slate-400">
          Renews automatically • Cancel anytime
        </div>

        <Button
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
          disabled
        >
          Upgrade Plan (Coming Soon)
        </Button>
      </CardContent>
    </Card>
  );
}
