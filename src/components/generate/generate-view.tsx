"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveResumePreview } from "@/components/editor/live-resume-preview";
import { GENERATION_STEPS, type AtsBreakdown, type GenerationStep, type PipelineWarning } from "@/lib/types";
import { cn } from "@/lib/utils";

type StepState = Record<GenerationStep, "idle" | "running" | "done">;

export function GenerateView({ resumeId, jobId }: { resumeId: string; jobId: string }) {
  const router = useRouter();
  const [steps, setSteps] = useState<StepState>({
    analyze: "idle",
    match: "idle",
    rewrite: "idle",
    validate: "idle",
    compile: "idle",
    score: "idle",
  });
  const [keywords, setKeywords] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<PipelineWarning[]>([]);
  const [score, setScore] = useState<AtsBreakdown | null>(null);
  const [done, setDone] = useState(false);
  const { data: resume } = useQuery({
    queryKey: ["resume", resumeId],
    queryFn: async () => (await fetch(`/api/resumes/${resumeId}`)).json(),
    enabled: done,
  });

  useEffect(() => {
    const source = new EventSource(`/api/generate/stream?jobId=${jobId}`);
    source.onmessage = (message) => {
      const event = JSON.parse(message.data);
      if (event.type === "step") {
        setSteps((prev) => ({ ...prev, [event.step]: event.status }));
      }
      if (event.type === "keywords") setKeywords(event.keywords);
      if (event.type === "warnings") setWarnings(event.warnings);
      if (event.type === "score") setScore(event.breakdown);
      if (event.type === "done") {
        setDone(true);
        source.close();
      }
    };
    return () => source.close();
  }, [jobId]);

  const ring = useMemo(() => score?.score ?? 0, [score]);

  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-hidden px-6 py-8 sm:px-8">
      <ThinkingOrb active={!done} />
      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Generation pipeline</p>
        <h1 className="mt-2 font-display text-4xl">Tailoring without inventing.</h1>
        <div className="mt-8 grid gap-3">
          {GENERATION_STEPS.map((step) => {
            const status = steps[step.id];
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center justify-between rounded-2xl border border-border bg-card/80 px-4 py-3",
                  status === "running" && "border-accent/40",
                )}
              >
                <span>{step.label}</span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {status === "done" ? "done" : status === "running" ? "running" : "queued"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <motion.div key={keyword} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <Badge variant="accent">{keyword}</Badge>
            </motion.div>
          ))}
        </div>
        {warnings.length > 0 && (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
            {warnings.slice(0, 6).map((warning) => (
              <div key={warning.message}>{warning.message}</div>
            ))}
          </div>
        )}
        {done && score && (
          <div className="mt-10 grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
            <div className="grid place-items-center rounded-3xl border border-border bg-card p-8">
              <div
                className="grid h-40 w-40 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(var(--accent) ${ring * 3.6}deg, var(--border) 0deg)`,
                }}
              >
                <div className="grid h-28 w-28 place-items-center rounded-full bg-card font-display text-3xl">
                  {ring}
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">ATS match score</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Keywords {score.keywordCoverage}% · Must-have {score.mustHaveCoverage}% · Sections {score.sectionScore}%
              </p>
            </div>
            <div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-sm text-muted-foreground">Original profile facts</div>
                    <div className="paper-shadow max-h-[420px] overflow-auto rounded-md bg-paper">
                      {resume?.sourceContentJson ? <LiveResumePreview content={resume.sourceContentJson} /> : <p className="p-4 text-sm text-muted-foreground">Original profile snapshot unavailable.</p>}
                    </div>
                </div>
                <div>
                  <div className="mb-2 text-sm text-muted-foreground">Tailored resume</div>
                  <div className="paper-shadow overflow-hidden rounded-md bg-paper">
                    <iframe className="h-[420px] w-full" src={`/api/resumes/${resumeId}/pdf`} title="Tailored resume" />
                  </div>
                </div>
              </div>
              {resume?.matchedKeywords && (
                <DiffList matched={resume.matchedKeywords} content={resume.contentJson} />
              )}
              <Button className="mt-6" onClick={() => router.push(`/editor/${resumeId}`)}>
                Looks good, continue to edit
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DiffList({
  matched,
  content,
}: {
  matched: { matched?: string[]; missing?: string[] };
  content: { experience?: { bullets: string[] }[] };
}) {
  return (
    <div className="mt-5 rounded-2xl border border-border p-4 text-sm">
      <div className="mb-2 text-muted-foreground">Changed emphasis (from your real bullets)</div>
      <ul className="space-y-2">
        {(content?.experience ?? [])
          .flatMap((job) => job.bullets)
          .slice(0, 6)
          .map((bullet) => (
            <li key={bullet} className="rounded-lg bg-accent/10 px-3 py-2">
              {bullet}
            </li>
          ))}
      </ul>
      {!!matched?.missing?.length && (
        <p className="mt-3 text-amber-700 dark:text-amber-300">Still missing from profile: {matched.missing.slice(0, 8).join(", ")}</p>
      )}
    </div>
  );
}

function ThinkingOrb({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-60">
      <div className="relative h-72 w-72">
        <div className="absolute inset-0 animate-[orb_8s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(5,150,105,0.35),transparent_60%)]" />
        <div className="absolute inset-8 animate-[orb_11s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle_at_70%_40%,rgba(16,185,129,0.22),transparent_60%)]" />
      </div>
    </div>
  );
}
