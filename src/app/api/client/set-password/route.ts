// src/app/api/client/set-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const setPasswordSchema = z.object({
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth()
    
    if (!session?.user || session.user.type !== 'client') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const clientId = session.user.clientId
    const userEmail = session.user.email

    if (!clientId || !userEmail) {
      return NextResponse.json(
        { error: 'Client ID or email not found' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = setPasswordSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    const { newPassword } = validationResult.data

    // Update client user password AND set requires_password_change to false
    const passwordHash = await bcrypt.hash(newPassword, 12)

    const updatedClientUser = await prisma.client_users.updateMany({
      where: {
        client_id: clientId,
        email: userEmail
      },
      data: {
        password_hash: passwordHash,
        requires_password_change: false, // ← ADD THIS LINE
        updated_at: new Date()
      }
    })

    if (updatedClientUser.count === 0) {
      return NextResponse.json(
        { error: 'Client user not found' },
        { status: 404 }
      )
    }

    // Return success with a flag to trigger client-side redirect
    return NextResponse.json({
      success: true,
      message: 'Password set successfully',
      requiresRedirect: true // ← ADD THIS FLAG
    })

  } catch (error) {
    console.error('Set password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}