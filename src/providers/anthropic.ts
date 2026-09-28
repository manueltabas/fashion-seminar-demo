import { ProviderError } from "./errors";
import { postJson } from "./http";
import type {
  ModelProvider,
  ModelRequest,
  ModelResponse,
  ProviderOptions,
} from "./types";

const DEFAULT_BASE_URL = "https://api.anthropic.com/v1";
const DEFAULT_TIMEOUT_MS = 60_000;
const ANTHROPIC_VERSION = "2023-06-01";

type AnthropicResponse = {
  content?: Array<{ text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
};

export function createAnthropicProvider(
  options: ProviderOptions = {},
): ModelProvider {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  async function generate(request: ModelRequest): Promise<ModelResponse> {
    const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "";
    if (!apiKey) {
      throw new ProviderError("anthropic provider requires ANTHROPIC_API_KEY", {
        provider: "anthropic",
        code: "missing_credentials",
      });
    }

    const system = request.messages
      .filter((message) => message.role === "system")
      .map((message) => message.content)
      .join("\n\n");
    const messages = request.messages
      .filter((message) => message.role !== "system")
      .map((message) => ({ role: message.role, content: message.content }));

    const body: Record<string, unknown> = {
      model: request.model,
      max_tokens: request.maxTokens ?? 1024,
      temperature: request.temperature ?? 0,
      messages,
      ...(system ? { system } : {}),
    };

    const data = await postJson<AnthropicResponse>({
      provider: "anthropic",
      url: `${baseUrl}/messages`,
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body,
      timeoutMs,
      fetchImpl: options.fetchImpl,
    });

    const text =
      data.content?.map((block) => block.text ?? "").join("") ?? "";
    if (!text) {
      throw new ProviderError("anthropic returned no text content", {
        provider: "anthropic",
        code: "malformed_response",
      });
    }

    return {
      text,
      raw: data,
      usage: {
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      },
    };
  }

  return { name: "anthropic", generate };
}
