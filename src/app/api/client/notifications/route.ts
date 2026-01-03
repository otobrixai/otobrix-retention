//src/app/api/client/notifications/route.ts

import { NextResponse } from 'next/server'
import { auth } from '@/auth' // Changed from requireClient to auth
import { cacheManager } from '@/lib/cache/redis'
import { Notification } from '@/types/notification'

export async function GET() {
  // Use the same auth pattern as the snapshot route
  const session = await auth()

  if (!session?.user || session.user.type !== 'client') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use clientId from session user (adjust based on your actual session structure)
  const clientId = session.user.clientId

  const key = `notifications:${clientId}`

  const notifications = (await cacheManager.get<Notification[]>(key)) ?? []

  return NextResponse.json(notifications)
}