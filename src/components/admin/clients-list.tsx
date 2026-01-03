//src/components/admin/clients-list.tsx
'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Building, Mail, Calendar, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

// This type now matches exactly what Prisma returns
export type Client = {
  client_id: string
  client_name: string
  company_name: string | null
  email: string
  status: string
  created_at: string | Date
  setup_status?: string | null
}

interface ClientsListProps {
  initialClients: Client[]
}

export default function ClientsList({ initialClients }: ClientsListProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)  

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch clients with search - using TanStack Query
  const { data: clientsData, isLoading } = useQuery({
    queryKey: ['clients', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) {
        return { clients: initialClients }
      }

      const response = await fetch(`/api/admin/clients?search=${encodeURIComponent(debouncedSearch)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }
      return response.json()
    },
    initialData: { clients: initialClients },
    staleTime: 30 * 1000, // 30 seconds
  })

  const clients = clientsData.clients

  // Optimistic delete function
  const deleteClient = async (clientId: string) => {
    setIsDeleting(true)
    const previousClients = queryClient.getQueryData(['clients', debouncedSearch])
    
    // Optimistic update
    queryClient.setQueryData(['clients', debouncedSearch], (old: { clients: Client[] }) => ({
      clients: old.clients.filter((client: Client) => client.client_id !== clientId)
    }))

    try {
      const response = await fetch(`/api/admin/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete client')
      }

      toast.success('Client deleted successfully')
      // Refresh the list
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    } catch (error) {
      // Revert on error
      queryClient.setQueryData(['clients', debouncedSearch], previousClients)
      toast.error('Failed to delete client')
    } finally {
      setIsDeleting(false)
    }
  }

  // Helper to get badge variant
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default'
      case 'inactive':
        return 'secondary'
      case 'suspended':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  if (clients.length === 0 && !debouncedSearch) {
    return (
      <div className="enterprise-dark-bg min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-8 p-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 text-enterprise-slate hover:text-white mb-4 transition-colors enterprise-card px-4 py-2 rounded-lg w-fit"
              >
                <ArrowLeft size={20} />
                Back to Dashboard
              </Link>
              <h1 className="text-2xl font-semibold text-white enterprise-metric">Client Management</h1>
              <p className="text-enterprise-slate mt-2">Manage all client accounts and settings</p>
            </div>
            <Button
              onClick={() => router.push('/admin/clients/new')}
              className="gap-3 bg-gradient-to-r from-enterprise-blue to-enterprise-purple text-white hover:from-enterprise-blue/90 hover:to-enterprise-purple/90"
            >
              <Plus size={20} />
              <span>Add New Client</span>
            </Button>
          </div>

          {/* Empty State */}
          <div className="text-center py-20">
            <Building className="mx-auto text-enterprise-slate mb-6" size={64} />
            <h3 className="text-2xl font-bold text-white mb-3">No clients yet</h3>
            <p className="text-enterprise-slate mb-8 max-w-md mx-auto">
              Get started by creating your first client account.
            </p>
            <Button
              onClick={() => router.push('/admin/clients/new')}
              size="lg"
              className="gap-3 bg-gradient-to-r from-enterprise-blue to-enterprise-purple text-white hover:from-enterprise-blue/90 hover:to-enterprise-purple/90"
            >
              <Plus size={24} />
              Add Your First Client
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="enterprise-dark-bg min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8 p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 text-enterprise-slate hover:text-white mb-4 transition-colors enterprise-card px-4 py-2 rounded-lg w-fit"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-semibold text-white enterprise-metric">Client Management</h1>
            <p className="text-enterprise-slate mt-2">Manage all client accounts and settings</p>
          </div>
          <Button
            onClick={() => router.push('/admin/clients/new')}
            className="gap-3 bg-gradient-to-r from-enterprise-blue to-enterprise-purple text-white hover:from-enterprise-blue/90 hover:to-enterprise-purple/90"
          >
            <Plus size={20} />
            <span>Add New Client</span>
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-enterprise-slate" size={20} />
          <Input
            type="text"
            placeholder="Search clients by name, company, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full enterprise-card border-enterprise-slate bg-enterprise-panel/50 text-white placeholder:text-enterprise-slate"
            aria-label="Search clients"
          />
        </div>

        {/* Loading State */}
        {isLoading && debouncedSearch && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="text-enterprise-slate mt-2">Searching clients...</p>
          </div>
        )}

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {clients.map((client: Client) => (
            <Card
              key={client.client_id}
              className="enterprise-card hover:shadow-enterprise-lg transition-all duration-200 group relative"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-enterprise-blue to-enterprise-purple rounded-xl flex items-center justify-center shadow-md">
                    <Building className="text-white" size={24} />
                  </div>
                  <Badge
                    className={client.status === 'active' ? 'financial-badge-positive' : 
                              client.status === 'inactive' ? 'financial-badge-neutral' : 
                              'financial-badge-risk'}
                  >
                    {client.status}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-white mb-1 truncate">
                  {client.client_name}
                </h3>
                <p className="text-sm text-enterprise-slate mb-4 truncate">
                  {client.company_name || '—'}
                </p>

                <div className="space-y-2 text-sm text-enterprise-slate">
                  <div className="flex items-center gap-2">
                    <Mail size={14} />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>
                      {new Date(client.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-enterprise-slate/20 flex items-center justify-between">
                  <span className="text-xs text-enterprise-slate font-mono">
                    {client.client_id.substring(0, 8)}...
                  </span>
                  <div className="flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-enterprise-red hover:text-enterprise-red/80 hover:bg-enterprise-red/10 text-xs border-enterprise-red"
                        >
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the client
                            <span className="font-semibold text-white"> {client.client_name}</span>
                            {client.company_name && ` from ${client.company_name}`}.
                            <br /><br />
                            <span className="text-enterprise-red font-medium">
                              All associated data will be removed.
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteClient(client.client_id)}
                            className="bg-enterprise-red hover:bg-enterprise-red/90 text-white"
                          >
                            Delete Client
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/admin/clients/${client.client_id}`)}
                      className="text-enterprise-slate hover:text-white text-xs"
                    >
                      Manage →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results State */}
        {clients.length === 0 && debouncedSearch && (
          <div className="text-center py-12">
            <Building className="mx-auto text-enterprise-slate mb-4" size={48} />
            <h3 className="text-lg font-semibold text-white mb-2">No clients found</h3>
            <p className="text-enterprise-slate">
              No clients match your search for "{debouncedSearch}".
            </p>
          </div>
        )}
      </div>
    </div>
  )
}