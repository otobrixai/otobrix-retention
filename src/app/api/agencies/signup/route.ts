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
    
    console.log('🆕 Agency signup request:', body);

    return NextResponse.json({
      success: true,
      message: 'Agency signup request received',
      data: {
        agencyName: body.agencyName,
        email: body.email,
        status: 'pending'
      }
    });

  } catch (error: any) {
    console.error('❌ Error processing agency signup:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process signup' },
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
