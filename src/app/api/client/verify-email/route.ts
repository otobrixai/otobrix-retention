import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find client user by email
    const clientUser = await prisma.client_users.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        is_active: true
      },
      include: {
        clients: true
      }
    })

    if (!clientUser) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'User not found or inactive'
        },
        { status: 404 }
      )
    }

    // Check if password needs to be set (empty password_hash or requires_password_change)
    const needsPasswordSetup = !clientUser.password_hash || clientUser.requires_password_change

    if (!needsPasswordSetup) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Password already set'
        },
        { status: 400 }
      )
    }

    // Valid user who needs to set password
    return NextResponse.json({
      valid: true,
      requiresPasswordChange: clientUser.requires_password_change,
      clientName: clientUser.clients?.client_name || '',
      clientId: clientUser.client_id
    })

  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}