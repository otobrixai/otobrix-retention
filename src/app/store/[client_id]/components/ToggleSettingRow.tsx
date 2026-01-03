// src/app/store/[client_id]/components/ToggleSettingRow.tsx
"use client";

import { useState } from "react";

interface Props {
  label: string;
  description?: string;
  defaultEnabled?: boolean;
  disabled?: boolean;
}

export function ToggleSettingRow({
  label,
  description,
  defaultEnabled = false,
  disabled = false
}: Props) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && (
          <p className="text-xs text-slate-400">{description}</p>
        )}
      </div>

      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => setEnabled(e.target.checked)}
        disabled={disabled}
        className="mt-1 h-5 w-5 accent-emerald-500 cursor-pointer disabled:opacity-50"
      />
    </div>
  );
}
