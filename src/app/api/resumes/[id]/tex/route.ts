import { prisma } from "@/lib/prisma";
import { requireUser, unauthorized } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const resume = await prisma.resume.findFirst({ where: { id, userId: user.id } });
    if (!resume) return new Response("Not found", { status: 404 });
    return new Response(resume.latexSource, {
      headers: {
        "Content-Type": "application/x-tex",
        "Content-Disposition": `attachment; filename="${resume.title.replace(/[^\w\- ]+/g, "")}.tex"`,
      },
    });
  } catch {
    return unauthorized();
  }
}
