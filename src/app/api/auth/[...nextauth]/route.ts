// src/app/api/auth/[...nextauth]/route.ts   ← FINAL, WORKING, NO ERRORS
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'