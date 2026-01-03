// src/app/admin/settings/page.tsx - MINIMAL WORKING VERSION
'use client'

import { useEffect, useState } from 'react'

type AdminSettings = {
  maintenanceMode: boolean
  disableAutomations: boolean
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then((data: AdminSettings) => setSettings(data))
  }, [])

  const toggle = async (key: keyof AdminSettings) => {
    if (!settings) return

    const value = !settings[key]
    setSettings({ ...settings, [key]: value })

    await fetch('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    })
  }

  if (!settings) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Admin Settings</h1>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={settings.maintenanceMode}
          onChange={() => toggle('maintenanceMode')}
        />
        Maintenance Mode
      </label>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={settings.disableAutomations}
          onChange={() => toggle('disableAutomations')}
        />
        Disable AI Automations
      </label>
    </div>
  )
}
