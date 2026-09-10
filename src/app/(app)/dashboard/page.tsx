"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["resumes"],
    queryFn: async () => (await fetch("/api/resumes")).json(),
  });
  const resumes = Array.isArray(data) ? data : [];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Library</p>
          <h1 className="mt-2 font-display text-4xl">Saved resumes</h1>
        </div>
        <Button asChild>
          <Link href="/gallery">New from template</Link>
        </Button>
      </div>
      <div className="mt-8 grid gap-4">
        {resumes.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">
            Nothing yet. Pick a template and either edit or match to a job.
          </div>
        )}
        {resumes.map(
          (resume: {
            id: string;
            title: string;
            mode: string;
            atsScore?: number | null;
            updatedAt: string;
            template?: { name: string; thumbnailUrl: string } | null;
          }) => (
          <Link
            key={resume.id}
            href={`/editor/${resume.id}`}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-accent/40"
          >
            <div className="flex min-w-0 items-center gap-4">
              {resume.template?.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resume.template.thumbnailUrl}
                  alt={resume.template.name}
                  className="h-16 w-12 shrink-0 rounded-sm border border-border object-cover object-top"
                />
              ) : null}
              <div className="min-w-0">
                <div className="truncate font-medium">{resume.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {resume.template?.name ? `${resume.template.name} · ` : ""}
                  {new Date(resume.updatedAt).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="outline">{resume.mode}</Badge>
              {typeof resume.atsScore === "number" && <Badge variant="accent">{resume.atsScore} ATS</Badge>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
