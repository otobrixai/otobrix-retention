//src/domain/notifications/deriveNotifications.ts

import { DashboardData } from '@/types/dashboard'
import { Notification } from '@/types/notification'
import crypto from 'crypto'

export function deriveNotifications(
  clientId: string,
  prev: DashboardData | null,
  next: DashboardData
): Notification[] {
  const notifications: Notification[] = []
  const now = new Date().toISOString()

  // Guard: required sections must exist
  if (!next.roi || !next.actionSummary) return notifications
  if (prev && (!prev.roi || !prev.actionSummary)) return notifications

  // At this point, TypeScript knows prev.roi and prev.actionSummary exist if prev is truthy
  // But we need to help TypeScript understand this by storing references
  const prevRoi = prev?.roi
  const prevActionSummary = prev?.actionSummary
  const nextRoi = next.roi
  const nextActionSummary = next.actionSummary

  // 1️⃣ Revenue recovered increased
  if (prev && prevRoi && nextRoi.recoveredLast30Days > prevRoi.recoveredLast30Days) {
    const diff = nextRoi.recoveredLast30Days - prevRoi.recoveredLast30Days

    notifications.push({
      id: crypto.randomUUID(),
      clientId,
      type: 'revenue',
      title: `$${diff.toLocaleString()} revenue recovered`,
      description: 'AI retained at-risk customers',
      value: diff,
      createdAt: now,
    })
  }

  // 2️⃣ New churn-risk customers
  if (prev && prevActionSummary && nextActionSummary.customersPredictedToChurn > prevActionSummary.customersPredictedToChurn) {
    const diff = nextActionSummary.customersPredictedToChurn - prevActionSummary.customersPredictedToChurn

    notifications.push({
      id: crypto.randomUUID(),
      clientId,
      type: 'risk',
      title: `${diff} customers entered churn risk`,
      description: 'AI monitoring and preparing interventions',
      createdAt: now,
    })
  }

  // 3️⃣ Customers saved
  if (prev && prevActionSummary && nextActionSummary.customersSaved > prevActionSummary.customersSaved) {
    notifications.push({
      id: crypto.randomUUID(),
      clientId,
      type: 'action',
      title: 'AI retention action executed',
      description: 'Customers successfully retained',
      createdAt: now,
    })
  }

  return notifications
}