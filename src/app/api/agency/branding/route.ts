// src/app/api/agency/branding/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Extract agency ID from query parameters or headers
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    // TODO: Replace with actual branding data query
    // const branding = await prisma.agency_branding.findUnique({
    //   where: { agency_id: agencyId }
    // });

    // For now, return mock data
    const mockBranding = {
      agency_id: agencyId,
      logo_url: '/images/default-logo.png',
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
      company_name: 'Demo Agency'
    };

    return NextResponse.json(mockBranding);

  } catch (error: unknown) {
    console.error('❌ Error fetching branding:', error);
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message?: string }).message
        : undefined;
    return NextResponse.json(
      { error: errorMessage || 'Failed to fetch branding' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not implemented' },
    { status: 501 }
  );
}
