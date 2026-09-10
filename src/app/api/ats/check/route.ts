import { getAIProvider } from "@/lib/ai";
import { analyzeJobDescriptionHeuristic } from "@/lib/ats/analyze-jd";
import { scoreAts } from "@/lib/ats/score";
import { enforceRateLimit } from "@/lib/rate-limit";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { JdAnalysis } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  const userKey = session?.user?.id || session?.user?.email || request.headers.get("x-forwarded-for") || "anon";
  const limit = await enforceRateLimit(`ats-check:${userKey}`, Number(process.env.ATS_CHECK_LIMIT_PER_HOUR || 30));
  if (!limit.allowed) {
    return Response.json({ error: "Too many ATS checks. Try again later." }, { status: 429 });
  }

  const body = (await request.json()) as {
    jd?: string;
    resumeText?: string;
    latexSource?: string;
  };

  const jd = body.jd?.trim() || "";
  const resumeText = body.resumeText?.trim() || "";
  if (jd.length < 40 || resumeText.length < 80) {
    return Response.json(
      {
        error:
          "Paste a full job description (40+ characters) and your resume plain text (80+ characters). Copy text from your PDF viewer.",
      },
      { status: 400 },
    );
  }

  let analysis: JdAnalysis;
  let analysisSource: "ai" | "heuristic" = "heuristic";
  try {
    analysis = await Promise.race([
      getAIProvider().analyzeJobDescription(jd),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 12_000)),
    ]);
    // Merge lexicon hits so AI misses still get coverage
    const heuristic = analyzeJobDescriptionHeuristic(jd);
    analysis = {
      ...analysis,
      hardSkills: Array.from(new Set([...analysis.hardSkills, ...heuristic.hardSkills])),
      tools: Array.from(new Set([...analysis.tools, ...heuristic.tools])),
      mustHaveKeywords:
        analysis.mustHaveKeywords?.length > 0
          ? analysis.mustHaveKeywords
          : heuristic.mustHaveKeywords,
      niceToHaveKeywords: Array.from(
        new Set([...(analysis.niceToHaveKeywords || []), ...heuristic.niceToHaveKeywords]),
      ),
    };
    analysisSource = "ai";
  } catch {
    analysis = analyzeJobDescriptionHeuristic(jd);
  }

  const breakdown = scoreAts({
    plainText: resumeText,
    latexSource: body.latexSource || "",
    analysis,
  });

  await prisma.atsCheck.create({
    data: {
      userId: session?.user?.id ?? null,
      score: breakdown.score,
      breakdown: breakdown as object,
    },
  });

  return Response.json({
    score: breakdown.score,
    breakdown,
    analysis: {
      mustHaveKeywords: analysis.mustHaveKeywords,
      hardSkills: analysis.hardSkills,
      tools: analysis.tools,
      seniorityLevel: analysis.seniorityLevel,
      niceToHaveKeywords: analysis.niceToHaveKeywords,
      keyResponsibilities: analysis.keyResponsibilities,
    },
    meta: {
      analysisSource,
      method:
        "Keyword + synonym match, section detection, quantification, action verbs, and ATS-breaking format checks. Not affiliated with Workday/Taleo/Greenhouse.",
    },
  });
}
