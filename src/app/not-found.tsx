import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">404</p>
        <h1 className="mt-2 font-display text-4xl">This page was never compiled.</h1>
        <Button asChild className="mt-6">
          <Link href="/gallery">Back to gallery</Link>
        </Button>
      </div>
    </div>
  );
}
