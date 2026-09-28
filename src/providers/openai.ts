import { ProviderError } from "./errors";
import { postJson } from "./http";
import type {
  ModelProvider,
  ModelRequest,
  ModelResponse,
  ProviderOptions,
} from "./types";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_TIMEOUT_MS = 60_000;

type OpenAIResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

export function createOpenAIProvider(
  options: ProviderOptions = {},
): ModelProvider {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function generate(request: ModelRequest): Promise<ModelResponse> {
    const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    if (!apiKey) {
      throw new ProviderError("openai provider requires OPENAI_API_KEY", {
        provider: "openai",
        code: "missing_credentials",
      });
    }

    const body: Record<string, unknown> = {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature ?? 0,
      ...(request.maxTokens ? { max_tokens: request.maxTokens } : {}),
      ...(request.json ? { response_format: { type: "json_object" } } : {}),
    };

    const data = await postJson<OpenAIResponse>({
      provider: "openai",
      url: `${baseUrl}/chat/completions`,
      headers: { authorization: `Bearer ${apiKey}` },
      body,
      timeoutMs,
      fetchImpl: options.fetchImpl,
    });

    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text) {
      throw new ProviderError("openai returned no text content", {
        provider: "openai",
        code: "malformed_response",
      });
    }

    return {
      text,
      raw: data,
      usage: {
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
      },
    };
  }

  return { name: "openai", generate };
}
