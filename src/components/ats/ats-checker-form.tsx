"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SAMPLE_RAZORPAY_JD } from "@/lib/sample-jd";

type Result = {
  score: number;
  breakdown: {
    keywordCoverage: number;
    mustHaveCoverage: number;
    sectionScore: number;
    formattingScore: number;
    quantificationScore?: number;
    matched: string[];
    missing: string[];
    formattingIssues: string[];
    recommendations?: string[];
  };
  analysis: {
    mustHaveKeywords: string[];
    hardSkills: string[];
    tools: string[];
    seniorityLevel: string;
    niceToHaveKeywords?: string[];
  };
  meta?: { analysisSource?: string; method?: string };
};

export function AtsCheckerForm() {
  const [jd, setJd] = useState(SAMPLE_RAZORPAY_JD);
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Free ATS match checker</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-foreground md:text-5xl">
          See how your resume aligns with a job description
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Works with <strong className="font-medium text-foreground">any resume you already have</strong> — Word, Google
          Docs, or PDF. You do not need a ResumeForge account or a resume built here. Open your PDF → Select all →
          Copy → paste below with the job description, then calculate.
        </p>

        <div className="mt-8 grid gap-4">
          <label className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Job description
            </span>
            <Textarea className="min-h-44" value={jd} onChange={(e) => setJd(e.target.value)} />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Resume plain text
            </span>
            <Textarea
              className="min-h-56"
              placeholder="Open your PDF → select all → copy → paste here. Contact info in headers/footers is often missed by ATS; include it in the body if needed."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </label>
          <Button
            size="lg"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch("/api/ats/check", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ jd, resumeText }),
                });
                const data = await res.json();
                if (!res.ok) {
                  toast.error(data.error || "Check failed");
                  return;
                }
                setResult(data);
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Analyzing…" : "Calculate match score"}
          </Button>
          <p className="text-xs text-muted-foreground">
            This is an alignment estimate for applicants — not a score from Workday, Taleo, or Greenhouse.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        {!result ? (
          <div className="flex h-full min-h-[360px] flex-col justify-center gap-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">How to use</p>
              <h2 className="mt-2 font-display text-xl text-foreground">Score in three steps</h2>
            </div>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-display text-lg text-accent">1</span>
                <span>Paste the full job description on the left (a sample JD is pre-filled — replace it).</span>
              </li>
              <li className="flex gap-3">
                <span className="font-display text-lg text-accent">2</span>
                <span>
                  Paste your resume as plain text (from any PDF/Word file). Building a resume on ResumeForge first is
                  optional.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-display text-lg text-accent">3</span>
                <span>
                  Click <strong className="text-foreground">Calculate match score</strong> — results (keywords, gaps,
                  formatting) show here.
                </span>
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Overall match</p>
                <div className="mt-1 font-display text-6xl tracking-tight text-foreground">{result.score}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Seniority signal: {result.analysis.seniorityLevel}
                  {result.meta?.analysisSource ? ` · JD parse: ${result.meta.analysisSource}` : ""}
                </p>
              </div>
              <div
                className="grid h-24 w-24 shrink-0 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(var(--accent) ${result.score * 3.6}deg, var(--border) 0deg)`,
                }}
              >
                <div className="grid h-16 w-16 place-items-center rounded-full bg-card text-sm font-medium">
                  /100
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Stat label="Keywords" value={`${result.breakdown.keywordCoverage}%`} />
              <Stat label="Must-have" value={`${result.breakdown.mustHaveCoverage}%`} />
              <Stat label="Sections" value={`${result.breakdown.sectionScore}%`} />
              <Stat label="Formatting" value={`${result.breakdown.formattingScore}%`} />
              {typeof result.breakdown.quantificationScore === "number" && (
                <Stat label="Quantified bullets" value={`${result.breakdown.quantificationScore}%`} />
              )}
            </div>

            {result.breakdown.recommendations && result.breakdown.recommendations.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">What to fix</p>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {result.breakdown.recommendations.map((tip) => (
                    <li key={tip} className="rounded-xl border border-border bg-muted/40 px-3 py-2">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.breakdown.formattingIssues.length > 0 && (
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Formatting risks</p>
                <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
                  {result.breakdown.formattingIssues.map((issue) => (
                    <li key={issue}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Matched</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.breakdown.matched.length === 0 && (
                  <span className="text-sm text-muted-foreground">None yet</span>
                )}
                {result.breakdown.matched.map((k) => (
                  <Badge key={k} variant="accent">
                    {k}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Missing from resume</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.breakdown.missing.slice(0, 20).map((k) => (
                  <Badge key={k} variant="outline">
                    {k}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/50 px-3 py-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
