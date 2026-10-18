import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type AiProvider = "anthropic" | "openai";

const DEFAULT_MODEL: Record<AiProvider, string> = {
  anthropic: "claude-sonnet-5-5",
  // OpenAI-Modell bewusst über AI_MODEL setzen; Platzhalter nur als Fallback.
  openai: "gpt-5",
};

export function resolveProvider(): { provider: AiProvider; modelId: string } {
  const provider = (process.env.AI_PROVIDER ?? "anthropic") as AiProvider;
  if (provider !== "anthropic" && provider !== "openai") {
    throw new Error(`Unbekannter AI_PROVIDER: ${provider}`);
  }
  return { provider, modelId: process.env.AI_MODEL || DEFAULT_MODEL[provider] };
}

/** Sprachmodell gemäss AI_PROVIDER / AI_MODEL (ADR 0005). */
export function coachModel(): { model: LanguageModel; modelId: string } {
  const { provider, modelId } = resolveProvider();
  if (provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return { model: anthropic(modelId), modelId };
  }
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return { model: openai(modelId), modelId };
}
