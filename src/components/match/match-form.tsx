"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export function MatchForm({ templateId }: { templateId: string }) {
  const router = useRouter();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => (await fetch("/api/profile")).json(),
  });
  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await fetch("/api/templates");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
  });
  const template = templates.find(
    (t: { id: string; slug: string; name?: string; thumbnailUrl?: string }) =>
      t.id === templateId || t.slug === templateId,
  ) as { id: string; slug: string; name: string; thumbnailUrl: string } | undefined;
  const [jd, setJd] = useState("");
  const [url, setUrl] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [extracting, setExtracting] = useState(false);

  const ready = Boolean(profile?.experience?.length || profile?.education?.length);

  const extract = async (text: string) => {
    setExtracting(true);
    try {
      const res = await fetch("/api/jd/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jd: text }),
      });
      const data = await res.json();
      const chips = Array.from(
        new Set([
          ...(data.mustHaveKeywords ?? []),
          ...(data.hardSkills ?? []),
          ...(data.tools ?? []),
        ]),
      );
      setKeywords(chips);
    } finally {
      setExtracting(false);
    }
  };

  const preview = useMemo(() => keywords, [keywords]);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10 sm:px-8">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">AI path</p>
      <h1 className="mt-2 font-display text-4xl">
        Build {template?.name ? `${template.name}` : "this template"} with your profile
      </h1>
      {template?.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={template.thumbnailUrl}
          alt={template.name}
          className="mt-6 h-44 w-32 rounded-md border border-border object-cover object-top"
        />
      ) : null}
      <p className="mt-3 text-muted-foreground">
        AI only uses facts from your career profile and the job description you paste. It does not open the gallery
        sample as if it were you.
      </p>

      {!ready && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
          Add your experience first — we collect it once, then never ask again.
          <Button className="ml-3" size="sm" onClick={() => router.push(`/profile?next=/match/${templateId}`)}>
            Complete profile
          </Button>
        </div>
      )}

      <div className="mt-8 grid gap-3">
        <div className="flex gap-2">
          <input
            className="h-11 flex-1 rounded-xl border border-border bg-background px-3 text-sm"
            placeholder="Import from URL (many boards block this — paste works better)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button
            variant="secondary"
            onClick={async () => {
              const res = await fetch("/api/jd/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
              });
              const data = await res.json();
              if (!res.ok) {
                toast.error(data.error || "Could not import. Paste the JD manually.");
                return;
              }
              setJd(data.text);
              extract(data.text);
            }}
          >
            Import
          </Button>
        </div>
        <Textarea
          className="min-h-64"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          onBlur={() => jd.trim() && extract(jd)}
        />
        <div className="text-sm text-muted-foreground">
          {extracting ? "Extracting keywords…" : preview.length ? "Confirm or remove keywords" : "Keywords appear after you paste a JD"}
        </div>
        <div className="flex flex-wrap gap-2">
          {preview.map((keyword) => (
            <button key={keyword} onClick={() => setKeywords((list) => list.filter((k) => k !== keyword))}>
              <Badge variant="accent">{keyword} ×</Badge>
            </button>
          ))}
        </div>
        <Button
          disabled={!ready || !jd.trim()}
          onClick={async () => {
            const res = await fetch("/api/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ templateId, jd, confirmedKeywords: keywords }),
            });
            const data = await res.json();
            if (!res.ok) {
              toast.error(data.error || "Could not start generation");
              return;
            }
            router.push(`/generate/${data.resumeId}?jobId=${data.jobId}`);
          }}
        >
          Generate ATS-matched resume
        </Button>
      </div>
    </div>
  );
}
