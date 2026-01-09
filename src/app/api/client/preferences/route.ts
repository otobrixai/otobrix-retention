// app/api/client/preferences/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()

  if (!session?.user || session.user.type !== 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get clientId from session
  const clientId = session.user.clientId

  if (!clientId) {
    return NextResponse.json({ error: 'Client ID not found' }, { status: 400 })
  }

  try {
    const preferences = await prisma.clientPreferences.findUnique({
      where: { client_id: clientId },
      select: {
        ai_risk_alerts: true,
        weekly_report: true,
        email_notifications: true,
      }
    })

    return NextResponse.json(preferences || {
      ai_risk_alerts: true,
      weekly_report: true,
      email_notifications: true,
    })
  } catch (error) {
    console.error('Error fetching preferences:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch preferences',
      ai_risk_alerts: true,
      weekly_report: true,
      email_notifications: true,
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()

  if (!session?.user || session.user.type !== 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get clientId from session
  const clientId = session.user.clientId

  if (!clientId) {
    return NextResponse.json({ error: 'Client ID not found' }, { status: 400 })
  }

  try {
    const body = await request.json()
    
    const updated = await prisma.clientPreferences.upsert({
      where: { client_id: clientId },
      create: {
        client_id: clientId,
        ai_risk_alerts: body.aiRiskAlerts,
        weekly_report: body.weeklyReport,
        email_notifications: body.emailNotifications,
      },
      update: {
        ai_risk_alerts: body.aiRiskAlerts,
        weekly_report: body.weeklyReport,
        email_notifications: body.emailNotifications,
      }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error saving preferences:', error)
    return NextResponse.json({ 
      error: 'Failed to save preferences' 
    }, { status: 500 })
  }
}
