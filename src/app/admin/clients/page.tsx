// src/app/admin/clients/page.tsx - ENTERPRISE DARK
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import ClientsList from '@/components/admin/clients-list'
import { prisma } from '@/lib/prisma'

export const revalidate = 0 // ← This forces fresh data on every visit

export default async function ClientsPage() {
  const session = await auth()
  
  if (!session || session.user.type !== 'admin') {
    redirect(`/${process.env.ADMIN_LOGIN_PATH_SEGMENT}`)
  }

  const clients = await prisma.clients.findMany({
    select: {
      client_id: true,
      client_name: true,
      company_name: true,
      email: true,
      status: true,
      created_at: true,
      setup_status: true,
    },
    orderBy: { created_at: 'desc' },
  })

  return (
    <div className="enterprise-dark-bg min-h-screen">
      <ClientsList initialClients={clients} />
    </div>
  )
}