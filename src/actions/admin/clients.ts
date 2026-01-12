// Update: src/actions/admin/clients.ts - USE ENHANCED AUTH
'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/server-auth' // Use enhanced auth
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { serverOnly } from '@/lib/server-only' // Add server-only directive

export async function createClientAction(formData: FormData) {
  // Mark as server-only
  serverOnly()
  
  // Use enhanced auth with expiration check
  await requireAdmin() // This will redirect if not admin or session expired
  
  // Rest of your validation logic...
  const clientName = formData.get('client_name') as string
  const email = formData.get('email') as string
  const companyName = formData.get('company_name') as string
  const status = formData.get('status') as string || 'active'

  if (!clientName?.trim()) {
    redirect('/admin/clients/new?error=client_name_required')
  }
  
  if (!email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    redirect('/admin/clients/new?error=invalid_email')
  }

  // Check for duplicate email
  const existingClient = await prisma.clients.findUnique({
    where: { email: email.toLowerCase().trim() }
  })

  if (existingClient) {
    redirect('/admin/clients/new?error=email_already_exists')
  }

  // Use transaction to ensure both records are created together
  await prisma.$transaction(async (tx) => {
    // Generate client ID
    const clientId = `otobrix_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`

    // Create client
    await tx.clients.create({
      data: {
        client_id: clientId,
        company_name: companyName,
        client_name: clientName.trim(),
        email: email.toLowerCase().trim(),
        status: status as 'active' | 'inactive' | 'suspended',
        setup_status: 'pending',
      },
    })

    // Also create a client_user record for login access
    await tx.client_users.create({
      data: {
        client_id: clientId,
        email: email.toLowerCase().trim(),
        password_hash: '', // Empty initially - will be set via password reset
        role: 'client',
        is_active: true,
        requires_password_change: true,
      },
    })
  })

  // Invalidate cache
  revalidatePath('/admin/clients')
  revalidatePath('/admin/dashboard')
  
  // Redirect with success
  const successMessage = encodeURIComponent(`Client "${clientName}" created successfully!`)
  redirect(`/admin/clients/new?success=${successMessage}`)
}