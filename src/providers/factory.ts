import { createAnthropicProvider } from "./anthropic";
import { createGoogleProvider } from "./google";
import { createOpenAIProvider } from "./openai";
import type { ModelProvider, ProviderName, ProviderOptions } from "./types";

export function createProvider(
  name: ProviderName,
  options: ProviderOptions = {},
): ModelProvider {
  switch (name) {
    case "google":
      return createGoogleProvider(options);
    case "openai":
      return createOpenAIProvider(options);
    case "anthropic":
      return createAnthropicProvider(options);
  }
}
