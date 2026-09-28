export const providerNames = ["google", "openai", "anthropic"] as const;

export type ProviderName = (typeof providerNames)[number];

export type ModelRole = "system" | "user" | "assistant";

export type ModelMessage = {
  role: ModelRole;
  content: string;
};

export type ModelRequest = {
  model: string;
  messages: ModelMessage[];
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
};

export type ModelUsage = {
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  estimatedCostUsd?: number;
};

export type ModelResponse = {
  text: string;
  usage?: ModelUsage;
  raw: unknown;
};

export type ProviderOptions = {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

export interface ModelProvider {
  readonly name: ProviderName;
  generate(request: ModelRequest): Promise<ModelResponse>;
}
