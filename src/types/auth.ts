// src/types/auth.ts
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      type: 'admin' | 'client'
      role: string
      clientId?: string
      clientName?: string
      branding?: {
        primary_color: string
        logo_url: string
        company_name: string
      }
    } & DefaultSession["user"]
  }
  
  interface User {
    type: 'admin' | 'client'
    role: string
    clientId?: string
    clientName?: string
    branding?: unknown
    requiresPasswordChange?: boolean
  }
}

