import { prisma } from "@/lib/prisma";
import { compileResume } from "@/lib/latex/compile";
import { injectLatex } from "@/lib/latex/inject";
import { requireUser, apiError } from "@/lib/session";
import { savePdf } from "@/lib/storage";
import type { ResumeContent } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const resume = await prisma.resume.findFirst({ where: { id, userId: user.id } });
    if (!resume) return Response.json({ error: "Not found" }, { status: 404 });
    const body = await request.json();
    const content = (body.contentJson ?? resume.contentJson) as ResumeContent;
    const template = await prisma.resumeTemplate.findFirst({ where: { id: resume.templateId } });
    const baseLatex = template?.latexSource || resume.latexSource;
    // Form edits must reinject into the template; stale latexSource would freeze the PDF.
    const latexSource =
      body.reinject || !body.latexSource
        ? injectLatex(baseLatex, content)
        : (body.latexSource as string);
    const compiled = await compileResume({ latexSource, content });
    const pdfUrl = await savePdf(id, compiled.pdf);
    const updated = await prisma.resume.update({
      where: { id },
      data: { latexSource, contentJson: content as object, pdfUrl, plainText: compiled.text },
    });
    return Response.json({
      ...updated,
      engine: compiled.engine,
      formattingIssues: compiled.formattingIssues,
      template: template
        ? {
            id: template.id,
            slug: template.slug,
            name: template.name,
            thumbnailUrl: template.thumbnailUrl,
            category: template.category,
            latexSource: template.latexSource,
          }
        : null,
    });
  } catch (error) {
    return apiError(error);
  }
}
