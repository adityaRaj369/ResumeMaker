import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider } from "@/lib/ai/provider";
import { ANALYZE_SYSTEM_PROMPT, REWRITE_SYSTEM_PROMPT } from "@/lib/ai/provider";
import type { JdAnalysis, RewriteResult } from "@/lib/types";

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned) as T;
}

export function createGeminiProvider(): AIProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-pro";

  return {
    id: "gemini",
    async analyzeJobDescription(jd) {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: ANALYZE_SYSTEM_PROMPT,
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      });
      const result = await model.generateContent(jd);
      return parseJson<JdAnalysis>(result.response.text());
    },
    async rewriteResume(input) {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: REWRITE_SYSTEM_PROMPT,
        generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
      });
      const result = await model.generateContent(JSON.stringify(input));
      return parseJson<RewriteResult>(result.response.text());
    },
  };
}
