"use client";

import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, FileText, Gauge, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const TEMPLATES = [
  { src: "/templates/jakes-real.png", name: "Jake's" },
  { src: "/templates/sb2nov-real.png", name: "sb2nov" },
  { src: "/templates/deedy-real.png", name: "Deedy" },
  { src: "/templates/engineeringresumes-real.png", name: "Engineering" },
  { src: "/templates/moderncv-real.png", name: "ModernCV" },
  { src: "/templates/harvard-real.png", name: "Harvard" },
];

function safeCallback(url: string | null, fallback = "/gallery") {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return fallback;
  return url;
}

export function LandingHero({ googleConfigured }: { googleConfigured: boolean }) {
  const search = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const from = safeCallback(search.get("from"));
  const needsContinue = Boolean(search.get("from"));

  useEffect(() => {
    if (status === "authenticated" && search.get("from")) {
      router.replace(from);
    }
  }, [status, search, from, router]);

  const start = () => signIn(googleConfigured ? "google" : "demo", { callbackUrl: from });

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[720px]"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 70% 10%, rgba(5,150,105,0.12), transparent 55%), radial-gradient(ellipse 50% 40% at 15% 20%, rgba(0,0,0,0.03), transparent 50%)",
        }}
      />
      <div className="surface-grid pointer-events-none absolute inset-x-0 top-0 h-[720px] opacity-50" />

      <header className="relative z-20">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-display text-base tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            ResumeForge
          </Link>
          <nav className="flex items-center gap-1 text-sm text-muted-foreground sm:gap-2">
            <Link
              href="/templates"
              className="hidden rounded-full px-3 py-1.5 transition hover:bg-muted hover:text-foreground sm:inline"
            >
              Templates
            </Link>
            <Link
              href="/ats-checker"
              className="rounded-full px-3 py-1.5 transition hover:bg-muted hover:text-foreground"
            >
              ATS Checker
            </Link>
            <ThemeToggle />
            {session?.user ? (
              <Button size="sm" className="ml-1" asChild>
                <Link href="/gallery">Open gallery</Link>
              </Button>
            ) : (
              <Button size="sm" className="ml-1" onClick={start}>
                Sign in
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="relative z-10">
        {needsContinue && !session?.user && (
          <div className="mx-auto w-full max-w-6xl px-6 pt-4 sm:px-8">
            <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
              Sign in to continue to <span className="font-medium text-foreground">{from}</span>
              <Button size="sm" className="ml-3" onClick={start}>
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-16 pt-12 sm:px-8 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:pb-20 lg:pt-16">
          <div className="max-w-xl">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-accent"
            >
              LaTeX resume builder for engineers
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 }}
              className="mt-3 font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl"
            >
              ResumeForge
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="mt-4 text-lg leading-relaxed text-muted-foreground"
            >
              Write once, tailor per job, export a PDF that applicant tracking systems can actually parse — without
              inventing experience.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              {session?.user ? (
                <Button size="lg" asChild>
                  <Link href="/gallery">
                    Open template gallery <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" onClick={start}>
                  {needsContinue ? "Sign in to continue" : "Create my resume"}{" "}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              <Button size="lg" variant="outline" asChild>
                <Link href="/templates">Browse templates</Link>
              </Button>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-sm text-muted-foreground"
            >
              Free ATS score for any pasted resume text · Jake&apos;s, sb2nov &amp; more · PDF + .tex export
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="relative mx-auto w-full max-w-[380px] lg:max-w-none"
          >
            {/* Subtle back peeks */}
            <div
              aria-hidden
              className="absolute left-[8%] top-6 hidden h-[88%] w-[78%] rotate-[-4deg] rounded-sm bg-card opacity-40 shadow-lg lg:block"
            />
            <div
              aria-hidden
              className="absolute right-[4%] top-4 hidden h-[90%] w-[78%] rotate-[5deg] rounded-sm bg-card opacity-50 shadow-lg lg:block"
            />
            <div className="paper-shadow relative z-10 overflow-hidden rounded-sm border border-border/60 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/templates/jakes-real.png"
                alt="Example resume built with ResumeForge"
                className="aspect-[8.5/11] w-full object-cover object-top"
              />
            </div>
          </motion.div>
        </section>

        {/* Template strip — Resume.io style proof */}
        <section className="border-y border-border bg-card/50 py-12">
          <div className="mx-auto w-full max-w-6xl px-6 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Templates</p>
                <h2 className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">
                  Pick a layout recruiters already recognize
                </h2>
              </div>
              <Button variant="outline" asChild>
                <Link href="/templates">
                  Browse all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TEMPLATES.map((t, i) => (
                <Link
                  key={t.src}
                  href="/templates"
                  className="group w-[140px] shrink-0 sm:w-[160px]"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="paper-shadow overflow-hidden rounded-sm border border-border bg-desk transition duration-300 group-hover:-translate-y-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={t.src}
                      alt={t.name}
                      className="aspect-[8.5/11] w-full object-cover object-top"
                    />
                  </div>
                  <p className="mt-2 text-center text-xs text-muted-foreground group-hover:text-foreground">
                    {t.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* How it works — light row, not card grid clutter */}
        <section id="how" className="py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-6 sm:px-8">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">How it works</p>
            <h2 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">From blank page to tailored PDF</h2>
            <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
              {[
                {
                  n: "1",
                  title: "Fill your profile",
                  body: "Contact, skills, roles, education, and projects live in one place and reuse across every version.",
                },
                {
                  n: "2",
                  title: "Edit or match a job",
                  body: "Change fields with a live preview, or paste a JD — we only rewrite what you already have.",
                },
                {
                  n: "3",
                  title: "Download and apply",
                  body: "Export PDF or .tex. Use the free ATS checker to see keyword gaps before you submit.",
                },
              ].map((step) => (
                <div key={step.n} className="relative">
                  <div className="font-display text-4xl text-accent/30">{step.n}</div>
                  <h3 className="mt-2 font-display text-xl tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits — icon rows, Kickresume clarity */}
        <section className="border-t border-border bg-muted/25 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-6xl px-6 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Why ResumeForge</p>
              <h2 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
                Built for people who care what the ATS extracts
              </h2>
            </div>
            <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
              {[
                {
                  icon: FileText,
                  title: "Real LaTeX, real PDF",
                  body: "Single-column templates that compile to text recruiters and parsers can read — not a decorative image.",
                },
                {
                  icon: PenLine,
                  title: "Live editor",
                  body: "Add experience, education, projects, and certifications. Preview updates as you type; compile when ready.",
                },
                {
                  icon: Sparkles,
                  title: "Honest job matching",
                  body: "AI reorders and rephrases your real bullets for a JD. It will not invent companies, dates, or metrics.",
                },
                {
                  icon: Gauge,
                  title: "Clear ATS score",
                  body: "See matched keywords, missing must-haves, section coverage, and formatting risks — with fixes you can apply.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border bg-background">
                    <item.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg tracking-tight">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ATS band */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-8 px-6 sm:px-8 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Free · no account</p>
              <h2 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
                Check your resume against any job description
              </h2>
              <p className="mt-3 text-muted-foreground">
                Paste the posting and your resume text. Get keyword coverage, must-have gaps, and formatting warnings
                before you hit apply.
              </p>
            </div>
            <Button size="lg" asChild>
              <Link href="/ats-checker">
                Open ATS checker <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-border bg-card py-16">
          <div className="mx-auto max-w-2xl px-6 text-center sm:px-8">
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">Start with a template</h2>
            <p className="mt-3 text-muted-foreground">
              Sign in, choose a layout, and fill in your experience. Export when it looks right.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" onClick={start}>
                Create my resume <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/templates">Browse templates</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:px-8">
          <span className="font-display text-foreground">ResumeForge</span>
          <div className="flex gap-5">
            <Link href="/templates" className="hover:text-foreground">
              Templates
            </Link>
            <Link href="/ats-checker" className="hover:text-foreground">
              ATS Checker
            </Link>
          </div>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
