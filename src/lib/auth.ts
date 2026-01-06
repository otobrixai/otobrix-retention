// src/auth.ts - Updated with Security Fixes
import NextAuth from "next-auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

// Email validation schema to prevent spoofing
const emailSchema = z.string()
  .email("Please provide a valid email address")
  .max(150, "Email must be less than 150 characters")
  .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email format")
  .transform((email) => email.toLowerCase().trim())

export const { handlers, auth, signIn, signOut } = NextAuth({
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours (reduced from 30 days for security)
    updateAge: 4 * 60 * 60, // Update session every 4 hours
  },

  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24 hours
        domain: process.env.NODE_ENV === 'production' ? '.otobrixai.com' : undefined,
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  
  providers: [
    Credentials({
      id: 'admin',
      name: 'Admin Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Validate email format
          const validatedEmail = emailSchema.safeParse(credentials.email);
          if (!validatedEmail.success) {
            console.warn('Invalid email format attempt:', credentials.email);
            return null;
          }

          const adminUser = await prisma.admin_users.findUnique({
            where: { 
              email: validatedEmail.data
            }
          });

          if (!adminUser || !adminUser.is_active) {
            // Use consistent timing to prevent timing attacks
            await bcrypt.compare(credentials.password as string, '$2a$10$fakehashforconsistenttiming');
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password as string, adminUser.password_hash);
          
          if (!isValid) {
            return null;
          }

          return {
            id: adminUser.id,
            email: adminUser.email,
            name: 'Admin User',
            type: 'admin',
            role: adminUser.role,
          };
        } catch (error) {
          console.error('Admin auth error:', error);
          return null;
        }
      }
    }),
    
    Credentials({
      id: 'client',
      name: 'Client Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Validate email format
          const validatedEmail = emailSchema.safeParse(credentials.email);
          if (!validatedEmail.success) {
            console.warn('Invalid email format attempt:', credentials.email);
            return null;
          }

          const clientUser = await prisma.client_users.findFirst({
            where: {
              email: validatedEmail.data,
              is_active: true
            },
            include: {
              clients: true
            }
          });

          if (!clientUser || !clientUser.clients || clientUser.clients.status !== 'active') {
            // Use consistent timing
            await bcrypt.compare(credentials.password as string, '$2a$10$fakehashforconsistenttiming');
            return null;
          }

          const isValidPassword = await bcrypt.compare(credentials.password as string, clientUser.password_hash);
          
          if (!isValidPassword) {
            return null;
          }

          return {
            id: clientUser.clients.client_id,
            email: clientUser.email,
            name: clientUser.clients.client_name,
            type: 'client',
            role: clientUser.role,
            clientId: clientUser.clients.client_id,
            requiresPasswordChange: clientUser.requires_password_change
          };
        } catch (error) {
          console.error('Client auth error:', error);
          return null;
        }
      }
    })
  ],
  
  callbacks: {
    async signIn({ user }) {
      // Additional sign-in validation for client users
      if (user.type === 'client') {
        const client = await prisma.clients.findUnique({
          where: { client_id: user.clientId as string },
          select: { status: true }
        });
        
        if (!client || client.status !== 'active') {
          return false;
        }
      }
      return true;
    },
    
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.type = user.type;
        token.role = user.role;
        // Minimal token payload
        if (user.clientId) token.clientId = user.clientId;
        if (user.requiresPasswordChange) token.requiresPasswordChange = user.requiresPasswordChange;
      }

      // Handle session update
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          type: token.type as 'admin' | 'client',
          role: token.role as string,
          clientId: token.clientId as string | undefined,
          requiresPasswordChange: token.requiresPasswordChange as boolean | undefined,
        }
      }
    }
  },
  
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/auth/error',
  },
  
  // Security events - simplified to avoid type issues
  events: {
    async signIn({ user }) {
      console.warn('User signed in:', user.email);
    },
    async signOut() {
      // Simplified - just log the sign out event without user details
      console.warn('User signed out');
    },
  },
})