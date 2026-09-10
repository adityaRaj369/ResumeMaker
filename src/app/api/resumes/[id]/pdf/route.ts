import { prisma } from "@/lib/prisma";
import { compileResume } from "@/lib/latex/compile";
import { requireUser, unauthorized } from "@/lib/session";
import { readPdf, savePdf } from "@/lib/storage";
import type { ResumeContent } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const resume = await prisma.resume.findFirst({ where: { id, userId: user.id } });
    if (!resume) return new Response("Not found", { status: 404 });
    let pdf: Buffer;
    try {
      pdf = await readPdf(id);
    } catch {
      const compiled = await compileResume({
        latexSource: resume.latexSource,
        content: resume.contentJson as ResumeContent,
      });
      await savePdf(id, compiled.pdf);
      await prisma.resume.update({
        where: { id },
        data: { pdfUrl: `/api/resumes/${id}/pdf`, plainText: compiled.text },
      });
      pdf = compiled.pdf;
    }
    const download = new URL(request.url).searchParams.get("download");
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Content-Disposition": download
          ? `attachment; filename="${resume.title.replace(/[^\w\- ]+/g, "")}.pdf"`
          : "inline",
      },
    });
  } catch {
    return unauthorized();
  }
}
