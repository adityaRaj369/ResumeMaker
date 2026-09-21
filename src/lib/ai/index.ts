import { createGeminiProvider } from "@/lib/ai/gemini";
import { createMockProvider } from "@/lib/ai/mock";
import { createGrokProvider, createOpenAIProvider } from "@/lib/ai/openai";
import type { AIProvider } from "@/lib/ai/provider";

export type AiProviderId = "gemini" | "openai" | "grok" | "mock";

/**
 * Resolves the configured provider, falling back to the rules-based provider so
 * the product still runs without API keys. Callers surface `id` in the UI so a
 * rules-based run is never presented as a language model run.
 */
export function getAIProvider(): AIProvider {
  const name = (process.env.AI_PROVIDER || "").toLowerCase();
  try {
    if (name === "mock") return createMockProvider();
    if (name === "gemini" && process.env.GEMINI_API_KEY) return createGeminiProvider();
    if (name === "openai" && process.env.OPENAI_API_KEY) return createOpenAIProvider();
    if (name === "grok" && process.env.GROK_API_KEY) return createGrokProvider();

    if (process.env.GEMINI_API_KEY) return createGeminiProvider();
    if (process.env.OPENAI_API_KEY) return createOpenAIProvider();
    if (process.env.GROK_API_KEY) return createGrokProvider();
  } catch (error) {
    throw new Error(
      `AI provider initialization failed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
  return createMockProvider();
}

export function isLanguageModelConfigured() {
  return getAIProvider().id !== "mock";
}
