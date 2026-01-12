import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { Resend } from 'resend'

// Safe initialization of Resend
const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await auth()
    
    if (!session?.user || session.user.type !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if Resend is configured
    if (!resend) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Email service not configured',
          message: 'RESEND_API_KEY is missing. Email service is unavailable.'
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { testEmail } = body

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Send test email
    const { data, error } = await resend.emails.send({
      from: 'OtoRetain Pro <support@otobrixai.com>',
      to: testEmail,
      subject: 'Test Email from OtoRetain Admin',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Service Test</h2>
          <p>Hello,</p>
          <p>This is a test email sent from your OtoRetain Pro administration dashboard.</p>
          <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #666;">Test details:</p>
            <ul style="margin: 8px 0; padding-left: 20px;">
              <li>Service: Resend</li>
              <li>Time: ${new Date().toLocaleString()}</li>
              <li>Status: ✅ Operational</li>
            </ul>
          </div>
          <p>If you received this email, your email service is configured correctly.</p>
          <br>
          <p>Best regards,<br>OtoRetain Pro Team</p>
        </div>
      `,
      text: `Test email from OtoRetain Pro admin dashboard. Time: ${new Date().toLocaleString()}. If you received this, email service is working.`,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to send email',
          details: error.message
        },
        { status: 500 }
      )
    }

    console.info(`Test email sent to: ${testEmail}, email ID: ${data?.id}`)

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: data?.id,
      service_used: 'Resend'
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}