// src/app/store/[client_id]/components/SettingsSection.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function SettingsSection({
  title,
  description,
  icon,
  children
}: Props) {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-slate-700/50 text-slate-300">
              {icon}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && (
              <p className="text-sm text-slate-400">{description}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
