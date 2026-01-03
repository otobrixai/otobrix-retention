// src/app/api/auth/[...nextauth]/route.ts   ← FINAL, WORKING, NO ERRORS
import { handlers } from '@/auth'

export const { GET, POST } = handlers

// Optional: make it fast + explicit
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'