// src/app/api/admin/clients/[id]/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { Resend } from 'resend'

// Safe initialization of Resend
const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const session = await auth()
    
    if (!session?.user || session.user.type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Await the params
    const { id } = await params
    const clientId = id

    // Fetch client details
    const client = await prisma.clients.findUnique({
      where: { client_id: clientId },
      include: {
        client_users: {
          where: { is_active: true }
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    if (!client.client_users.length) {
      return NextResponse.json(
        { error: 'No active users found for this client' },
        { status: 400 }
      )
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8)
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    // Update the client user with temporary password and require password change
    await prisma.client_users.updateMany({
      where: {
        client_id: clientId,
        is_active: true
      },
      data: {
        password_hash: passwordHash,
        requires_password_change: true,
        updated_at: new Date()
      }
    })

    console.info(`Password reset for client: ${clientId}`)

    let emailSent = false
    // Send email with temporary password only if Resend is configured
    if (resend) {
      try {
        const setupPasswordUrl = `${process.env.NEXTAUTH_URL}/set-password`
        const { error } = await resend.emails.send({
          from: 'OtoRetain Pro <support@otobrixai.com>',
          to: client.client_users[0].email,
          subject: 'Password Reset - Temporary Password',
          html: `
            <div>
              <h2>Password Reset Request</h2>
              <p>Hello ${client.client_name},</p>
              <p>Your password has been reset. Click the button below to set a new password:</p>
              <p><a href="${setupPasswordUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Set New Password</a></p>
              <p><strong>Note:</strong> This link will expire in 24 hours.</p>
              <br>
              <p>Best regards,<br>OtobrixAI Support Team</p>
            </div>
          `,
        })

        if (!error) {
          emailSent = true
          console.info(`Password reset email sent to: ${client.client_users[0].email}`)
        } else {
          console.error('Resend error:', error)
          console.info(`Password reset for client: ${clientId}, but email failed to send. Temp password: ${tempPassword}`)
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError)
        // Don't fail the request if email fails
      }
    } else {
      console.info(`Resend not configured. Password reset for client: ${clientId}, temp password: ${tempPassword}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
      emailSent: emailSent,
      note: emailSent ? 'Email sent successfully' : 'Email service not configured or failed'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}