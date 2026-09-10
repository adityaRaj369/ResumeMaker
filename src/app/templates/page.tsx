import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { listPublishedTemplates } from "@/lib/templates";
import { MarketingHeader } from "@/components/marketing-header";
import { SignInButton } from "@/components/sign-in-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "LaTeX Resume Templates (Jake's, sb2nov, RenderCV)",
  description:
    "Browse real ATS-safe LaTeX resume templates — Jake's Resume, sb2nov, Engineering Resumes, ModernCV, and more.",
  alternates: { canonical: "/templates" },
};

export default async function TemplatesIndexPage() {
  const templates = await listPublishedTemplates();
  const googleConfigured = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader googleConfigured={googleConfigured} />
      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Template library</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight md:text-5xl">
          Real LaTeX resume templates
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Published sample designs. Use a template to fill your own details — no fake demo resume.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Link
              key={template.id}
              href={`/templates/${template.slug}`}
              className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={template.thumbnailUrl}
                alt={`${template.name} real resume sample`}
                className="aspect-[8.5/11] w-full bg-desk object-contain object-top"
              />
              <div className="p-4">
                <div className="font-display text-xl">{template.name}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {template.atsSafe && <Badge variant="accent">ATS-Safe</Badge>}
                  <Badge variant="outline">{template.category}</Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Suspense fallback={<Button size="lg">Continue to gallery</Button>}>
            <SignInButton size="lg" googleConfigured={googleConfigured} callbackUrl="/gallery">
              Sign in &amp; open gallery
            </SignInButton>
          </Suspense>
          <Button size="lg" variant="outline" asChild>
            <Link href="/ats-checker">Score an existing resume (paste text)</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
