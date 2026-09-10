import { prisma } from "@/lib/prisma";
import { requireUser, apiError } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const resume = await prisma.resume.findFirst({
      where: { id, userId: user.id },
      include: { versions: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    if (!resume) return Response.json({ error: "Not found" }, { status: 404 });
    const template = await prisma.resumeTemplate.findFirst({
      where: { id: resume.templateId },
      select: {
        id: true,
        slug: true,
        name: true,
        thumbnailUrl: true,
        category: true,
        latexSource: true,
      },
    });
    return Response.json({ ...resume, template });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const existing = await prisma.resume.findFirst({ where: { id, userId: user.id } });
    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });
    const resume = await prisma.resume.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        latexSource: body.latexSource ?? existing.latexSource,
        contentJson: body.contentJson ?? existing.contentJson,
        jobDescription: body.jobDescription ?? existing.jobDescription,
      },
    });
    if ((body.latexSource || body.contentJson) && body.note !== "autosave") {
      await prisma.resumeVersion.create({
        data: {
          resumeId: id,
          latexSource: resume.latexSource,
          contentJson: resume.contentJson as object | undefined,
          note: body.note || "manual edit",
        },
      });
    }
    return Response.json(resume);
  } catch (error) {
    return apiError(error);
  }
}
