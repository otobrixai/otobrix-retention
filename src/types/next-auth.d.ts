// src/types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      email: string;
      role: string;
      type: string;
      name: string;
      clientId?: string;
      clientName?: string;
      requiresPasswordChange?: boolean;
    };
  }

  interface User {
    email: string;
    role: string;
    type: string;
    name: string;
    clientId?: string;
    clientName?: string;
    requiresPasswordChange?: boolean;
  }
}
