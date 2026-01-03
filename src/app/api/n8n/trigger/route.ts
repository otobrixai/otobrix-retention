// src/app/api/n8n/trigger/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

// Simulate n8n webhook response times
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Dedup guard: prevent duplicate triggers within 5 minutes
const recentTriggers = new Map<string, number>()

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.type !== 'client') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { client_id, segment, action } = await request.json()

    // Validate the request
    if (!client_id || !segment || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields',
        details: 'client_id, segment, and action are required'
      }, { status: 400 })
    }

    // Security check - ensure client can only access their own data
    if (session.user.clientId !== client_id) {
      return NextResponse.json({ 
        error: 'Forbidden',
        details: 'You can only trigger workflows for your own client'
      }, { status: 403 })
    }

    // Add dedup guard
    const now = Date.now()
    const storeId = `${client_id}_${action}_${segment}`
    const last = recentTriggers.get(storeId)

    if (last && now - last < 5 * 60 * 1000) {
      return NextResponse.json({ 
        skipped: true,
        message: 'Similar workflow was triggered recently. Please wait 5 minutes before retrying.'
      })
    }

    recentTriggers.set(storeId, now)

    // Simulate API call delay
    await simulateDelay(1000)

    // Validate action types
    const validActions = [
      'campaign_launch',
      'send_reengagement_email',
      'update_segments',
      'generate_report',
      'personalized_email',
      'sms_reminder',
      'call_campaign',
      'bulk_email_campaign',
      'reactivation_flow'
    ]
    
    if (!validActions.includes(action)) {
      return NextResponse.json({
        error: 'Invalid action',
        details: `Action must be one of: ${validActions.join(', ')}`
      }, { status: 400 })
    }

    // Log the trigger for monitoring
    console.info('N8N Workflow Triggered:', {
      client_id,
      segment,
      action,
      timestamp: new Date().toISOString(),
      user: session.user.email
    })

    // Simulate success response with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000) // 10 second timeout

    try {
      // Simulate fetch with timeout
      await simulateDelay(800) // Simulate network delay
      
      const simulatedResponse = {
        success: true,
        message: 'Workflow triggered successfully',
        workflowId: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        action,
        segment,
        timestamp: new Date().toISOString(),
        estimatedCompletion: '2-5 minutes',
        nextSteps: [
          'Workflow queued for processing',
          'You will receive a notification upon completion',
          'Check the n8n dashboard for detailed logs'
        ]
      }

      clearTimeout(timeoutId)
      return NextResponse.json(simulatedResponse)
      
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { 
            error: 'Workflow trigger timed out',
            message: 'The workflow trigger request took too long. Please try again later.',
            timestamp: new Date().toISOString()
          },
          { status: 504 }
        )
      }
      throw fetchError
    }

  } catch (error: unknown) {
    console.error('Error triggering N8N webhook:', error)
    return NextResponse.json(
      { 
        error: 'Failed to trigger workflow',
        details: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}