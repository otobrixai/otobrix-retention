// src/app/api/client/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.type !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock dashboard data for now
    const dashboardData = {
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalCustomers: 0,
      recentActivity: []
    };

    // TODO: Uncomment and fix these when retention_logs table exists
    /*
    const dashboardData = await prisma.retention_logs.groupBy({
      by: ['campaign_id'],
      _count: {
        customer_id: true
      }
    });

    const recentCampaigns = await prisma.retention_logs.findMany({
      take: 5,
      orderBy: {
        created_at: 'desc'
      }
    });
    */

    return NextResponse.json(dashboardData);

  } catch (error: any) {
    console.error('❌ Error fetching client dashboard data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
