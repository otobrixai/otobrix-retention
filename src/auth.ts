// src/auth.ts
import NextAuth from "next-auth";
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({

  debug: false,

  trustHost: true,
  basePath: "/api/auth",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
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
          const adminUser = await prisma.admin_users.findUnique({
            where: { 
              email: (credentials.email as string).toLowerCase()
            }
          });

          if (!adminUser || !adminUser.is_active) {
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
    
    // Client credentials provider
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
          const clientUser = await prisma.client_users.findFirst({
            where: {
              email: (credentials.email as string).toLowerCase(),
              is_active: true
            },
            include: {
              clients: true
            }
          });

          if (!clientUser || !clientUser.clients || clientUser.clients.status !== 'active') {
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.type = user.type;
        token.role = user.role;
        // SECURITY: Minimal token payload - removed sensitive fields
        // Update any server code that expected token.clientName to use session data instead
        if (user.clientId) token.clientId = user.clientId;
        if (user.requiresPasswordChange) token.requiresPasswordChange = user.requiresPasswordChange;
      }

      // Handle session update if needed
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      return token;
    },
    async session({ session, token }) {
      // Safely extend the session user
      return {
        ...session,
        user: {
          ...session.user,
          type: token.type as 'admin' | 'client',
          role: token.role as string,
          clientId: token.clientId as string | undefined, // Still available but not in JWT
          requiresPasswordChange: token.requiresPasswordChange as boolean | undefined,
        }
      }
    }
  },
  pages: {
    signIn: '/',
    signOut: '/'
  }
})