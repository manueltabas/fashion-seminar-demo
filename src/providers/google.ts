import { ProviderError } from "./errors";
import { postJson } from "./http";
import type {
  ModelProvider,
  ModelRequest,
  ModelResponse,
  ProviderOptions,
} from "./types";

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_TIMEOUT_MS = 60_000;

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
};

export function createGoogleProvider(
  options: ProviderOptions = {},
): ModelProvider {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function generate(request: ModelRequest): Promise<ModelResponse> {
    const apiKey =
      options.apiKey ??
      process.env.GEMINI_API_KEY ??
      process.env.GOOGLE_API_KEY ??
      "";
    if (!apiKey) {
      throw new ProviderError(
        "google provider requires GEMINI_API_KEY or GOOGLE_API_KEY",
        { provider: "google", code: "missing_credentials" },
      );
    }

    const systemParts = request.messages
      .filter((message) => message.role === "system")
      .map((message) => ({ text: message.content }));
    const contents = request.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0,
        ...(request.maxTokens ? { maxOutputTokens: request.maxTokens } : {}),
        ...(request.json ? { responseMimeType: "application/json" } : {}),
      },
      ...(systemParts.length > 0
        ? { systemInstruction: { parts: systemParts } }
        : {}),
    };

    const data = await postJson<GeminiResponse>({
      provider: "google",
      url: `${baseUrl}/models/${encodeURIComponent(
        request.model,
      )}:generateContent?key=${encodeURIComponent(apiKey)}`,
      headers: {},
      body,
      timeoutMs,
      fetchImpl: options.fetchImpl,
    });

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("") ?? "";

    if (!text) {
      throw new ProviderError("google returned no text content", {
        provider: "google",
        code: "malformed_response",
      });
    }

    return {
      text,
      raw: data,
      usage: {
        inputTokens: data.usageMetadata?.promptTokenCount,
        outputTokens: data.usageMetadata?.candidatesTokenCount,
      },
    };
  }

  return { name: "google", generate };
}
