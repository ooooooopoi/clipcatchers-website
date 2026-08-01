import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  role: string;
  company: string | null;
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
