import { prisma } from "@/lib/prisma";
import { injectLatex } from "@/lib/latex/inject";
import { isProfileReady, manualTemplateContent, profileToContent } from "@/lib/resume-content";
import { requireUser, apiError } from "@/lib/session";
import { getTemplateByIdOrSlug } from "@/lib/templates";

export async function GET() {
  try {
    const user = await requireUser();
    const resumes = await prisma.resume.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    const templateIds = [...new Set(resumes.map((r) => r.templateId))];
    const templates = templateIds.length
      ? await prisma.resumeTemplate.findMany({
          where: { id: { in: templateIds } },
          select: { id: true, slug: true, name: true, thumbnailUrl: true, category: true },
        })
      : [];
    const byId = new Map(templates.map((t) => [t.id, t]));
    return Response.json(resumes.map((resume) => ({ ...resume, template: byId.get(resume.templateId) ?? null })));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    if (!body.templateId || typeof body.templateId !== "string") {
      return Response.json({ error: "templateId is required" }, { status: 400 });
    }
    const template = await getTemplateByIdOrSlug(body.templateId);
    if (!template) return Response.json({ error: "Template not found" }, { status: 404 });

    const mode = body.mode === "ats_matched" ? "ats_matched" : "manual";

    // Two product paths:
    // 1) manual — form pre-filled from that template's published sample fields
    // 2) ats_matched — only from career profile (AI path)
    let content;
    if (mode === "ats_matched") {
      const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
      content = profileToContent(user, profile);
      if (!isProfileReady(content)) {
        return Response.json(
          { error: "Complete your career profile before using AI match.", code: "PROFILE_REQUIRED" },
          { status: 400 },
        );
      }
    } else {
      content = manualTemplateContent(template.slug);
    }

    const latexSource = injectLatex(template.latexSource, content);
    const month = new Date().toLocaleString("en-US", { month: "short", year: "numeric" });
    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        templateId: template.id,
        title: body.title || `${template.name} — ${month}`,
        mode,
        jobDescription: body.jobDescription,
        latexSource,
        contentJson: content as object,
      },
    });
    await prisma.resumeVersion.create({
      data: { resumeId: resume.id, latexSource, contentJson: content as object, note: "created" },
    });
    return Response.json({
      ...resume,
      template: {
        id: template.id,
        slug: template.slug,
        name: template.name,
        thumbnailUrl: template.thumbnailUrl,
        category: template.category,
        latexSource: template.latexSource,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
