import { createGeminiProvider } from "@/lib/ai/gemini";
import { createGrokProvider, createOpenAIProvider } from "@/lib/ai/openai";
import type { AIProvider } from "@/lib/ai/provider";

export function getAIProvider(): AIProvider {
  const name = (process.env.AI_PROVIDER || "mock").toLowerCase();
  try {
    if (name === "gemini" && process.env.GEMINI_API_KEY) return createGeminiProvider();
    if (name === "openai" && process.env.OPENAI_API_KEY) return createOpenAIProvider();
    if (name === "grok" && process.env.GROK_API_KEY) return createGrokProvider();
  } catch (error) {
    throw new Error(`AI provider initialization failed: ${error instanceof Error ? error.message : "unknown error"}`);
  }
  if (process.env.GEMINI_API_KEY) return createGeminiProvider();
  if (process.env.OPENAI_API_KEY) return createOpenAIProvider();
  if (process.env.GROK_API_KEY) return createGrokProvider();
  throw new Error("AI is not configured. Set AI_PROVIDER and its matching API key before generating a tailored resume.");
}
