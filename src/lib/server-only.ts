// Create: src/lib/server-only.ts
// This helps TypeScript enforce server-side only usage

export const serverOnly = () => {
  if (typeof window !== 'undefined') {
    throw new Error('This code can only run on the server')
  }
}

// Helper for environment variables
export function requireServerEnv(key: string): string {
  serverOnly()
  
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}