import { getAIProvider } from "@/lib/ai";
import { requireUser, apiError } from "@/lib/session";

export async function POST(request: Request) {
  try {
    await requireUser();
    const { jd } = (await request.json()) as { jd?: string };
    if (!jd?.trim()) return Response.json({ error: "Missing JD" }, { status: 400 });
    const ai = getAIProvider();
    const analysis = await ai.analyzeJobDescription(jd);
    return Response.json({ ...analysis, analysisSource: ai.id === "mock" ? "heuristic" : "ai" });
  } catch (error) {
    return apiError(error);
  }
}
