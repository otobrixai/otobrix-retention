// src/lib/snapshots/snapshot-writer.ts

import { prisma } from '@/lib/prisma'
import {
  trimSnapshot,
  calculateSizeBytes,
  assertSnapshotSize,
} from './snapshot-utils'
import { Prisma } from '@prisma/client'

function hashStringToInt(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export async function writeSnapshot(params: {
  type: 'admin' | 'premium' | 'client'
  subjectId?: string
  version: number
  data: unknown
}) {
  // Generate unique lock key
  const lockKey = `snapshot_${params.type}_${params.subjectId || 'admin'}`
  const lockId = hashStringToInt(lockKey)

  try {
    const lockResult = await prisma.$queryRaw<{pg_try_advisory_lock: boolean}[]>`
      SELECT pg_try_advisory_lock(${lockId}) as pg_try_advisory_lock
    `

    if (!lockResult[0]?.pg_try_advisory_lock) {
      console.warn(`⚠️ Snapshot lock contention for ${lockKey} - skipping write`)
      return // Silent fail - another process is already writing
    }

    console.info(`🔒 Acquired snapshot lock: ${lockKey}`)

    try {
      const trimmed = trimSnapshot(params.data) as Prisma.InputJsonValue
      const sizeBytes = calculateSizeBytes(trimmed)
      assertSnapshotSize(params.type, sizeBytes)

      await prisma.dashboardSnapshot.create({
        data: {
          type: params.type,
          subjectId: params.subjectId ?? null,
          version: params.version,
          data: trimmed,
          sizeBytes,
        },
      })

      console.info(`✅ Snapshot written for ${params.type}`)
    } catch (error) {
      console.error(`❌ Failed to write snapshot for ${params.type}:`, error)
      throw error
    }

  } finally {
    try {
      await prisma.$queryRaw`
        SELECT pg_advisory_unlock(${lockId})
      `
    } catch (error) {
      console.warn(`⚠️ Could not release lock ${lockId}:`, error)
    }
  }
}