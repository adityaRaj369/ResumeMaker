import { getAIProvider } from "@/lib/ai";
import { analyzeJobDescriptionHeuristic } from "@/lib/ats/analyze-jd";
import { requireUser, apiError } from "@/lib/session";

export async function POST(request: Request) {
  try {
    await requireUser();
    const { jd } = (await request.json()) as { jd?: string };
    if (!jd?.trim()) return Response.json({ error: "Missing JD" }, { status: 400 });
    const analysis = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROK_API_KEY
      ? await getAIProvider().analyzeJobDescription(jd)
      : analyzeJobDescriptionHeuristic(jd);
    return Response.json(analysis);
  } catch (error) {
    return apiError(error);
  }
}
