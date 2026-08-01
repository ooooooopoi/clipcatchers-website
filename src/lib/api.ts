import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function unauthorized(message = "You must be signed in.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "You don't have access to this.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function notFound(message = "Not found.") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Something went wrong.") {
  return NextResponse.json({ error: message }, { status: 500 });
}

/** Turns thrown errors into a sane JSON response — never leaks stack traces. */
export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return badRequest(error.issues[0]?.message ?? "Invalid input.", error.flatten());
  }
  console.error("[api]", error);
  return serverError();
}
