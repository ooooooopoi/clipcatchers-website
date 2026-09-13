import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      company: string | null;
      /**
       * Discord snowflake, set only for someone who signed in with Discord.
       *
       * The bot's key for everything a clipper owns — clips, wallet, payouts —
       * so /me needs nothing else to find them. Null for clients.
       */
      discordId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    company?: string | null;
    discordId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    company: string | null;
    discordId: string | null;
  }
}

export {};
