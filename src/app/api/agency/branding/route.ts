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

    // Note: agency_branding table doesn't exist in schema
    // Return default/empty branding data
    const branding = {
      agency_id: agencyId,
      logo_url: null,
      primary_color: '#3B82F6',
      secondary_color: '#1E40AF',
      company_name: null
    };

    return NextResponse.json(branding);

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
