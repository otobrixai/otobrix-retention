// src/app/api/admin/clients/[id]/send-access-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

// Initialize Resend (make sure you have RESEND_API_KEY in your .env)
const resend = new Resend(process.env.RESEND_API_KEY)

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

    // Fetch client details from database
    const client = await prisma.clients.findUnique({
      where: { client_id: clientId },
      include: {
        client_users: {
          where: { is_active: true },
          take: 1 // Get the first active user
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

    const clientUser = client.client_users[0]
    const setupPasswordUrl = `${process.env.NEXTAUTH_URL}/set-password`

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'OtoRetain Pro <support@otobrixai.com>',
      to: clientUser.email,
      subject: 'Access Your Dashboard',
    html: `
      <div>
        <h2>Welcome to Your Dashboard</h2>
        <p>Hello ${client.client_name},</p>
        <p>Your account has been set up. Please set your password using the link below:</p>
        <p><a href="${setupPasswordUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Set Your Password</a></p>
        <p>Use your email: <strong>${clientUser.email}</strong> to set your password.</p>
        <p><strong>Important:</strong> You must set your password before you can access your dashboard.</p>
        <br>
        <p>Best regards,<br>Your Team</p>
      </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    console.log(`Access email sent to: ${clientUser.email}`)

    return NextResponse.json({
      success: true,
      message: 'Access email sent successfully',
      emailId: data?.id
    })

  } catch (error) {
    console.error('Send access email error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}