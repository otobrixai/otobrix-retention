// src/app/page.tsx - UPDATED
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import ClientLoginForm from '@/components/ClientLoginForm'

export default async function Home() {
  console.log('DEBUG: Homepage executing at', new Date().toISOString())
  
  const session = await auth()
  console.log('DEBUG: Session result:', { 
    hasSession: !!session, 
    userType: (session?.user as any)?.type 
  })

  if (session?.user) {
    const user = session.user as {
      type?: 'admin' | 'client'
      clientId?: string
      requiresPasswordChange?: boolean
    }

    if (user.requiresPasswordChange) {
      return redirect('/set-password')
    }

    if (user.type === 'admin') {
      return redirect('/admin/dashboard')
    }

    if (user.type === 'client' && user.clientId) {
      return redirect(`/store/${user.clientId}`)
    }

    // Fallback for incomplete session data
    return redirect('/?error=invalid_role')
  }

  return <ClientLoginForm />
}