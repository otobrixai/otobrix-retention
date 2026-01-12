import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, newPassword, confirmPassword } = body

    if (!email || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Find client user
    const clientUser = await prisma.client_users.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        is_active: true
      }
    })

    if (!clientUser) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      )
    }

    // Verify user is allowed to set password (empty password or requires change)
    if (clientUser.password_hash && !clientUser.requires_password_change) {
      return NextResponse.json(
        { error: 'Password already set. Use forgot password instead.' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Update user
    await prisma.client_users.update({
      where: { id: clientUser.id },
      data: {
        password_hash: passwordHash,
        requires_password_change: false,
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Password set successfully'
    })

  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}