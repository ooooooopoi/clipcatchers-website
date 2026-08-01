import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      company: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    company?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    company: string | null;
  }
}

export {};
