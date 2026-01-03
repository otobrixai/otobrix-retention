// Example: src/app/api/admin/test/route.ts
import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Your business logic here
    return NextResponse.json({ 
      message: 'Admin test endpoint',
      user: { email: session.user.email }
    });
    
  } catch (error) {
    // Capture error in Sentry
    Sentry.captureException(error);
    console.error('Admin test error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}