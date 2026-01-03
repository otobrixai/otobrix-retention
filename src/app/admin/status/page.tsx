// src/app/admin/status/page.tsx

'use client'

import { useEffect, useState } from 'react'

type StatusResponse = {
  services: Record<string, string>
  latencyMs: number
}

export default function AdminStatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/status')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6">Loading system status…</div>
  if (!data) return <div className="p-6">Failed to load status</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">System Status</h1>

      <ul className="space-y-2 text-sm">
        {Object.entries(data.services).map(([key, value]) => (
          <li key={key}>
            <strong>{key}</strong>: {value}
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-400">
        Latency: {data.latencyMs}ms
      </p>
    </div>
  )
}
