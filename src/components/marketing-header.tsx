"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignInButton } from "@/components/sign-in-button";
import { Button } from "@/components/ui/button";

export function MarketingHeader({ googleConfigured = false }: { googleConfigured?: boolean }) {
  const { data: session } = useSession();

  return (
    <header className="border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-[15px] tracking-tight text-foreground">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          ResumeForge
        </Link>
        <nav className="flex items-center gap-3 text-sm text-muted-foreground sm:gap-4">
          <Link href="/templates" className="transition hover:text-foreground">
            Templates
          </Link>
          <Link href="/ats-checker" className="transition hover:text-foreground">
            ATS Checker
          </Link>
          <ThemeToggle />
          {session?.user ? (
            <Button size="sm" asChild>
              <Link href="/gallery">Gallery</Link>
            </Button>
          ) : (
            <Suspense fallback={<Button size="sm">Sign in</Button>}>
              <SignInButton size="sm" googleConfigured={googleConfigured} callbackUrl="/gallery">
                Sign in
              </SignInButton>
            </Suspense>
          )}
        </nav>
      </div>
    </header>
  );
}
