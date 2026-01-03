// src/app/api/admin/clients/[id]/route.ts - FIXED
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    const client = await prisma.clients.findUnique({
      where: { client_id: id },
      select: {
        client_id: true,
        client_name: true,
        company_name: true,
        email: true,
        status: true,
        api_key: true,
        n8n_base_url: true,
        agency_id: true,
        created_at: true,
        updated_at: true
      }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('GET client error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    
    const { client_name, company_name, email, status, n8n_base_url } = body

    // Check if client exists
    const existingClient = await prisma.clients.findUnique({
      where: { client_id: id }
    })

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingClient.email) {
      const emailExists = await prisma.clients.findUnique({
        where: { email: email.toLowerCase() }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'A client with this email already exists' },
          { status: 409 }
        )
      }

      // Also update the client_users email if it exists
      await prisma.client_users.updateMany({
        where: { 
          client_id: id,
          email: existingClient.email
        },
        data: {
          email: email.toLowerCase()
        }
      })
    }

    // Update client
    const updatedClient = await prisma.clients.update({
      where: { client_id: id },
      data: {
        client_name: client_name?.trim(),
        company_name: company_name?.trim() || null,
        email: email?.toLowerCase().trim(),
        status,
        n8n_base_url: n8n_base_url?.trim() || null,
        updated_at: new Date()
      },
      select: {
        client_id: true,
        client_name: true,
        company_name: true,
        email: true,
        status: true,
        api_key: true,
        n8n_base_url: true,
        created_at: true,
        updated_at: true
      }
    })

    return NextResponse.json(updatedClient)
  } catch (error) {
    console.error('PUT client error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.type !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Check if client exists
    const client = await prisma.clients.findUnique({
      where: { client_id: id }
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Delete the client
    await prisma.clients.delete({
      where: { client_id: id }
    })

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully'
    })
  } catch (error) {
    console.error('DELETE client error:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}