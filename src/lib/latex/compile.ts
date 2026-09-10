import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ResumeContent } from "@/lib/types";
import { detectAtsBreakingLatex } from "@/lib/latex/inject";

const execFileAsync = promisify(execFile);

export type CompileResult = {
  pdf: Buffer;
  text: string;
  engine: "tectonic" | "latex-service" | "pdflatex" | "pdf-lib-fallback";
  formattingIssues: string[];
};

async function compileWithService(latexSource: string): Promise<CompileResult | null> {
  const url = process.env.LATEX_SERVICE_URL;
  if (!url) return null;
  const response = await fetch(`${url.replace(/\/$/, "")}/compile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ latex: latexSource }),
  });
  if (!response.ok) {
    throw new Error(`LaTeX service failed: ${response.status}`);
  }
  const payload = (await response.json()) as { pdfBase64: string; text: string };
  return {
    pdf: Buffer.from(payload.pdfBase64, "base64"),
    text: payload.text,
    engine: "latex-service",
    formattingIssues: detectAtsBreakingLatex(latexSource),
  };
}

async function compileWithTectonic(latexSource: string): Promise<CompileResult | null> {
  const work = await mkdtemp(path.join(tmpdir(), "resumeforge-"));
  try {
    const texPath = path.join(work, "resume.tex");
    await writeFile(texPath, latexSource, "utf8");
    await execFileAsync("tectonic", ["-X", "compile", "--outfmt", "pdf", texPath], {
      cwd: work,
      timeout: 60_000,
    });
    const pdf = await readFile(path.join(work, "resume.pdf"));
    let text = "";
    try {
      const { stdout } = await execFileAsync("pdftotext", ["-layout", path.join(work, "resume.pdf"), "-"], {
        timeout: 15_000,
      });
      text = stdout;
    } catch {
      text = stripLatexApprox(latexSource);
    }
    return {
      pdf,
      text,
      engine: "tectonic",
      formattingIssues: detectAtsBreakingLatex(latexSource),
    };
  } catch {
    return null;
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

async function compileWithPdflatex(latexSource: string): Promise<CompileResult | null> {
  const work = await mkdtemp(path.join(tmpdir(), "resumeforge-"));
  try {
    const texPath = path.join(work, "resume.tex");
    await writeFile(texPath, latexSource, "utf8");
    await execFileAsync("pdflatex", ["-interaction=nonstopmode", "-halt-on-error", "resume.tex"], {
      cwd: work,
      timeout: 60_000,
    });
    // Second pass for references if needed
    await execFileAsync("pdflatex", ["-interaction=nonstopmode", "-halt-on-error", "resume.tex"], {
      cwd: work,
      timeout: 60_000,
    }).catch(() => undefined);
    const pdf = await readFile(path.join(work, "resume.pdf"));
    let text = "";
    try {
      const { stdout } = await execFileAsync("pdftotext", ["-layout", path.join(work, "resume.pdf"), "-"], {
        timeout: 15_000,
      });
      text = stdout;
    } catch {
      text = stripLatexApprox(latexSource);
    }
    return {
      pdf,
      text,
      engine: "pdflatex",
      formattingIssues: detectAtsBreakingLatex(latexSource),
    };
  } catch {
    return null;
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

function stripLatexApprox(source: string) {
  return source
    .replace(/\\documentclass[\s\S]*?\\begin\{document\}/g, "")
    .replace(/\\end\{document\}/g, "")
    .replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, " ")
    .replace(/[{}$]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function compileWithPdfLib(content: ResumeContent): Promise<CompileResult> {
  const doc = await PDFDocument.create();
  const pageSize: [number, number] = [612, 792];
  let page = doc.addPage(pageSize);
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);
  const fontSize = 10.5;
  const headingSize = 12;
  const nameSize = 20;
  const margin = 48;
  let y = page.getHeight() - margin;
  const maxWidth = page.getWidth() - margin * 2;
  const color = rgb(0.07, 0.07, 0.08);
  const muted = rgb(0.2, 0.2, 0.22);

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = doc.addPage(pageSize);
      y = page.getHeight() - margin;
    }
  };

  const drawLine = (text: string, options?: { font?: typeof font; size?: number; gap?: number }) => {
    const usedFont = options?.font ?? font;
    const size = options?.size ?? fontSize;
    const words = text.split(/\s+/);
    let line = "";
    const flush = (current: string) => {
      if (!current) return;
      ensureSpace(size + 4);
      page.drawText(current, { x: margin, y, size, font: usedFont, color });
      y -= size + (options?.gap ?? 3);
    };
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (usedFont.widthOfTextAtSize(next, size) > maxWidth) {
        flush(line);
        line = word;
      } else {
        line = next;
      }
    }
    flush(line);
  };

  const section = (title: string) => {
    y -= 8;
    ensureSpace(22);
    page.drawText(title.toUpperCase(), { x: margin, y, size: headingSize, font: bold, color });
    y -= 6;
    page.drawLine({
      start: { x: margin, y },
      end: { x: page.getWidth() - margin, y },
      thickness: 0.8,
      color: muted,
    });
    y -= 14;
  };

  drawLine(content.fullName || "Your Name", { font: bold, size: nameSize, gap: 8 });
  const contact = [
    content.email,
    content.phone,
    content.location,
    content.linkedinUrl,
    content.githubUrl,
    content.portfolioUrl,
  ]
    .filter(Boolean)
    .join("  ·  ");
  if (contact) drawLine(contact, { size: 9.5, gap: 10 });

  if (content.summary) {
    section("Summary");
    drawLine(content.summary);
  }

  section("Skills");
  if (content.skillCategories) {
    const { languages, frameworks, tools } = content.skillCategories;
    if (languages?.length) drawLine(`Languages: ${languages.join(", ")}`);
    if (frameworks?.length) drawLine(`Frameworks & Libraries: ${frameworks.join(", ")}`);
    if (tools?.length) drawLine(`Tools & Platforms: ${tools.join(", ")}`);
  } else if (content.skills?.length) {
    drawLine(content.skills.join(" · "));
  }

  const stats = content.codingProfiles?.stats;
  const codingBits = [
    stats?.leetcodeSolved ? `${stats.leetcodeSolved}+ LeetCode problems solved` : null,
    stats?.codeforcesRating
      ? `Codeforces ${stats.codeforcesRank ?? ""} rating ${stats.codeforcesRating}`.trim()
      : null,
  ].filter(Boolean) as string[];
  if (codingBits.length) {
    section("Competitive Programming");
    drawLine(codingBits.join(" · "));
  }

  if (content.experience?.length) {
    section("Experience");
    for (const job of content.experience) {
      drawLine(`${job.title}`, { font: bold, gap: 2 });
      drawLine(`${job.company}${job.location ? ` — ${job.location}` : ""}  ${job.startDate} – ${job.endDate || "Present"}`, {
        font: italic,
        size: 10,
      });
      for (const bullet of job.bullets ?? []) drawLine(`• ${bullet}`);
      y -= 6;
    }
  }

  if (content.projects?.length) {
    section("Projects");
    for (const project of content.projects) {
      drawLine(`${project.name}${project.tech?.length ? ` (${project.tech.join(", ")})` : ""}`, { font: bold });
      if (project.description) drawLine(project.description);
      for (const bullet of project.bullets ?? []) drawLine(`• ${bullet}`);
      y -= 4;
    }
  }

  if (content.education?.length) {
    section("Education");
    for (const ed of content.education) {
      drawLine(ed.school, { font: bold, gap: 2 });
      drawLine(
        `${[ed.degree, ed.field].filter(Boolean).join(" in ")}${ed.gpa ? `  GPA ${ed.gpa}` : ""}  ${[ed.startDate, ed.endDate].filter(Boolean).join(" – ")}`,
      );
    }
  }

  if (content.certifications?.length) {
    section("Certifications");
    for (const cert of content.certifications) {
      drawLine(`${cert.name}${cert.issuer ? ` — ${cert.issuer}` : ""}${cert.date ? `, ${cert.date}` : ""}`);
    }
  }

  const pdf = Buffer.from(await doc.save());
  const text = [
    content.fullName,
    contact,
    content.summary,
    ...(content.skills ?? []),
    ...content.experience.flatMap((job) => [job.title, job.company, ...(job.bullets ?? [])]),
    ...(content.education ?? []).flatMap((ed) => [ed.school, ed.degree, ed.field]),
    ...(content.projects ?? []).flatMap((p) => [p.name, p.description, ...(p.bullets ?? [])]),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    pdf,
    text,
    engine: "pdf-lib-fallback",
    formattingIssues: [],
  };
}

export async function compileResume(options: {
  latexSource: string;
  content: ResumeContent;
}): Promise<CompileResult> {
  const viaService = await compileWithService(options.latexSource).catch(() => null);
  if (viaService) return viaService;
  const viaTectonic = await compileWithTectonic(options.latexSource);
  if (viaTectonic) return viaTectonic;
  const viaPdflatex = await compileWithPdflatex(options.latexSource);
  if (viaPdflatex) return viaPdflatex;
  return compileWithPdfLib(options.content);
}
