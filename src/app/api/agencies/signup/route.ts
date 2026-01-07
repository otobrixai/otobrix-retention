// src/app/api/agencies/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.agencyName || !body.email) {
      return NextResponse.json(
        { error: 'Agency name and email are required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual agency signup logic
    // This should create an agency record in the database
    
    console.info('🆕 Agency signup request:', body);

    return NextResponse.json({
      success: true,
      message: 'Agency signup request received',
      data: {
        agencyName: body.agencyName,
        email: body.email,
        status: 'pending'
      }
    });

  } catch (error: unknown) {
    console.error('❌ Error processing agency signup:', error);
    const errorMessage =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message?: string }).message
        : undefined;

    return NextResponse.json(
      { error: errorMessage || 'Failed to process signup' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
