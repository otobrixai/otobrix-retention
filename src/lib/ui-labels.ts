// src/lib/ui-labels.ts
export function formatClientLabel(client: { company_name?: string | null; client_name?: string | null; email?: string }) {
  if (!client.email) return 'Unknown Client';
  return client.company_name || client.client_name || client.email.split('@')[0];
}