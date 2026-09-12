import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Pages only. API routes guard themselves via getSessionUser() so they can
  // answer with a JSON 401 instead of redirecting a fetch to an HTML page.
  //
  // The extension list is a static-asset escape hatch and has to name every
  // type actually served out of public/. mp4 and webm were missing, so the
  // homepage clip videos were answered with a 307 to /login. That would not
  // have been reported as a bug: each <video> falls back to its poster, and a
  // poster is exactly what the belt looked like before it had any video.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm)$).*)",
  ],
};
