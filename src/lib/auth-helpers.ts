import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { isTeamMember } from "@/lib/bot";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: string;
  company: string | null;
  /**
   * Set only for someone who signed in with Discord — a clipper.
   *
   * Carried so anything offering a "Dashboard" can tell the two apart. The
   * client dashboard scopes every query to campaigns the account owns, and a
   * clipper owns none — so sending them there produces a working page full of
   * zeros, which reads as broken rather than as the wrong door.
   */
  discordId: string | null;
};

/** Session user for API routes — null instead of redirecting. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? "",
    image: session.user.image ?? null,
    role: session.user.role ?? "CLIENT",
    company: session.user.company ?? null,
    discordId: session.user.discordId ?? null,
  };
}

/** Session user for pages — bounces to /login when signed out. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Role gate for admin-only surfaces. */
export async function requireRole(role: "ADMIN" | "CLIENT"): Promise<SessionUser> {
  const user = await requireUser();
  if (role === "ADMIN" && user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

/** Full DB record for the signed-in user, including settings. */
export async function getCurrentUser() {
  const session = await getSessionUser();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.id },
    include: { settings: true },
  });
}

/**
 * The campaigns an account sees in the client dashboard: its own, or, for
 * the team (the bot's admins, signed in with Discord), every campaign that is
 * shared with a client, so the team sees what the clients see.
 * Read-only either way: editing still checks ownership.
 */
export async function campaignScope(user: SessionUser): Promise<Prisma.CampaignWhereInput> {
  // Only campaigns shared with a client (/campaign-client): the rest belong to
  // the placeholder account the ingest parks them on and no client sees them.
  // The owner wanted the client's view, not every campaign (2026-10-05).
  if (user.discordId && (await isTeamMember(user.discordId))) {
    return { externalId: { not: null }, user: { email: { not: "shared-reports@clipcatchers.local" } } };
  }
  return { userId: user.id };
}
