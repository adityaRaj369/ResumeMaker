"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function safeCallback(url: string | null | undefined, fallback = "/gallery") {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return fallback;
  return url;
}

export function SignInButton({
  callbackUrl,
  children = "Sign in",
  className,
  size = "default",
  variant = "default",
  googleConfigured = false,
}: {
  callbackUrl?: string;
  children?: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "outline" | "ghost" | "link";
  googleConfigured?: boolean;
}) {
  const search = useSearchParams();
  const target = safeCallback(callbackUrl ?? search.get("from"));

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn(className)}
      onClick={() => signIn(googleConfigured ? "google" : "demo", { callbackUrl: target })}
    >
      {children}
    </Button>
  );
}
