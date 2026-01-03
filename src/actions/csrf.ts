// src/actions/csrf.ts
'use server'

import { generateCSRFToken } from '@/lib/csrf'

export async function initCSRFToken(): Promise<string> {
  return await generateCSRFToken()
}