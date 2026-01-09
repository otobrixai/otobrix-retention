// src/app/api/client/dashboard/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session || session.user.type !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = session.user.clientId;
    if (!clientId) {
      return NextResponse.json({ error: 'Client ID not found' }, { status: 400 });
    }

    // Get campaign statistics from retention_logs
    const campaignStats = await prisma.retention_logs.groupBy({
      by: ['campaign_variant'],
      where: {
        client_id: clientId,
        campaign_variant: { not: null }
      },
      _count: {
        customer_id: true
      }
    });

    // Get unique customers count
    const uniqueCustomers = await prisma.retention_logs.groupBy({
      by: ['customer_id'],
      where: {
        client_id: clientId,
        timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    });

    // Get recent activity
    const recentActivity = await prisma.retention_logs.findMany({
      where: {
        client_id: clientId
      },
      select: {
        id: true,
        customer_id: true,
        action: true,
        status: true,
        timestamp: true,
        campaign_variant: true
      },
      take: 10,
      orderBy: {
        timestamp: 'desc'
      }
    });

    const dashboardData = {
      totalCampaigns: campaignStats.length,
      activeCampaigns: campaignStats.filter(c => c.campaign_variant !== null).length,
      totalCustomers: uniqueCustomers.length,
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        customerId: activity.customer_id,
        action: activity.action,
        status: activity.status,
        timestamp: activity.timestamp,
        campaignVariant: activity.campaign_variant
      }))
    };

    return NextResponse.json(dashboardData);

  } catch (error: unknown) {
    console.error('❌ Error fetching client dashboard data:', error);
    return NextResponse.json(
      { error: (typeof error === 'object' && error !== null && 'message' in error) ? (error as { message: string }).message : 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
