//src/app/api/admin/settings/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getAdminSettings, setAdminSetting } from '@/lib/cache'

export async function GET() {
  return NextResponse.json(getAdminSettings())
}

export async function POST(req: NextRequest) {
  const { key, value } = await req.json()

  if (!['maintenanceMode', 'disableAutomations'].includes(key)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  setAdminSetting(key, value)
  return NextResponse.json({ success: true })
}
