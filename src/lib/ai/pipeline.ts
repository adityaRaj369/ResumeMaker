import { getAIProvider } from "@/lib/ai";
import { analyzeMatch } from "@/lib/ai/match";
import { stripFabrications, validateRewrite } from "@/lib/ai/validate";
import { scoreAts } from "@/lib/ats/score";
import { compileResume } from "@/lib/latex/compile";
import { injectLatex } from "@/lib/latex/inject";
import type {
  AtsBreakdown,
  GenerationStep,
  JdAnalysis,
  MatchAnalysis,
  PipelineWarning,
  ResumeContent,
} from "@/lib/types";

export type PipelineEvent =
  | { type: "step"; step: GenerationStep; status: "running" | "done" | "error"; message?: string }
  | { type: "keywords"; keywords: string[] }
  | { type: "analysis"; analysis: JdAnalysis }
  | { type: "match"; match: MatchAnalysis }
  | { type: "warnings"; warnings: PipelineWarning[] }
  | { type: "content"; content: ResumeContent }
  | { type: "score"; breakdown: AtsBreakdown }
  | { type: "pdf"; pdfBase64: string; engine: string; text: string }
  | { type: "error"; message: string }
  | { type: "done" };

export async function runAtsPipeline(options: {
  jd: string;
  profile: ResumeContent;
  latexTemplate: string;
  emit?: (event: PipelineEvent) => void | Promise<void>;
}) {
  const emit = options.emit ?? (() => undefined);
  const ai = getAIProvider();

  await emit({ type: "step", step: "analyze", status: "running" });
  const analysis = await ai.analyzeJobDescription(options.jd);
  await emit({ type: "analysis", analysis });
  await emit({
    type: "keywords",
    keywords: [...analysis.mustHaveKeywords, ...analysis.hardSkills, ...analysis.tools],
  });
  await emit({ type: "step", step: "analyze", status: "done" });

  await emit({ type: "step", step: "match", status: "running" });
  const match = analyzeMatch(options.profile, analysis);
  await emit({ type: "match", match });
  await emit({ type: "step", step: "match", status: "done" });

  await emit({ type: "step", step: "rewrite", status: "running" });
  const rewritten = await ai.rewriteResume({
    profile: options.profile,
    jd: options.jd,
    analysis,
    match,
  });
  await emit({ type: "step", step: "rewrite", status: "done" });

  await emit({ type: "step", step: "validate", status: "running" });
  const sanitized = stripFabrications(options.profile, rewritten.content);
  sanitized.summary = rewritten.content.summary || sanitized.summary;
  const warnings = [
    ...rewritten.warnings,
    ...validateRewrite(options.profile, sanitized),
    ...match.genuinelyMissing.map((keyword) => ({
      type: "missing_skill" as const,
      message: `This JD wants ${keyword} — you don't have it in your profile. The AI will not claim it.`,
      evidence: keyword,
    })),
  ];
  await emit({ type: "warnings", warnings });
  await emit({ type: "content", content: sanitized });
  await emit({ type: "step", step: "validate", status: "done" });

  await emit({ type: "step", step: "compile", status: "running" });
  const latexSource = injectLatex(options.latexTemplate, sanitized);
  const compiled = await compileResume({ latexSource, content: sanitized });
  await emit({
    type: "pdf",
    pdfBase64: compiled.pdf.toString("base64"),
    engine: compiled.engine,
    text: compiled.text,
  });
  await emit({ type: "step", step: "compile", status: "done" });

  await emit({ type: "step", step: "score", status: "running" });
  const breakdown = scoreAts({
    plainText: compiled.text,
    latexSource,
    analysis,
  });
  await emit({ type: "score", breakdown });
  await emit({ type: "step", step: "score", status: "done" });
  await emit({ type: "done" });

  return {
    analysis,
    match,
    content: sanitized,
    warnings,
    latexSource,
    compiled,
    breakdown,
  };
}
