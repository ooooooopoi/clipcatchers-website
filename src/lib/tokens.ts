import { randomBytes } from "crypto";
import type { TokenType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const TOKEN_TTL_MS: Record<TokenType, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,
  PASSWORD_RESET: 60 * 60 * 1000,
};

export async function createToken(userId: string, type: TokenType) {
  // Only one live token per purpose, so older links stop working.
  await prisma.verificationToken.deleteMany({ where: { userId, type, usedAt: null } });
  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      token,
      type,
      userId,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS[type]),
    },
  });
  return token;
}

export async function consumeToken(token: string, type: TokenType) {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!record || record.type !== type) return null;
  if (record.usedAt) return null;
  if (record.expiresAt < new Date()) return null;

  await prisma.verificationToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
  return record;
}

export function appUrl(path = "") {
  // `||` not `??`: an env var set to an empty string is as good as unset here.
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000";
  // Tolerate a host pasted without a scheme, which would otherwise produce
  // links that browsers treat as relative paths.
  const base = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return `${base.replace(/\/+$/, "")}${path}`;
}
