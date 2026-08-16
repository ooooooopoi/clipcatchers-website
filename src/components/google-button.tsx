"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

/**
 * Continue with Google.
 *
 * Rendered only when the server says the provider is configured — a button
 * that bounces off a misconfigured provider is worse than no button, because
 * the user has already committed to it by the time it fails.
 */
export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <div className="mt-6">
      <div className="relative mb-4 text-center">
        <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        <span className="relative bg-card px-3 text-xs text-muted-foreground">or</span>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        loading={loading}
        onClick={() => {
          setLoading(true);
          signIn("google", { callbackUrl: "/dashboard" });
        }}
      >
        {!loading && (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.5 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1z"
            />
            <path
              fill="#EA4335"
              d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"
            />
          </svg>
        )}
        {label}
      </Button>
    </div>
  );
}
