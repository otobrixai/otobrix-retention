// src/lib/actions/client-retention.ts - FIXED WITH PROPER TYPES
'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

// Define types for the retention log data
interface RetentionLog {
  id: string;
  customer_id: string;
  action: string;
  timestamp: Date;
  status: string;
  channel: string;
  churn_score: number | null;
  rfm_recency: number | null;
  rfm_frequency: number | null;
  rfm_monetary: number | null;
  campaign_variant: string | null;
  ab_test_group: string | null;
  email_hash: string | null;
  phone_hash: string | null;
  client_id: string;
  created_at: Date;
  updated_at: Date;
  predicted_churn_reason: string | null;
  recommended_action: string | null;
  action_triggered: boolean;
  recovered_revenue: unknown;
}

interface ClientData {
  client_name: string;
  company_name: string | null;
  status: string;
}

interface RetentionData {
  logs: RetentionLog[];
  client: ClientData;
  stats: {
    totalActions: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    highRiskCustomers: number;
  };
}

export async function getRetentionData(clientId: string): Promise<RetentionData> {
  const session = await auth()

  // Security: Only allow client to see their own data
  if (
    !session?.user ||
    session.user.type !== 'client' ||
    session.user.clientId !== clientId
  ) {
    redirect('/')
  }

  const [logs, client] = await Promise.all([
    prisma.retention_logs.findMany({
      where: {
        client_id: clientId,
        timestamp: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // last 90 days
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    }) as Promise<RetentionLog[]>,
    prisma.clients.findUnique({
      where: { client_id: clientId },
      select: {
        client_name: true,
        company_name: true,
        status: true,
      },
    }) as Promise<ClientData | null>,
  ])

  if (!client || client.status !== 'active') {
    redirect('/')
  }

  // Calculate stats with proper typing
  const totalActions = logs.length
  const delivered = logs.filter((l: RetentionLog) => l.status === 'delivered').length
  const opened = logs.filter((l: RetentionLog) => l.status === 'opened').length
  const clicked = logs.filter((l: RetentionLog) => l.status === 'clicked').length
  const highRiskCustomers = logs.filter((l: RetentionLog) => (l.churn_score || 0) > 0.7).length

  return {
    logs,
    client,
    stats: {
      totalActions,
      deliveryRate: totalActions > 0 ? (delivered / totalActions) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      highRiskCustomers,
    },
  }
}