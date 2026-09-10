"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { toast } from "sonner";
import { TemplateResumePreview } from "@/components/editor/template-preview";
import { ResumeEditorForm } from "@/components/editor/resume-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ResumeContent } from "@/lib/types";
import { cn } from "@/lib/utils";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type ResumePayload = {
  id: string;
  title: string;
  latexSource: string;
  contentJson: ResumeContent;
  pdfUrl?: string | null;
  templateId?: string;
  template?: {
    id: string;
    slug: string;
    name: string;
    thumbnailUrl: string;
    category: string;
    latexSource?: string;
  } | null;
  versions?: { id: string; note?: string | null; createdAt: string }[];
  engine?: string;
};

type PreviewMode = "live" | "sample" | "pdf";

function isRealLatexEngine(engine?: string | null) {
  return engine === "tectonic" || engine === "latex-service" || engine === "pdflatex";
}

export function ResumeEditor({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const [view, setView] = useState<"form" | "code">("form");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("live");
  const [compiling, setCompiling] = useState(false);
  const [compileEngine, setCompileEngine] = useState<string | null>(null);
  const [previewTick, setPreviewTick] = useState(0);
  const [draftContent, setDraftContent] = useState<ResumeContent | null>(null);
  const [draftLatex, setDraftLatex] = useState<string | null>(null);
  const [lockedSlug, setLockedSlug] = useState<string | null>(null);
  const [lockedName, setLockedName] = useState<string | null>(null);
  const [lockedThumb, setLockedThumb] = useState<string | null>(null);
  const [lockedTemplateLatex, setLockedTemplateLatex] = useState<string | null>(null);
  const [narrow, setNarrow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const compileTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInitialCompile = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const { data: resume, isLoading, isError, error } = useQuery({
    queryKey: ["resume", resumeId],
    queryFn: async () => {
      const res = await fetch(`/api/resumes/${resumeId}`, { cache: "no-store" });
      const data = (await res.json()) as ResumePayload & { error?: string };
      if (!res.ok || !data.id) throw new Error(data.error || "Resume not found");
      return data;
    },
    enabled: Boolean(resumeId) && resumeId !== "new",
    staleTime: 30_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!resume?.id) return;
    setDraftContent(resume.contentJson);
    setDraftLatex(resume.latexSource);
    if (resume.template?.slug) setLockedSlug(resume.template.slug);
    if (resume.template?.name) setLockedName(resume.template.name);
    if (resume.template?.thumbnailUrl) setLockedThumb(resume.template.thumbnailUrl);
    if (resume.template?.latexSource) setLockedTemplateLatex(resume.template.latexSource);
    didInitialCompile.current = false;
    setCompileEngine(null);
    setPreviewMode("live");
    setPreviewTick(0);
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume?.id]);

  const save = useMutation({
    mutationFn: async (payload: Partial<ResumePayload> & { note?: string }) => {
      if (!resume?.id) return null;
      const res = await fetch(`/api/resumes/${resume.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });

  const compile = async (opts: {
    latexSource?: string;
    contentJson: ResumeContent;
    reinject?: boolean;
    silent?: boolean;
  }) => {
    if (!resume?.id) return;
    setCompiling(true);
    try {
      const res = await fetch(`/api/resumes/${resume.id}/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentJson: opts.contentJson,
          latexSource: opts.reinject ? undefined : opts.latexSource,
          reinject: opts.reinject ?? false,
        }),
      });
      if (!res.ok) throw new Error("Compile failed");
      const updated = (await res.json()) as ResumePayload & { engine?: string };
      setDraftLatex(updated.latexSource);
      if (updated.engine) setCompileEngine(updated.engine);
      if (isRealLatexEngine(updated.engine)) {
        setPreviewTick((n) => n + 1);
      }
      queryClient.setQueryData(["resume", resume.id], (old: ResumePayload | undefined) => ({
        ...(old ?? updated),
        ...updated,
        template: old?.template ?? updated.template ?? null,
      }));
      if (!opts.silent) {
        if (isRealLatexEngine(updated.engine)) toast.success("LaTeX PDF updated");
        else toast.message("Saved — live preview is up to date", {
          description: "Exact PDF needs tectonic, pdflatex, or LATEX_SERVICE_URL.",
        });
      }
    } catch {
      if (!opts.silent) toast.error("Compile failed");
    } finally {
      setCompiling(false);
    }
  };

  const schedule = (opts: { content: ResumeContent; latex?: string; reinject: boolean }) => {
    if (timer.current) clearTimeout(timer.current);
    if (compileTimer.current) clearTimeout(compileTimer.current);
    timer.current = setTimeout(() => {
      save.mutate({
        contentJson: opts.content,
        latexSource: opts.reinject ? undefined : opts.latex,
        note: "autosave",
      });
    }, 650);
    // Only attempt background compile when a real engine was already detected
    if (isRealLatexEngine(compileEngine)) {
      compileTimer.current = setTimeout(() => {
        compile({
          contentJson: opts.content,
          latexSource: opts.latex,
          reinject: opts.reinject,
          silent: true,
        });
      }, 1200);
    }
  };

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (compileTimer.current) clearTimeout(compileTimer.current);
    };
  }, []);

  // Probe once for a real TeX engine — silent, no toast spam.
  useEffect(() => {
    if (!resume?.id || !draftContent || didInitialCompile.current) return;
    didInitialCompile.current = true;
    void compile({
      contentJson: draftContent,
      latexSource: draftLatex ?? resume.latexSource,
      reinject: true,
      silent: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume?.id, draftContent]);

  const content = draftContent;
  const latex = draftLatex ?? "";
  const pdfSrc = resume?.id ? `/api/resumes/${resume.id}/pdf?v=${previewTick}` : "";
  const templateSlug = lockedSlug || resume?.template?.slug;
  const templateName = lockedName || resume?.template?.name;
  const templateThumb = lockedThumb || resume?.template?.thumbnailUrl;
  const templateLatex = lockedTemplateLatex || resume?.template?.latexSource || "";
  const hasRealPdf = isRealLatexEngine(compileEngine) && previewTick > 0;
  const showPdf = previewMode === "pdf" && hasRealPdf;
  const showSample = previewMode === "sample" && Boolean(templateThumb);

  if (isLoading || !resume || !content) {
    return (
      <div className="grid min-h-[calc(100dvh-56px)] place-items-center px-4 text-sm text-muted-foreground">
        {isError ? (error as Error)?.message || "Could not open this resume" : "Opening editor…"}
      </div>
    );
  }

  const previewPane = (
    <div className="relative h-full min-h-[280px] overflow-auto bg-desk">
      {compiling && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 overflow-hidden">
          <div className="shimmer h-full w-full bg-accent/40" />
        </div>
      )}
      <div className="mx-auto w-full max-w-[560px] px-3 py-4 sm:px-4">
        <div className={cn("overflow-hidden rounded-sm border border-border bg-white", compiling && "opacity-95")}>
          {showPdf ? (
            <iframe
              key={`${resume.id}-${previewTick}`}
              title="LaTeX resume PDF"
              src={pdfSrc}
              className="h-[min(720px,75dvh)] w-full bg-white"
            />
          ) : showSample ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={templateThumb!}
              alt={`${templateName || "Template"} published sample`}
              className="w-full object-contain object-top"
            />
          ) : (
            <TemplateResumePreview content={content} templateSlug={templateSlug} />
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          {showPdf
            ? compiling
              ? "Recompiling LaTeX…"
              : "Compiled from this template’s real .tex"
            : showSample
              ? "Published sample of this template (reference)"
              : "Live preview — updates as you type on the right"}
        </p>
      </div>
    </div>
  );

  const editorPane = (
    <div className="h-full min-h-[320px] overflow-auto border-border bg-card md:border-l">
      {view === "code" ? (
        <Monaco
          key={resume.id}
          height="100%"
          language="plaintext"
          theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
          value={latex}
          onChange={(value) => {
            const next = value ?? "";
            setDraftLatex(next);
            schedule({ content, latex: next, reinject: false });
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            wordWrap: "on",
            padding: { top: 16 },
            scrollBeyondLastLine: false,
          }}
        />
      ) : (
        <ResumeEditorForm
          key={resume.id}
          content={content}
          templateLatex={templateLatex}
          templateName={templateName}
          onChange={(next) => {
            setDraftContent(next);
            if (previewMode !== "live") setPreviewMode("live");
            schedule({ content: next, reinject: true });
          }}
        />
      )}
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-56px)] flex-col bg-background">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Input
            key={resume.id}
            className="h-9 max-w-[160px] border-transparent bg-transparent px-2 font-medium shadow-none focus-visible:border-border focus-visible:bg-card sm:max-w-[220px]"
            defaultValue={resume.title}
            onBlur={(e) => save.mutate({ title: e.target.value })}
          />
          {templateName ? (
            <span className="hidden truncate rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-muted-foreground sm:inline">
              {templateName}
            </span>
          ) : null}
        </div>
        <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "form" | "code")}>
            <TabsList>
              <TabsTrigger value="form">Edit</TabsTrigger>
              <TabsTrigger value="code">LaTeX</TabsTrigger>
            </TabsList>
          </Tabs>
          <Tabs
            value={previewMode === "pdf" && !hasRealPdf ? "live" : previewMode}
            onValueChange={(v) => {
              if (v === "pdf" && !hasRealPdf) {
                toast.message("Exact PDF unavailable yet", {
                  description: "Install tectonic/pdflatex or set LATEX_SERVICE_URL. Live preview still works.",
                });
                setPreviewMode("live");
                return;
              }
              setPreviewMode(v as PreviewMode);
            }}
          >
            <TabsList>
              <TabsTrigger value="live">Live</TabsTrigger>
              <TabsTrigger value="sample">Sample</TabsTrigger>
              <TabsTrigger value="pdf">PDF</TabsTrigger>
            </TabsList>
          </Tabs>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="hidden sm:inline-flex">
                Versions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-64 overflow-auto">
              {(resume.versions ?? []).length === 0 ? (
                <DropdownMenuItem disabled>No versions yet</DropdownMenuItem>
              ) : (
                (resume.versions ?? []).map((version) => (
                  <DropdownMenuItem
                    key={version.id}
                    onClick={async () => {
                      await fetch(`/api/resumes/${resume.id}/versions`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ restoreId: version.id }),
                      });
                      setDraftContent(null);
                      setDraftLatex(null);
                      queryClient.invalidateQueries({ queryKey: ["resume", resume.id] });
                      toast.success("Restored version");
                    }}
                  >
                    {version.note || "edit"} · {new Date(version.createdAt).toLocaleString()}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            variant="secondary"
            disabled={compiling}
            onClick={() =>
              compile({
                contentJson: content,
                latexSource: latex,
                reinject: view === "form",
              })
            }
          >
            {compiling ? "…" : "Compile"}
          </Button>
          {hasRealPdf ? (
            <Button size="sm" asChild className="hidden xs:inline-flex sm:inline-flex">
              <a href={`/api/resumes/${resume.id}/pdf?download=1&v=${previewTick}`}>Download</a>
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" className="hidden md:inline-flex" asChild>
            <a href={`/api/resumes/${resume.id}/tex`}>.tex</a>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => router.push("/gallery")}>
            Gallery
          </Button>
        </div>
      </div>

      <Group orientation={narrow ? "vertical" : "horizontal"} className="min-h-0 flex-1">
        <Panel defaultSize={narrow ? 42 : 46} minSize={narrow ? 28 : 30}>
          {previewPane}
        </Panel>
        <Separator
          className={cn(
            "bg-border transition-colors hover:bg-accent",
            narrow ? "h-1.5 w-full" : "w-1.5",
          )}
        />
        <Panel defaultSize={narrow ? 58 : 54} minSize={narrow ? 32 : 30}>
          {editorPane}
        </Panel>
      </Group>
    </div>
  );
}
