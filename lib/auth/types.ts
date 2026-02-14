// Type definitions for NextAuth v5 - module augmentation
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role?: string;
  }
}

// JWT callback types: use token.id and token.role in auth config (session callback)
