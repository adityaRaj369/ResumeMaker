import { prisma } from "@/lib/prisma";
import { requireUser, apiError } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const resume = await prisma.resume.findFirst({ where: { id, userId: user.id } });
    if (!resume) return Response.json({ error: "Not found" }, { status: 404 });
    const version = await prisma.resumeVersion.findFirst({
      where: { id: body.restoreId, resumeId: id },
    });
    if (!version) return Response.json({ error: "Version not found" }, { status: 404 });
    const updated = await prisma.resume.update({
      where: { id },
      data: { latexSource: version.latexSource, contentJson: version.contentJson ?? undefined },
    });
    await prisma.resumeVersion.create({
      data: {
        resumeId: id,
        latexSource: version.latexSource,
        contentJson: version.contentJson ?? undefined,
        note: "restored",
      },
    });
    return Response.json(updated);
  } catch (error) {
    return apiError(error);
  }
}
