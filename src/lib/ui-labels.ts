// src/lib/ui-labels.ts  ← new file
export function formatClientLabel(client: any) {
  return client.company_name || client.client_name || client.email.split('@')[0];
}