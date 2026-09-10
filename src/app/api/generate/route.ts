import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { withAiConcurrency } from "@/lib/ai/concurrency";
import { runAtsPipeline } from "@/lib/ai/pipeline";
import { pushJobEvent } from "@/lib/jobs/events";
import { injectLatex } from "@/lib/latex/inject";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isProfileReady, profileToContent } from "@/lib/resume-content";
import { requireUser, apiError } from "@/lib/session";
import { savePdf } from "@/lib/storage";
import { getTemplateByIdOrSlug } from "@/lib/templates";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const hourly = await enforceRateLimit(`ai:${user.id}`, Number(process.env.AI_RATE_LIMIT_PER_HOUR || 20));
    if (!hourly.allowed) {
      return Response.json(
        { error: "AI rate limit reached (hourly). Try again later." },
        { status: 429, headers: { "Retry-After": "3600" } },
      );
    }
    const daily = await enforceRateLimit(`ai-day:${user.id}`, Number(process.env.AI_RATE_LIMIT_PER_DAY || 50), 24);
    if (!daily.allowed) {
      return Response.json({ error: "Daily AI quota reached. Upgrade or try tomorrow." }, { status: 429 });
    }

    const body = await request.json();
    if (!body.jd || String(body.jd).trim().length < 40) {
      return Response.json({ error: "Paste a fuller job description (at least ~40 characters)." }, { status: 400 });
    }

    const template = await getTemplateByIdOrSlug(body.templateId);
    if (!template?.latexSource) {
      return Response.json({ error: "Template not found in database" }, { status: 404 });
    }

    const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
    const content = profileToContent(user, profile);
    if (!isProfileReady(content)) {
      return Response.json(
        { error: "Complete your career profile first. AI only uses facts you provide — never invents jobs.", code: "PROFILE_REQUIRED" },
        { status: 400 },
      );
    }

    const latexSource = injectLatex(template.latexSource, content);
    const month = new Date().toLocaleString("en-US", { month: "short", year: "numeric" });
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        templateId: template.id,
        title: `${content.targetRole || "Resume"} - ATS - ${month}`,
        mode: "ats_matched",
        jobDescription: body.jd,
        latexSource,
        contentJson: content as object,
        sourceContentJson: content as object,
      },
    });

    const jobId = randomUUID();
    await prisma.aiJob.create({
      data: {
        id: jobId,
        userId: user.id,
        resumeId: resume.id,
        type: "ats_generate",
        status: "queued",
        step: "queued",
      },
    });

    void withAiConcurrency(async () => {
      await prisma.aiJob.update({
        where: { id: jobId },
        data: { status: "running", step: "analyze", progress: 5 },
      });
      try {
        const result = await Promise.race([
          runAtsPipeline({
            jd: body.jd,
            profile: content,
            latexTemplate: template.latexSource,
            emit: async (event) => {
              pushJobEvent(jobId, event);
              if (event.type === "step" && event.status === "running") {
                await prisma.aiJob.update({
                  where: { id: jobId },
                  data: { step: event.step, progress: Math.min(95, await progressFor(event.step)) },
                });
              }
            },
          }),
          timeout(90_000, "AI generation timed out") as Promise<never>,
        ]);

        const pdfUrl = await savePdf(resume.id, result.compiled.pdf);
        await prisma.resume.update({
          where: { id: resume.id },
          data: {
            latexSource: result.latexSource,
            contentJson: result.content as object,
            pdfUrl,
            plainText: result.compiled.text,
            atsScore: result.breakdown.score,
            matchedKeywords: {
              matched: result.breakdown.matched,
              missing: result.breakdown.missing,
            },
            atsBreakdown: result.breakdown as object,
          },
        });
        await prisma.resumeVersion.create({
          data: {
            resumeId: resume.id,
            latexSource: result.latexSource,
            contentJson: result.content as object,
            note: "AI-generated ATS match",
          },
        });
        await prisma.aiJob.update({
          where: { id: jobId },
          data: {
            status: "done",
            step: "done",
            progress: 100,
            result: { score: result.breakdown.score } as object,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Generation failed";
        pushJobEvent(jobId, { type: "error", message });
        await prisma.aiJob.update({
          where: { id: jobId },
          data: { status: "error", error: message },
        });
      }
    });

    return Response.json({ resumeId: resume.id, jobId });
  } catch (error) {
    return apiError(error);
  }
}

function timeout<T>(ms: number, message: string): Promise<T> {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
}

async function progressFor(step: string) {
  const map: Record<string, number> = {
    analyze: 15,
    match: 30,
    rewrite: 50,
    validate: 65,
    compile: 80,
    score: 92,
  };
  return map[step] ?? 40;
}
